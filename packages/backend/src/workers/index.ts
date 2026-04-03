import { db } from "../db";
import { JobRunner } from "./jobRunner";
import { WorkerPool } from "./workerPool";

// 1. create pool — spawns 4 worker threads immediately
export const pool = new WorkerPool(4);

// 2. create runner — wires to pool
export const jobRunner = new JobRunner(pool);

// 3. this is called from main.ts after DB is confirmed ready
export async function initJobSystem() {
  // recover orphaned jobs from last crash
  const orphaned = await db("processing_jobs")
    .where({ status: "processing" })
    .update({ status: "queued", started_at: null })
    .returning("id");

  if (orphaned.length > 0) {
    console.log(`[boot] recovered ${orphaned.length} orphaned jobs`);
  }

  // pick up any pending jobs that existed before this boot
  const pendingRow = await db("processing_jobs")
    .where({ status: "queued" })
    .count<{ count: string }>("id as count")
    .first();

  const pendingCount = Number(pendingRow?.count ?? 0);
  if (pendingCount > 0) {
    console.log(`[boot] ${pendingCount} queued jobs found, starting runner`);
    jobRunner.notify();
  }

  // wire shutdown
  process.on("SIGTERM", async () => {
    console.log("[shutdown] SIGTERM received");
    jobRunner.beginShutdown();

    const deadline = Date.now() + 30_000;
    while (jobRunner.currentState !== 'stopped' && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 500));
    }

    await pool.shutdown();
    process.exit(0);
  });

  console.log("[boot] job system ready");
}