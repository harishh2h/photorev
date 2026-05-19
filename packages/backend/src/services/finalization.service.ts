import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Knex } from "knex";
import { jobRunner } from "../workers";

export type FinalizeAction =
  | "keep_all"
  | "soft_delete_rejected"
  | "hard_delete_rejected";

export interface FinalizeProjectParams {
  readonly userId: string;
  readonly projectId: string;
  readonly action: FinalizeAction;
}

export type FinalizeFailureReason =
  | "not_found"
  | "forbidden"
  | "pending_conflicts"
  | "already_finalized";

export type FinalizeProjectResult =
  | {
      readonly ok: true;
      readonly finalizedAt: string;
      readonly action: FinalizeAction;
      readonly affectedPhotos: number;
    }
  | { readonly ok: false; readonly reason: FinalizeFailureReason; readonly pendingCount?: number };

export interface FinalizationServiceMethods {
  finalizeProject: (params: FinalizeProjectParams) => Promise<FinalizeProjectResult>;
}

function buildFinalizationService(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): FinalizationServiceMethods {
  const db: Knex = fastify.db;

  async function finalizeProject(params: FinalizeProjectParams): Promise<FinalizeProjectResult> {
    const project = await db<{ created_by: string; status: string }>("projects")
      .select("created_by", "status")
      .where("id", params.projectId)
      .first();
    if (!project || project.status === "deleted") {
      return { ok: false, reason: "not_found" };
    }
    if (project.created_by !== params.userId) {
      return { ok: false, reason: "forbidden" };
    }
    if (project.status === "finalized") {
      return { ok: false, reason: "already_finalized" };
    }

    const pendingRow = await db("photos")
      .where({ project_id: params.projectId, status: "ready", conflict_state: "pending_owner" })
      .count<{ count: string }[]>({ count: "*" });
    const pendingCount = Number(pendingRow[0]?.count ?? 0);
    if (pendingCount > 0) {
      return { ok: false, reason: "pending_conflicts", pendingCount };
    }

    type TxResult =
      | { readonly ok: true; readonly now: Date; readonly affected: number }
      | { readonly ok: false; readonly reason: "not_found" | "already_finalized" };

    const result = await db.transaction(async (trx: Knex.Transaction): Promise<TxResult> => {
      const locked = await trx<{ status: string }>("projects")
        .select("status")
        .where("id", params.projectId)
        .forUpdate()
        .first();
      if (!locked) {
        return { ok: false, reason: "not_found" };
      }
      if (locked.status === "finalized") {
        return { ok: false, reason: "already_finalized" };
      }

      const now = new Date();
      await trx("projects").where("id", params.projectId).update({
        status: "finalized",
        finalized_at: now,
        finalized_by: params.userId,
        finalize_action: params.action,
      });
      let affected = 0;
      if (params.action === "soft_delete_rejected") {
        affected = await trx("photos")
          .where("project_id", params.projectId)
          .andWhere("status", "ready")
          .andWhere("final_decision", -1)
          .update({ status: "trashed", trashed_at: now });
      } else if (params.action === "hard_delete_rejected") {
        const rows = await trx("photos")
          .select<{ id: string }[]>("id")
          .where("project_id", params.projectId)
          .andWhere("status", "ready")
          .andWhere("final_decision", -1);
        if (rows.length > 0) {
          await trx("processing_jobs").insert(
            rows.map((r) => ({
              photo_id: r.id,
              job_type: "hard_delete_photo",
            })),
          );
        }
        affected = rows.length;
      }
      return { ok: true, now, affected };
    });

    if (!result.ok) {
      return { ok: false, reason: result.reason };
    }

    if (params.action === "hard_delete_rejected" && result.affected > 0) {
      jobRunner.notify();
    }

    return {
      ok: true,
      finalizedAt: result.now.toISOString(),
      action: params.action,
      affectedPhotos: result.affected,
    };
  }

  return { finalizeProject };
}

export default buildFinalizationService;
