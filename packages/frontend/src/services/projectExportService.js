import { apiFetch, getApiBaseUrl, isApiEnvelope, notifyUnauthorized } from './httpClient.js'

/**
 * @typedef {'original' | 'preview'} ExportVariant
 */

/**
 * @typedef {object} ProjectExportStatus
 * @property {string} id
 * @property {string} projectId
 * @property {ExportVariant} variant
 * @property {'queued' | 'processing' | 'done' | 'failed' | 'expired'} status
 * @property {number} photoCount
 * @property {number} processedCount
 * @property {number} progressPercent
 * @property {number | null} byteSize
 * @property {string | null} errorMessage
 * @property {string | null} expiresAt
 * @property {string} queuedAt
 * @property {string | null} completedAt
 * @property {boolean} downloadAvailable
 * @property {boolean} [reused]
 */

/**
 * @param {string} token
 * @param {string} projectId
 * @param {ExportVariant} variant
 * @returns {Promise<ProjectExportStatus>}
 */
export async function createProjectExport(token, projectId, variant) {
  const { ok, message, data } = await apiFetch(`/projects/${encodeURIComponent(projectId)}/exports`, {
    token,
    method: 'POST',
    body: { variant },
  })
  if (!ok) throw new Error(message)
  return /** @type {ProjectExportStatus} */ (data)
}

/**
 * @param {string} token
 * @param {string} projectId
 * @param {string} exportId
 * @returns {Promise<ProjectExportStatus>}
 */
export async function fetchProjectExportStatus(token, projectId, exportId) {
  const { ok, message, data } = await apiFetch(
    `/projects/${encodeURIComponent(projectId)}/exports/${encodeURIComponent(exportId)}`,
    { token },
  )
  if (!ok) throw new Error(message)
  return /** @type {ProjectExportStatus} */ (data)
}

/**
 * @param {string} token
 * @param {string} projectId
 * @param {string} exportId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Blob>}
 */
export async function fetchProjectExportZipBlob(token, projectId, exportId, options = {}) {
  const base = getApiBaseUrl()
  const res = await fetch(
    `${base}/projects/${encodeURIComponent(projectId)}/exports/${encodeURIComponent(exportId)}/download`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: options.signal,
    },
  )
  if (res.status === 401) notifyUnauthorized()
  if (!res.ok) {
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const text = await res.text()
      try {
        const parsed = JSON.parse(text)
        if (isApiEnvelope(parsed)) throw new Error(parsed.message)
      } catch (err) {
        if (!(err instanceof SyntaxError)) throw err
      }
    }
    throw new Error('Download not available')
  }
  return res.blob()
}

/**
 * @param {string} shareToken
 * @param {ExportVariant} variant
 * @param {string | null} unlockToken
 * @returns {Promise<ProjectExportStatus>}
 */
export async function createShareExport(shareToken, variant, unlockToken) {
  const base = getApiBaseUrl()
  const headers = { 'Content-Type': 'application/json' }
  if (unlockToken) headers.Authorization = `Bearer ${unlockToken}`
  const res = await fetch(`${base}/public/share/${encodeURIComponent(shareToken)}/exports`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ variant }),
  })
  const parsed = await res.json()
  if (!isApiEnvelope(parsed) || parsed.error) {
    throw new Error(parsed?.message || 'Could not start export')
  }
  return /** @type {ProjectExportStatus} */ (parsed.data)
}

/**
 * @param {string} shareToken
 * @param {string} exportId
 * @param {string | null} unlockToken
 * @returns {Promise<ProjectExportStatus>}
 */
export async function fetchShareExportStatus(shareToken, exportId, unlockToken) {
  const base = getApiBaseUrl()
  const qs = unlockToken ? `?u=${encodeURIComponent(unlockToken)}` : ''
  const headers = {}
  if (unlockToken) headers.Authorization = `Bearer ${unlockToken}`
  const res = await fetch(
    `${base}/public/share/${encodeURIComponent(shareToken)}/exports/${encodeURIComponent(exportId)}${qs}`,
    { headers },
  )
  const parsed = await res.json()
  if (!isApiEnvelope(parsed) || parsed.error) {
    throw new Error(parsed?.message || 'Could not load export status')
  }
  return /** @type {ProjectExportStatus} */ (parsed.data)
}

/**
 * @param {string} shareToken
 * @param {string} exportId
 * @param {string | null} unlockToken
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Blob>}
 */
export async function fetchShareExportZipBlob(shareToken, exportId, unlockToken, options = {}) {
  const base = getApiBaseUrl()
  const qs = unlockToken ? `?u=${encodeURIComponent(unlockToken)}` : ''
  const headers = {}
  if (unlockToken) headers.Authorization = `Bearer ${unlockToken}`
  const res = await fetch(
    `${base}/public/share/${encodeURIComponent(shareToken)}/exports/${encodeURIComponent(exportId)}/download${qs}`,
    { headers, signal: options.signal },
  )
  if (!res.ok) throw new Error('Download not available')
  return res.blob()
}
