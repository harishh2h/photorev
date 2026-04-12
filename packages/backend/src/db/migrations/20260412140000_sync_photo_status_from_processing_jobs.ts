import type { Knex } from "knex";

/**
 * Historical bug: workers updated paths but never set photos.status to ready/failed.
 * Align existing rows with processing_jobs terminal state.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    UPDATE photos p
    SET status = 'failed'
    WHERE p.status = 'pending'
      AND EXISTS (
        SELECT 1 FROM processing_jobs pj
        WHERE pj.photo_id = p.id AND pj.status = 'failed'
      )
  `);
  await knex.raw(`
    UPDATE photos p
    SET status = 'ready'
    WHERE p.status = 'pending'
      AND EXISTS (SELECT 1 FROM processing_jobs pj WHERE pj.photo_id = p.id)
      AND NOT EXISTS (
        SELECT 1 FROM processing_jobs pj
        WHERE pj.photo_id = p.id AND pj.status <> 'done'
      )
  `);
}

export async function down(_knex: Knex): Promise<void> {
  // Cannot infer previous status values safely
}
