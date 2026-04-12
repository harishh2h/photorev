export const PHOTOS_TABLE = 'photos'

export type PhotoStatus = 'pending' | 'ready' | 'failed'

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
