import { apiFetch } from './httpClient.js'

/**
 * @param {string} token
 * @param {string} projectId
 * @param {{ page?: number; pageSize?: number }} [params]
 */
export async function fetchProjectGrid(token, projectId, params = {}) {
  const search = new URLSearchParams()
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  const qs = search.toString()
  const path = qs
    ? `/projects/${encodeURIComponent(projectId)}/grid?${qs}`
    : `/projects/${encodeURIComponent(projectId)}/grid`
  const { ok, message, data } = await apiFetch(path, { token })
  if (!ok) {
    throw new Error(message)
  }
  return /** @type {{ items: object[]; total: number; page: number; pageSize: number; filterCounts: object }} */ (data)
}

/**
 * @param {string} token
 * @param {string} projectId
 * @param {string[]} photoIds
 */
export async function fetchPendingPhotoStatuses(token, projectId, photoIds) {
  if (photoIds.length === 0) {
    return []
  }
  const search = new URLSearchParams()
  search.set('ids', photoIds.join(','))
  const path = `/projects/${encodeURIComponent(projectId)}/photos/pending-status?${search.toString()}`
  const { ok, message, data } = await apiFetch(path, { token })
  if (!ok) {
    throw new Error(message)
  }
  const items = /** @type {{ items?: Array<{ id: string; status: string }> }} */ (data)?.items
  return Array.isArray(items) ? items : []
}
