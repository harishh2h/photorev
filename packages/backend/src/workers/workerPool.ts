import { Worker } from "node:worker_threads";
import path from "node:path";

type JobCallback = (result: unknown, error: Error | null) => void | Promise<void>;

type PoolWorker = {
  readonly thread: Worker;
  busy: boolean;
};

type QueuedJob = {
  readonly job: Record<string, unknown>;
  readonly callback: JobCallback;
};

type WorkerResultMessage = {
  readonly __callbackId: string;
  readonly result?: unknown;
  readonly error?: string | null;
};

export class WorkerPool {
  private static callbacks = new Map<string, JobCallback>();

  private readonly workers: PoolWorker[] = [];

  private readonly queue: QueuedJob[] = [];

  constructor(size: number) {
    for (let i = 0; i < size; i += 1) {
      this.spawnWorker();
    }
  }

  submit(job: Record<string, unknown>, callback: JobCallback): void {
    const free = this.workers.find((w) => !w.busy);
    if (free) {
      this.dispatch(free, job, callback);
    } else {
      this.queue.push({ job, callback });
    }
  }

  get activeCount(): number {
    return this.workers.filter((w) => w.busy).length;
  }

  async shutdown(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.thread.terminate()));
  }

  static resolveCallback(
    callbackId: string,
    result: unknown,
    errorMessage: string | null,
  ): void {
    const cb = WorkerPool.callbacks.get(callbackId);
    WorkerPool.callbacks.delete(callbackId);
    const err = errorMessage ? new Error(errorMessage) : null;
    void Promise.resolve(cb?.(result, err)).catch((e: unknown) => {
      console.error("WorkerPool: job callback failed", e);
    });
  }

  private spawnWorker(): void {
    const useTsSource = __filename.endsWith(".ts");
    const scriptPath = path.join(
      __dirname,
      useTsSource ? "workerThread.ts" : "workerThread.js",
    );
    const thread = new Worker(scriptPath, useTsSource ? { execArgv: [...process.execArgv] } : undefined);
    const worker: PoolWorker = { thread, busy: false };
    thread.on("message", (msg: WorkerResultMessage) => {
      worker.busy = false;
      if (typeof msg.__callbackId === "string") {
        WorkerPool.resolveCallback(
          msg.__callbackId,
          msg.result ?? null,
          msg.error ?? null,
        );
      }
      const next = this.queue.shift();
      if (next) {
        this.dispatch(worker, next.job, next.callback);
      }
    });
    thread.on("error", (err: Error) => {
      console.error("Worker thread crashed:", err);
      worker.busy = false;
      const next = this.queue.shift();
      if (next) {
        this.dispatch(worker, next.job, next.callback);
      }
    });
    this.workers.push(worker);
  }

  private dispatch(
    worker: PoolWorker,
    job: Record<string, unknown>,
    callback: JobCallback,
  ): void {
    worker.busy = true;
    const callbackId = String(job.id);
    WorkerPool.callbacks.set(callbackId, callback);
    worker.thread.postMessage({ ...job, __callbackId: callbackId });
  }
}
