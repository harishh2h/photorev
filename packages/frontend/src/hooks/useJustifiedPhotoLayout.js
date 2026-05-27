import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  computeJustifiedPhotoLayout,
  getLayoutSpacing,
  getTargetRowHeight,
  groupLayoutIntoRows,
} from '@/utils/justifiedPhotoLayout.js'

/**
 * @param {object[]} photos
 * @param {import('react').RefObject<HTMLElement | null>} containerRef
 */
export function useJustifiedPhotoLayout(photos, containerRef) {
  const [containerWidth, setContainerWidth] = useState(0)

  const syncContainerWidth = useCallback(() => {
    const element = containerRef.current
    if (!element) {
      return
    }
    setContainerWidth(element.clientWidth)
  }, [containerRef])

  useEffect(() => {
    const element = containerRef.current
    if (!element) {
      return undefined
    }

    const observer = new ResizeObserver(() => {
      syncContainerWidth()
    })
    observer.observe(element)
    syncContainerWidth()
    window.addEventListener('resize', syncContainerWidth)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncContainerWidth)
    }
  }, [containerRef, syncContainerWidth])

  const effectiveContainerWidth =
    containerWidth > 0
      ? containerWidth
      : typeof window !== 'undefined'
        ? Math.max(window.innerWidth - 32, 280)
        : 343

  const spacing = getLayoutSpacing(effectiveContainerWidth)
  const targetRowHeight = getTargetRowHeight(effectiveContainerWidth)

  const layout = useMemo(
    () =>
      computeJustifiedPhotoLayout(photos, {
        containerWidth: effectiveContainerWidth,
        targetRowHeight,
        spacing,
      }),
    [photos, effectiveContainerWidth, targetRowHeight, spacing],
  )

  const rows = useMemo(() => groupLayoutIntoRows(layout, photos), [layout, photos])

  return {
    layout,
    rows,
    containerWidth: effectiveContainerWidth,
    spacing,
    targetRowHeight,
  }
}
