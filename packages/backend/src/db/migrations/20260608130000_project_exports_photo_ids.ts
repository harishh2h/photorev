import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("project_exports", (table) => {
    table.jsonb("photo_ids").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("project_exports", (table) => {
    table.dropColumn("photo_ids");
  });
}
