import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('name', 255).notNullable()
    table.string('email', 255).notNullable().unique()
    table.text('password_hash').notNullable()
    table.enu('role', ['admin', 'reviewer'])
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('name', 255).notNullable()
    table.enu('status', ['active', 'processing', 'completed']).notNullable().defaultTo('active')
    table.boolean('is_active').notNullable().defaultTo(true)
    table.text('root_path').notNullable()
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('library', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('name', 255).notNullable()
    table.text('description')
    table.text('absolute_path').notNullable()
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE')
    table.enu('status', ['active', 'processing', 'completed']).notNullable().defaultTo('active')
    table.boolean('is_active').notNullable().defaultTo(true)
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('photos', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE')
    table.uuid('library_id').notNullable().references('id').inTable('library').onDelete('CASCADE')
    table.text('filename').notNullable()
    table.text('absolute_path').notNullable()
    table.text('thumbnail_path')
    table.text('hash')
    table.jsonb('metadata')
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('photo_reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('photo_id').notNullable().references('id').inTable('photos').onDelete('CASCADE')
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.uuid('library_id').notNullable().references('id').inTable('library').onDelete('CASCADE')
    table.boolean('seen').notNullable().defaultTo(true)
    table.smallint('decision')
    table.text('renamed_to')
    table.timestamp('seen_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('voted_at')
    table.unique(['photo_id', 'user_id'])
  })

  await knex.schema.raw('CREATE INDEX idx_photos_project ON photos(project_id)')
  await knex.schema.raw('CREATE INDEX idx_reviews_user ON photo_reviews(user_id)')
  await knex.schema.raw('CREATE INDEX idx_reviews_photo ON photo_reviews(photo_id)')
  await knex.schema.raw('CREATE INDEX idx_reviews_photo_decision ON photo_reviews(photo_id, decision)')
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('photo_reviews')
  await knex.schema.dropTableIfExists('photos')
  await knex.schema.dropTableIfExists('library')
  await knex.schema.dropTableIfExists('projects')
  await knex.schema.dropTableIfExists('users')
}
