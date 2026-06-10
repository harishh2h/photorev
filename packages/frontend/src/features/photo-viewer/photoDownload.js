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

/**
 * Clipboard APIs are picky — normalize any image blob to PNG via canvas.
 *
 * @param {Blob} blob
 * @returns {Promise<Blob>}
 */
async function blobToPngBlob(blob) {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Could not prepare image for clipboard')
      }
      ctx.drawImage(bitmap, 0, 0)
      const pngBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result)
          else reject(new Error('Could not convert image for clipboard'))
        }, 'image/png')
      })
      return pngBlob
    } finally {
      bitmap.close?.()
    }
  }

  const url = URL.createObjectURL(blob)
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Could not load image for clipboard'))
      img.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not prepare image for clipboard')
    }
    ctx.drawImage(image, 0, 0)
    return new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result)
        else reject(new Error('Could not convert image for clipboard'))
      }, 'image/png')
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Copy the original-resolution photo to the system clipboard.
 *
 * @param {{ token: string; photoId: string }} params
 */
export async function copyPhotoToClipboard({ token, photoId }) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('Clipboard not supported in this browser')
  }

  const sourceBlob = await fetchPhotoDownloadBlob(token, photoId)
  const pngBlob = await blobToPngBlob(sourceBlob)

  await navigator.clipboard.write([
    new ClipboardItem({
      'image/png': Promise.resolve(pngBlob),
    }),
  ])
}
