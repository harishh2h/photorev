import { useEffect, useRef, useState } from 'react'

/**
 * Tracks the rendered size of the viewer image stage (for cover vs contain decisions).
 *
 * @returns {{ stageRef: import('react').RefObject<HTMLDivElement | null>; stageWidth: number; stageHeight: number }}
 */
export function useViewerStageSize() {
  const stageRef = useRef(null)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const node = stageRef.current
    if (!node) {
      return undefined
    }

    const update = () => {
      const rect = node.getBoundingClientRect()
      setStageSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      })
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return {
    stageRef,
    stageWidth: stageSize.width,
    stageHeight: stageSize.height,
  }
}
