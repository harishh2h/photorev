import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("photos", (table) => {
    table.text("blurhash").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("photos", (table) => {
    table.dropColumn("blurhash");
  });
}
