export const LIBRARY_TABLE = 'library'

export type LibraryStatus = 'active' | 'processing' | 'completed'

export interface Library {
  id: string
  name: string
  description: string | null
  absolute_path: string
  project_id: string
  status: LibraryStatus
  is_active: boolean
  created_by: string
  created_at: Date
}

export interface LibraryInsert {
  name: string
  description?: string | null
  absolute_path: string
  project_id: string
  status?: LibraryStatus
  is_active?: boolean
  created_by: string
}
