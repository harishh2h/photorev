import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.bigInteger("quota_bytes").nullable();
    table.bigInteger("quota_usage_bytes").notNullable().defaultTo(0);
  });

  await knex.raw(`
    UPDATE users u
    SET quota_usage_bytes = COALESCE(usage.tot, 0)
    FROM (
      SELECT p.created_by AS user_id, SUM(ph.file_size) AS tot
      FROM photos ph
      INNER JOIN projects p ON p.id = ph.project_id
      WHERE ph.status <> 'deleted'
        AND ph.file_size IS NOT NULL
      GROUP BY p.created_by
    ) usage
    WHERE u.id = usage.user_id
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("quota_bytes");
    table.dropColumn("quota_usage_bytes");
  });
}
