/**
 * @param {boolean} hasPassword
 */
export function formatSharePasswordStatus(hasPassword) {
  return hasPassword ? 'On' : 'Off'
}

/**
 * @param {boolean} allowDownload
 */
export function formatShareDownloadsStatus(allowDownload) {
  return allowDownload ? 'On' : 'Off'
}

/**
 * @param {boolean} showMetadata
 */
export function formatShareMetadataStatus(showMetadata) {
  return showMetadata ? 'Shown' : 'Hidden'
}

/**
 * @param {string | null | undefined} expiresAt
 */
export function formatShareExpiresLabel(expiresAt) {
  if (!expiresAt) return 'Never'
  const date = new Date(expiresAt)
  if (Number.isNaN(date.getTime())) return 'Never'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * @param {string} pathToken
 */
export function buildShareUrl(pathToken) {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/s/${pathToken}`
}
