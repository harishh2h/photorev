const MAX_CLIENT_ERROR_LENGTH = 200;

interface PgErrorLike {
  code?: string;
  detail?: string;
  message?: string;
}

const PG_CODE_MESSAGES: Record<string, string> = {
  "23505": "Record already exists",
  "23503": "Related record not found",
  "23502": "Required field missing",
  "22P02": "Invalid input format",
  "42703": "Unknown column",
  "42P01": "Database table missing",
};

function trimMessage(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, " ");
  if (trimmed.length <= MAX_CLIENT_ERROR_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_CLIENT_ERROR_LENGTH - 1)}…`;
}

function simplifyErrorMessage(message: string): string {
  const dashIdx = message.indexOf(" - ");
  if (dashIdx === -1) {
    return message;
  }
  const tail = message.slice(dashIdx + 3).trim();
  return tail.length > 0 ? tail : message;
}

/**
 * Short, client-safe message from thrown errors (incl. PostgreSQL / Knex).
 */
export function toClientErrorMessage(err: unknown, fallback = "Request failed"): string {
  if (err == null) {
    return fallback;
  }
  if (typeof err === "string") {
    return trimMessage(err) || fallback;
  }
  if (!(err instanceof Error)) {
    return trimMessage(String(err)) || fallback;
  }

  const pg = err as PgErrorLike;
  if (typeof pg.detail === "string" && pg.detail.trim().length > 0) {
    return trimMessage(pg.detail);
  }
  if (pg.code && PG_CODE_MESSAGES[pg.code]) {
    return PG_CODE_MESSAGES[pg.code];
  }
  if (typeof err.message === "string" && err.message.trim().length > 0) {
    return trimMessage(simplifyErrorMessage(err.message));
  }
  return fallback;
}
