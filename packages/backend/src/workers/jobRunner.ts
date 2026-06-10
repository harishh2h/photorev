import fs from "node:fs";
import path from "node:path";
import { db } from "../db";
import type { ProcessingJobWithOriginalPath } from "../models/processing-job";
import {
  captureBackgroundError,
  endBackgroundSpan,
  startBackgroundSpan,
} from "../utils/apm-spans";
import { getStorageRoot } from "../utils/storage";
import { getProjectOwnerId, releaseQuota } from "../utils/storage-quota";
import type { ProcessingJobWorkerSuccess } from "./tasks/runProcessingJob";
import { WorkerPool } from "./workerPool";

const TRASH_TTL_DAYS = 15;
const PURGE_BATCH_SIZE = 1;

function storageRelativeDbPath(outputAbsolute: string): string {
  return path.relative(path.resolve(getStorageRoot()), outputAbsolute).split(path.sep).join("/");
}

type RunnerState = "idle" | "running" | "draining" | "stopped";

export class JobRunner {
  private state: RunnerState = "idle";

  private readonly pool: WorkerPool;

  constructor(pool: WorkerPool) {
    this.pool = pool;
  }

  notify(): void {
    if (this.state === "idle") {
      this.state = "running";
      void this.drain();
    }
  }

  beginShutdown(): void {
    if (this.state === "running") {
      this.state = "draining";
    } else {
      this.state = "stopped";
    }
  }

  get currentState(): RunnerState {
    return this.state;
  }

  private async drain(): Promise<void> {
    while (this.state === "running") {
      const job = await this.claimNextJob();
      if (!job) {
        this.state = "idle";
        return;
      }
      if (job.job_type === "hard_delete_photo" || job.job_type === "purge_trashed") {
        await this.handleMaintenanceJob(job);
        continue;
      }
      const span = startBackgroundSpan(`processing.${job.job_type}`, "worker", {
        job_id: job.id,
        job_type: job.job_type,
        photo_id: job.photo_id ?? "",
      });
      this.pool.submit({ ...job } as Record<string, unknown>, (workerResult, error) => {
        void (async (): Promise<void> => {
          try {
            if (error) {
              captureBackgroundError(error);
              await this.handleFailure(job, error);
            } else {
              await this.completeSuccessfulJob(job, workerResult);
            }
            if (this.state === "idle") {
              this.notify();
            } else if (this.state === "draining" && this.pool.activeCount === 0) {
              this.state = "stopped";
              console.log("JobRunner: all workers finished, safe to exit");
            }
          } finally {
            endBackgroundSpan(span);
          }
        })();
      });
    }
  }

