import type { Knex } from "knex";

/**
 * Aligns photos table with the domain model:
 * - Rename absolute_path → original_path
 * - Drop exif_data (EXIF lives in metadata)
 * - Backfill original_name from filename, then drop filename
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("photos", (table: Knex.AlterTableBuilder) => {
    table.renameColumn("absolute_path", "original_path");
  });
  await knex("photos")
    .whereNull("original_name")
    .update({ original_name: knex.ref("filename") });
  await knex.schema.alterTable("photos", (table: Knex.AlterTableBuilder) => {
    table.dropColumn("exif_data");
    table.dropColumn("filename");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("photos", (table: Knex.AlterTableBuilder) => {
    table.text("filename").nullable();
    table.jsonb("exif_data").nullable();
  });
  await knex("photos").update({ filename: knex.ref("original_name") });
  await knex.schema.alterTable("photos", (table: Knex.AlterTableBuilder) => {
    table.renameColumn("original_path", "absolute_path");
  });
}
