export const PHOTOS_TABLE = 'photos'

export type PhotoStatus = 'pending' | 'ready' | 'failed' | 'trashed' | 'deleted'

export type ConflictState =
  | 'none'
  | 'pending_owner'
  | 'resolved_owner'
  | 'resolved_majority'

export interface Photo {
  id: string
  project_id: string
  original_path: string
  thumbnail_path: string | null
  hash: string | null
  metadata: Record<string, unknown> | null
  created_at: Date
  original_name: string | null
  mime_type: string | null
  file_size: number | null
  status: PhotoStatus
  width: number | null
  height: number | null
  preview_path: string | null
  final_decision: number | null
  final_decided_by: string | null
  final_decided_at: Date | null
  conflict_state: ConflictState | null
  trashed_at: Date | null
}

export interface PhotoInsert {
  id?: string
  project_id: string
  original_path: string
  thumbnail_path?: string | null
  hash?: string | null
  metadata?: Record<string, unknown> | null
  original_name?: string | null
  mime_type?: string | null
  file_size?: number | null
  status?: PhotoStatus
  width?: number | null
  height?: number | null
  preview_path?: string | null
}
