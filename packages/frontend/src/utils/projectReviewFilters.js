/** @typedef {'mine' | 'team'} ReviewScope */
/** @typedef {'all' | 'liked' | 'rejected' | 'unreviewed' | 'conflicts' | 'trashed'} PhotoFilter */

export const REVIEW_SCOPE = {
  MINE: 'mine',
  TEAM: 'team',
}

export const PHOTO_FILTER = {
  ALL: 'all',
  LIKED: 'liked',
  REJECTED: 'rejected',
  UNREVIEWED: 'unreviewed',
  CONFLICTS: 'conflicts',
  TRASHED: 'trashed',
}

const CONFLICT_STATES = new Set(['pending_owner', 'resolved_owner', 'resolved_majority'])

/**
 * @param {string | null | undefined} conflictState
 * @returns {boolean}
 */
export function hasTeamConflict(conflictState) {
  return typeof conflictState === 'string' && CONFLICT_STATES.has(conflictState)
}

/**
 * @param {string | null | undefined} conflictState
 * @returns {boolean}
 */
export function needsOwnerDecision(conflictState) {
  return conflictState === 'pending_owner'
}

/**
 * @param {object} photo
 * @param {ReviewScope} scope
 * @param {PhotoFilter} filter
 * @returns {boolean}
 */
function matchesFilter(photo, scope, filter) {
  if (filter === PHOTO_FILTER.TRASHED) {
    return photo.isTrashed === true
  }
  if (filter === PHOTO_FILTER.CONFLICTS) {
    return photo.hasConflict === true
  }
  if (filter === PHOTO_FILTER.ALL) {
    return true
  }
  if (scope === REVIEW_SCOPE.MINE) {
    if (filter === PHOTO_FILTER.LIKED) return photo.myIsLiked === true
    if (filter === PHOTO_FILTER.REJECTED) return photo.myIsRejected === true
    if (filter === PHOTO_FILTER.UNREVIEWED) return photo.myIsUnreviewed === true
  }
  if (scope === REVIEW_SCOPE.TEAM) {
    if (filter === PHOTO_FILTER.LIKED) return photo.teamIsLiked === true
    if (filter === PHOTO_FILTER.REJECTED) return photo.teamIsRejected === true
  }
  return true
}

/**
 * @param {object[]} photos
 * @param {object[]} trashedPhotos
 * @param {{ scope: ReviewScope; filter: PhotoFilter }} options
 * @returns {object[]}
 */
export function filterPhotos(photos, trashedPhotos, { scope, filter }) {
  if (filter === PHOTO_FILTER.TRASHED) {
    return trashedPhotos
  }
  return photos.filter((photo) => matchesFilter(photo, scope, filter))
}

/**
 * @param {object[]} photos
 * @param {object[]} trashedPhotos
 * @returns {{ mine: Record<string, number>; team: Record<string, number>; conflicts: number; pendingConflicts: number; trashed: number; viewerSelected: number }}
 */
export function countByFilter(photos, trashedPhotos) {
  const mine = {
    all: photos.length,
    liked: photos.filter((p) => p.myIsLiked).length,
    rejected: photos.filter((p) => p.myIsRejected).length,
    unreviewed: photos.filter((p) => p.myIsUnreviewed).length,
  }
  const team = {
    all: photos.length,
    liked: photos.filter((p) => p.teamIsLiked).length,
    rejected: photos.filter((p) => p.teamIsRejected).length,
  }
  const conflicts = photos.filter((p) => p.hasConflict).length
  const pendingConflicts = photos.filter((p) => p.needsOwnerDecision).length
  const viewerSelected = photos.filter((p) => p.teamIsLiked).length

  return {
    mine,
    team,
    conflicts,
    pendingConflicts,
    trashed: trashedPhotos.length,
    viewerSelected,
  }
}

/**
 * @param {ReviewScope} scope
 * @param {boolean} canReviewPhotos
 * @returns {{ id: PhotoFilter; label: string }[]}
 */
export function filterItemsForScope(scope, canReviewPhotos) {
  if (!canReviewPhotos) {
    return []
  }
  const items = [
    { id: PHOTO_FILTER.ALL, label: 'All' },
    { id: PHOTO_FILTER.LIKED, label: 'Liked' },
    { id: PHOTO_FILTER.REJECTED, label: 'Rejected' },
  ]
  if (scope === REVIEW_SCOPE.MINE) {
    items.push({ id: PHOTO_FILTER.UNREVIEWED, label: 'Unreviewed' })
  }
  items.push({ id: PHOTO_FILTER.CONFLICTS, label: 'Conflicts' })
  return items
}

/**
 * @param {Record<string, number>} scopeCounts
 * @param {PhotoFilter} filter
 * @param {{ conflicts: number; trashed: number }} globalCounts
 * @returns {number}
 */
export function countForFilter(scopeCounts, filter, globalCounts) {
  if (filter === PHOTO_FILTER.CONFLICTS) return globalCounts.conflicts
  if (filter === PHOTO_FILTER.TRASHED) return globalCounts.trashed
  return scopeCounts[filter] ?? 0
}
