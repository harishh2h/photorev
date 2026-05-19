import fs from "node:fs";
import path from "node:path";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Knex } from "knex";
import type { ShareLink } from "../models/share-link";
import {
  findPreviewFileAbsolute,
  getStorageRoot,
  mediaStoragePathForApi,
} from "../utils/storage";

export type PublicVariant = "thumb" | "preview" | "original";

export interface PublicPhotoDto {
  readonly id: string;
  readonly originalName: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly fileSize: number | null;
  readonly mimeType: string | null;
  readonly metadata: unknown | null;
}

export interface PublicShareMeta {
  readonly projectName: string;
  readonly description: string | null;
  readonly showMetadata: boolean;
  readonly allowDownload: boolean;
  readonly expiresAt: string | null;
  readonly finalizedAt: string | null;
}

export interface PublicShareListing {
  readonly meta: PublicShareMeta;
  readonly photos: ReadonlyArray<PublicPhotoDto>;
}

export interface PublicShareServiceMethods {
  loadShareListing: (link: ShareLink) => Promise<PublicShareListing | null>;
  resolveSharePhotoFile: (
    projectId: string,
    photoId: string,
    variant: PublicVariant,
  ) => Promise<{ absolutePath: string; mimeType: string; fileSize: number | null; originalName: string | null } | null>;
}

function getMimeForPath(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".tif") || lower.endsWith(".tiff")) return "image/tiff";
  return "image/jpeg";
}

async function readableOrNull(p: string): Promise<string | null> {
  try {
    await fs.promises.access(p);
    return p;
  } catch {
    return null;
  }
}

function buildPublicShareService(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
): PublicShareServiceMethods {
  const db: Knex = fastify.db;

  async function loadShareListing(link: ShareLink): Promise<PublicShareListing | null> {
    const project = await db<{ name: string; finalized_at: Date | null }>("projects")
      .select("name", "finalized_at")
      .where("id", link.project_id)
      .first();
    if (!project) return null;
    const photos = await db("photos")
      .select<
        Array<{
          id: string;
          original_name: string | null;
          width: number | null;
          height: number | null;
          file_size: number | null;
          mime_type: string | null;
          metadata: unknown;
        }>
      >("id", "original_name", "width", "height", "file_size", "mime_type", "metadata")
      .where("project_id", link.project_id)
      .andWhere("status", "ready")
      .andWhere("final_decision", 1)
      .orderBy("created_at", "asc");
    return {
      meta: {
        projectName: project.name,
        description: link.description,
        showMetadata: link.show_metadata,
        allowDownload: link.allow_download,
        expiresAt: link.expires_at ? link.expires_at.toISOString() : null,
        finalizedAt: project.finalized_at ? project.finalized_at.toISOString() : null,
      },
      photos: photos.map((p) => ({
        id: p.id,
        originalName: p.original_name,
        width: p.width,
        height: p.height,
        fileSize: p.file_size,
        mimeType: p.mime_type,
        metadata: link.show_metadata ? p.metadata : null,
      })),
    };
  }

  async function resolveSharePhotoFile(
    projectId: string,
    photoId: string,
    variant: PublicVariant,
  ): Promise<{ absolutePath: string; mimeType: string; fileSize: number | null; originalName: string | null } | null> {
    const row = await db("photos")
      .select<
        Array<{
          id: string;
          original_path: string;
          original_name: string | null;
          thumbnail_path: string | null;
          preview_path: string | null;
          file_size: number | null;
          mime_type: string | null;
        }>
      >(
        "id",
        "original_path",
        "original_name",
        "thumbnail_path",
        "preview_path",
        "file_size",
        "mime_type",
      )
      .where("id", photoId)
      .andWhere("project_id", projectId)
      .andWhere("status", "ready")
      .andWhere("final_decision", 1)
      .first();
    if (!row) return null;

    const storageRoot = getStorageRoot();
    const photoDir = path.join(storageRoot, "photos", projectId, row.id);
    const joinRel = (rel: string | null | undefined): string | null =>
      rel != null && String(rel).trim() !== "" ? path.join(storageRoot, String(rel)) : null;
    const thumbDb = joinRel(row.thumbnail_path);
    const previewDb = joinRel(row.preview_path);
    const originalDb = joinRel(mediaStoragePathForApi(row.original_path));
    const thumbDisk = path.join(photoDir, "thumb.jpeg");

    const previewDisk = async (): Promise<string | null> => {
      const found = await findPreviewFileAbsolute(photoDir);
      return found ? readableOrNull(found) : null;
    };

    async function pick(
      paths: Array<string | null | (() => Promise<string | null>)>,
    ): Promise<string | null> {
      for (const p of paths) {
        const candidate = typeof p === "function" ? await p() : p;
        if (!candidate) continue;
        const ok = await readableOrNull(candidate);
        if (ok) return ok;
      }
      return null;
    }

    let abs: string | null;
    if (variant === "thumb") {
      abs = await pick([thumbDisk, thumbDb, previewDisk, previewDb, originalDb]);
    } else if (variant === "preview") {
      abs = await pick([previewDisk, previewDb, thumbDisk, thumbDb, originalDb]);
    } else {
      abs = await pick([originalDb, previewDisk, previewDb, thumbDisk, thumbDb]);
    }
    if (!abs) return null;
    return {
      absolutePath: abs,
      mimeType: getMimeForPath(abs),
      fileSize: variant === "original" ? row.file_size : null,
      originalName: row.original_name,
    };
  }

  return { loadShareListing, resolveSharePhotoFile };
}

export default buildPublicShareService;
