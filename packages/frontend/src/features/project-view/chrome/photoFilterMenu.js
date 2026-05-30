import {
  PHOTO_FILTER,
  filterItemsForScope,
  countForFilter,
} from '@/utils/projectReviewFilters.js'

/**
 * @param {string} reviewScope
 * @param {boolean} canReviewPhotos
 * @param {object} filterCounts
 * @returns {{ filterItems: { id: string; label: string }[]; scopeCounts: object; globalCounts: { conflicts: number; trashed: number } }}
 */
export function buildPhotoFilterMenu(reviewScope, canReviewPhotos, filterCounts) {
  const scopeCounts = reviewScope === 'team' ? filterCounts.team : filterCounts.mine
  const filterItems = filterItemsForScope(reviewScope, canReviewPhotos)
  const trashedCount = filterCounts.trashed ?? 0
  if (canReviewPhotos && trashedCount > 0) {
    filterItems.push({ id: PHOTO_FILTER.TRASHED, label: 'Trash' })
  }
  const globalCounts = { conflicts: filterCounts.conflicts ?? 0, trashed: trashedCount }
  return { filterItems, scopeCounts, globalCounts }
}

/**
 * @param {string} filterId
 * @returns {string}
 */
export function photoFilterCountToneClass(filterId) {
  if (filterId === PHOTO_FILTER.LIKED) return 'text-accent'
  if (filterId === PHOTO_FILTER.REJECTED) return 'text-error'
  if (filterId === PHOTO_FILTER.CONFLICTS) return 'text-warning'
  return 'text-muted'
}

/**
 * @param {{ id: string; label: string }[]} filterItems
 * @param {Record<string, number>} scopeCounts
 * @param {{ conflicts: number; trashed: number }} globalCounts
 * @param {string} filterId
 * @returns {number}
 */
export function photoFilterCount(filterItems, scopeCounts, globalCounts, filterId) {
  return countForFilter(scopeCounts, filterId, globalCounts)
}

/**
 * @param {{ id: string; label: string }[]} filterItems
 * @param {Record<string, number>} scopeCounts
 * @param {{ conflicts: number; trashed: number }} globalCounts
 * @returns {{ id: string; label: string; count: number }[]}
 */
export function visiblePhotoFilterItems(filterItems, scopeCounts, globalCounts) {
  return filterItems
    .map((item) => ({
      ...item,
      count: countForFilter(scopeCounts, item.id, globalCounts),
    }))
    .filter((item) => {
      if (item.id === PHOTO_FILTER.CONFLICTS && item.count === 0) return false
      if (item.id === PHOTO_FILTER.UNREVIEWED && item.count === 0) return false
      return true
    })
}

/**
 * @param {{ id: string; label: string }[]} filterItems
 * @param {string} activeFilter
 * @returns {string}
 */
export function activePhotoFilterLabel(filterItems, activeFilter) {
  const match = filterItems.find((item) => item.id === activeFilter)
  return match?.label ?? 'All'
}
