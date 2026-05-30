import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
    // Drop the old constraint first, then update data, then add the new constraint
    await knex.raw(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`)
    await knex.raw(`UPDATE users SET role = 'user' WHERE role = 'reviewer'`)
    await knex.raw(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'))`)
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`UPDATE users SET role = 'reviewer' WHERE role = 'user'`)
    await knex.raw(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`)
    await knex.raw(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'reviewer'))`)
}
