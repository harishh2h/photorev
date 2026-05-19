export const SHARE_LINKS_TABLE = 'share_links'

export interface ShareLink {
  id: string
  project_id: string
  token: string
  password_hash: string | null
  description: string | null
  show_metadata: boolean
  allow_download: boolean
  expires_at: Date | null
  revoked_at: Date | null
  created_by: string
  created_at: Date
  view_count: number
  last_viewed_at: Date | null
}

export interface ShareLinkInsert {
  project_id: string
  token: string
  password_hash?: string | null
  description?: string | null
  show_metadata?: boolean
  allow_download?: boolean
  expires_at?: Date | null
  created_by: string
}
