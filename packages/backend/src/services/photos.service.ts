import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Knex } from "knex";
import {
  applyPagination,
  buildPaginatedResult,
  PaginatedResult,
  PaginationParams,
} from "../utils/pagination";
import { mediaStoragePathForApi, removeUploadDir } from "../utils/storage";
import { jobRunner } from "../workers";
import {
  canDeletePhotos,
  canEditPhotoMetadata,
  canUploadPhotos,
  loadProjectPermissionContext,
} from "../utils/project-permissions";
import {
  getProjectOwnerId,
  releaseQuota,
  reserveQuotaInTransaction,
  StorageQuotaExceededError,
} from "../utils/storage-quota";

export interface PhotoInsert {
  id?: string;
  project_id: string;
  original_path: string;
  original_name: string;
  mime_type?: string;
  file_size?: number;
  status?: "pending" | "ready" | "failed";
  width?: number;
  height?: number;
  preview_path?: string;
}
export interface PhotoRecord {
  readonly id: string;
  readonly project_id: string;
  readonly original_path: string;
  thumbnail_path: string | null;
  readonly hash: string | null;
  metadata: unknown | null;
  readonly created_at: Date;
  readonly original_name: string | null;
  readonly mime_type: string | null;
  readonly file_size: number | null;
  readonly status: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly preview_path: string | null;
  readonly final_decision: number | null;
  readonly final_decided_by: string | null;
  readonly final_decided_at: Date | null;
  readonly conflict_state: string | null;
  readonly trashed_at: Date | null;
}

export interface PhotoDto {
  readonly id: string;
  readonly projectId: string;
  readonly originalPath: string;
  readonly thumbnailPath: string | null;
  readonly hash: string | null;
  readonly metadata: unknown | null;
  readonly createdAt: string;
  readonly originalName: string | null;
  readonly mimeType: string | null;
  readonly fileSize: number | null;
  readonly status: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly previewPath: string | null;
  readonly finalDecision: number | null;
  readonly finalDecidedBy: string | null;
  readonly finalDecidedAt: string | null;
  readonly conflictState: string | null;
  readonly trashedAt: string | null;
}

export interface ListPhotosFilters extends PaginationParams {
  readonly projectId?: string;
  readonly search?: string;
  readonly decision?: number;
}

export interface GetPhotoParams {
  readonly userId: string;
  readonly photoId: string;
}

export interface UpdatePhotoMetadataParams {
  readonly userId: string;
  readonly photoId: string;
  readonly metadata?: unknown;
  readonly thumbnailPath?: string;
}

export interface CanUploadToProjectParams {
  readonly userId: string;
  readonly projectId: string;
}

export interface DeletePhotoParams {
  readonly userId: string;
  readonly photoId: string;
}

export interface DeletePhotosParams {
  readonly userId: string;
  readonly photoIds: readonly string[];
}

export type PhotoMutationDenyReason = "not_found" | "forbidden";

export interface DeletePhotoResult {
  readonly ok: true;
  readonly projectId: string;
}

export interface DeletePhotoFailure {
  readonly ok: false;
  readonly reason: PhotoMutationDenyReason;
}

export type DeletePhotoOutcome = DeletePhotoResult | DeletePhotoFailure;

export interface DeletePhotosResult {
  readonly deletedIds: readonly string[];
  readonly failedIds: readonly string[];
}

export interface PhotosServiceMethods {
  listPhotos: (
    filters: ListPhotosFilters,
    userId: string,
  ) => Promise<PaginatedResult<PhotoDto>>;
  getPhoto: (params: GetPhotoParams) => Promise<PhotoDto | null>;
  updatePhotoMetadata: (params: UpdatePhotoMetadataParams) => Promise<PhotoDto | null>;
  insertPhoto: (photo: PhotoInsert, ownerIdForQuota?: string) => Promise<PhotoDto | null>;
  canUploadToProject: (
    params: CanUploadToProjectParams,
  ) => Promise<boolean>;
  deletePhoto: (params: DeletePhotoParams) => Promise<DeletePhotoOutcome>;
  deletePhotos: (params: DeletePhotosParams) => Promise<DeletePhotosResult>;
}

function mapPhotoRecordToDto(record: PhotoRecord): PhotoDto {
  return {
    id: record.id,
    projectId: record.project_id,
    originalPath: mediaStoragePathForApi(record.original_path) ?? "",
    thumbnailPath:
      record.thumbnail_path !== null ? mediaStoragePathForApi(record.thumbnail_path) : null,
    hash: record.hash,
    metadata: record.metadata,
    createdAt: record.created_at.toISOString(),
    originalName: record.original_name,
    mimeType: record.mime_type,
    fileSize: record.file_size,
    status: record.status,
    width: record.width,
    height: record.height,
    previewPath:
      record.preview_path !== null ? mediaStoragePathForApi(record.preview_path) : null,
    finalDecision: record.final_decision,
    finalDecidedBy: record.final_decided_by,
    finalDecidedAt: record.final_decided_at ? record.final_decided_at.toISOString() : null,
    conflictState: record.conflict_state,
    trashedAt: record.trashed_at ? record.trashed_at.toISOString() : null,
  };
}

