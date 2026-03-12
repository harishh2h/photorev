import type { Knex } from "knex";

const PHOTOS_STATUS_CHECK = "photos_status_check";
const JOBS_JOB_TYPE_CHECK = "processing_jobs_job_type_check";
const JOBS_STATUS_CHECK = "processing_jobs_status_check";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("photos", (table: Knex.AlterTableBuilder) => {
    table.text("original_name").nullable();
    table.text("mime_type").nullable();
    table.bigInteger("file_size").nullable();
    table.text("status").notNullable().defaultTo("pending"); 
    table.integer("width").nullable();
    table.integer("height").nullable();
    table.jsonb("exif_data").nullable();
    table.text("preview_path").nullable();

  });
  await knex.raw(
    `ALTER TABLE photos ADD CONSTRAINT ${PHOTOS_STATUS_CHECK} CHECK (status IN ('pending', 'ready', 'failed'))`,
  );

  await knex.schema.createTable(
    "processing_jobs",
    (table: Knex.CreateTableBuilder) => {
      table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
      table
        .uuid("photo_id")
        .notNullable()
        .references("id")
        .inTable("photos")
        .onDelete("CASCADE");
      table.text("job_type").notNullable();
      table.text("status").notNullable().defaultTo("queued"); 
      table.integer("attempts").notNullable().defaultTo(0);
      table.integer("max_attempts").notNullable().defaultTo(3);
      table.text("error_message").nullable();
      table.text("worker_id").nullable();
      table.timestamp("queued_at").notNullable().defaultTo(knex.fn.now());
      table.timestamp("started_at").nullable();
      table.timestamp("completed_at").nullable();
    },
  );
  await knex.raw(
    `ALTER TABLE processing_jobs ADD CONSTRAINT ${JOBS_JOB_TYPE_CHECK} CHECK (job_type IN ('thumbnail', 'preview', 'metadata'))`,
  );
  await knex.raw(
    `ALTER TABLE processing_jobs ADD CONSTRAINT ${JOBS_STATUS_CHECK} CHECK (status IN ('queued', 'processing', 'done', 'failed'))`,
  );
  await knex.raw(                                             
    "CREATE INDEX idx_processing_jobs_status_queued ON processing_jobs(status, queued_at)",
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    "DROP INDEX IF EXISTS idx_processing_jobs_status_queued",
  );
  await knex.schema.dropTableIfExists("processing_jobs");
  await knex.raw(
    `ALTER TABLE photos DROP CONSTRAINT IF EXISTS ${PHOTOS_STATUS_CHECK}`,
  );
  await knex.schema.alterTable("photos", (table: Knex.AlterTableBuilder) => {
    table.dropColumn("original_name");
    table.dropColumn("mime_type");
    table.dropColumn("file_size");
    table.dropColumn("status");
    table.dropColumn("width");
    table.dropColumn("height");
    table.dropColumn("exif_data");
    table.dropColumn("preview_path");
  });
}