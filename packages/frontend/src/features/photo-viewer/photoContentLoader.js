import { fetchPhotoContentBlob } from '@/services/photoService.js'
import {
  buildAuthenticatedPhotoUrl,
  isPhotoSignedUrlsEnabled,
  peekAuthenticatedPhotoUrl,
} from '@/utils/photoContentUrl.js'
import {
  acquirePhotoContentUrl,
  peekPhotoContentUrl,
  storePhotoContentUrl,
} from '@/utils/photoContentCache.js'

/**
 * @param {string} url
 * @returns {Promise<void>}
 */
function warmCachedImageUrl(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.decoding = 'async'
    img.src = url
  })
}

/**
 * @param {string} token
 * @param {string} photoId
 * @param {boolean} signedEnabled
 * @returns {Promise<string>}
 */
export async function resolvePreviewUrl(token, photoId, signedEnabled) {
  if (signedEnabled) {
    return (
      peekAuthenticatedPhotoUrl(photoId, 'preview') ||
      (await buildAuthenticatedPhotoUrl(token, photoId, 'preview'))
    )
  }
  const cached = peekPhotoContentUrl(photoId, 'preview')
  if (cached) {
    acquirePhotoContentUrl(photoId, 'preview')
    return cached
  }
  const blob = await fetchPhotoContentBlob(token, photoId, { variant: 'preview' })
  const url = URL.createObjectURL(blob)
  storePhotoContentUrl(photoId, 'preview', url)
  acquirePhotoContentUrl(photoId, 'preview')
  return url
}

/**
 * @param {string} token
 * @param {string} photoId
 * @param {boolean} signedEnabled
 * @returns {Promise<string>}
 */
export async function resolveOriginalUrl(token, photoId, signedEnabled) {
  if (signedEnabled) {
    return (
      peekAuthenticatedPhotoUrl(photoId, 'original') ||
      (await buildAuthenticatedPhotoUrl(token, photoId, 'original'))
    )
  }
  const cached = peekPhotoContentUrl(photoId, 'original')
  if (cached) {
    acquirePhotoContentUrl(photoId, 'original')
    return cached
  }
  const blob = await fetchPhotoContentBlob(token, photoId, { variant: 'original' })
  const url = URL.createObjectURL(blob)
  storePhotoContentUrl(photoId, 'original', url)
  acquirePhotoContentUrl(photoId, 'original')
  return url
}

/**
 * Best-effort preview warm for an adjacent photo (no ref-count acquire).
 *
 * @param {string} token
 * @param {string} photoId
 */
export async function prefetchPhotoPreview(token, photoId) {
  const signedEnabled = isPhotoSignedUrlsEnabled()
  try {
    if (signedEnabled) {
      let url = peekAuthenticatedPhotoUrl(photoId, 'preview')
      if (!url) {
        url = await buildAuthenticatedPhotoUrl(token, photoId, 'preview')
      }
      await warmCachedImageUrl(url)
      return
    }
    if (peekPhotoContentUrl(photoId, 'preview')) {
      return
    }
    const blob = await fetchPhotoContentBlob(token, photoId, { variant: 'preview' })
    const url = URL.createObjectURL(blob)
    storePhotoContentUrl(photoId, 'preview', url)
    await warmCachedImageUrl(url)
  } catch {
    /* prefetch is optional */
  }
}
