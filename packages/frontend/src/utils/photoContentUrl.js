import { apiFetch, getApiBaseUrl } from '@/services/httpClient.js'

/** @type {Map<string, string>} */
const signedUrlCache = new Map()

function cacheKey(photoId, variant) {
  return `${photoId}:${variant}`
}

function isSignedUrlsEnabled() {
  const raw = import.meta.env.VITE_PHOTO_SIGNED_URLS
  return raw === undefined || raw === 'true' || raw === '1'
}

/**
 * @param {string} token
 * @param {string} photoId
 * @param {'thumbnail' | 'preview' | 'original'} [variant]
 * @returns {Promise<string | null>}
 */
export async function buildAuthenticatedPhotoUrl(token, photoId, variant = 'thumbnail') {
  if (!isSignedUrlsEnabled()) {
    return null
  }
  const key = cacheKey(photoId, variant)
  const cached = signedUrlCache.get(key)
  if (cached) {
    return cached
  }
  const search = new URLSearchParams()
  search.set('variant', variant)
  const path = `/photos/${encodeURIComponent(photoId)}/content-url?${search.toString()}`
  const { ok, message, data } = await apiFetch(path, { token })
  if (!ok) {
    throw new Error(message)
  }
  const relative = /** @type {{ url?: string }} */ (data)?.url
  if (typeof relative !== 'string' || !relative.startsWith('/')) {
    throw new Error('Invalid signed URL response')
  }
  const base = getApiBaseUrl()
  const full = `${base}${relative}`
  signedUrlCache.set(key, full)
  return full
}

/**
 * @param {string} photoId
 * @param {'thumbnail' | 'preview' | 'original'} [variant]
 * @returns {string | null}
 */
export function peekAuthenticatedPhotoUrl(photoId, variant = 'thumbnail') {
  return signedUrlCache.get(cacheKey(photoId, variant)) ?? null
}

export function isPhotoSignedUrlsEnabled() {
  return isSignedUrlsEnabled()
}

export function isPhotoLazyLoadEnabled() {
  const raw = import.meta.env.VITE_PHOTO_LAZY_LOAD
  return raw === undefined || raw === 'true' || raw === '1'
}

export function isPhotoVirtualGridEnabled() {
  const raw = import.meta.env.VITE_PHOTO_VIRTUAL_GRID
  return raw === undefined || raw === 'true' || raw === '1'
}
