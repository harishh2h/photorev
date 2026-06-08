/** @typedef {{ lastLoaded: number; lastAt: number; smoothed: number }} UploadSpeedState */

/**
 * @returns {UploadSpeedState}
 */
export function createUploadSpeedState() {
  return { lastLoaded: 0, lastAt: 0, smoothed: 0 }
}

/**
 * @param {UploadSpeedState} state
 * @param {number} loaded
 * @param {number} [now]
 * @returns {number}
 */
export function updateUploadSpeed(state, loaded, now = Date.now()) {
  if (state.lastAt === 0) {
    state.lastLoaded = loaded
    state.lastAt = now
    return 0
  }

  const elapsedMs = now - state.lastAt
  if (elapsedMs < 50) {
    return state.smoothed
  }

  const instant = (loaded - state.lastLoaded) / (elapsedMs / 1000)
  state.smoothed = state.smoothed === 0 ? instant : state.smoothed * 0.75 + instant * 0.25
  state.lastLoaded = loaded
  state.lastAt = now
  return state.smoothed
}

/**
 * @param {UploadSpeedState} state
 */
export function resetUploadSpeed(state) {
  state.lastLoaded = 0
  state.lastAt = 0
  state.smoothed = 0
}

/**
 * @typedef {'queued' | 'uploading' | 'succeeded' | 'failed' | 'cancelled'} UploadJobStatusLite
 */

/**
 * @typedef {{ status: UploadJobStatusLite; bytesTotal: number; bytesLoaded: number; bytesPerSecond: number }} BatchProgressJob
 */

/**
 * @param {BatchProgressJob[]} jobs
 */
export function computeBatchUploadProgress(jobs) {
  let bytesLoaded = 0
  let bytesTotal = 0
  let batchSpeed = 0

  for (const job of jobs) {
    if (job.status === 'cancelled') continue
    bytesTotal += job.bytesTotal
    if (job.status === 'succeeded') {
      bytesLoaded += job.bytesTotal
    } else if (job.status === 'uploading') {
      bytesLoaded += job.bytesLoaded
      batchSpeed += job.bytesPerSecond
    }
  }

  const percent = bytesTotal > 0 ? Math.min(100, (bytesLoaded / bytesTotal) * 100) : 0
  return { bytesLoaded, bytesTotal, batchSpeed, percent }
}

/**
 * @param {() => void} flush
 * @param {number} [intervalMs]
 */
export function createProgressThrottle(flush, intervalMs = 120) {
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null
  let pending = false

  return {
    schedule() {
      pending = true
      if (timer !== null) return
      timer = setTimeout(() => {
        timer = null
        if (!pending) return
        pending = false
        flush()
      }, intervalMs)
    },
    flushNow() {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
      pending = false
      flush()
    },
    clear() {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
      pending = false
    },
  }
}
