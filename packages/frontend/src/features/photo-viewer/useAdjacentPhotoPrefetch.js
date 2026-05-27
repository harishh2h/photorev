import { useEffect } from 'react'
import { prefetchPhotoPreview } from '@/features/photo-viewer/photoContentLoader.js'

/**
 * Prefetch preview images for the immediate previous and next photos only.
 *
 * @param {{
 *   token: string;
 *   photos: Array<{ id?: string; status?: string }>;
 *   index: number;
 * }} params
 */
export function useAdjacentPhotoPrefetch({ token, photos, index }) {
  const prevPhoto = index > 0 ? photos[index - 1] : null
  const nextPhoto = index >= 0 && index < photos.length - 1 ? photos[index + 1] : null

  useEffect(() => {
    if (!token || index < 0) {
      return undefined
    }

    let cancelled = false
    const targets = [prevPhoto, nextPhoto].filter(
      (photo) => photo != null && photo.status === 'ready' && typeof photo.id === 'string',
    )

    void (async () => {
      for (const photo of targets) {
        if (cancelled) {
          return
        }
        await prefetchPhotoPreview(token, photo.id)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, index, prevPhoto?.id, prevPhoto?.status, nextPhoto?.id, nextPhoto?.status])
}
