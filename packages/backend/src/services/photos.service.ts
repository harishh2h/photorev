import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Knex } from "knex";
import {
  applyPagination,
  buildPaginatedResult,
  PaginatedResult,
  PaginationParams,
} from "../utils/pagination";
import { jobRunner } from "../workers";

export interface PhotoInsert {
  id?: string;
  project_id: string;
  library_id: string;
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
  readonly library_id: string;
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
}

export interface PhotoDto {
  readonly id: string;
  readonly projectId: string;
  readonly libraryId: string;
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
}

export interface ListPhotosFilters extends PaginationParams {
  readonly projectId?: string;
  readonly libraryId?: string;
  readonly search?: string;
  readonly decision?: number;
}

export interface GetPhotoParams {
  readonly userId: string;
  readonly photoId: string;
}

export interface ListLibraryPhotosParams extends PaginationParams {
  readonly userId: string;
  readonly libraryId: string;
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
  readonly libraryId: string;
}

export interface PhotosServiceMethods {
  listPhotos: (
    filters: ListPhotosFilters,
    userId: string,
  ) => Promise<PaginatedResult<PhotoDto>>;
  listLibraryPhotos: (
    params: ListLibraryPhotosParams,
  ) => Promise<PaginatedResult<PhotoDto>>;
  getPhoto: (params: GetPhotoParams) => Promise<PhotoDto | null>;
  updatePhotoMetadata: (params: UpdatePhotoMetadataParams) => Promise<PhotoDto | null>;
  insertPhoto: (photo: PhotoInsert) => Promise<PhotoDto | null>;
  canUploadToProject: (
    params: CanUploadToProjectParams,
  ) => Promise<boolean>;
}

function mapPhotoRecordToDto(record: PhotoRecord): PhotoDto {
  return {
    id: record.id,
    projectId: record.project_id,
    libraryId: record.library_id,
    originalPath: record.original_path,
    thumbnailPath: record.thumbnail_path,
    hash: record.hash,
    metadata: record.metadata,
    createdAt: record.created_at.toISOString(),
    originalName: record.original_name,
    mimeType: record.mime_type,
    fileSize: record.file_size,
    status: record.status,
    width: record.width,
    height: record.height,
    previewPath: record.preview_path,
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
      .join("project_members", function joinProjectMembers() {
        this.on("project_members.project_id", "photos.project_id").andOn(
          "project_members.user_id",
          db.raw("?", [userId]),
        );
      });
    if (filters.projectId) {
      baseQuery.where("photos.project_id", filters.projectId);
    }
    if (filters.libraryId) {
      baseQuery.where("photos.library_id", filters.libraryId);
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
    const pagedQuery = applyPagination(baseQuery, filters);
    const rows = await pagedQuery;
    const items = rows.map(mapPhotoRecordToDto);
    return buildPaginatedResult(items, total, filters.page, filters.pageSize);
  }

  async function listLibraryPhotos(
    params: ListLibraryPhotosParams,
  ): Promise<PaginatedResult<PhotoDto>> {
    const baseQuery = db<PhotoRecord>("photos")
      .select<PhotoRecord[]>("photos.*")
      .join("project_members", function joinProjectMembers() {
        this.on("project_members.project_id", "photos.project_id").andOn(
          "project_members.user_id",
          db.raw("?", [params.userId]),
        );
      })
      .where("photos.library_id", params.libraryId);
    const countResult = await baseQuery
      .clone()
      .clearSelect()
      .count<{ count: string }[]>({ count: "*" });
    const total = Number(countResult[0]?.count ?? 0);
    const pagedQuery = applyPagination(baseQuery, params);
    const rows = await pagedQuery;
    const items = rows.map(mapPhotoRecordToDto);
    return buildPaginatedResult(items, total, params.page, params.pageSize);
  }

  async function getPhoto(params: GetPhotoParams): Promise<PhotoDto | null> {
    const row = await db<PhotoRecord>("photos")
      .select<PhotoRecord[]>("photos.*")
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
    const patch: Partial<PhotoRecord> = {};
    if (typeof params.metadata !== "undefined") {
      patch.metadata = params.metadata as any;
    }
    if (typeof params.thumbnailPath !== "undefined") {
      patch.thumbnail_path = params.thumbnailPath;
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
    const row = await db("project_members")
      .join("library", "library.project_id", "project_members.project_id")
      .where("project_members.user_id", params.userId)
      .where("project_members.project_id", params.projectId)
      .where("library.id", params.libraryId)
      .first();
    return Boolean(row);
  }

  async function insertPhoto(photo: PhotoInsert): Promise<PhotoDto | null> {
    const row: Record<string, unknown> = {
      project_id: photo.project_id,
      library_id: photo.library_id,
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
      fastify.log.error({ err }, "insertPhoto failed");
      return null;
    }
  }

  return {
    listPhotos,
    listLibraryPhotos,
    getPhoto,
    updatePhotoMetadata,
    insertPhoto,
    canUploadToProject,
  };
}

export default buildPhotosService;

