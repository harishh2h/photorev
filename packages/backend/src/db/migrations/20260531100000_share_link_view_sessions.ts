import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("share_link_view_sessions", (table) => {
    table.uuid("share_link_id").notNullable().references("id").inTable("share_links").onDelete("CASCADE");
    table.string("view_session_id", 64).notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.primary(["share_link_id", "view_session_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("share_link_view_sessions");
}
