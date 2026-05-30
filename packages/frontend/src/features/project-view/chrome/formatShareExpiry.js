/**
 * @param {string | null | undefined} expiresAt
 * @returns {string}
 */
export function formatShareExpiry(expiresAt) {
  if (!expiresAt) return 'Never expires'
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const days = Math.round(ms / (24 * 60 * 60 * 1000))
  if (days >= 1) return `Expires in ${days}d`
  const hrs = Math.round(ms / (60 * 60 * 1000))
  return `Expires in ${hrs}h`
}
