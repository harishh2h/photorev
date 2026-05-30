import { useState, useEffect, useRef } from 'react'
import { fetchRandomProjectCoverPhotoId } from '@/services/projectService.js'
import { fetchProjectGrid } from '@/services/projectGridService.js'

/**
 * Loads cover photo + review counts when the card root enters the viewport.
 *
 * @param {{ projectId: string; authToken: string; isCreator: boolean; skipCover: boolean }} args
 * @returns {{
 *   coverPhotoId: string | null;
 *   reviewStats: { liked: number; rejected: number } | null;
 *   rootRef: import('react').RefObject<HTMLDivElement | null>;
 * }}
 */
export function useLazyProjectCardMeta({ projectId, authToken, isCreator, skipCover }) {
  const [coverPhotoId, setCoverPhotoId] = useState(/** @type {string | null} */ (null))
  const [reviewStats, setReviewStats] = useState(/** @type {{ liked: number; rejected: number } | null} */ (null))
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null))

  useEffect(() => {
    if (!projectId || !authToken) {
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

        const coverPromise = skipCover
          ? Promise.resolve(null)
          : fetchRandomProjectCoverPhotoId(authToken, projectId).catch(() => null)

        const statsPromise = fetchProjectGrid(authToken, projectId, { pageSize: 1 })
          .then((grid) => {
            const mine = grid.filterCounts?.mine ?? {}
            const team = grid.filterCounts?.team ?? {}
            return {
              liked: isCreator
                ? typeof team.liked === 'number'
                  ? team.liked
                  : 0
                : typeof mine.liked === 'number'
                  ? mine.liked
                  : 0,
              rejected: isCreator
                ? typeof team.rejected === 'number'
                  ? team.rejected
                  : 0
                : typeof mine.rejected === 'number'
                  ? mine.rejected
                  : 0,
            }
          })
          .catch(() => null)

        coverPromise.then((id) => {
          if (!cancelled && id) {
            setCoverPhotoId(id)
          }
        })

        statsPromise.then((stats) => {
          if (!cancelled && stats) {
            setReviewStats(stats)
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
  }, [skipCover, projectId, authToken, isCreator])

  return { coverPhotoId, reviewStats, rootRef }
}
