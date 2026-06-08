import { createHash } from "node:crypto";
import type { Knex } from "knex";
import {
  applyProjectGridFilters,
  normalizeProjectGridFilter,
  normalizeProjectGridScope,
  type ProjectGridPhotoFilter,
  type ProjectGridReviewScope,
} from "./project-grid-filters";

export interface ExportPhotoQueryRow {
  readonly id: string;
  readonly original_name: string | null;
  readonly original_path: string | null;
  readonly preview_path: string | null;
  readonly status: string;
  readonly my_decision: number | null;
  readonly final_decision: number | null;
  readonly conflict_state: string | null;
  readonly renamed_to: string | null;
}

export const DEFAULT_EXPORT_SCOPE: ProjectGridReviewScope = "team";
export const DEFAULT_EXPORT_FILTER: ProjectGridPhotoFilter = "liked";

export function resolveExportFilters(
  scope: unknown,
  filter: unknown,
): { scope: ProjectGridReviewScope; filter: ProjectGridPhotoFilter } {
  return {
    scope: normalizeProjectGridScope(scope),
    filter: normalizeProjectGridFilter(filter),
  };
}

async function loadProjectPhotoRows(
  db: Knex,
  projectId: string,
  userId: string | null,
): Promise<ExportPhotoQueryRow[]> {
  let query = db<ExportPhotoQueryRow>("photos")
    .select(
      "photos.id",
      "photos.original_name",
      "photos.original_path",
      "photos.preview_path",
      "photos.status",
      "photos.final_decision",
      "photos.conflict_state",
    )
    .where("photos.project_id", projectId)
    .whereNot("photos.status", "deleted")
    .orderBy("photos.created_at", "asc")
    .orderBy("photos.id", "asc");

  if (userId) {
    query = query
      .select(db.raw("photo_reviews.decision as my_decision"))
      .select(db.raw("photo_reviews.renamed_to as renamed_to"))
      .leftJoin("photo_reviews", function joinReviews() {
        this.on("photo_reviews.photo_id", "photos.id").andOn(
          "photo_reviews.user_id",
          db.raw("?", [userId]),
        );
      });
  } else {
    query = query.select(
      db.raw("NULL::smallint as my_decision"),
      db.raw("NULL::text as renamed_to"),
    );
  }

  return query;
}

/**
 * Photos included in a project export for the given review scope + grid filter.
 */
export async function loadExportPhotoRows(
  db: Knex,
  projectId: string,
  userId: string | null,
  scopeInput: unknown,
  filterInput: unknown,
): Promise<ExportPhotoQueryRow[]> {
  const { scope, filter } = resolveExportFilters(scopeInput, filterInput);
  const rows = await loadProjectPhotoRows(db, projectId, userId);
  return applyProjectGridFilters(rows, { scope, filter });
}

/**
 * Stable fingerprint of export photo set (scope, filter, ids, rename labels).
 */
export async function computeProjectExportHash(
  db: Knex,
  projectId: string,
  userId: string | null,
  scopeInput: unknown,
  filterInput: unknown,
): Promise<{ hash: string; photoCount: number; scope: ProjectGridReviewScope; filter: ProjectGridPhotoFilter }> {
  const { scope, filter } = resolveExportFilters(scopeInput, filterInput);
  const rows = await loadExportPhotoRows(db, projectId, userId, scope, filter);
  const payload = [
    scope,
    filter,
    ...rows.map((row) => `${row.id}:${row.renamed_to?.trim() ?? ""}`),
  ].join(",");
  const hash = createHash("sha256").update(payload).digest("hex");
  return { hash, photoCount: rows.length, scope, filter };
}
