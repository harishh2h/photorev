import { fetchPhotoDownloadBlob } from '@/services/photoService.js'

/**
 * @param {Blob} blob
 * @param {string} filename
 */
function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/**
 * Download the original-resolution photo for any project member (all roles).
 * Uses GET /photos/:id/download — strict original only, never preview/thumbnail fallbacks.
 *
 * @param {{ token: string; photoId: string; filename?: string | null }} params
 */
export async function downloadPhotoOriginal({ token, photoId, filename }) {
  const safeName =
    typeof filename === 'string' && filename.trim().length > 0
      ? filename.trim()
      : `photo-${photoId}.jpg`
  const blob = await fetchPhotoDownloadBlob(token, photoId)
  triggerBlobDownload(blob, safeName)
}
