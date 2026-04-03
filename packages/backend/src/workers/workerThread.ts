import { parentPort } from "node:worker_threads";
import { runProcessingJob } from "./tasks/runProcessingJob";
import type { ProcessingJobType } from "../models/processing-job";

type WorkerJobMessage = {
  readonly __callbackId: string;
  readonly job_type: ProcessingJobType;
  readonly photo_id: string;
  readonly original_path: string;
};

parentPort!.on("message", async (job: WorkerJobMessage) => {
  const { __callbackId, job_type, photo_id, original_path } = job;
  try {
    const result = await runProcessingJob(job_type, photo_id, original_path);
    parentPort!.postMessage({ __callbackId, result, error: null as string | null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    parentPort!.postMessage({ __callbackId, result: null, error: message });
  }
});
