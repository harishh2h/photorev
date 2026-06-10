import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const MIN_SCALE = 1
const MAX_SCALE = 4
const CLICK_ZOOM_SCALE = 2
const ZOOMED_EPSILON = 0.02
const WHEEL_ZOOM_FACTOR = 0.0025

/**
 * Fit-to-screen photo zoom: click to toggle, wheel/pinch to scale, drag to pan when zoomed.
 * Transforms apply to the image wrapper only — not the viewer chrome.
 *
 * @param {{ enabled?: boolean; onInteraction?: () => void }} [opts]
 */
export function usePhotoViewerZoom({ enabled = true, onInteraction } = {}) {
  const containerRef = useRef(null)
  const contentRef = useRef(null)

  const [scale, setScale] = useState(MIN_SCALE)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [isPinching, setIsPinching] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const scaleRef = useRef(MIN_SCALE)
  const translateRef = useRef({ x: 0, y: 0 })
  const panStartRef = useRef({ x: 0, y: 0, translateX: 0, translateY: 0 })
  const pinchStartRef = useRef(null)
  const pointerIdRef = useRef(/** @type {number | null} */ (null))
  const didPanRef = useRef(false)

  const notifyInteraction = useCallback(() => {
    onInteraction?.()
  }, [onInteraction])

  const clampTranslate = useCallback((nextX, nextY, nextScale) => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content || nextScale <= MIN_SCALE) {
      return { x: 0, y: 0 }
    }

    const containerRect = container.getBoundingClientRect()
    const contentRect = content.getBoundingClientRect()
    const baseWidth = contentRect.width / scaleRef.current
    const baseHeight = contentRect.height / scaleRef.current
    const scaledWidth = baseWidth * nextScale
    const scaledHeight = baseHeight * nextScale

    const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2)
    const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2)

    return {
      x: Math.min(maxX, Math.max(-maxX, nextX)),
      y: Math.min(maxY, Math.max(-maxY, nextY)),
    }
  }, [])

  const applyTransform = useCallback(
    (nextScale, nextTranslate) => {
      const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale))
      const clampedTranslate =
        clampedScale <= MIN_SCALE
          ? { x: 0, y: 0 }
          : clampTranslate(nextTranslate.x, nextTranslate.y, clampedScale)

      scaleRef.current = clampedScale
      translateRef.current = clampedTranslate
      setScale(clampedScale)
      setTranslate(clampedTranslate)
    },
    [clampTranslate]
  )

  const resetZoom = useCallback(() => {
    applyTransform(MIN_SCALE, { x: 0, y: 0 })
  }, [applyTransform])

  const zoomAtPoint = useCallback(
    (clientX, clientY, nextScale) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const pointX = clientX - rect.left - rect.width / 2
      const pointY = clientY - rect.top - rect.height / 2
      const currentScale = scaleRef.current
      const ratio = nextScale / currentScale

      const nextTranslate = {
        x: pointX - (pointX - translateRef.current.x) * ratio,
        y: pointY - (pointY - translateRef.current.y) * ratio,
      }

      applyTransform(nextScale, nextTranslate)
      notifyInteraction()
    },
    [applyTransform, notifyInteraction]
  )

  const handleClick = useCallback(
    (e) => {
      if (!enabled || e.detail > 1 || didPanRef.current) {
        didPanRef.current = false
        return
      }

      const isZoomed = scaleRef.current > MIN_SCALE + ZOOMED_EPSILON
      if (isZoomed) {
        resetZoom()
      } else {
        zoomAtPoint(e.clientX, e.clientY, CLICK_ZOOM_SCALE)
      }
    },
    [enabled, resetZoom, zoomAtPoint]
  )

  const handleWheel = useCallback(
    (e) => {
      if (!enabled) return

      e.preventDefault()
      e.stopPropagation()

      if (!e.ctrlKey && !e.metaKey) return

      const delta = -e.deltaY * WHEEL_ZOOM_FACTOR
      const nextScale = scaleRef.current * (1 + delta)
      zoomAtPoint(e.clientX, e.clientY, nextScale)
    },
    [enabled, zoomAtPoint]
  )

  const handlePointerDown = useCallback(
    (e) => {
      if (!enabled || scaleRef.current <= MIN_SCALE + ZOOMED_EPSILON) return
      if (e.pointerType === 'mouse' && e.button !== 0) return

      pointerIdRef.current = e.pointerId
      didPanRef.current = false
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        translateX: translateRef.current.x,
        translateY: translateRef.current.y,
      }
      setIsPanning(true)
      e.currentTarget.setPointerCapture(e.pointerId)
      e.stopPropagation()
    },
    [enabled]
  )

  const handlePointerMove = useCallback(
    (e) => {
      if (pointerIdRef.current !== e.pointerId) return

      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        didPanRef.current = true
      }
      applyTransform(scaleRef.current, {
        x: panStartRef.current.translateX + dx,
        y: panStartRef.current.translateY + dy,
      })
      e.stopPropagation()
    },
    [applyTransform]
  )

  const finishPan = useCallback((e) => {
    if (pointerIdRef.current !== e.pointerId) return
    pointerIdRef.current = null
    setIsPanning(false)
    e.stopPropagation()
  }, [])

  const getTouchDistance = (touches) => {
    if (touches.length < 2) return 0
    const [a, b] = touches
    const dx = a.clientX - b.clientX
    const dy = a.clientY - b.clientY
    return Math.hypot(dx, dy)
  }

  const getTouchCenter = (touches) => {
    const [a, b] = touches
    return {
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
    }
  }

  const handleTouchStart = useCallback(
    (e) => {
      if (!enabled || e.touches.length < 2) return

      e.preventDefault()
      e.stopPropagation()

      pinchStartRef.current = {
        distance: getTouchDistance(e.touches),
        scale: scaleRef.current,
        center: getTouchCenter(e.touches),
      }
      setIsPinching(true)
      notifyInteraction()
    },
    [enabled, notifyInteraction]
  )

  const handleTouchMove = useCallback(
    (e) => {
      if (!enabled || !pinchStartRef.current || e.touches.length < 2) return

      e.preventDefault()
      e.stopPropagation()

      const start = pinchStartRef.current
      const distance = getTouchDistance(e.touches)
      if (start.distance <= 0) return

      const nextScale = start.scale * (distance / start.distance)
      zoomAtPoint(start.center.x, start.center.y, nextScale)
    },
    [enabled, zoomAtPoint]
  )

  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) {
      pinchStartRef.current = null
      setIsPinching(false)
    }
  }, [])

  const toggleZoom = useCallback(() => {
    if (!enabled) return

    const container = containerRef.current
    const zoomed = scaleRef.current > MIN_SCALE + ZOOMED_EPSILON
    if (zoomed) {
      resetZoom()
      return
    }

    if (!container) return
    const rect = container.getBoundingClientRect()
    zoomAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, CLICK_ZOOM_SCALE)
  }, [enabled, resetZoom, zoomAtPoint])

  const isZoomed = scale > MIN_SCALE + ZOOMED_EPSILON

  const cursor = useMemo(() => {
    if (!enabled || !isHovering) return undefined
    if (isPanning) return 'grabbing'
    if (isZoomed) return 'grab'
    return 'zoom-in'
  }, [enabled, isHovering, isPanning, isZoomed])

  const innerStyle = useMemo(
    () => ({
      transform: `translate3d(${translate.x}px, ${translate.y}px, 0) scale(${scale})`,
      transition: isPanning || isPinching ? 'none' : 'transform 200ms cubic-bezier(0, 0, 0.2, 1)',
      willChange: 'transform',
    }),
    [isPanning, isPinching, scale, translate.x, translate.y]
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el || !enabled) return undefined

    const onWheel = (e) => {
      handleWheel(e)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
    }
  }, [enabled, handleWheel])

  return {
    containerRef,
    contentRef,
    isZoomed,
    resetZoom,
    toggleZoom,
    cursor,
    innerStyle,
    handlers: {
      onClick: handleClick,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: finishPan,
      onPointerCancel: finishPan,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
      onMouseEnter: () => setIsHovering(true),
      onMouseLeave: () => setIsHovering(false),
    },
  }
}
