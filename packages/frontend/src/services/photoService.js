import { apiFetch, getApiBaseUrl, isApiEnvelope } from './httpClient.js'

/**
 * @param {string} token
 * @param {string} projectId
 * @param {File} file
 * @returns {Promise<{ photoId: string }>}
 */
export async function uploadPhoto(token, projectId, file) {
  const base = getApiBaseUrl()
  const form = new FormData()
  form.append('projectId', projectId)
  form.append('file', file)

  const res = await fetch(`${base}/photos/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })

  /** @type {unknown} */
  let parsed = null
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const text = await res.text()
    if (text) {
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = null
      }
    }
  }
  if (!isApiEnvelope(parsed)) {
    throw new Error(`Upload failed (${res.status})`)
  }
  if (!res.ok || parsed.error) {
    throw new Error(parsed.message)
  }
  const data = /** @type {{ photoId?: string }} */ (parsed.data)
  if (typeof data?.photoId !== 'string') {
    throw new Error('Invalid upload response')
  }
  return { photoId: data.photoId }
}

/**
 * @param {string} token
 * @param {{ page?: number; pageSize?: number; projectId?: string }} [params]
 * @returns {Promise<{ items: object[]; total: number; page: number; pageSize: number }>}
 */
/**
 * @param {string} token
 * @param {string} photoId
 * @returns {Promise<object>}
 */
export async function getPhoto(token, photoId) {
  const { ok, message, data } = await apiFetch(`/photos/${photoId}`, { token })
  if (!ok) {
    throw new Error(message)
  }
  return /** @type {object} */ (data)
}

export async function listPhotos(token, params = {}) {
  const search = new URLSearchParams()
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  if (params.projectId) search.set('projectId', params.projectId)
  const qs = search.toString()
  const path = qs ? `/photos?${qs}` : '/photos'
  const { ok, message, data } = await apiFetch(path, { token })
  if (!ok) {
    throw new Error(message)
  }
  return /** @type {{ items: object[]; total: number; page: number; pageSize: number }} */ (data)
}

/**
 * @param {string} token
 * @param {string} photoId
 * @returns {Promise<Blob>}
 */
export async function fetchPhotoContentBlob(token, photoId) {
  const base = getApiBaseUrl()
  const res = await fetch(`${base}/photos/${photoId}/content`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const text = await res.text()
      try {
        const parsed = JSON.parse(text)
        if (isApiEnvelope(parsed)) {
          throw new Error(parsed.message)
        }
      } catch (err) {
        if (err instanceof SyntaxError) {
          // use generic message below
        } else {
          throw err
        }
      }
    }
    throw new Error('Could not load image')
  }
  return res.blob()
}
