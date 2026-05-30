import { useState } from 'react'
import PropTypes from 'prop-types'
import { AppBottomSheet } from '@/components/ui/index.js'
import {
  buildPhotoFilterMenu,
  visiblePhotoFilterItems,
  activePhotoFilterLabel,
  photoFilterCountToneClass,
  photoFilterCount,
} from './photoFilterMenu.js'

/**
 * Mobile-only filter control: trigger + bottom sheet list.
 * @param {{
 *   reviewScope: string;
 *   canReviewPhotos?: boolean;
 *   filterCounts: object;
 *   activeFilter: string;
 *   onFilterChange: (id: string) => void;
 * }} props
 */
export default function ProjectFilterDropdown({
  reviewScope,
  canReviewPhotos = true,
  filterCounts,
  activeFilter,
  onFilterChange,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const { filterItems, scopeCounts, globalCounts } = buildPhotoFilterMenu(
    reviewScope,
    canReviewPhotos,
    filterCounts
  )
  const visibleItems = visiblePhotoFilterItems(filterItems, scopeCounts, globalCounts)
  const activeLabel = activePhotoFilterLabel(filterItems, activeFilter)
  const activeCount = photoFilterCount(filterItems, scopeCounts, globalCounts, activeFilter)
  const activeCountClass = photoFilterCountToneClass(activeFilter)

  const handleSelect = (filterId) => {
    onFilterChange(filterId)
    setIsOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-full border-[1.5px] border-base-300 bg-base-100 px-4 font-base text-sm font-medium text-base-content transition-[border-color,background-color,box-shadow] duration-150 ease-out hover:border-accent-mid hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-focus md:hidden"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <span className="truncate">{activeLabel}</span>
        <span className="inline-flex items-center gap-2">
          <span className={`font-semibold ${activeCountClass}`}>{activeCount}</span>
          <span className="flex text-muted" aria-hidden>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </span>
      </button>
      <AppBottomSheet open={isOpen} onClose={() => setIsOpen(false)} title="Filter photos" ariaLabel="Filter photos">
        <ul className="m-0 list-none p-0" role="listbox" aria-label="Photo filters">
          {visibleItems.map((item) => {
            const isActive = activeFilter === item.id
            return (
              <li key={item.id} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left font-base text-base transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:shadow-focus ${
                    isActive ? 'bg-accent/10 text-base-content' : 'text-base-content hover:bg-base-200'
                  }`}
                  onClick={() => handleSelect(item.id)}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className={`font-semibold ${photoFilterCountToneClass(item.id)}`}>{item.count}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </AppBottomSheet>
    </>
  )
}

ProjectFilterDropdown.propTypes = {
  reviewScope: PropTypes.string.isRequired,
  canReviewPhotos: PropTypes.bool,
  filterCounts: PropTypes.shape({
    mine: PropTypes.object.isRequired,
    team: PropTypes.object.isRequired,
    conflicts: PropTypes.number.isRequired,
    trashed: PropTypes.number,
  }).isRequired,
  activeFilter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
}
