/**
 * Stable per-browser session id for share link view counting (one view per tab session).
 * @param {string} token
 * @returns {string}
 */
export function getShareViewSessionId(token) {
  const key = `photorev_share_view_session_${token}`
  try {
    let id = window.sessionStorage.getItem(key)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `v-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
      window.sessionStorage.setItem(key, id)
    }
    return id
  } catch {
    return `v-${token.slice(0, 8)}-${Date.now()}`
  }
}
