import fs from "node:fs/promises";
import path from "node:path";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Knex } from "knex";
import {
  EXPORT_TTL_MS,
  type ProjectExportDto,
  type ProjectExportRecord,
  type ProjectExportStatus,
  type ProjectExportVariant,
} from "../models/project-export";
import {
  computeProjectExportHash,
  computeProjectExportHashByIds,
  DEFAULT_EXPORT_FILTER,
  DEFAULT_EXPORT_SCOPE,
} from "../utils/export-photo-query";
import { loadProjectPermissionContext } from "../utils/project-permissions";
import { getStorageRoot } from "../utils/storage";
import { exportRunner } from "../workers/exportRunner";

export interface CreateProjectExportParams {
  readonly userId: string;
  readonly projectId: string;
  readonly variant: ProjectExportVariant;
  readonly reviewScope?: string;
  readonly photoFilter?: string;
  readonly photoIds?: unknown;
}

export interface CreateShareExportParams {
  readonly shareToken: string;
  readonly variant: ProjectExportVariant;
  readonly photoIds?: unknown;
}

export interface GetExportParams {
  readonly userId?: string;
  readonly projectId: string;
  readonly exportId: string;
}

export interface GetShareExportParams {
  readonly shareToken: string;
  readonly exportId: string;
}

export interface ProjectExportsServiceMethods {
  createForProject: (params: CreateProjectExportParams) => Promise<ProjectExportDto | null>;
  createForShare: (params: CreateShareExportParams) => Promise<ProjectExportDto | null>;
  getForProjectMember: (params: GetExportParams) => Promise<ProjectExportDto | null>;
  getForShare: (params: GetShareExportParams) => Promise<ProjectExportDto | null>;
  resolveDownloadForProjectMember: (
    params: GetExportParams,
  ) => Promise<{ absolutePath: string; filename: string } | null>;
  resolveDownloadForShare: (
    params: GetShareExportParams,
  ) => Promise<{ absolutePath: string; filename: string } | null>;
  countSelectedPhotos: (projectId: string) => Promise<number>;
}

function mapRecordToDto(row: ProjectExportRecord, reused = false): ProjectExportDto {
  const photoCount = Number(row.photo_count) || 0;
  const processedCount = Number(row.processed_count) || 0;
  const progressPercent =
    photoCount > 0 ? Math.min(100, Math.round((processedCount / photoCount) * 100)) : 0;
  const expiresAt = row.expires_at ? row.expires_at.toISOString() : null;
  const downloadAvailable =
    row.status === "done" &&
    expiresAt != null &&
    new Date(expiresAt).getTime() > Date.now() &&
    row.file_path != null;

  return {
    id: row.id,
    projectId: row.project_id,
    variant: row.variant,
    status: row.status as ProjectExportStatus,
    photoCount,
    processedCount,
    progressPercent,
    byteSize: row.byte_size != null ? Number(row.byte_size) : null,
    errorMessage: row.error_message,
    expiresAt,
    queuedAt: row.queued_at.toISOString(),
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    downloadAvailable,
    reused,
  };
}

async function expireIfNeeded(db: Knex, row: ProjectExportRecord): Promise<ProjectExportRecord> {
  if (row.status !== "done" || !row.expires_at) {
    return row;
  }
  if (row.expires_at.getTime() > Date.now()) {
    return row;
  }
  if (row.file_path) {
    const abs = path.join(getStorageRoot(), row.file_path);
    await fs.rm(abs, { force: true }).catch(() => undefined);
  }
  await db("project_exports").where("id", row.id).update({ status: "expired", file_path: null });
  return { ...row, status: "expired", file_path: null };
}

function buildDownloadFilename(projectName: string, variant: ProjectExportVariant): string {
  const safe = projectName.replace(/[^\w\s-]/g, "").trim().slice(0, 60) || "project";
  const tier = variant === "preview" ? "compressed" : "full-quality";
  return `${safe}-selected-${tier}.zip`;
}

