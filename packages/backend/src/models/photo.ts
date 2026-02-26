export const PHOTOS_TABLE = 'photos'

export interface Photo {
  id: string
  project_id: string
  library_id: string
  filename: string
  absolute_path: string
  thumbnail_path: string | null
  hash: string | null
  metadata: Record<string, unknown> | null
  created_at: Date
}

export interface PhotoInsert {
  project_id: string
  library_id: string
  filename: string
  absolute_path: string
  thumbnail_path?: string | null
  hash?: string | null
  metadata?: Record<string, unknown> | null
}
