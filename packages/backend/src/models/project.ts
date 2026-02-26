export const PROJECTS_TABLE = 'projects'

export type ProjectStatus = 'active' | 'processing' | 'completed'

export interface Project {
  id: string
  name: string
  status: ProjectStatus
  is_active: boolean
  root_path: string
  created_by: string
  created_at: Date
}

export interface ProjectInsert {
  name: string
  status?: ProjectStatus
  is_active?: boolean
  root_path: string
  created_by: string
}
