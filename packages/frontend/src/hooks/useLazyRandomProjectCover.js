import { useState, useEffect, useRef } from 'react'
import { fetchRandomProjectCoverPhotoId } from '@/services/projectService.js'

/**
 * When `skip` is false, loads one random ready preview photo id after the root
 * element intersects the viewport (single fetch, observer disconnects after trigger).
 *
 * @param {{ projectId: string; authToken: string; skip: boolean }} args
 * @returns {{ coverPhotoId: string | null; rootRef: import('react').RefObject<HTMLDivElement | null> }}
 */
export function useLazyRandomProjectCover({ projectId, authToken, skip }) {
  const [coverPhotoId, setCoverPhotoId] = useState(/** @type {string | null} */ (null))
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null))

  useEffect(() => {
    if (skip || !projectId || !authToken) {
      return undefined
    }
    const el = rootRef.current
    if (!el) {
      return undefined
    }
    let cancelled = false
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) {
          return
        }
        observer.disconnect()
        fetchRandomProjectCoverPhotoId(authToken, projectId)
          .then((id) => {
            if (!cancelled) {
              setCoverPhotoId(id)
            }
          })
          .catch(() => {
            if (!cancelled) {
              setCoverPhotoId(null)
            }
          })
      },
      { root: null, rootMargin: '120px 0px 120px 0px', threshold: 0 },
    )
    observer.observe(el)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [skip, projectId, authToken])

  return { coverPhotoId, rootRef }
}
