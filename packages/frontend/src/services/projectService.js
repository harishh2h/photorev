import { apiFetch } from './httpClient.js'

/**
 * @param {string} token
 * @param {{ page?: number; pageSize?: number; status?: string; isActive?: boolean }} [params]
 * @returns {Promise<{ items: object[]; total: number; page: number; pageSize: number }>}
 */
export async function listProjects(token, params = {}) {
  const search = new URLSearchParams()
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  if (params.status) search.set('status', params.status)
  if (typeof params.isActive === 'boolean') search.set('isActive', String(params.isActive))
  const qs = search.toString()
  const path = qs ? `/projects?${qs}` : '/projects'
  const { ok, message, data } = await apiFetch(path, { token })
  if (!ok) {
    throw new Error(message)
  }
  return /** @type {{ items: object[]; total: number; page: number; pageSize: number }} */ (data)
}

/**
 * @param {string} token
 * @param {string} projectId
 * @returns {Promise<object>}
 */
export async function getProject(token, projectId) {
  const { ok, message, data } = await apiFetch(`/projects/${projectId}`, { token })
  if (!ok) {
    throw new Error(message)
  }
  return /** @type {object} */ (data)
}

/**
 * @param {string} token
 * @param {{ name: string; rootPath?: string }} payload
 * @returns {Promise<object>}
 */
export async function createProject(token, payload) {
  const { ok, message, data } = await apiFetch('/projects', {
    token,
    method: 'POST',
    body: payload,
  })
  if (!ok) {
    throw new Error(message)
  }
  return /** @type {object} */ (data)
}

/**
 * Ephemeral random cover for dashboard when no banner is set (member-only).
 *
 * @param {string} token
 * @param {string} projectId
 * @returns {Promise<string | null>} photo UUID, or null when no ready preview exists
 */
export async function fetchRandomProjectCoverPhotoId(token, projectId) {
  const { ok, message, data } = await apiFetch(`/projects/${projectId}/cover-photo`, { token })
  if (!ok) {
    throw new Error(message || 'Failed to load cover')
  }
  if (data != null && typeof data === 'object' && 'photoId' in data) {
    const pid = /** @type {{ photoId?: unknown }} */ (data).photoId
    if (typeof pid === 'string' && pid.length > 0) {
      return pid
    }
  }
  return null
}
