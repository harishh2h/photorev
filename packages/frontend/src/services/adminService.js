import { apiFetch } from './httpClient.js'

/**
 * @param {string} token
 * @returns {Promise<{ success: boolean, data?: Array<{ id: string, email: string, name: string, role: string, is_active: boolean, created_at: string }>, message?: string }>}
 */
export async function listUsers(token) {
  const r = await apiFetch('/admin/users', { token })
  if (r.ok && Array.isArray(r.data)) {
    return { success: true, data: r.data }
  }
  return { success: false, message: r.message || 'Failed to load users' }
}

/**
 * @param {string} token
 * @param {{ email: string, password: string, name: string, role: string }} payload
 */
export async function createUser(token, payload) {
  const r = await apiFetch('/admin/users', { token, method: 'POST', body: payload })
  if (r.ok && r.data) {
    return { success: true, data: r.data }
  }
  return { success: false, message: r.message || 'Failed to create user' }
}

/**
 * @param {string} token
 * @param {string} userId
 * @param {{ name?: string, role?: string, password?: string }} payload
 */
export async function updateUser(token, userId, payload) {
  const r = await apiFetch(`/admin/users/${userId}`, { token, method: 'PATCH', body: payload })
  if (r.ok && r.data) {
    return { success: true, data: r.data }
  }
  return { success: false, message: r.message || 'Failed to update user' }
}

/**
 * @param {string} token
 * @param {string} userId
 */
export async function deactivateUser(token, userId) {
  const r = await apiFetch(`/admin/users/${userId}`, { token, method: 'DELETE' })
  if (r.ok) {
    return { success: true }
  }
  return { success: false, message: r.message || 'Failed to deactivate user' }
}
