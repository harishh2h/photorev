/**
 * @param {'project' | 'share'} mode
 * @param {string} scopeId projectId or share token
 * @returns {string}
 */
export function getExportStorageKey(mode, scopeId) {
  return `photorev-export:${mode}:${scopeId}`
}

/**
 * @param {string} key
 * @returns {{ exportId: string; variant: 'original' | 'preview'; projectName: string } | null}
 */
export function readActiveExport(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.exportId !== 'string' || typeof parsed?.variant !== 'string') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

/**
 * @param {string} key
 * @param {{ exportId: string; variant: 'original' | 'preview'; projectName: string }} payload
 */
export function writeActiveExport(key, payload) {
  localStorage.setItem(
    key,
    JSON.stringify({
      ...payload,
      savedAt: Date.now(),
    }),
  )
}

/**
 * @param {string} key
 */
export function clearActiveExport(key) {
  localStorage.removeItem(key)
}
