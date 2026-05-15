import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const dupCheck = await knex.raw(`
    SELECT lower(trim(email)) AS e
    FROM users
    GROUP BY lower(trim(email))
    HAVING count(*) > 1
  `);
  const dupRows =
    dupCheck &&
    typeof dupCheck === "object" &&
    "rows" in dupCheck &&
    Array.isArray((dupCheck as { rows: unknown }).rows)
      ? (dupCheck as { rows: unknown[] }).rows
      : [];
  if (dupRows.length > 0) {
    throw new Error(
      `Cannot normalize emails: ${dupRows.length} duplicate normalized address(es). Resolve collisions first.`,
    );
  }

  await knex.raw(`
    UPDATE users SET email = lower(trim(email))
  `);

  await knex.schema.alterTable("project_members", (table: Knex.AlterTableBuilder) => {
    table.text("role").nullable();
  });

  await knex.raw(`
    UPDATE project_members pm
    SET is_owner = false
    FROM projects p
    WHERE pm.project_id = p.id
      AND pm.is_owner = true
      AND pm.user_id <> p.created_by
  `);

  await knex.raw(`
    INSERT INTO project_members (project_id, user_id, is_owner, role)
    SELECT p.id, p.created_by, true, 'contributor'
    FROM projects p
    WHERE NOT EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = p.id AND pm.user_id = p.created_by
    )
  `);

  await knex.raw(`
    UPDATE project_members pm
    SET is_owner = true
    FROM projects p
    WHERE pm.project_id = p.id AND pm.user_id = p.created_by
  `);

  await knex.raw(`
    UPDATE project_members pm
    SET role = 'contributor'
    FROM projects p
    WHERE pm.project_id = p.id AND pm.user_id = p.created_by
  `);

  await knex.raw(`
    UPDATE project_members pm
    SET role = 'reviewer'
    FROM projects p
    WHERE pm.project_id = p.id AND pm.user_id <> p.created_by AND pm.role IS NULL
  `);

  await knex.raw(`
    ALTER TABLE project_members
    ALTER COLUMN role SET NOT NULL
  `);

  await knex.raw(`
    ALTER TABLE project_members
    ADD CONSTRAINT project_members_role_check
    CHECK (role IN ('viewer', 'reviewer', 'contributor'))
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX project_members_one_owner_per_project
    ON project_members (project_id)
    WHERE is_owner = true
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS project_members_one_owner_per_project`);
  await knex.raw(`ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_role_check`);
  await knex.schema.alterTable("project_members", (table: Knex.AlterTableBuilder) => {
    table.dropColumn("role");
  });
}