function buildPhotosService(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): PhotosServiceMethods {
  const db: Knex = fastify.db;

  async function listPhotos(
    filters: ListPhotosFilters,
    userId: string,
  ): Promise<PaginatedResult<PhotoDto>> {
    const baseQuery = db<PhotoRecord>("photos")
      .select<PhotoRecord[]>("photos.*")
      .join("projects", "projects.id", "photos.project_id")
      .whereNot("projects.status", "deleted")
      .whereNot("photos.status", "deleted")
      .join("project_members", function joinProjectMembers() {
        this.on("project_members.project_id", "photos.project_id").andOn(
          "project_members.user_id",
          db.raw("?", [userId]),
        );
      });
    if (filters.projectId) {
      baseQuery.where("photos.project_id", filters.projectId);
    }
    if (filters.search) {
      baseQuery.whereILike("photos.original_name", `%${filters.search}%`);
    }
    if (typeof filters.decision !== "undefined") {
      baseQuery
        .join("photo_reviews", "photo_reviews.photo_id", "photos.id")
        .where("photo_reviews.user_id", userId)
        .andWhere("photo_reviews.decision", filters.decision);
    }
    const countResult = await baseQuery
      .clone()
      .clearSelect()
      .count<{ count: string }[]>({ count: "*" });
    const total = Number(countResult[0]?.count ?? 0);
    const rows = await applyPagination(baseQuery, filters)
      .orderBy("photos.created_at", "asc")
      .orderBy("photos.id", "asc");
    const items = rows.map(mapPhotoRecordToDto);
    return buildPaginatedResult(items, total, filters.page, filters.pageSize);
  }

  async function getPhoto(params: GetPhotoParams): Promise<PhotoDto | null> {
    const row = await db<PhotoRecord>("photos")
      .select<PhotoRecord[]>("photos.*")
      .join("projects", "projects.id", "photos.project_id")
      .whereNot("projects.status", "deleted")
      .whereNot("photos.status", "deleted")
      .join("project_members", function joinProjectMembers() {
        this.on("project_members.project_id", "photos.project_id").andOn(
          "project_members.user_id",
          db.raw("?", [params.userId]),
        );
      })
      .where("photos.id", params.photoId)
      .first();
    if (!row) {
      return null;
    }
    return mapPhotoRecordToDto(row);
  }

  async function updatePhotoMetadata(
    params: UpdatePhotoMetadataParams,
  ): Promise<PhotoDto | null> {
    const existing = await db<PhotoRecord>("photos")
      .where("id", params.photoId)
      .first();
    if (!existing) {
      return null;
    }
    const memberRow = await db("project_members")
      .where({
        project_id: existing.project_id,
        user_id: params.userId,
      })
      .first();
    if (!memberRow) {
      return null;
    }
    const permCtx = await loadProjectPermissionContext(db, params.userId, existing.project_id);
    if (!permCtx || !canEditPhotoMetadata(permCtx)) {
      return null;
    }
    const patch: Partial<PhotoRecord> = {};
    if (typeof params.metadata !== "undefined") {
      patch.metadata = params.metadata as any;
    }
    if (typeof params.thumbnailPath !== "undefined") {
      const t = params.thumbnailPath;
      patch.thumbnail_path =
        typeof t === "string" && t.trim().length > 0 ? mediaStoragePathForApi(t) ?? null : null;
    }
    if (Object.keys(patch).length === 0) {
      return mapPhotoRecordToDto(existing);
    }
    const updatedRows = await db<PhotoRecord>("photos")
      .where("id", params.photoId)
      .update(patch, "*")
      .then((rows: PhotoRecord[]) => rows);
    const updated = updatedRows[0];
    if (!updated) {
      return null;
    }
    return mapPhotoRecordToDto(updated);
  }

  async function canUploadToProject(
    params: CanUploadToProjectParams,
  ): Promise<boolean> {
    const ctx = await loadProjectPermissionContext(db, params.userId, params.projectId);
    return Boolean(ctx && canUploadPhotos(ctx));
  }

  async function loadDeletablePhoto(
    photoId: string,
  ): Promise<(PhotoRecord & { project_id: string }) | null> {
    const row = await db<PhotoRecord>("photos")
      .select<PhotoRecord[]>("photos.*")
      .join("projects", "projects.id", "photos.project_id")
      .where("photos.id", photoId)
      .whereNot("projects.status", "deleted")
      .whereNot("photos.status", "deleted")
      .first();
    return row ?? null;
  }

  async function purgePhotoRecord(
    trx: Knex.Transaction,
    projectId: string,
    photoId: string,
    fileSize: number,
  ): Promise<boolean> {
    const ownerId = await getProjectOwnerId(trx, projectId);
    const deletedCount = await trx("photos").where({ id: photoId, project_id: projectId }).delete();
    if (deletedCount === 0) {
      return false;
    }
    if (ownerId && Number.isFinite(fileSize) && fileSize > 0) {
      await releaseQuota(trx, ownerId, fileSize);
    }
    return true;
  }

  async function deletePhoto(params: DeletePhotoParams): Promise<DeletePhotoOutcome> {
    const existing = await loadDeletablePhoto(params.photoId);
    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    const permCtx = await loadProjectPermissionContext(db, params.userId, existing.project_id);
    if (!permCtx || !canDeletePhotos(permCtx)) {
      return { ok: false, reason: "forbidden" };
    }
    const fileSize = Number(existing.file_size ?? 0);
    const purged = await db.transaction(async (trx: Knex.Transaction) =>
      purgePhotoRecord(trx, existing.project_id, params.photoId, fileSize),
    );
    if (!purged) {
      return { ok: false, reason: "not_found" };
    }
    try {
      await removeUploadDir(existing.project_id, params.photoId);
    } catch (err) {
      fastify.log.error(
        { err, projectId: existing.project_id, photoId: params.photoId },
        "removeUploadDir failed after photo delete",
      );
    }
    return { ok: true, projectId: existing.project_id };
  }

  async function deletePhotos(params: DeletePhotosParams): Promise<DeletePhotosResult> {
    const uniqueIds = [...new Set(params.photoIds.filter((id) => typeof id === "string" && id.length > 0))];
    if (uniqueIds.length === 0) {
      return { deletedIds: [], failedIds: [] };
    }

    const rows = await db<PhotoRecord>("photos")
      .select<PhotoRecord[]>("photos.*")
      .join("projects", "projects.id", "photos.project_id")
      .whereIn("photos.id", uniqueIds)
      .whereNot("projects.status", "deleted")
      .whereNot("photos.status", "deleted");

    const rowById = new Map(rows.map((row) => [row.id, row]));
    const deletedIds: string[] = [];
    const failedIds: string[] = [];

    for (const photoId of uniqueIds) {
      const row = rowById.get(photoId);
      if (!row) {
        failedIds.push(photoId);
        continue;
      }
      const permCtx = await loadProjectPermissionContext(db, params.userId, row.project_id);
      if (!permCtx || !canDeletePhotos(permCtx)) {
        failedIds.push(photoId);
        continue;
      }
      const fileSize = Number(row.file_size ?? 0);
      const purged = await db.transaction(async (trx: Knex.Transaction) =>
        purgePhotoRecord(trx, row.project_id, photoId, fileSize),
      );
      if (!purged) {
        failedIds.push(photoId);
        continue;
      }
      try {
        await removeUploadDir(row.project_id, photoId);
      } catch (err) {
        fastify.log.error(
          { err, projectId: row.project_id, photoId },
          "removeUploadDir failed after bulk photo delete",
        );
      }
      deletedIds.push(photoId);
    }

    return { deletedIds, failedIds };
  }

  async function insertPhoto(
    photo: PhotoInsert,
    ownerIdForQuota?: string,
  ): Promise<PhotoDto | null> {
    const row: Record<string, unknown> = {
      project_id: photo.project_id,
      original_path: photo.original_path,
      original_name: photo.original_name,
      mime_type: photo.mime_type,
      file_size: photo.file_size,
      status: photo.status ?? "pending",
      width: photo.width ?? null,
      height: photo.height ?? null,
    };
    if (photo.id) row.id = photo.id;
    try {
      const result = await db.transaction(async (trx: Knex.Transaction) => {
        if (ownerIdForQuota) {
          await reserveQuotaInTransaction(trx, ownerIdForQuota, photo.file_size ?? 0);
        }
        const inserted = await trx<PhotoRecord>("photos").insert(row, "*");
        const insertedPhoto = inserted[0];
        if (!insertedPhoto) {
          throw new Error("Photo insert returned no row");
        }
        await trx("processing_jobs").insert([
          { photo_id: insertedPhoto.id, job_type: "thumbnail" },
          { photo_id: insertedPhoto.id, job_type: "preview" },
          { photo_id: insertedPhoto.id, job_type: "metadata" },
        ]);
        return insertedPhoto;
      });
      jobRunner.notify();
      return mapPhotoRecordToDto(result);
    } catch (err) {
      if (err instanceof StorageQuotaExceededError) {
        throw err;
      }
      fastify.log.error({ err }, "insertPhoto failed");
      return null;
    }
  }

  return {
    listPhotos,
    getPhoto,
    updatePhotoMetadata,
    insertPhoto,
    canUploadToProject,
    deletePhoto,
    deletePhotos,
  };
}

export default buildPhotosService;
