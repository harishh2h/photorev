export const USERS_TABLE = 'users'

export type UserRole = 'admin' | 'user'

export interface User {
  id: string
  name: string
  email: string
  password_hash: string
  role: UserRole
  is_active: boolean
  created_at: Date
}

export interface UserInsert {
  name: string
  email: string
  password_hash: string
  role: UserRole
}
