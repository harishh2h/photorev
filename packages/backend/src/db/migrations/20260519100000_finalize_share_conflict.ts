import type { Knex } from "knex";

const PHOTOS_STATUS_CHECK = "photos_status_check";
const JOBS_JOB_TYPE_CHECK = "processing_jobs_job_type_check";
const PROJECTS_STATUS_CHECK = "projects_status_check";

async function resolveProjectsStatusType(
  knex: Knex,
): Promise<{ typname: string; typtype: string } | null> {
  const res = await knex.raw<{ rows: Array<{ typname: string; typtype: string }> }>(
    `SELECT t.typname::text, t.typtype::text
     FROM pg_catalog.pg_attribute a
     JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
     JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
     JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
     WHERE c.relname = 'projects'
       AND a.attname = 'status'
       AND a.attnum > 0
       AND NOT a.attisdropped
       AND n.nspname = CURRENT_SCHEMA()`,
  );
  return res.rows[0] ?? null;
}

function safePgIdentifier(name: string): string | null {
  return /^[a-z_][a-z0-9_]*$/i.test(name) ? name : null;
}

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("photos", (table: Knex.AlterTableBuilder) => {
    table.smallint("final_decision").nullable();
    table.uuid("final_decided_by").nullable();
    table.timestamp("final_decided_at").nullable();
    table.text("conflict_state").nullable();
    table.timestamp("trashed_at").nullable();
  });

  await knex.raw(`ALTER TABLE photos DROP CONSTRAINT IF EXISTS ${PHOTOS_STATUS_CHECK}`);
  await knex.raw(`
    ALTER TABLE photos
    ADD CONSTRAINT ${PHOTOS_STATUS_CHECK}
    CHECK (status IN ('pending', 'ready', 'failed', 'trashed', 'deleted'))
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_photos_project_final
    ON photos (project_id, final_decision)
    WHERE status = 'ready'
  `);
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_photos_trashed_due
    ON photos (trashed_at)
    WHERE status = 'trashed'
  `);

  await knex.schema.alterTable("projects", (table: Knex.AlterTableBuilder) => {
    table.timestamp("finalized_at").nullable();
    table.uuid("finalized_by").nullable();
    table.text("finalize_action").nullable();
  });

  const projectStatusType = await resolveProjectsStatusType(knex);
  if (projectStatusType && projectStatusType.typtype === "e") {
    const enumName = safePgIdentifier(projectStatusType.typname);
    if (!enumName) {
      throw new Error("Invalid PostgreSQL enum type name for projects.status");
    }
    await knex.raw(`ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS 'finalized'`);
  } else {
    await knex.raw(`ALTER TABLE projects DROP CONSTRAINT IF EXISTS ${PROJECTS_STATUS_CHECK}`);
    await knex.raw(`
      ALTER TABLE projects
      ADD CONSTRAINT ${PROJECTS_STATUS_CHECK}
      CHECK (status IN ('active', 'processing', 'completed', 'finalized', 'deleted'))
    `);
  }

  await knex.schema.createTable("share_links", (table: Knex.CreateTableBuilder) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("project_id")
      .notNullable()
      .references("id")
      .inTable("projects")
      .onDelete("CASCADE");
    table.text("token").notNullable().unique();
    table.text("password_hash").nullable();
    table.text("description").nullable();
    table.boolean("show_metadata").notNullable().defaultTo(false);
    table.boolean("allow_download").notNullable().defaultTo(true);
    table.timestamp("expires_at").nullable();
    table.timestamp("revoked_at").nullable();
    table
      .uuid("created_by")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.bigInteger("view_count").notNullable().defaultTo(0);
    table.timestamp("last_viewed_at").nullable();
  });
  await knex.raw(`
    CREATE UNIQUE INDEX share_links_one_active_per_project
    ON share_links (project_id)
    WHERE revoked_at IS NULL
  `);

  await knex.raw(`ALTER TABLE processing_jobs DROP CONSTRAINT IF EXISTS ${JOBS_JOB_TYPE_CHECK}`);
  await knex.raw(`
    ALTER TABLE processing_jobs
    ADD CONSTRAINT ${JOBS_JOB_TYPE_CHECK}
    CHECK (job_type IN ('thumbnail', 'preview', 'metadata', 'hard_delete_photo', 'purge_trashed'))
  `);

  await knex.raw(`ALTER TABLE processing_jobs ALTER COLUMN photo_id DROP NOT NULL`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE processing_jobs DROP CONSTRAINT IF EXISTS ${JOBS_JOB_TYPE_CHECK}`);
  await knex.raw(`
    ALTER TABLE processing_jobs
    ADD CONSTRAINT ${JOBS_JOB_TYPE_CHECK}
    CHECK (job_type IN ('thumbnail', 'preview', 'metadata'))
  `);

  await knex.raw(`DROP INDEX IF EXISTS share_links_one_active_per_project`);
  await knex.schema.dropTableIfExists("share_links");

  await knex.schema.alterTable("projects", (table: Knex.AlterTableBuilder) => {
    table.dropColumn("finalized_at");
    table.dropColumn("finalized_by");
    table.dropColumn("finalize_action");
  });

  await knex.raw(`DROP INDEX IF EXISTS idx_photos_project_final`);
  await knex.raw(`DROP INDEX IF EXISTS idx_photos_trashed_due`);

  await knex.raw(`ALTER TABLE photos DROP CONSTRAINT IF EXISTS ${PHOTOS_STATUS_CHECK}`);
  await knex.raw(`
    ALTER TABLE photos
    ADD CONSTRAINT ${PHOTOS_STATUS_CHECK}
    CHECK (status IN ('pending', 'ready', 'failed'))
  `);

  await knex.schema.alterTable("photos", (table: Knex.AlterTableBuilder) => {
    table.dropColumn("final_decision");
    table.dropColumn("final_decided_by");
    table.dropColumn("final_decided_at");
    table.dropColumn("conflict_state");
    table.dropColumn("trashed_at");
  });
}
