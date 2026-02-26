export const USERS_TABLE = 'users'

export type UserRole = 'admin' | 'reviewer'

export interface User {
  id: string
  name: string
  email: string
  password_hash: string
  role: UserRole
  created_at: Date
}

export interface UserInsert {
  name: string
  email: string
  password_hash: string
  role: UserRole
}
