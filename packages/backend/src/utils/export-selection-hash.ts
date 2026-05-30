import { createHash } from "node:crypto";
import type { Knex } from "knex";

/**
 * Stable fingerprint of team-selected photos (final_decision = 1).
 * Changes when likes change → new export required.
 */
export async function computeProjectSelectionHash(
  db: Knex,
  projectId: string,
): Promise<{ hash: string; photoCount: number }> {
  const rows = await db<{ id: string }>("photos")
    .select("id")
    .where("project_id", projectId)
    .andWhere("status", "ready")
    .andWhere("final_decision", 1)
    .orderBy("id", "asc");

  const payload = rows.map((r) => r.id).join(",");
  const hash = createHash("sha256").update(payload).digest("hex");
  return { hash, photoCount: rows.length };
}
