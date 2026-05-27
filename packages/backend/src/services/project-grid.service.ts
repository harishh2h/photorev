import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Knex } from "knex";
import {
  buildPaginatedResult,
  PaginatedResult,
  PaginationParams,
} from "../utils/pagination";
import { loadProjectPermissionContext } from "../utils/project-permissions";

export interface ProjectGridItemDto {
  readonly id: string;
  readonly originalName: string | null;
  readonly status: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly myDecision: number | null;
  readonly renamedTo: string | null;
  readonly teamDecision: number | null;
  readonly conflictState: string | null;
  readonly blurhash: string | null;
}

export interface ProjectGridFilterCounts {
  readonly mine: {
    readonly all: number;
    readonly liked: number;
    readonly rejected: number;
    readonly unreviewed: number;
  };
  readonly team: {
    readonly all: number;
    readonly liked: number;
    readonly rejected: number;
  };
  readonly conflicts: number;
  readonly pendingConflicts: number;
  readonly trashed: number;
  readonly viewerSelected: number;
}

export interface ProjectGridResult extends PaginatedResult<ProjectGridItemDto> {
  readonly filterCounts: ProjectGridFilterCounts;
}

interface PhotoGridRow {
  readonly id: string;
  readonly original_name: string | null;
  readonly status: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly final_decision: number | null;
  readonly conflict_state: string | null;
  readonly blurhash: string | null;
  readonly my_decision: number | null;
  readonly renamed_to: string | null;
}

const CONFLICT_STATES = new Set(["pending_owner", "resolved_owner", "resolved_majority"]);

function mapGridRow(row: PhotoGridRow): ProjectGridItemDto {
  return {
    id: row.id,
    originalName: row.original_name,
    status: row.status,
    width: row.width,
    height: row.height,
    myDecision: row.my_decision,
    renamedTo: row.renamed_to,
    teamDecision: row.final_decision,
    conflictState: row.conflict_state,
    blurhash: row.blurhash,
  };
}

function buildFilterCounts(rows: PhotoGridRow[]): ProjectGridFilterCounts {
  const visible = rows.filter((r) => r.status !== "trashed");
  const trashed = rows.filter((r) => r.status === "trashed");
  const hasConflict = (r: PhotoGridRow) =>
    typeof r.conflict_state === "string" && CONFLICT_STATES.has(r.conflict_state);

  return {
    mine: {
      all: visible.length,
      liked: visible.filter((r) => r.my_decision === 1).length,
      rejected: visible.filter((r) => r.my_decision === -1).length,
      unreviewed: visible.filter((r) => r.my_decision == null).length,
    },
    team: {
      all: visible.length,
      liked: visible.filter((r) => r.final_decision === 1).length,
      rejected: visible.filter((r) => r.final_decision === -1).length,
    },
    conflicts: visible.filter(hasConflict).length,
    pendingConflicts: visible.filter((r) => r.conflict_state === "pending_owner").length,
    trashed: trashed.length,
    viewerSelected: visible.filter((r) => r.final_decision === 1).length,
  };
}

export interface ProjectGridServiceMethods {
  getProjectGrid: (
    userId: string,
    projectId: string,
    pagination: PaginationParams,
  ) => Promise<ProjectGridResult | null>;
  getPendingPhotoStatuses: (
    userId: string,
    projectId: string,
    photoIds: readonly string[],
  ) => Promise<Array<{ readonly id: string; readonly status: string }> | null>;
}

function buildProjectGridService(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): ProjectGridServiceMethods {
  const db: Knex = fastify.db;

  async function loadAccessibleProjectPhotos(
    userId: string,
    projectId: string,
  ): Promise<PhotoGridRow[] | null> {
    const ctx = await loadProjectPermissionContext(db, userId, projectId);
    if (!ctx) {
      return null;
    }
    return db<PhotoGridRow>("photos")
      .select(
        "photos.id",
        "photos.original_name",
        "photos.status",
        "photos.width",
        "photos.height",
        "photos.final_decision",
        "photos.conflict_state",
        "photos.blurhash",
        db.raw("photo_reviews.decision as my_decision"),
        db.raw("photo_reviews.renamed_to as renamed_to"),
      )
      .leftJoin("photo_reviews", function joinReviews() {
        this.on("photo_reviews.photo_id", "photos.id").andOn(
          "photo_reviews.user_id",
          db.raw("?", [userId]),
        );
      })
      .where("photos.project_id", projectId)
      .whereNot("photos.status", "deleted")
      .orderBy("photos.created_at", "asc")
      .orderBy("photos.id", "asc");
  }

  async function getProjectGrid(
    userId: string,
    projectId: string,
    pagination: PaginationParams,
  ): Promise<ProjectGridResult | null> {
    const allRows = await loadAccessibleProjectPhotos(userId, projectId);
    if (!allRows) {
      return null;
    }
    const total = allRows.length;
    const page = pagination.page && pagination.page > 0 ? pagination.page : 1;
    const pageSize =
      pagination.pageSize && pagination.pageSize > 0 ? Math.min(pagination.pageSize, 100) : 100;
    const offset = (page - 1) * pageSize;
    const pageRows = allRows.slice(offset, offset + pageSize);
    const items = pageRows.map(mapGridRow);
    const base = buildPaginatedResult(items, total, page, pageSize);
    return {
      ...base,
      filterCounts: buildFilterCounts(allRows),
    };
  }

  async function getPendingPhotoStatuses(
    userId: string,
    projectId: string,
    photoIds: readonly string[],
  ): Promise<Array<{ readonly id: string; readonly status: string }> | null> {
    if (photoIds.length === 0) {
      return [];
    }
    const ctx = await loadProjectPermissionContext(db, userId, projectId);
    if (!ctx) {
      return null;
    }
    const uniqueIds = [...new Set(photoIds)].slice(0, 200);
    const rows = await db<{ id: string; status: string }>("photos")
      .select("photos.id", "photos.status")
      .where("photos.project_id", projectId)
      .whereIn("photos.id", uniqueIds)
      .whereNot("photos.status", "deleted");
    return rows.map((r) => ({ id: r.id, status: r.status }));
  }

  return { getProjectGrid, getPendingPhotoStatuses };
}

export default buildProjectGridService;
