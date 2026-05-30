import fs from "node:fs/promises";
import path from "node:path";
import type { ProjectExportVariant } from "../models/project-export";
import {
  findOriginalFileAbsolute,
  findPreviewFileAbsolute,
  getStorageRoot,
  mediaStoragePathForApi,
} from "./storage";
import { sanitizeZipEntryName } from "./zip-entry-name";

export interface ExportPhotoRow {
  readonly id: string;
  readonly original_name: string | null;
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

export function zipEntryNameForPhoto(
  photo: ExportPhotoRow,
  variant: ProjectExportVariant,
  index: number,
): string {
  const fallback =
    variant === "preview" ? `photo-${photo.id}.jpg` : `photo-${photo.id}`;
  const base = sanitizeZipEntryName(photo.original_name ?? "", fallback);
  if (variant === "preview") {
    const stem = base.replace(/\.[^.]+$/, "") || `photo-${photo.id}`;
    return `${String(index + 1).padStart(4, "0")}-${stem}.jpg`;
  }
  return `${String(index + 1).padStart(4, "0")}-${base}`;
}
