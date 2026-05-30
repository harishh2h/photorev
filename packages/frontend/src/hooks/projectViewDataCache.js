/**
 * In-memory snapshot so project grid + viewer survive route remounts (grid ↔ photo viewer).
 * @typedef {{
 *   data: object;
 *   reviewScope: string;
 *   activeFilter: string;
 *   gridPhotos: object[];
 *   loadedCount: number;
 *   totalCount: number;
 *   filterCounts: object | null;
 *   project: object;
 *   members: object[];
 *   gridPage: number;
 *   canReviewPhotos: boolean;
 * }} ProjectViewCacheEntry
 */

/** @type {Map<string, ProjectViewCacheEntry>} */
const cache = new Map()

/**
 * @param {string | undefined} projectId
 * @param {string | null | undefined} token
 * @returns {string | null}
 */
export function projectViewCacheKey(projectId, token) {
  if (!projectId || !token) return null
  return `${projectId}:${token}`
}

/**
 * @param {string | undefined} projectId
 * @param {string | null | undefined} token
 * @returns {ProjectViewCacheEntry | null}
 */
export function readProjectViewCache(projectId, token) {
  const key = projectViewCacheKey(projectId, token)
  if (!key) return null
  return cache.get(key) ?? null
}

/**
 * @param {string} key
 * @param {ProjectViewCacheEntry} entry
 */
export function writeProjectViewCache(key, entry) {
  cache.set(key, entry)
}

/**
 * @param {string | undefined} projectId
 * @param {string | null | undefined} token
 */
export function clearProjectViewCache(projectId, token) {
  const key = projectViewCacheKey(projectId, token)
  if (key) cache.delete(key)
}
