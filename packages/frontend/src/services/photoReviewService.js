import { apiFetch } from './httpClient.js'

/**
 * @param {string} token
 * @param {{ page?: number; pageSize?: number; projectId?: string; decision?: number }} [params]
 * @returns {Promise<{ items: object[]; total: number; page: number; pageSize: number }>}
 */
export async function listMyPhotoReviews(token, params = {}) {
  const search = new URLSearchParams()
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  if (params.projectId) search.set('projectId', params.projectId)
  if (typeof params.decision === 'number') search.set('decision', String(params.decision))
  const qs = search.toString()
  const path = qs ? `/photo-reviews/me?${qs}` : '/photo-reviews/me'
  const { ok, message, data } = await apiFetch(path, { token })
  if (!ok) {
    throw new Error(message)
  }
  return /** @type {{ items: object[]; total: number; page: number; pageSize: number }} */ (data)
}
