import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Knex } from "knex";
import {
  applyPagination,
  buildPaginatedResult,
  PaginatedResult,
  PaginationParams,
} from "../utils/pagination";

export interface PhotoRecord {
  readonly id: string;
  readonly project_id: string;
  readonly library_id: string;
  readonly filename: string;
  readonly absolute_path: string;
  thumbnail_path: string | null;
  readonly hash: string | null;
  metadata: unknown | null;
  readonly created_at: Date;
}

export interface PhotoDto {
  readonly id: string;
  readonly projectId: string;
  readonly libraryId: string;
  readonly filename: string;
  readonly absolutePath: string;
  readonly thumbnailPath: string | null;
  readonly hash: string | null;
  readonly metadata: unknown | null;
  readonly createdAt: string;
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
}

function mapPhotoRecordToDto(record: PhotoRecord): PhotoDto {
  return {
    id: record.id,
    projectId: record.project_id,
    libraryId: record.library_id,
    filename: record.filename,
    absolutePath: record.absolute_path,
    thumbnailPath: record.thumbnail_path,
    hash: record.hash,
    metadata: record.metadata,
    createdAt: record.created_at.toISOString(),
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
      baseQuery.whereILike("photos.filename", `%${filters.search}%`);
    }
    if (typeof filters.decision !== "undefined") {
      baseQuery
        .join("photo_reviews", "photo_reviews.photo_id", "photos.id")
        .where("photo_reviews.user_id", userId)
        .andWhere("photo_reviews.decision", filters.decision);
    }
    const countResult = await baseQuery.clone().count<{ count: string }[]>({
      count: "*",
    });
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
    const countResult = await baseQuery.clone().count<{ count: string }[]>({
      count: "*",
    });
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

  return {
    listPhotos,
    listLibraryPhotos,
    getPhoto,
    updatePhotoMetadata,
  };
}

export default buildPhotosService;

