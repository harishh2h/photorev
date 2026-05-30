#!/bin/sh
set -e

cd /app/packages/backend

echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until pnpm exec tsx -e "
const { Client } = require('pg');
const c = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
c.connect()
  .then(() => c.end())
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
" 2>/dev/null; do
  sleep 2
done

echo "Running database migrations..."
pnpm run migrate:latest

echo "Starting API..."
exec "$@"