  private async handleMaintenanceJob(job: ProcessingJobWithOriginalPath): Promise<void> {
    const span = startBackgroundSpan(`maintenance.${job.job_type}`, "worker", {
      job_id: job.id,
      job_type: job.job_type,
    });
    try {
      if (job.job_type === "hard_delete_photo") {
        await this.runHardDeletePhoto(job);
      } else if (job.job_type === "purge_trashed") {
        await this.runPurgeTrashed(job);
      }
      await this.markDone(job.id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      captureBackgroundError(error);
      await this.handleFailure(job, error);
    } finally {
      endBackgroundSpan(span);
    }
    if (this.state === "idle") {
      this.notify();
    } else if (this.state === "running") {
      // continue draining loop
    } else if (this.state === "draining" && this.pool.activeCount === 0) {
      this.state = "stopped";
    }
  }

  private async runHardDeletePhoto(job: ProcessingJobWithOriginalPath): Promise<void> {
    if (!job.photo_id || !job.project_id) {
      return;
    }
    const photoRow = await db<{ file_size: string | number | null }>("photos")
      .select("file_size")
      .where("id", job.photo_id)
      .first();
    const ownerId = await getProjectOwnerId(db, job.project_id);
    const storageRoot = getStorageRoot();
    const dir = path.join(storageRoot, "photos", job.project_id, job.photo_id);
    await fs.promises.rm(dir, { recursive: true, force: true });
    const fileSize = Number(photoRow?.file_size ?? 0);
    if (ownerId && Number.isFinite(fileSize) && fileSize > 0) {
      await releaseQuota(db, ownerId, fileSize);
    }
    await db("photos").where("id", job.photo_id).delete();
  }

  private async runPurgeTrashed(_job: ProcessingJobWithOriginalPath): Promise<void> {
    const cutoff = new Date(Date.now() - TRASH_TTL_DAYS * 24 * 60 * 60 * 1000);
    const rows = await db<{ id: string }>("photos")
      .select("id")
      .where("status", "trashed")
      .andWhere("trashed_at", "<", cutoff)
      .orderBy("trashed_at", "asc")
      .limit(PURGE_BATCH_SIZE);
    if (rows.length === 0) return;
    await db("processing_jobs").insert(
      rows.map((r) => ({ photo_id: r.id, job_type: "hard_delete_photo" })),
    );
    const remaining = await db("photos")
      .where("status", "trashed")
      .andWhere("trashed_at", "<", cutoff)
      .count<{ count: string }[]>({ count: "*" });
    if (Number(remaining[0]?.count ?? 0) > rows.length) {
      await db("processing_jobs").insert({ photo_id: null, job_type: "purge_trashed" });
    }
  }

  private async claimNextJob(): Promise<ProcessingJobWithOriginalPath | null> {
    const result = await db.raw(`
      WITH next_job AS (
        SELECT id
        FROM processing_jobs
        WHERE status = 'queued'
        ORDER BY queued_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE processing_jobs AS pj
      SET status = 'processing',
          started_at = NOW()
      FROM next_job
      LEFT JOIN photos AS p ON p.id = (
        SELECT photo_id FROM processing_jobs WHERE id = next_job.id
      )
      WHERE pj.id = next_job.id
      RETURNING
        pj.id,
        pj.photo_id,
        pj.job_type,
        pj.status,
        pj.attempts,
        pj.max_attempts,
        pj.error_message,
        pj.worker_id,
        pj.queued_at,
        pj.started_at,
        pj.completed_at,
        p.original_path AS original_path,
        p.project_id AS project_id,
        p.thumbnail_path AS thumbnail_path,
        p.preview_path AS preview_path
    `);
    const row = result.rows[0] as ProcessingJobWithOriginalPath | undefined;
    return row ?? null;
  }

  /**
   * Persists photo fields on the main thread (one query per job — uses shared Knex pool only here).
   */
  private async completeSuccessfulJob(
    job: ProcessingJobWithOriginalPath,
    workerResult: unknown,
  ): Promise<void> {
    const payload = workerResult as ProcessingJobWorkerSuccess;
    const photoId = job.photo_id;
    if (photoId && payload.ok === true && job.job_type === "metadata" && payload.photoMetadata) {
      await db("photos")
        .where("id", photoId)
        .update({
          metadata: payload.photoMetadata.metadata,
          width: payload.photoMetadata.width,
          height: payload.photoMetadata.height,
        });
    } else if (
      photoId &&
      payload.ok === true &&
      job.job_type === "thumbnail" &&
      typeof payload.outputPath === "string"
    ) {
      const patch: Record<string, unknown> = {
        thumbnail_path: storageRelativeDbPath(payload.outputPath),
      };
      if (typeof payload.blurhash === "string" && payload.blurhash.length > 0) {
        patch.blurhash = payload.blurhash;
      }
      await db("photos").where("id", photoId).update(patch);
    } else if (
      photoId &&
      payload.ok === true &&
      job.job_type === "preview" &&
      typeof payload.outputPath === "string"
    ) {
      await db("photos")
        .where("id", photoId)
        .update({
          preview_path: storageRelativeDbPath(payload.outputPath),
        });
    }
    await this.markDone(job.id);
    if (photoId) {
      await this.syncPhotoProcessingStatus(photoId);
    }
  }

  private async markDone(jobId: string): Promise<void> {
    await db("processing_jobs")
      .where("id", jobId)
      .update({ status: "done", completed_at: new Date() });
  }

  private async handleFailure(job: ProcessingJobWithOriginalPath, error: Error): Promise<void> {
    if (job.attempts + 1 < job.max_attempts) {
      await db("processing_jobs")
        .where("id", job.id)
        .update({
          status: "queued",
          attempts: job.attempts + 1,
          started_at: null,
        });
      this.notify();
    } else {
      await db("processing_jobs")
        .where("id", job.id)
        .update({
          status: "failed",
          error_message: error.message,
        });
      if (job.photo_id) {
        await this.syncPhotoProcessingStatus(job.photo_id);
      }
    }
  }

  /**
   * Drive photos.status from processing_jobs: ready when all jobs are done, failed if any job failed.
   */
  private async syncPhotoProcessingStatus(photoId: string): Promise<void> {
    const rows = await db("processing_jobs").where("photo_id", photoId).select("status");
    if (rows.length === 0) {
      return;
    }
    const hasFailed = rows.some((r: { status: string }) => r.status === "failed");
    const allDone = rows.every((r: { status: string }) => r.status === "done");
    if (hasFailed) {
      await db("photos").where("id", photoId).update({ status: "failed" });
      return;
    }
    if (allDone) {
      await db("photos").where("id", photoId).update({ status: "ready" });
    }
  }
}
