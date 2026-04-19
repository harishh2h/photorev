import { apiFetch } from './httpClient.js'

/**
 * @param {string} token
 * @param {string} photoId
 * @param {{ seen?: boolean; decision?: number | null; renamedTo?: string | null }} body
 * @returns {Promise<object>}
 */
export async function upsertPhotoReview(token, photoId, body) {
  const { ok, message, data } = await apiFetch(`/photo-reviews/${photoId}`, {
    token,
    method: 'PUT',
    body,
  })
  if (!ok) {
    throw new Error(message)
  }
  return /** @type {object} */ (data)
}

/**
 * @param {string} token
 * @param {string} photoId
 * @returns {Promise<object[]>}
 */
export async function listAllPhotoReviewsForPhoto(token, photoId) {
  const items = []
  let page = 1
  while (page < 30) {
    const search = new URLSearchParams()
    search.set('page', String(page))
    search.set('pageSize', '100')
    const { ok, message, data } = await apiFetch(
      `/photo-reviews/photos/${photoId}/reviews?${search.toString()}`,
      { token }
    )
    if (!ok) {
      throw new Error(message)
    }
    const chunk = /** @type {{ items?: object[]; pageSize?: number }} */ (data)
    const batch = Array.isArray(chunk?.items) ? chunk.items : []
    items.push(...batch)
    if (batch.length < (chunk.pageSize ?? 100)) break
    page += 1
  }
  return items
}

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
