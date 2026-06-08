const UNITS = ['B', 'KB', 'MB', 'GB', 'TB']

/**
 * @param {number} bytes
 * @param {number} [decimals]
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 1) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const k = 1024
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), UNITS.length - 1)
  const value = bytes / k ** i
  const precision = i === 0 ? 0 : decimals
  return `${value.toFixed(precision)} ${UNITS[i]}`
}

/**
 * @param {number} bytesPerSecond
 * @returns {string | null}
 */
export function formatBytesPerSecond(bytesPerSecond) {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return null
  return `${formatBytes(bytesPerSecond)}/s`
}
