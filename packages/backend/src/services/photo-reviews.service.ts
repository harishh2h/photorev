import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Knex } from "knex";
import {
  applyPagination,
  buildPaginatedResult,
  PaginatedResult,
  PaginationParams,
} from "../utils/pagination";

export interface PhotoReviewRecord {
  readonly id: string;
  readonly photo_id: string;
  readonly user_id: string;
  readonly library_id: string;
  readonly seen: boolean;
  readonly decision: number | null;
  readonly renamed_to: string | null;
  readonly seen_at: Date;
  readonly voted_at: Date | null;
}

export interface PhotoReviewDto {
  readonly id: string;
  readonly photoId: string;
  readonly userId: string;
  readonly libraryId: string;
  readonly seen: boolean;
  readonly decision: number | null;
  readonly renamedTo: string | null;
  readonly seenAt: string;
  readonly votedAt: string | null;
}

export interface UpsertReviewParams {
  readonly userId: string;
  readonly photoId: string;
  readonly libraryId: string;
  readonly seen?: boolean;
  readonly decision?: number | null;
  readonly renamedTo?: string | null;
}

export interface ListUserReviewsFilters extends PaginationParams {
  readonly projectId?: string;
  readonly libraryId?: string;
  readonly decision?: number;
}

export interface ListPhotoReviewsParams extends PaginationParams {
  readonly userId: string;
  readonly photoId: string;
}

export interface PhotoReviewsServiceMethods {
  upsertReview: (params: UpsertReviewParams) => Promise<PhotoReviewDto | null>;
  listUserReviews: (
    userId: string,
    filters: ListUserReviewsFilters,
  ) => Promise<PaginatedResult<PhotoReviewDto>>;
  listPhotoReviews: (
    params: ListPhotoReviewsParams,
  ) => Promise<PaginatedResult<PhotoReviewDto>>;
}

function mapReviewRecordToDto(record: PhotoReviewRecord): PhotoReviewDto {
  return {
    id: record.id,
    photoId: record.photo_id,
    userId: record.user_id,
    libraryId: record.library_id,
    seen: record.seen,
    decision: record.decision,
    renamedTo: record.renamed_to,
    seenAt: record.seen_at.toISOString(),
    votedAt: record.voted_at ? record.voted_at.toISOString() : null,
  };
}

function buildPhotoReviewsService(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): PhotoReviewsServiceMethods {
  const db: Knex = fastify.db;

  async function ensureUserCanAccessPhoto(userId: string, photoId: string): Promise<boolean> {
    const row = await db("photos")
      .join("project_members", function joinProjectMembers() {
        this.on("project_members.project_id", "photos.project_id").andOn(
          "project_members.user_id",
          db.raw("?", [userId]),
        );
      })
      .where("photos.id", photoId)
      .first();
    return Boolean(row);
  }

  async function upsertReview(params: UpsertReviewParams): Promise<PhotoReviewDto | null> {
    const canAccess = await ensureUserCanAccessPhoto(params.userId, params.photoId);
    if (!canAccess) {
      return null;
    }
    const now = new Date();
    const baseUpdate: Partial<PhotoReviewRecord> = {
      seen: params.seen ?? true,
      seen_at: now,
    } as any;
    if (typeof params.renamedTo !== "undefined") {
      (baseUpdate as any).renamed_to = params.renamedTo;
    }
    if (typeof params.decision !== "undefined") {
      (baseUpdate as any).decision = params.decision;
      (baseUpdate as any).voted_at = params.decision === null ? null : now;
    }
    const insertedRows = await db<PhotoReviewRecord>("photo_reviews")
      .insert(
        {
          photo_id: params.photoId,
          user_id: params.userId,
          library_id: params.libraryId,
          seen: baseUpdate.seen ?? true,
          decision:
            typeof (baseUpdate as any).decision === "undefined"
              ? null
              : (baseUpdate as any).decision,
          renamed_to:
            typeof (baseUpdate as any).renamed_to === "undefined"
              ? null
              : (baseUpdate as any).renamed_to,
          seen_at: now,
          voted_at:
            typeof (baseUpdate as any).voted_at === "undefined"
              ? null
              : (baseUpdate as any).voted_at,
        },
        "*",
      )
      .onConflict(["photo_id", "user_id"])
      .merge(baseUpdate as any)
      .then((rows: PhotoReviewRecord[]) => rows);
    const review = insertedRows[0];
    return mapReviewRecordToDto(review);
  }

  async function listUserReviews(
    userId: string,
    filters: ListUserReviewsFilters,
  ): Promise<PaginatedResult<PhotoReviewDto>> {
    const baseQuery = db<PhotoReviewRecord>("photo_reviews")
      .select<PhotoReviewRecord[]>("photo_reviews.*")
      .join("photos", "photos.id", "photo_reviews.photo_id")
      .join("project_members", function joinProjectMembers() {
        this.on("project_members.project_id", "photos.project_id").andOn(
          "project_members.user_id",
          db.raw("?", [userId]),
        );
      })
      .where("photo_reviews.user_id", userId);
    if (filters.projectId) {
      baseQuery.where("photos.project_id", filters.projectId);
    }
    if (filters.libraryId) {
      baseQuery.where("photo_reviews.library_id", filters.libraryId);
    }
    if (typeof filters.decision !== "undefined") {
      baseQuery.where("photo_reviews.decision", filters.decision);
    }
    const countResult = await baseQuery.clone().count<{ count: string }[]>({
      count: "*",
    });
    const total = Number(countResult[0]?.count ?? 0);
    const pagedQuery = applyPagination(baseQuery, filters);
    const rows = await pagedQuery;
    const items = rows.map(mapReviewRecordToDto);
    return buildPaginatedResult(items, total, filters.page, filters.pageSize);
  }

  async function listPhotoReviews(
    params: ListPhotoReviewsParams,
  ): Promise<PaginatedResult<PhotoReviewDto>> {
    const canAccess = await ensureUserCanAccessPhoto(params.userId, params.photoId);
    if (!canAccess) {
      return buildPaginatedResult([], 0, params.page, params.pageSize);
    }
    const baseQuery = db<PhotoReviewRecord>("photo_reviews")
      .select<PhotoReviewRecord[]>("photo_reviews.*")
      .where("photo_reviews.photo_id", params.photoId);
    const countResult = await baseQuery.clone().count<{ count: string }[]>({
      count: "*",
    });
    const total = Number(countResult[0]?.count ?? 0);
    const pagedQuery = applyPagination(baseQuery, params);
    const rows = await pagedQuery;
    const items = rows.map(mapReviewRecordToDto);
    return buildPaginatedResult(items, total, params.page, params.pageSize);
  }

  return {
    upsertReview,
    listUserReviews,
    listPhotoReviews,
  };
}

export default buildPhotoReviewsService;

