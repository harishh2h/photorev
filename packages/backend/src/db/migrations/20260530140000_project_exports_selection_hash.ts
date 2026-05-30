import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("project_exports", (table) => {
    table.text("selection_hash").nullable();
  });
  await knex.schema.raw(
    "CREATE INDEX idx_project_exports_reuse ON project_exports (project_id, variant, selection_hash, status)",
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw("DROP INDEX IF EXISTS idx_project_exports_reuse");
  await knex.schema.alterTable("project_exports", (table) => {
    table.dropColumn("selection_hash");
  });
}
