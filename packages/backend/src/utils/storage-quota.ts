import type { Knex } from "knex";

export const QUOTA_EXCEEDED_MESSAGE = "Storage quota exceeded";
export const QUOTA_EXCEEDED_CODE = "QUOTA_EXCEEDED" as const;

export class StorageQuotaExceededError extends Error {
  readonly code = QUOTA_EXCEEDED_CODE;

  constructor(message = QUOTA_EXCEEDED_MESSAGE) {
    super(message);
    this.name = "StorageQuotaExceededError";
  }
}

export interface StorageQuotaSnapshot {
  readonly quotaBytes: number | null;
  readonly usageBytes: number;
  readonly remainingBytes: number | null;
  readonly canUpload: boolean;
}

interface UserQuotaRow {
  readonly quota_bytes: string | number | null;
  readonly quota_usage_bytes: string | number | null;
}

function toSafeInt(value: string | number | null | undefined): number {
  if (value == null) {
    return 0;
  }
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function toQuotaLimit(value: string | number | null | undefined): number | null {
  if (value == null) {
    return null;
  }
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return Math.floor(n);
}

export function hasQuotaRoom(
  quotaBytes: number | null,
  usageBytes: number,
  additionalBytes: number,
): boolean {
  if (quotaBytes === null) {
    return true;
  }
  const nextUsage = usageBytes + Math.max(0, additionalBytes);
  return nextUsage <= quotaBytes;
}

export function buildStorageQuotaSnapshot(
  quotaBytes: number | null,
  usageBytes: number,
): StorageQuotaSnapshot {
  const safeUsage = Math.max(0, usageBytes);
  const remainingBytes =
    quotaBytes === null ? null : Math.max(0, quotaBytes - safeUsage);
  const canUpload = quotaBytes === null ? true : safeUsage < quotaBytes;
  return {
    quotaBytes,
    usageBytes: safeUsage,
    remainingBytes,
    canUpload,
  };
}

export function parseAdminQuotaBytes(raw: unknown): number | null | "invalid" {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (typeof raw === "string" && raw.trim() === "") {
    return null;
  }
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return "invalid";
  }
  return Math.floor(n);
}

export async function getProjectOwnerId(db: Knex, projectId: string): Promise<string | null> {
  const row = await db<{ created_by: string }>("projects")
    .select("created_by")
    .where({ id: projectId })
    .whereNot("status", "deleted")
    .first();
  return row?.created_by ?? null;
}

export async function loadUserQuotaSnapshot(
  db: Knex,
  userId: string,
): Promise<StorageQuotaSnapshot | null> {
  const row = await db<UserQuotaRow>("users")
    .select("quota_bytes", "quota_usage_bytes")
    .where({ id: userId })
    .first();
  if (!row) {
    return null;
  }
  return buildStorageQuotaSnapshot(
    toQuotaLimit(row.quota_bytes),
    toSafeInt(row.quota_usage_bytes),
  );
}

export async function reserveQuotaInTransaction(
  trx: Knex.Transaction,
  ownerId: string,
  fileSizeBytes: number,
): Promise<void> {
  if (fileSizeBytes <= 0) {
    return;
  }
  const row = await trx<UserQuotaRow>("users")
    .select("quota_bytes", "quota_usage_bytes")
    .where({ id: ownerId })
    .forUpdate()
    .first();
  if (!row) {
    throw new Error("OWNER_NOT_FOUND");
  }
  const quotaBytes = toQuotaLimit(row.quota_bytes);
  const usageBytes = toSafeInt(row.quota_usage_bytes);
  if (!hasQuotaRoom(quotaBytes, usageBytes, fileSizeBytes)) {
    throw new StorageQuotaExceededError();
  }
  await trx("users")
    .where({ id: ownerId })
    .update({ quota_usage_bytes: usageBytes + fileSizeBytes });
}

export async function releaseQuota(
  dbOrTrx: Knex | Knex.Transaction,
  ownerId: string,
  fileSizeBytes: number,
): Promise<void> {
  if (fileSizeBytes <= 0) {
    return;
  }
  await dbOrTrx("users")
    .where({ id: ownerId })
    .update({
      quota_usage_bytes: dbOrTrx.raw("GREATEST(quota_usage_bytes - ?, 0)", [fileSizeBytes]),
    });
}

export async function sumProjectPhotoBytes(
  dbOrTrx: Knex | Knex.Transaction,
  projectId: string,
): Promise<number> {
  const row = await dbOrTrx("photos")
    .where("project_id", projectId)
    .whereNot("status", "deleted")
    .sum<{ sum: string | number | null }>({ sum: "file_size" })
    .first();
  return toSafeInt(row?.sum ?? 0);
}

export async function reconcileAllUserQuotaUsage(db: Knex): Promise<void> {
  await db.raw(`
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
  await db.raw(`
    UPDATE users
    SET quota_usage_bytes = 0
    WHERE id NOT IN (
      SELECT DISTINCT p.created_by
      FROM photos ph
      INNER JOIN projects p ON p.id = ph.project_id
      WHERE ph.status <> 'deleted'
        AND ph.file_size IS NOT NULL
    )
  `);
}
