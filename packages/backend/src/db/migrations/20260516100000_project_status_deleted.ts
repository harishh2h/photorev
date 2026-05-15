import type { Knex } from "knex";

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

/**
 * Adds soft-delete status `deleted`: native enum value and/or CHECK constraint refresh.
 */
export async function up(knex: Knex): Promise<void> {
  const col = await resolveProjectsStatusType(knex);
  if (!col) {
    throw new Error("Could not resolve projects.status column type");
  }

  if (col.typtype === "e") {
    const enumName = safePgIdentifier(col.typname);
    if (!enumName) {
      throw new Error("Invalid PostgreSQL enum type name for projects.status");
    }
    await knex.raw(`ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS 'deleted'`);
    return;
  }

  await knex.raw(`ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check`);
  await knex.raw(`
    ALTER TABLE projects
    ADD CONSTRAINT projects_status_check
    CHECK (status IN ('active', 'processing', 'completed', 'deleted'))
  `);
}

export async function down(_knex: Knex): Promise<void> {
  // Cannot safely remove enum values or narrow CHECK without data migration.
}
