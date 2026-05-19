import { apiFetch, getApiBaseUrl, isApiEnvelope } from './httpClient.js'

/**
 * @typedef {object} PublicSharePhoto
 * @property {string} id
 * @property {string | null} originalName
 * @property {number | null} width
 * @property {number | null} height
 * @property {number | null} fileSize
 * @property {string | null} mimeType
 * @property {unknown} metadata
 */

/**
 * @typedef {object} PublicShareMeta
 * @property {string} projectName
 * @property {string | null} description
 * @property {boolean} showMetadata
 * @property {boolean} allowDownload
 * @property {string | null} expiresAt
 * @property {string | null} finalizedAt
 */

/**
 * @typedef {object} PublicShareListing
 * @property {PublicShareMeta} meta
 * @property {PublicSharePhoto[]} photos
 */

/**
 * @param {string} token
 * @param {string} [password]
 * @returns {Promise<{ unlockToken: string; requiresPassword: boolean }>}
 */
export async function unlockShare(token, password) {
  const { ok, message, data, status } = await apiFetch(
    `/public/share/${encodeURIComponent(token)}/unlock`,
    {
      method: 'POST',
      body: password ? { password } : {},
      skipUnauthorizedHandler: true,
    }
  )
  if (!ok) {
    const err = new Error(message)
    err.status = status
    throw err
  }
  return /** @type {{ unlockToken: string; requiresPassword: boolean }} */ (data)
}

/**
 * @param {string} token
 * @param {string | null} [unlockToken]
 * @returns {Promise<PublicShareListing>}
 */
export async function getPublicShareListing(token, unlockToken) {
  const base = getApiBaseUrl()
  const url = `${base}/public/share/${encodeURIComponent(token)}`
  const headers = {}
  if (unlockToken) headers.Authorization = `Bearer ${unlockToken}`
  const res = await fetch(url, { headers })
  const text = await res.text()
  let parsed = null
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = null
  }
  if (!isApiEnvelope(parsed)) {
    throw new Error(`Request failed (${res.status})`)
  }
  if (res.status === 401) {
    const err = new Error(parsed.message)
    err.status = 401
    err.requiresPassword = true
    throw err
  }
  if (!res.ok || parsed.error) {
    const err = new Error(parsed.message)
    err.status = res.status
    throw err
  }
  return /** @type {PublicShareListing} */ (parsed.data)
}

/**
 * @param {string} token
 * @param {string} photoId
 * @param {'thumb' | 'preview'} variant
 * @param {string | null} [unlockToken]
 * @returns {string}
 */
export function buildPublicPhotoUrl(token, photoId, variant, unlockToken) {
  const base = getApiBaseUrl()
  const qs = unlockToken ? `?u=${encodeURIComponent(unlockToken)}` : ''
  return `${base}/public/share/${encodeURIComponent(token)}/photos/${encodeURIComponent(photoId)}/${variant}${qs}`
}

/**
 * @param {string} token
 * @param {string} photoId
 * @param {string | null} [unlockToken]
 * @returns {string}
 */
export function buildPublicDownloadUrl(token, photoId, unlockToken) {
  const base = getApiBaseUrl()
  const qs = unlockToken ? `?u=${encodeURIComponent(unlockToken)}` : ''
  return `${base}/public/share/${encodeURIComponent(token)}/photos/${encodeURIComponent(photoId)}/download${qs}`
}
