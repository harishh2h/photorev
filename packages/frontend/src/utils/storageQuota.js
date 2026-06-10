const GIBIBYTE = 1024 ** 3

/**
 * @param {number | null | undefined} bytes
 * @returns {string}
 */
export function formatQuotaGigabytes(bytes) {
  if (bytes == null) return ''
  if (bytes === 0) return '0'
  const gib = bytes / GIBIBYTE
  if (Number.isInteger(gib)) return String(gib)
  return gib.toFixed(2).replace(/\.?0+$/, '')
}

/**
 * @param {string} raw
 * @returns {number | null | 'invalid'}
 */
export function parseQuotaGigabytesInput(raw) {
  if (typeof raw !== 'string') return 'invalid'
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 0) return 'invalid'
  return Math.floor(n * GIBIBYTE)
}

/**
 * @param {{ quotaBytes?: number | null; usageBytes?: number; remainingBytes?: number | null; canUpload?: boolean } | null | undefined} snapshot
 * @returns {boolean}
 */
export function isStorageUploadBlocked(snapshot) {
  if (!snapshot || snapshot.quotaBytes == null) return false
  return snapshot.canUpload === false
}
