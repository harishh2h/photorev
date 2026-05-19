import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Knex } from "knex";
import {
  applyPagination,
  buildPaginatedResult,
  PaginatedResult,
  PaginationParams,
} from "../utils/pagination";
import {
  canReviewPhotos,
  loadProjectPermissionContext,
} from "../utils/project-permissions";

export interface PhotoReviewRecord {
  readonly id: string;
  readonly photo_id: string;
  readonly user_id: string;
  readonly seen: boolean;
  readonly decision: number | null;
  readonly renamed_to: string | null;
  readonly seen_at: Date;
  readonly voted_at: Date | null;
}

export interface PhotoReviewDto {
  readonly id: string;
  readonly photoId: string;
  readonly userId: string;
  readonly seen: boolean;
  readonly decision: number | null;
  readonly renamedTo: string | null;
  readonly seenAt: string;
  readonly votedAt: string | null;
}

export interface UpsertReviewParams {
  readonly userId: string;
  readonly photoId: string;
  readonly seen?: boolean;
  readonly decision?: number | null;
  readonly renamedTo?: string | null;
}

export interface ListUserReviewsFilters extends PaginationParams {
  readonly projectId?: string;
  readonly decision?: number;
}

export interface ListPhotoReviewsParams extends PaginationParams {
  readonly userId: string;
  readonly photoId: string;
}

export interface PhotoReviewsServiceMethods {
  upsertReview: (params: UpsertReviewParams) => Promise<PhotoReviewDto | null>;
  listUserReviews: (
    userId: string,
    filters: ListUserReviewsFilters,
  ) => Promise<PaginatedResult<PhotoReviewDto>>;
  listPhotoReviews: (
    params: ListPhotoReviewsParams,
  ) => Promise<PaginatedResult<PhotoReviewDto> | null>;
}

function mapReviewRecordToDto(record: PhotoReviewRecord): PhotoReviewDto {
  return {
    id: record.id,
    photoId: record.photo_id,
    userId: record.user_id,
    seen: record.seen,
    decision: record.decision,
    renamedTo: record.renamed_to,
    seenAt: record.seen_at.toISOString(),
    votedAt: record.voted_at ? record.voted_at.toISOString() : null,
  };
}

