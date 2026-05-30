import fs from "node:fs/promises";
import path from "node:path";
import type { ProjectExportVariant } from "../models/project-export";
import {
  findOriginalFileAbsolute,
  findPreviewFileAbsolute,
  getStorageRoot,
  mediaStoragePathForApi,
} from "./storage";
import { sanitizeZipEntryName, uniquifyZipEntryName } from "./zip-entry-name";

export interface ExportPhotoRow {
  readonly id: string;
  readonly original_name: string | null;
  readonly renamed_to?: string | null;
  readonly original_path: string | null;
  readonly preview_path: string | null;
}

async function readableOrNull(absolutePath: string): Promise<string | null> {
  try {
    await fs.access(absolutePath);
    return absolutePath;
  } catch {
    return null;
  }
}

export async function resolveExportPhotoAbsolutePath(
  projectId: string,
  photo: ExportPhotoRow,
  variant: ProjectExportVariant,
): Promise<string | null> {
  const storageRoot = getStorageRoot();
  const photoDir = path.join(storageRoot, "photos", projectId, photo.id);
  const joinRel = (rel: string | null | undefined): string | null => {
    const api = mediaStoragePathForApi(rel);
    if (!api) return null;
    return path.join(storageRoot, api);
  };

  if (variant === "preview") {
    const previewDb = joinRel(photo.preview_path);
    if (previewDb) {
      const ok = await readableOrNull(previewDb);
      if (ok) return ok;
    }
    const disk = await findPreviewFileAbsolute(photoDir);
    return disk ? readableOrNull(disk) : null;
  }

  const originalDb = joinRel(photo.original_path);
  if (originalDb) {
    const ok = await readableOrNull(originalDb);
    if (ok) return ok;
  }
  const disk = await findOriginalFileAbsolute(photoDir);
  return disk ? readableOrNull(disk) : null;
}

/**
 * Client-facing filename: rename suggestion when set, otherwise upload original_name.
 */
export function exportDisplayNameForPhoto(photo: ExportPhotoRow): string {
  const renamed = photo.renamed_to?.trim();
  if (renamed) {
    if (!path.extname(renamed) && photo.original_name) {
      const originalExt = path.extname(photo.original_name);
      if (originalExt) {
        return `${renamed}${originalExt}`;
      }
    }
    return renamed;
  }
  return photo.original_name?.trim() ?? "";
}

export function zipEntryNameForPhoto(photo: ExportPhotoRow, variant: ProjectExportVariant): string {
  const fallback =
    variant === "preview" ? `photo-${photo.id}.jpg` : `photo-${photo.id}`;
  const base = sanitizeZipEntryName(exportDisplayNameForPhoto(photo), fallback);
  if (variant === "preview") {
    const stem = base.replace(/\.[^.]+$/, "") || `photo-${photo.id}`;
    return `${stem}.jpg`;
  }
  return base;
}

/**
 * Assigns ZIP entry names; resolves collisions with numeric suffixes (foo-2.jpg).
 */
export function zipEntryNamesForPhotos(
  photos: ExportPhotoRow[],
  variant: ProjectExportVariant,
): string[] {
  const used = new Set<string>();
  return photos.map((photo) => {
    const raw = zipEntryNameForPhoto(photo, variant);
    return uniquifyZipEntryName(raw, used);
  });
}
