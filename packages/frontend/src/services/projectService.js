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
