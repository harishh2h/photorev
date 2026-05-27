import { apiFetch, getApiBaseUrl } from '@/services/httpClient.js'

const SIGNED_URL_SESSION_KEY = 'photorev:signed-photo-urls'
const SIGNED_URL_EXPIRY_BUFFER_SEC = 60

/** @type {Map<string, string>} */
const signedUrlCache = new Map()

let sessionHydrated = false

function cacheKey(photoId, variant) {
  return `${photoId}:${variant}`
}

function isSignedUrlsEnabled() {
  const raw = import.meta.env.VITE_PHOTO_SIGNED_URLS
  return raw === undefined || raw === 'true' || raw === '1'
}

function parseSignedUrlExpiry(fullUrl) {
  try {
    const exp = Number(new URL(fullUrl).searchParams.get('exp'))
    return Number.isFinite(exp) ? exp : null
  } catch {
    return null
  }
}

function isSignedUrlUsable(fullUrl) {
  const exp = parseSignedUrlExpiry(fullUrl)
  if (exp == null) {
    return false
  }
  const now = Math.floor(Date.now() / 1000)
  return exp > now + SIGNED_URL_EXPIRY_BUFFER_SEC
}

function hydrateSignedUrlCacheFromSession() {
  if (sessionHydrated || typeof sessionStorage === 'undefined') {
    sessionHydrated = true
    return
  }
  sessionHydrated = true
  try {
    const raw = sessionStorage.getItem(SIGNED_URL_SESSION_KEY)
    if (!raw) {
      return
    }
    const parsed = JSON.parse(raw)
    if (parsed == null || typeof parsed !== 'object') {
      return
    }
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== 'string' || !isSignedUrlUsable(value)) {
        continue
      }
      signedUrlCache.set(key, value)
    }
  } catch {
    /* ignore corrupt session cache */
  }
}

function persistSignedUrlCacheToSession() {
  if (typeof sessionStorage === 'undefined') {
    return
  }
  try {
    const payload = Object.fromEntries(signedUrlCache.entries())
    sessionStorage.setItem(SIGNED_URL_SESSION_KEY, JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

function rememberSignedUrl(key, fullUrl) {
  if (!isSignedUrlUsable(fullUrl)) {
    return
  }
  signedUrlCache.set(key, fullUrl)
  persistSignedUrlCacheToSession()
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
  hydrateSignedUrlCacheFromSession()
  const key = cacheKey(photoId, variant)
  const cached = signedUrlCache.get(key)
  if (cached && isSignedUrlUsable(cached)) {
    return cached
  }
  if (cached) {
    signedUrlCache.delete(key)
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
  rememberSignedUrl(key, full)
  return full
}

/**
 * @param {string} photoId
 * @param {'thumbnail' | 'preview' | 'original'} [variant]
 * @returns {string | null}
 */
export function peekAuthenticatedPhotoUrl(photoId, variant = 'thumbnail') {
  hydrateSignedUrlCacheFromSession()
  const key = cacheKey(photoId, variant)
  const cached = signedUrlCache.get(key)
  if (!cached) {
    return null
  }
  if (!isSignedUrlUsable(cached)) {
    signedUrlCache.delete(key)
    persistSignedUrlCacheToSession()
    return null
  }
  return cached
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
