import { apiFetch, getApiBaseUrl, isApiEnvelope, notifyUnauthorized } from './httpClient.js'
import {
  classifyUploadFailure,
  messageForUploadFailure,
  PhotoUploadError,
} from '@/utils/uploadErrors.js'

/**
 * @typedef {{ loaded: number; total: number; percent: number | null }} UploadProgressEvent
 */

/**
 * @param {number} status
 * @param {string} responseText
 * @param {string | null} contentType
 * @returns {{ photoId: string }}
 */
function parseUploadResponse(status, responseText, contentType) {
  if (status === 401) {
    notifyUnauthorized()
  }

  /** @type {unknown} */
  let parsed = null
  if ((contentType || '').includes('application/json') && responseText) {
    try {
      parsed = JSON.parse(responseText)
    } catch {
      parsed = null
    }
  }

  if (!isApiEnvelope(parsed)) {
    const kind = classifyUploadFailure(status)
    throw new PhotoUploadError(messageForUploadFailure(kind), { kind, status })
  }
  if (status < 200 || status >= 300 || parsed.error) {
    const kind = classifyUploadFailure(status, parsed.message)
    throw new PhotoUploadError(messageForUploadFailure(kind, parsed.message), {
      kind,
      status,
    })
  }
  const data = /** @type {{ photoId?: string }} */ (parsed.data)
  if (typeof data?.photoId !== 'string') {
    throw new PhotoUploadError('Invalid upload response', { kind: 'unknown', status })
  }
  return { photoId: data.photoId }
}

/**
 * @param {string} token
 * @param {string} projectId
 * @param {File} file
 * @param {{ onProgress?: (event: UploadProgressEvent) => void; signal?: AbortSignal }} [options]
 * @returns {Promise<{ photoId: string }>}
 */
export function uploadPhoto(token, projectId, file, options = {}) {
  const { onProgress, signal } = options
  const base = getApiBaseUrl()
  const form = new FormData()
  form.append('projectId', projectId)
  form.append('file', file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    const fail = (err) => {
      reject(err instanceof PhotoUploadError ? err : new PhotoUploadError('Upload failed', { kind: 'network', status: 0 }))
    }

    const onAbort = () => {
      xhr.abort()
      reject(new PhotoUploadError('Upload cancelled', { kind: 'cancelled', status: 0 }))
    }

    if (signal?.aborted) {
      onAbort()
      return
    }
    signal?.addEventListener('abort', onAbort, { once: true })

    xhr.upload.addEventListener('progress', (event) => {
      if (!onProgress) return
      const total = event.lengthComputable ? event.total : file.size
      onProgress({
        loaded: event.loaded,
        total,
        percent: event.lengthComputable && total > 0 ? (event.loaded / total) * 100 : null,
      })
    })

    xhr.addEventListener('load', () => {
      signal?.removeEventListener('abort', onAbort)
      try {
        const contentType = xhr.getResponseHeader('content-type')
        resolve(parseUploadResponse(xhr.status, xhr.responseText, contentType))
      } catch (err) {
        fail(err)
      }
    })

    xhr.addEventListener('error', () => {
      signal?.removeEventListener('abort', onAbort)
      fail(new PhotoUploadError('Network error during upload', { kind: 'network', status: 0 }))
    })

    xhr.addEventListener('abort', () => {
      signal?.removeEventListener('abort', onAbort)
      fail(new PhotoUploadError('Upload cancelled', { kind: 'cancelled', status: 0 }))
    })

    xhr.open('POST', `${base}/photos/upload`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(form)
  })
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
 * @typedef {'thumbnail' | 'preview' | 'original'} PhotoContentVariant
 */

/**
 * @param {string} token
 * @param {string} photoId
 * @param {{ variant?: PhotoContentVariant }} [options]
 * @returns {Promise<Blob>}
 */
export async function fetchPhotoContentBlob(token, photoId, options = {}) {
  const variant = options.variant ?? 'thumbnail'
  const base = getApiBaseUrl()
  const qs = new URLSearchParams()
  qs.set('variant', variant)
  const res = await fetch(`${base}/photos/${encodeURIComponent(photoId)}/content?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: options.signal,
  })
  if (res.status === 401) {
    notifyUnauthorized()
  }
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

/**
 * Strict original-only download — never preview or thumbnail (see GET /photos/:id/download).
 *
 * @param {string} token
 * @param {string} photoId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Blob>}
 */
export async function fetchPhotoDownloadBlob(token, photoId, options = {}) {
  const base = getApiBaseUrl()
  const res = await fetch(`${base}/photos/${encodeURIComponent(photoId)}/download`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: options.signal,
  })
  if (res.status === 401) {
    notifyUnauthorized()
  }
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
    throw new Error('Original file not available')
  }
  return res.blob()
}
