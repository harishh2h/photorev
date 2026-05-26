import { useState, useEffect, useRef } from 'react'

const DEFAULT_ROOT_MARGIN = '200px 0px'

/**
 * Tracks whether an element is near or inside the viewport via IntersectionObserver.
 *
 * @param {{ rootMargin?: string; enabled?: boolean }} [options]
 * @returns {{ ref: import('react').RefObject<HTMLElement | null>; isInViewport: boolean }}
 */
export function useInViewport(options = {}) {
  const { rootMargin = DEFAULT_ROOT_MARGIN, enabled = true } = options
  const ref = useRef(/** @type {HTMLElement | null} */ (null))
  const [isInViewport, setIsInViewport] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setIsInViewport(false)
      return undefined
    }
    const el = ref.current
    if (!el) {
      return undefined
    }
    const observer = new IntersectionObserver(
      (entries) => {
        setIsInViewport(entries.some((entry) => entry.isIntersecting))
      },
      { root: null, rootMargin, threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled, rootMargin])

  return { ref, isInViewport }
}
