import { apiFetch } from './httpClient.js'

/**
 * @param {string} token
 * @param {string} projectId
 * @returns {Promise<object[]>}
 */
export async function listProjectMembers(token, projectId) {
  const { ok, status, message, data } = await apiFetch(`/projects/${projectId}/members`, { token })
  if (!ok) {
    throw new Error(status === 403 ? message || 'Not allowed to view members' : message)
  }
  return Array.isArray(data) ? data : []
}

/**
 * @param {string} token
 * @param {string} projectId
 * @param {string} email
 * @returns {Promise<{ user: { id: string; name: string; email: string } | null }>}
 */
export async function lookupMemberByEmail(token, projectId, email) {
  const qs = new URLSearchParams({ email })
  const { ok, status, message, data } = await apiFetch(`/projects/${projectId}/members/lookup?${qs}`, {
    token,
  })
  if (!ok) {
    throw new Error(status === 403 ? message || 'Not allowed' : message)
  }
  if (data != null && typeof data === 'object' && 'user' in data) {
    return /** @type {{ user: object | null }} */ (data)
  }
  return { user: null }
}

/**
 * @param {string} token
 * @param {string} projectId
 * @param {{ userId: string; role: 'viewer' | 'reviewer' | 'contributor' }} payload
 */
export async function addProjectMember(token, projectId, payload) {
  const { ok, message, data } = await apiFetch(`/projects/${projectId}/members`, {
    token,
    method: 'POST',
    body: payload,
  })
  if (!ok) {
    throw new Error(message)
  }
  return data
}

/**
 * @param {string} token
 * @param {string} projectId
 * @param {string} userId
 */
export async function removeProjectMember(token, projectId, userId) {
  const { ok, message } = await apiFetch(`/projects/${projectId}/members/${userId}`, {
    token,
    method: 'DELETE',
  })
  if (!ok) {
    throw new Error(message)
  }
}

/**
 * @param {string} token
 * @param {string} projectId
 * @param {string} userId
 * @param {{ role: 'viewer' | 'reviewer' | 'contributor' }} payload
 */
export async function updateMemberRole(token, projectId, userId, payload) {
  const { ok, message, data } = await apiFetch(`/projects/${projectId}/members/${userId}`, {
    token,
    method: 'PATCH',
    body: payload,
  })
  if (!ok) {
    throw new Error(message)
  }
  return data
}