function buildProjectExportsService(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): ProjectExportsServiceMethods {
  const db: Knex = fastify.db;

  async function countSelectedPhotos(projectId: string): Promise<number> {
    const row = await db("photos")
      .where("project_id", projectId)
      .andWhere("status", "ready")
      .andWhere("final_decision", 1)
      .count<{ count: string }[]>({ count: "*" });
    return Number(row[0]?.count ?? 0);
  }

  async function findReusableExport(
    projectId: string,
    variant: ProjectExportVariant,
    selectionHash: string,
  ): Promise<ProjectExportRecord | null> {
    const candidates = await db<ProjectExportRecord>("project_exports")
      .where({
        project_id: projectId,
        variant,
        selection_hash: selectionHash,
      })
      .whereIn("status", ["queued", "processing", "done"])
      .orderBy("queued_at", "desc");

    for (const raw of candidates) {
      const row = await expireIfNeeded(db, raw);
      if (row.status === "failed" || row.status === "expired") {
        continue;
      }
      if (row.status === "done") {
        if (!row.file_path || !row.expires_at || row.expires_at.getTime() <= Date.now()) {
          continue;
        }
        const abs = path.join(getStorageRoot(), row.file_path);
        try {
          await fs.access(abs);
        } catch {
          continue;
        }
      }
      return row;
    }
    return null;
  }

  async function insertExport(params: {
    projectId: string;
    variant: ProjectExportVariant;
    userId: string | null;
    shareLinkId: string | null;
    photoCount: number;
    selectionHash: string;
    reviewScope: string | null;
    photoFilter: string | null;
    photoIds: string[] | null;
  }): Promise<ProjectExportDto> {
    const photoIdsJson =
      params.photoIds != null && params.photoIds.length > 0
        ? JSON.stringify(params.photoIds)
        : null;

    const [row] = await db<ProjectExportRecord>("project_exports")
      .insert({
        project_id: params.projectId,
        variant: params.variant,
        created_by_user_id: params.userId,
        share_link_id: params.shareLinkId,
        photo_count: params.photoCount,
        processed_count: 0,
        status: "queued",
        selection_hash: params.selectionHash,
        review_scope: params.reviewScope,
        photo_filter: params.photoFilter,
        photo_ids: photoIdsJson == null ? null : db.raw("?::jsonb", [photoIdsJson]),
      })
      .returning("*");
    exportRunner.notify();
    return mapRecordToDto(row, false);
  }

  async function createOrReuseExport(params: {
    projectId: string;
    variant: ProjectExportVariant;
    userId: string | null;
    shareLinkId: string | null;
    reviewScope?: string;
    photoFilter?: string;
    photoIds?: unknown;
    shareEligibleOnly?: boolean;
  }): Promise<ProjectExportDto> {
    const hasPhotoIds =
      Array.isArray(params.photoIds) && params.photoIds.length > 0;

    if (hasPhotoIds) {
      const { hash, photoCount, photoIds } = await computeProjectExportHashByIds(
        db,
        params.projectId,
        params.userId,
        params.photoIds,
        { shareEligibleOnly: params.shareEligibleOnly },
      );
      const existing = await findReusableExport(params.projectId, params.variant, hash);
      if (existing) {
        if (existing.status === "queued") {
          exportRunner.notify();
        }
        return mapRecordToDto(existing, true);
      }
      return insertExport({
        projectId: params.projectId,
        variant: params.variant,
        userId: params.userId,
        shareLinkId: params.shareLinkId,
        photoCount,
        selectionHash: hash,
        reviewScope: null,
        photoFilter: null,
        photoIds,
      });
    }

    const scope = params.reviewScope ?? DEFAULT_EXPORT_SCOPE;
    const filter = params.photoFilter ?? DEFAULT_EXPORT_FILTER;
    const { hash, photoCount } = await computeProjectExportHash(
      db,
      params.projectId,
      params.userId,
      scope,
      filter,
    );
    if (photoCount === 0) {
      throw new Error("No photos to download for this filter");
    }

    const existing = await findReusableExport(params.projectId, params.variant, hash);
    if (existing) {
      if (existing.status === "queued") {
        exportRunner.notify();
      }
      return mapRecordToDto(existing, true);
    }

    return insertExport({
      projectId: params.projectId,
      variant: params.variant,
      userId: params.userId,
      shareLinkId: params.shareLinkId,
      photoCount,
      selectionHash: hash,
      reviewScope: scope,
      photoFilter: filter,
      photoIds: null,
    });
  }

  async function loadExportById(exportId: string, projectId: string): Promise<ProjectExportRecord | null> {
    const row = await db<ProjectExportRecord>("project_exports")
      .where({ id: exportId, project_id: projectId })
      .first();
    if (!row) return null;
    return expireIfNeeded(db, row);
  }

  const service: ProjectExportsServiceMethods = {
    countSelectedPhotos,

    createForProject: async (params) => {
      const ctx = await loadProjectPermissionContext(db, params.userId, params.projectId);
      if (!ctx) return null;

      return createOrReuseExport({
        projectId: params.projectId,
        variant: params.variant,
        userId: params.userId,
        shareLinkId: null,
        reviewScope: params.reviewScope,
        photoFilter: params.photoFilter,
        photoIds: params.photoIds,
      });
    },

    createForShare: async (params) => {
      const link = await db<{ id: string; project_id: string; revoked_at: Date | null; allow_download: boolean; expires_at: Date | null }>(
        "share_links",
      )
        .select("id", "project_id", "revoked_at", "allow_download", "expires_at")
        .where("token", params.shareToken)
        .first();

      if (!link || link.revoked_at) return null;
      if (!link.allow_download) {
        throw new Error("Downloads are disabled for this share link");
      }
      if (link.expires_at && link.expires_at.getTime() < Date.now()) {
        throw new Error("Share link has expired");
      }

      return createOrReuseExport({
        projectId: link.project_id,
        variant: params.variant,
        userId: null,
        shareLinkId: link.id,
        photoIds: params.photoIds,
        shareEligibleOnly: true,
      });
    },

    getForProjectMember: async (params) => {
      const ctx = await loadProjectPermissionContext(db, params.userId ?? "", params.projectId);
      if (!ctx || !params.userId) return null;
      const row = await loadExportById(params.exportId, params.projectId);
      return row ? mapRecordToDto(row, false) : null;
    },

    getForShare: async (params) => {
      const link = await db<{ id: string; project_id: string; revoked_at: Date | null }>("share_links")
        .select("id", "project_id", "revoked_at")
        .where("token", params.shareToken)
        .first();
      if (!link || link.revoked_at) return null;
      const row = await loadExportById(params.exportId, link.project_id);
      if (!row || row.share_link_id !== link.id) return null;
      return mapRecordToDto(row, false);
    },

    resolveDownloadForProjectMember: async (params) => {
      const ctx = await loadProjectPermissionContext(db, params.userId ?? "", params.projectId);
      if (!ctx || !params.userId) return null;

      const row = await loadExportById(params.exportId, params.projectId);
      if (!row || row.status !== "done" || !row.file_path || !row.expires_at) {
        return null;
      }
      if (row.expires_at.getTime() <= Date.now()) {
        return null;
      }

      const project = await db<{ name: string }>("projects")
        .select("name")
        .where("id", params.projectId)
        .first();
      const abs = path.join(getStorageRoot(), row.file_path);
      try {
        await fs.access(abs);
      } catch {
        return null;
      }

      return {
        absolutePath: abs,
        filename: buildDownloadFilename(project?.name ?? "project", row.variant as ProjectExportVariant),
      };
    },

    resolveDownloadForShare: async (params) => {
      const link = await db<{
        id: string;
        project_id: string;
        revoked_at: Date | null;
        allow_download: boolean;
      }>("share_links")
        .select("id", "project_id", "revoked_at", "allow_download")
        .where("token", params.shareToken)
        .first();
      if (!link || link.revoked_at || !link.allow_download) return null;

      const row = await loadExportById(params.exportId, link.project_id);
      if (
        !row ||
        row.share_link_id !== link.id ||
        row.status !== "done" ||
        !row.file_path ||
        !row.expires_at
      ) {
        return null;
      }
      if (row.expires_at.getTime() <= Date.now()) {
        return null;
      }

      const project = await db<{ name: string }>("projects")
        .select("name")
        .where("id", link.project_id)
        .first();
      const abs = path.join(getStorageRoot(), row.file_path);
      try {
        await fs.access(abs);
      } catch {
        return null;
      }

      return {
        absolutePath: abs,
        filename: buildDownloadFilename(project?.name ?? "project", row.variant as ProjectExportVariant),
      };
    },
  };

  return service;
}

export default buildProjectExportsService;
export { EXPORT_TTL_MS };
