/** @type {Map<string, { blobUrl: string; refCount: number }>} */
const cache = new Map()

function cacheKey(photoId, variant) {
  return `${photoId}:${variant}`
}

/**
 * @param {string} photoId
 * @param {'thumbnail' | 'preview' | 'original'} variant
 * @returns {string | null}
 */
export function peekPhotoContentUrl(photoId, variant) {
  return cache.get(cacheKey(photoId, variant))?.blobUrl ?? null
}

/**
 * @param {string} photoId
 * @param {'thumbnail' | 'preview' | 'original'} variant
 * @param {string} blobUrl
 */
export function storePhotoContentUrl(photoId, variant, blobUrl) {
  const key = cacheKey(photoId, variant)
  const existing = cache.get(key)
  if (existing?.blobUrl === blobUrl) {
    return
  }
  if (existing) {
    URL.revokeObjectURL(existing.blobUrl)
  }
  cache.set(key, { blobUrl, refCount: existing?.refCount ?? 0 })
}

/**
 * @param {string} photoId
 * @param {'thumbnail' | 'preview' | 'original'} variant
 * @returns {string | null}
 */
export function acquirePhotoContentUrl(photoId, variant) {
  const entry = cache.get(cacheKey(photoId, variant))
  if (!entry) {
    return null
  }
  entry.refCount += 1
  return entry.blobUrl
}

/**
 * In-memory blob URL cache for the current tab session.
 * Pairs with browser HTTP cache when signed URLs are enabled (`<img src>` + Cache-Control).
 *
 * @param {string} photoId
 * @param {'thumbnail' | 'preview' | 'original'} variant
 */
export function releasePhotoContentUrl(photoId, variant) {
  const entry = cache.get(cacheKey(photoId, variant))
  if (!entry) {
    return
  }
  entry.refCount = Math.max(0, entry.refCount - 1)
}
