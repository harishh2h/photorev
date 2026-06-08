import type { Knex } from "knex";
import {
  computeProjectExportHash,
  DEFAULT_EXPORT_FILTER,
  DEFAULT_EXPORT_SCOPE,
} from "./export-photo-query";

/**
 * @deprecated Use computeProjectExportHash with explicit scope/filter.
 */
export async function computeProjectSelectionHash(
  db: Knex,
  projectId: string,
  userId?: string | null,
): Promise<{ hash: string; photoCount: number }> {
  const result = await computeProjectExportHash(
    db,
    projectId,
    userId ?? null,
    DEFAULT_EXPORT_SCOPE,
    DEFAULT_EXPORT_FILTER,
  );
  return { hash: result.hash, photoCount: result.photoCount };
}
