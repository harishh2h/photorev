import { apiFetch } from './httpClient.js'

/**
 * @typedef {object} ShareLink
 * @property {string} id
 * @property {string} projectId
 * @property {string} token
 * @property {boolean} hasPassword
 * @property {string | null} description
 * @property {boolean} showMetadata
 * @property {boolean} allowDownload
 * @property {string | null} expiresAt
 * @property {string | null} revokedAt
 * @property {string} createdBy
 * @property {string} createdAt
 * @property {number} viewCount
 * @property {string | null} lastViewedAt
 */

/**
 * @param {string} token
 * @param {string} projectId
 * @param {{ description?: string | null; password?: string | null; showMetadata?: boolean; allowDownload?: boolean; expiresAt?: string | null }} payload
 * @returns {Promise<ShareLink>}
 */
export async function createShareLink(token, projectId, payload) {
  const { ok, message, data } = await apiFetch(`/projects/${projectId}/share-link`, {
    token,
    method: 'POST',
    body: payload,
  })
  if (!ok) {
    throw new Error(message)
  }
  return /** @type {ShareLink} */ (data)
}

/**
 * @param {string} token
 * @param {string} projectId
 * @returns {Promise<ShareLink | null>}
 */
export async function getActiveShareLink(token, projectId) {
  const { ok, message, data } = await apiFetch(`/projects/${projectId}/share-link`, { token })
  if (!ok) {
    throw new Error(message)
  }
  return /** @type {ShareLink | null} */ (data)
}

/**
 * @param {string} token
 * @param {string} projectId
 * @param {string} linkId
 * @returns {Promise<void>}
 */
export async function revokeShareLink(token, projectId, linkId) {
  const { ok, message } = await apiFetch(`/projects/${projectId}/share-link/${linkId}`, {
    token,
    method: 'DELETE',
  })
  if (!ok) {
    throw new Error(message)
  }
}
