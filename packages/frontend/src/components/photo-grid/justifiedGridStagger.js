const STAGGER_CAP_MS = 700
const STAGGER_STEP_MS = 70
const STAGGER_MAX_INDEX = 50

/**
 * @param {number} index
 * @param {number} total
 * @returns {string}
 */
export function getJustifiedGridStaggerDelay(index, total) {
  if (total > STAGGER_MAX_INDEX) {
    return '0ms'
  }
  return `${Math.min(index * STAGGER_STEP_MS, STAGGER_CAP_MS)}ms`
}
