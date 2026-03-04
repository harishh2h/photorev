import { useState, useEffect } from 'react'

const DEFAULT_DURATION_MS = 700

/**
 * Animates from 0 to target over duration. Uses requestAnimationFrame for smooth count-up.
 * @param {number} target - Final value to display
 * @param {number} [durationMs] - Animation duration in ms
 * @returns {number} Current value (0 → target)
 */
export function useCountUp(target, durationMs = DEFAULT_DURATION_MS) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target <= 0) {
      setValue(0)
      return
    }
    let startTime = null
    let rafId = null
    const tick = (timestamp) => {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const easeOutQuart = 1 - (1 - progress) ** 4
      setValue(Math.round(easeOutQuart * target))
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [target, durationMs])

  return value
}
