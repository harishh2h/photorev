import fs from "node:fs/promises";
import path from "node:path";
import { db } from "../db";
import {
  EXPORT_TTL_MS,
  type ProjectExportRecord,
  type ProjectExportVariant,
} from "../models/project-export";
import {
  resolveExportPhotoAbsolutePath,
  zipEntryNameForPhoto,
  type ExportPhotoRow,
} from "../utils/export-photo-paths";
import { getStorageRoot } from "../utils/storage";
import { buildProjectExportZip } from "./tasks/buildProjectExportZip";

type RunnerState = "idle" | "running";

export class ExportRunner {
  private state: RunnerState = "idle";

  notify(): void {
    if (this.state === "idle") {
      this.state = "running";
      void this.drain();
    }
  }

  private async drain(): Promise<void> {
    while (this.state === "running") {
      const job = await this.claimNextExport();
      if (!job) {
        this.state = "idle";
        return;
      }
      await this.processExport(job);
    }
  }

  private async claimNextExport(): Promise<ProjectExportRecord | null> {
    const result = await db.raw(`
      WITH next_export AS (
        SELECT id
        FROM project_exports
        WHERE status = 'queued'
        ORDER BY queued_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE project_exports AS pe
      SET status = 'processing',
          started_at = NOW()
      FROM next_export
      WHERE pe.id = next_export.id
      RETURNING pe.*
    `);
    const row = result.rows[0] as ProjectExportRecord | undefined;
    return row ?? null;
  }

  private async processExport(job: ProjectExportRecord): Promise<void> {
    try {
      const photos = await db<ExportPhotoRow>("photos")
        .select("id", "original_name", "original_path", "preview_path")
        .where("project_id", job.project_id)
        .andWhere("status", "ready")
        .andWhere("final_decision", 1)
        .orderBy("created_at", "asc");

      if (photos.length === 0) {
        throw new Error("No selected photos to export");
      }

      const variant = job.variant as ProjectExportVariant;
      const entries: Array<{ absolutePath: string; entryName: string }> = [];

      for (let i = 0; i < photos.length; i += 1) {
        const photo = photos[i];
        const abs = await resolveExportPhotoAbsolutePath(job.project_id, photo, variant);
        if (!abs) continue;
        entries.push({
          absolutePath: abs,
          entryName: zipEntryNameForPhoto(photo, variant, i),
        });
      }

      if (entries.length === 0) {
        throw new Error(
          variant === "preview"
            ? "Preview files are not ready for selected photos"
            : "Original files are not available for selected photos",
        );
      }

      const storageRoot = getStorageRoot();
      const zipAbsolute = path.join(storageRoot, "exports", job.project_id, `${job.id}.zip`);
      const zipRelative = path.posix.join("exports", job.project_id, `${job.id}.zip`);

      const { byteSize } = await buildProjectExportZip({
        outputAbsolutePath: zipAbsolute,
        entries,
        onProgress: async (processedCount) => {
          await db("project_exports").where("id", job.id).update({ processed_count: processedCount });
        },
      });

      const expiresAt = new Date(Date.now() + EXPORT_TTL_MS);
      await db("project_exports").where("id", job.id).update({
        status: "done",
        processed_count: entries.length,
        photo_count: entries.length,
        file_path: zipRelative,
        byte_size: byteSize,
        error_message: null,
        expires_at: expiresAt,
        completed_at: new Date(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db("project_exports").where("id", job.id).update({
        status: "failed",
        error_message: message,
        completed_at: new Date(),
      });
    }
  }
}

export const exportRunner = new ExportRunner();

export async function purgeExpiredExports(): Promise<void> {
  const rows = await db<{
    id: string;
    file_path: string | null;
  }>("project_exports")
    .select("id", "file_path")
    .where("status", "done")
    .andWhere("expires_at", "<", new Date());

  const storageRoot = getStorageRoot();
  for (const row of rows) {
    if (row.file_path) {
      const abs = path.join(storageRoot, row.file_path);
      await fs.rm(abs, { force: true }).catch(() => undefined);
    }
    await db("project_exports").where("id", row.id).update({ status: "expired", file_path: null });
  }
}