function buildPhotoReviewsService(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): PhotoReviewsServiceMethods {
  const db: Knex = fastify.db;

  async function getAccessiblePhotoProjectId(userId: string, photoId: string): Promise<string | null> {
    const row = await db<{ project_id: string }>("photos")
      .select("photos.project_id")
      .join("project_members", function joinProjectMembers() {
        this.on("project_members.project_id", "photos.project_id").andOn(
          "project_members.user_id",
          db.raw("?", [userId]),
        );
      })
      .where("photos.id", photoId)
      .first();
    return row?.project_id ?? null;
  }

  async function recomputePhotoFinal(
    trx: Knex.Transaction,
    photoId: string,
    projectId: string,
  ): Promise<void> {
    const ownerRow = await trx("project_members")
      .select<{ user_id: string }[]>("user_id")
      .where("project_id", projectId)
      .andWhere("is_owner", true)
      .first();
    const ownerId = ownerRow?.user_id ?? null;
    const reviews = await trx<{ user_id: string; decision: number | null }>("photo_reviews")
      .select("user_id", "decision")
      .where("photo_id", photoId);

    let likedCount = 0;
    let rejectedCount = 0;
    let ownerDecision: number | null = null;
    reviews.forEach((r) => {
      if (r.user_id === ownerId && r.decision !== null) {
        ownerDecision = r.decision;
      }
      if (r.decision === 1) likedCount += 1;
      else if (r.decision === -1) rejectedCount += 1;
    });
    const hasOpposing = likedCount > 0 && rejectedCount > 0;

    let finalDecision: number | null;
    let finalDecidedBy: string | null = null;
    let conflictState: "none" | "pending_owner" | "resolved_owner" | "resolved_majority";

    if (ownerDecision !== null) {
      finalDecision = ownerDecision;
      finalDecidedBy = ownerId;
      conflictState = hasOpposing ? "resolved_owner" : "none";
    } else if (!hasOpposing) {
      if (likedCount > 0) {
        finalDecision = 1;
        conflictState = "none";
      } else if (rejectedCount > 0) {
        finalDecision = -1;
        conflictState = "none";
      } else {
        finalDecision = null;
        conflictState = "none";
      }
    } else if (likedCount > rejectedCount) {
      finalDecision = 1;
      conflictState = "resolved_majority";
    } else if (rejectedCount > likedCount) {
      finalDecision = -1;
      conflictState = "resolved_majority";
    } else {
      finalDecision = null;
      conflictState = "pending_owner";
    }

    const now = new Date();
    const patch: Record<string, unknown> = {
      final_decision: finalDecision,
      final_decided_by: finalDecidedBy,
      final_decided_at: finalDecision === null ? null : now,
      conflict_state: conflictState,
    };

    const current = await trx<{ status: string }>("photos")
      .select("status")
      .where("id", photoId)
      .first();
    if (finalDecision === 1 && current?.status === "trashed") {
      patch.status = "ready";
      patch.trashed_at = null;
    }

    await trx("photos").where("id", photoId).update(patch);
  }

  async function upsertReview(params: UpsertReviewParams): Promise<PhotoReviewDto | null> {
    const projectId = await getAccessiblePhotoProjectId(params.userId, params.photoId);
    if (!projectId) {
      return null;
    }
    const permCtx = await loadProjectPermissionContext(db, params.userId, projectId);
    if (!permCtx || !canReviewPhotos(permCtx)) {
      return null;
    }
    const now = new Date();
    const merge: Record<string, unknown> = {
      seen: params.seen ?? true,
      seen_at: now,
    };
    if (typeof params.renamedTo !== "undefined") {
      merge.renamed_to = params.renamedTo;
    }
    if (typeof params.decision !== "undefined") {
      merge.decision = params.decision;
      merge.voted_at = params.decision === null ? null : now;
    }
    const review = await db.transaction(async (trx: Knex.Transaction) => {
      const rows = await trx<PhotoReviewRecord>("photo_reviews")
        .insert(
          {
            photo_id: params.photoId,
            user_id: params.userId,
            seen: (merge.seen as boolean | undefined) ?? true,
            decision:
              typeof merge.decision === "undefined" ? null : (merge.decision as number | null),
            renamed_to:
              typeof merge.renamed_to === "undefined" ? null : (merge.renamed_to as string | null),
            seen_at: now,
            voted_at:
              typeof merge.voted_at === "undefined" ? null : (merge.voted_at as Date | null),
          },
          "*",
        )
        .onConflict(["photo_id", "user_id"])
        .merge(merge)
        .then((r: PhotoReviewRecord[]) => r);
      const inserted = rows[0];
      if (!inserted) {
        return null;
      }
      await recomputePhotoFinal(trx, params.photoId, projectId);
      return inserted;
    });
    if (!review) {
      return null;
    }
    return mapReviewRecordToDto(review);
  }

  async function listUserReviews(
    userId: string,
    filters: ListUserReviewsFilters,
  ): Promise<PaginatedResult<PhotoReviewDto>> {
    const baseQuery = db<PhotoReviewRecord>("photo_reviews")
      .select<PhotoReviewRecord[]>("photo_reviews.*")
      .join("photos", "photos.id", "photo_reviews.photo_id")
      .join("project_members", function joinProjectMembers() {
        this.on("project_members.project_id", "photos.project_id").andOn(
          "project_members.user_id",
          db.raw("?", [userId]),
        );
      })
      .where("photo_reviews.user_id", userId);
    if (filters.projectId) {
      baseQuery.where("photos.project_id", filters.projectId);
    }
    if (typeof filters.decision !== "undefined") {
      baseQuery.where("photo_reviews.decision", filters.decision);
    }
    const countResult = await baseQuery
      .clone()
      .clearSelect()
      .count<{ count: string }[]>({ count: "*" });
    const total = Number(countResult[0]?.count ?? 0);
    const pagedQuery = applyPagination(baseQuery, filters);
    const rows = await pagedQuery;
    const items = rows.map(mapReviewRecordToDto);
    return buildPaginatedResult(items, total, filters.page, filters.pageSize);
  }

  async function listPhotoReviews(
    params: ListPhotoReviewsParams,
  ): Promise<PaginatedResult<PhotoReviewDto> | null> {
    const projectId = await getAccessiblePhotoProjectId(params.userId, params.photoId);
    if (!projectId) {
      return buildPaginatedResult([], 0, params.page, params.pageSize);
    }
    const permCtx = await loadProjectPermissionContext(db, params.userId, projectId);
    if (!permCtx || !canReviewPhotos(permCtx)) {
      return null;
    }
    const baseQuery = db<PhotoReviewRecord>("photo_reviews")
      .select<PhotoReviewRecord[]>("photo_reviews.*")
      .where("photo_reviews.photo_id", params.photoId);
    const countResult = await baseQuery
      .clone()
      .clearSelect()
      .count<{ count: string }[]>({ count: "*" });
    const total = Number(countResult[0]?.count ?? 0);
    const pagedQuery = applyPagination(baseQuery, params);
    const rows = await pagedQuery;
    const items = rows.map(mapReviewRecordToDto);
    return buildPaginatedResult(items, total, params.page, params.pageSize);
  }

  return {
    upsertReview,
    listUserReviews,
    listPhotoReviews,
  };
}

export default buildPhotoReviewsService;
