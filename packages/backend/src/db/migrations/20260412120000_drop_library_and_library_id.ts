import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("photo_reviews", (table) => {
    table.dropForeign(["library_id"]);
  });
  await knex.schema.alterTable("photo_reviews", (table) => {
    table.dropColumn("library_id");
  });
  await knex.schema.alterTable("photos", (table) => {
    table.dropForeign(["library_id"]);
  });
  await knex.schema.alterTable("photos", (table) => {
    table.dropColumn("library_id");
  });
  await knex.schema.dropTableIfExists("library");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.createTable("library", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name", 255).notNullable();
    table.text("description");
    table.text("absolute_path").notNullable();
    table.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    table.enu("status", ["active", "processing", "completed"]).notNullable().defaultTo("active");
    table.boolean("is_active").notNullable().defaultTo(true);
    table.uuid("created_by").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
  await knex.schema.alterTable("photos", (table) => {
    table.uuid("library_id").nullable().references("id").inTable("library").onDelete("CASCADE");
  });
  await knex.schema.alterTable("photo_reviews", (table) => {
    table.uuid("library_id").nullable().references("id").inTable("library").onDelete("CASCADE");
  });
}
