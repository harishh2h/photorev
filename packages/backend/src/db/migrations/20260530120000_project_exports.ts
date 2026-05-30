import type { Knex } from "knex";

const TABLE = "project_exports";
const VARIANT_CHECK = "project_exports_variant_check";
const STATUS_CHECK = "project_exports_status_check";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE, (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    table.uuid("share_link_id").nullable().references("id").inTable("share_links").onDelete("SET NULL");
    table.uuid("created_by_user_id").nullable().references("id").inTable("users").onDelete("SET NULL");
    table.text("variant").notNullable();
    table.text("status").notNullable().defaultTo("queued");
    table.integer("photo_count").notNullable().defaultTo(0);
    table.integer("processed_count").notNullable().defaultTo(0);
    table.text("file_path").nullable();
    table.bigInteger("byte_size").nullable();
    table.text("error_message").nullable();
    table.timestamp("expires_at", { useTz: false }).nullable();
    table.timestamp("queued_at", { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("started_at", { useTz: false }).nullable();
    table.timestamp("completed_at", { useTz: false }).nullable();
  });

  await knex.raw(
    `ALTER TABLE ${TABLE} ADD CONSTRAINT ${VARIANT_CHECK} CHECK (variant IN ('original', 'preview'))`,
  );
  await knex.raw(
    `ALTER TABLE ${TABLE} ADD CONSTRAINT ${STATUS_CHECK} CHECK (status IN ('queued', 'processing', 'done', 'failed', 'expired'))`,
  );

  await knex.schema.raw(
    `CREATE INDEX idx_project_exports_status_queued ON ${TABLE} (status, queued_at)`,
  );
  await knex.schema.raw(`CREATE INDEX idx_project_exports_project ON ${TABLE} (project_id)`);
  await knex.schema.raw(
    `CREATE INDEX idx_project_exports_expires ON ${TABLE} (expires_at) WHERE status = 'done'`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE);
}
