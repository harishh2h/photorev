import path from "node:path";
import type { ProcessingJobType } from "../../models/processing-job";
import { getStorageRoot } from "../../utils/storage";
import { ImageProcessor } from "./imageProcess";

/**
 * DB `original_path` is relative to the storage root, e.g.
 * `photos/{projectId}/{photoId}/original.jpeg` → folder `…/storage/photos/{projectId}/{photoId}/`.
 */
function resolvePhotoDirFromOriginalPath(originalPathRelative: string): string {
  return path.dirname(path.join(getStorageRoot(), originalPathRelative));
}

/** Success payload posted from worker thread; DB writes happen on the main thread only. */
export type ProcessingJobWorkerSuccess = {
  readonly ok: true;
  readonly jobType: ProcessingJobType;
  readonly photoId: string;
  readonly outputPath?: string;
  readonly photoMetadata?: {
    readonly metadata: Record<string, unknown>;
    readonly width: number | null;
    readonly height: number | null;
  };
};

/**
 * Dispatches CPU / filesystem work for a processing job (worker thread — no DB).
 */
export async function runProcessingJob(
  jobType: ProcessingJobType,
  photoId: string,
  originalPathRelative: string,
): Promise<ProcessingJobWorkerSuccess> {
  const photoDir = resolvePhotoDirFromOriginalPath(originalPathRelative);
  const processor = new ImageProcessor();
  if (jobType === "thumbnail") {
    const absolute = await processor.generateThumbnail(photoDir);
    return { ok: true, jobType, photoId, outputPath: absolute };
  }
  if (jobType === "preview") {
    const absolute = await processor.generatePreview(photoDir);
    return { ok: true, jobType, photoId, outputPath: absolute };
  }
  const photoMetadata = await processor.extractMetadataForDatabase(photoDir);
  return { ok: true, jobType, photoId, photoMetadata };
}
