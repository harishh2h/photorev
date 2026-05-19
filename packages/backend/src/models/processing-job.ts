export const PROCESSING_JOBS_TABLE = 'processing_jobs'

export type ProcessingJobType =
  | 'thumbnail'
  | 'preview'
  | 'metadata'
  | 'hard_delete_photo'
  | 'purge_trashed'

export type ProcessingJobStatus = 'queued' | 'processing' | 'done' | 'failed'

export interface ProcessingJob {
  id: string
  photo_id: string | null
  job_type: ProcessingJobType
  status: ProcessingJobStatus
  attempts: number
  max_attempts: number
  error_message: string | null
  worker_id: string | null
  queued_at: Date
  started_at: Date | null
  completed_at: Date | null
}

/** Job row plus `photos.original_path` (relative to storage root), set when claiming work. */
export interface ProcessingJobWithOriginalPath extends ProcessingJob {
  readonly original_path: string | null
  readonly project_id: string | null
  readonly thumbnail_path: string | null
  readonly preview_path: string | null
}

export interface ProcessingJobInsert {
  photo_id: string | null
  job_type: ProcessingJobType
  status?: ProcessingJobStatus
  attempts?: number
  max_attempts?: number
  error_message?: string | null
  worker_id?: string | null
}
