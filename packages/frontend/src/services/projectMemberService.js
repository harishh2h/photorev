import { apiFetch } from './httpClient.js'

/**
 * @param {string} token
 * @param {string} projectId
 * @returns {Promise<object[]>}
 */
export async function listProjectMembers(token, projectId) {
  const { ok, status, message, data } = await apiFetch(`/projects/${projectId}/members`, { token })
  if (!ok) {
    if (status === 403) {
      return []
    }
    throw new Error(message)
  }
  return Array.isArray(data) ? data : []
}
