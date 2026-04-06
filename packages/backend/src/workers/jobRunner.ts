import path from "node:path";
import { db } from "../db";
import type { ProcessingJobWithOriginalPath } from "../models/processing-job";
import { getStorageRoot } from "../utils/storage";
import type { ProcessingJobWorkerSuccess } from "./tasks/runProcessingJob";
import { WorkerPool } from "./workerPool";

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
      this.pool.submit({ ...job } as Record<string, unknown>, (workerResult, error) => {
        void (async (): Promise<void> => {
          if (error) {
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
        })();
      });
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
      FROM next_job, photos AS p
      WHERE pj.id = next_job.id
        AND p.id = pj.photo_id
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
        p.original_path AS original_path
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
    if (payload.ok === true && job.job_type === "metadata" && payload.photoMetadata) {
      await db("photos")
        .where("id", job.photo_id)
        .update({
          metadata: payload.photoMetadata.metadata,
          width: payload.photoMetadata.width,
          height: payload.photoMetadata.height,
        });
    } else if (payload.ok === true && job.job_type === "thumbnail" && typeof payload.outputPath === "string") {
      await db("photos")
        .where("id", job.photo_id)
        .update({
          thumbnail_path: path.relative(getStorageRoot(), payload.outputPath),
        });
    } else if (payload.ok === true && job.job_type === "preview" && typeof payload.outputPath === "string") {
      await db("photos")
        .where("id", job.photo_id)
        .update({
          preview_path: path.relative(getStorageRoot(), payload.outputPath),
        });
    }
    await this.markDone(job.id);
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
    }
  }
}
