import { useCallback, useRef } from 'react'

const DEFAULT_DELAY_MS = 450

/**
 * Long-press gesture for mobile selection entry (Google Photos pattern).
 *
 * @param {() => void} onLongPress
 * @param {{ delay?: number }} [options]
 */
export function useLongPress(onLongPress, options = {}) {
  const delay = options.delay ?? DEFAULT_DELAY_MS
  const timerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null))
  const triggeredRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handlePointerDown = useCallback(() => {
    triggeredRef.current = false
    clearTimer()
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true
      onLongPress()
    }, delay)
  }, [clearTimer, delay, onLongPress])

  const handlePointerEnd = useCallback(() => {
    clearTimer()
  }, [clearTimer])

  const handleClickCapture = useCallback((event) => {
    if (triggeredRef.current) {
      event.preventDefault()
      event.stopPropagation()
      triggeredRef.current = false
    }
  }, [])

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerEnd,
    onPointerLeave: handlePointerEnd,
    onPointerCancel: handlePointerEnd,
    onClickCapture: handleClickCapture,
  }
}
