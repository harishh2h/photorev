import { createHash } from "node:crypto";
import type { Knex } from "knex";

/**
 * Stable fingerprint of team-selected photos (final_decision = 1) and export filenames.
 * Changes when likes or the requesting user's rename labels change → new export required.
 */
export async function computeProjectSelectionHash(
  db: Knex,
  projectId: string,
  userId?: string | null,
): Promise<{ hash: string; photoCount: number }> {
  const rows = await db<{ id: string }>("photos")
    .select("id")
    .where("project_id", projectId)
    .andWhere("status", "ready")
    .andWhere("final_decision", 1)
    .orderBy("id", "asc");

  const renameByPhotoId = new Map<string, string>();
  if (userId && rows.length > 0) {
    const reviews = await db<{ photo_id: string; renamed_to: string | null }>("photo_reviews")
      .select("photo_id", "renamed_to")
      .where("user_id", userId)
      .whereIn(
        "photo_id",
        rows.map((r) => r.id),
      );
    for (const review of reviews) {
      const label = review.renamed_to?.trim() ?? "";
      if (label) {
        renameByPhotoId.set(review.photo_id, label);
      }
    }
  }

  const payload = rows
    .map((r) => `${r.id}:${renameByPhotoId.get(r.id) ?? ""}`)
    .join(",");
  const hash = createHash("sha256").update(payload).digest("hex");
  return { hash, photoCount: rows.length };
}
