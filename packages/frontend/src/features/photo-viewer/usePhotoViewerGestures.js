import { useCallback, useRef, useState } from 'react'

const LOCK_THRESHOLD = 10
const COMMIT_THRESHOLD = 52
const MAX_ROTATION = 10
const EXIT_ANIMATION_MS = 320
const SNAP_BACK_MS = 320
const RUBBER_BAND = 0.38
const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)'

/** @typedef {'horizontal' | 'vertical' | null} AxisLock */

/**
 * @typedef {'like' | 'reject' | 'next' | 'prev' | null} SwipeIntent
 */

/**
 * @param {number} value
 * @param {boolean} limited
 * @returns {number}
 */
function rubberBand(value, limited) {
  if (!limited) return value
  return value * RUBBER_BAND
}

/**
 * Mobile swipe review: horizontal vote (+ auto-advance via callbacks), vertical navigate.
 * @param {{
 *   onLikeAndNext: () => Promise<boolean>;
 *   onRejectAndNext: () => Promise<boolean>;
 *   goNext: () => void;
 *   goPrev: () => void;
 *   enabled: boolean;
 *   canVote: boolean;
 *   isSaving: boolean;
 *   hasNext?: boolean;
 *   hasPrev?: boolean;
 * }} opts
 */
export function usePhotoViewerGestures({
  onLikeAndNext,
  onRejectAndNext,
  goNext,
  goPrev,
  enabled,
  canVote,
  isSaving,
  hasNext = true,
  hasPrev = true,
}) {
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [intent, setIntent] = useState(/** @type {SwipeIntent} */ (null))

  const axisLockRef = useRef(/** @type {AxisLock} */ (null))
  const startRef = useRef({ x: 0, y: 0 })
  const pointerIdRef = useRef(/** @type {number | null} */ (null))
  const activePointerCountRef = useRef(0)

  const resetDrag = useCallback(() => {
    axisLockRef.current = null
    setOffsetX(0)
    setOffsetY(0)
    setIsDragging(false)
    setIsExiting(false)
    setIntent(null)
  }, [])

  const runExitAnimation = useCallback(
    async (exitX, exitY, action) => {
      setIsExiting(true)
      setOffsetX(exitX)
      setOffsetY(exitY)
      setIsDragging(false)

      await new Promise((resolve) => {
        window.setTimeout(resolve, EXIT_ANIMATION_MS)
      })

      const ok = await action()
      resetDrag()
      return ok
    },
    [resetDrag]
  )

  const handlePointerDown = useCallback(
    (e) => {
      if (!enabled || isSaving || isExiting) return
      if (e.pointerType === 'mouse' && e.button !== 0) return

      activePointerCountRef.current += 1
      if (activePointerCountRef.current > 1) {
        resetDrag()
        return
      }

      pointerIdRef.current = e.pointerId
      startRef.current = { x: e.clientX, y: e.clientY }
      axisLockRef.current = null
      setIsDragging(true)
      setIntent(null)
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [enabled, isExiting, isSaving, resetDrag]
  )

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging || pointerIdRef.current !== e.pointerId || isExiting) return
      if (activePointerCountRef.current > 1) return

      const dx = e.clientX - startRef.current.x
      const dy = e.clientY - startRef.current.y

      if (!axisLockRef.current) {
        if (canVote && Math.abs(dx) > LOCK_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.05) {
          axisLockRef.current = 'horizontal'
        } else if (Math.abs(dy) > LOCK_THRESHOLD && Math.abs(dy) > Math.abs(dx) * 1.05) {
          axisLockRef.current = 'vertical'
        }
      }

      if (axisLockRef.current === 'horizontal') {
        if (!canVote) return
        setOffsetX(dx)
        setOffsetY(0)
        setIntent(dx > 0 ? 'like' : 'reject')
        return
      }

      if (axisLockRef.current === 'vertical') {
        const nextIntent = dy < 0 ? 'next' : 'prev'
        const limited = (nextIntent === 'next' && !hasNext) || (nextIntent === 'prev' && !hasPrev)
        setOffsetX(0)
        setOffsetY(rubberBand(dy, limited))
        setIntent(nextIntent)
      }
    },
    [canVote, hasNext, hasPrev, isDragging, isExiting]
  )

  const handlePointerUp = useCallback(
    async (e) => {
      if (pointerIdRef.current !== e.pointerId) return

      activePointerCountRef.current = Math.max(0, activePointerCountRef.current - 1)
      pointerIdRef.current = null

      if (!isDragging || isExiting) return

      const dx = e.clientX - startRef.current.x
      const dy = e.clientY - startRef.current.y
      const lock = axisLockRef.current

      if (lock === 'horizontal' && canVote) {
        if (dx >= COMMIT_THRESHOLD) {
          await runExitAnimation(window.innerWidth * 0.55, 0, onLikeAndNext)
          return
        }
        if (dx <= -COMMIT_THRESHOLD) {
          await runExitAnimation(-window.innerWidth * 0.55, 0, onRejectAndNext)
          return
        }
      }

      if (lock === 'vertical') {
        if (dy <= -COMMIT_THRESHOLD && hasNext) {
          await runExitAnimation(0, -window.innerHeight * 0.4, async () => {
            goNext()
            return true
          })
          return
        }
        if (dy >= COMMIT_THRESHOLD && hasPrev) {
          await runExitAnimation(0, window.innerHeight * 0.4, async () => {
            goPrev()
            return true
          })
          return
        }
      }

      resetDrag()
    },
    [
      canVote,
      goNext,
      goPrev,
      hasNext,
      hasPrev,
      isDragging,
      isExiting,
      onLikeAndNext,
      onRejectAndNext,
      resetDrag,
      runExitAnimation,
    ]
  )

  const handlePointerCancel = useCallback(
    (e) => {
      if (pointerIdRef.current === e.pointerId) {
        activePointerCountRef.current = Math.max(0, activePointerCountRef.current - 1)
        pointerIdRef.current = null
      }
      if (!isExiting) resetDrag()
    },
    [isExiting, resetDrag]
  )

  const rotation =
    intent === 'like' || intent === 'reject'
      ? Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, offsetX / 18))
      : 0

  const dragOpacity =
    intent === 'next' || intent === 'prev'
      ? Math.max(0.72, 1 - Math.min(Math.abs(offsetY) / 280, 0.28))
      : 1

  const overlayStrength = Math.min(
    1,
    Math.max(
      intent === 'like' || intent === 'reject' ? Math.abs(offsetX) / COMMIT_THRESHOLD : 0,
      intent === 'next' || intent === 'prev' ? Math.abs(offsetY) / COMMIT_THRESHOLD : 0,
    ),
  )

  return {
    offsetX,
    offsetY,
    rotation,
    intent,
    isDragging,
    isExiting,
    dragOpacity,
    overlayStrength,
    snapBackMs: SNAP_BACK_MS,
    exitAnimationMs: EXIT_ANIMATION_MS,
    easeOut: EASE_OUT,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
    resetDrag,
  }
}

export { COMMIT_THRESHOLD, EXIT_ANIMATION_MS, MAX_ROTATION, SNAP_BACK_MS }
