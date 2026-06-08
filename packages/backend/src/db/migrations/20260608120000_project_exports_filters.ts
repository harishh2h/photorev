import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("project_exports", (table) => {
    table.text("review_scope").nullable();
    table.text("photo_filter").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("project_exports", (table) => {
    table.dropColumn("review_scope");
    table.dropColumn("photo_filter");
  });
}
