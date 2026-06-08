/**
 * @param {'project' | 'share'} mode
 * @param {string} scopeId projectId or share token
 * @param {{ reviewScope?: string; activeFilter?: string }} [filters]
 * @returns {string}
 */
export function getExportStorageKey(mode, scopeId, filters = {}) {
  const base = `photorev-export:${mode}:${scopeId}`
  if (mode !== 'project') return base
  const reviewScope = filters.reviewScope ?? 'mine'
  const activeFilter = filters.activeFilter ?? 'all'
  return `${base}:${reviewScope}:${activeFilter}`
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
