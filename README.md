# photorev

Speed up photo review workflows after events.

## Structure

- `packages/backend` - Fastify API (TypeScript, Knex, PostgreSQL)

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm backend:dev
```

## Database

See `packages/backend/src/db/schema.sql` for the PostgreSQL schema.

### Migrations

Migrations are managed with [Knex](https://knexjs.org/). Configuration lives in `packages/backend/src/db/knexfile.ts` and loads `.env` from `packages/backend/.env` (copy from `packages/backend/.env.example` if needed).

Run all commands from `packages/backend`:

| Command | Description |
|--------|--------------|
| `pnpm run migrate:latest` | Run all pending migrations |
| `pnpm run migrate:make <name>` | Create a new migration file (e.g. `pnpm run migrate:make add_avatar_to_users`) |
| `pnpm run migrate:rollback` | Roll back the last batch of migrations |
| `pnpm run migrate:list` | List completed and pending migrations |
| `pnpm run seed:run` | Run seed files |

Migration files are in `packages/backend/src/db/migrations/` (TypeScript). Ensure PostgreSQL is running and `DB_*` in `.env` are correct before running migrations.
