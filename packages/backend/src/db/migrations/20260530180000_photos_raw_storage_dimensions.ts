import type { Knex } from "knex";

/**
 * Prior metadata jobs stored orientation-corrected width/height while keeping EXIF
 * orientation in metadata. Read paths apply orientation again, so rotated photos
 * got landscape layout slots. Swap stored dimensions back to raw file values.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    UPDATE photos
    SET width = height, height = width
    WHERE width IS NOT NULL
      AND height IS NOT NULL
      AND width > 0
      AND height > 0
      AND metadata IS NOT NULL
      AND (metadata->>'orientation') ~ '^[5678]$'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    UPDATE photos
    SET width = height, height = width
    WHERE width IS NOT NULL
      AND height IS NOT NULL
      AND width > 0
      AND height > 0
      AND metadata IS NOT NULL
      AND (metadata->>'orientation') ~ '^[5678]$'
  `);
}
