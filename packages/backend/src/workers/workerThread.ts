// @ts-nocheck — tsx loads this file as ESM; import.meta + require() are valid at runtime.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parentPort } from "node:worker_threads";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(__dirname, "workerThread.ts"));
const { runProcessingJob } = require("./tasks/runProcessingJob.ts");

type ProcessingJobType = import("../models/processing-job").ProcessingJobType;

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
    parentPort!.postMessage({ __callbackId, result, error: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    parentPort!.postMessage({ __callbackId, result: null, error: message });
  }
});
