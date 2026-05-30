import PropTypes from 'prop-types'
import {
  buildPhotoFilterMenu,
  visiblePhotoFilterItems,
  photoFilterCountToneClass,
} from './photoFilterMenu.js'

/**
 * Desktop filter pills.
 * @param {{
 *   reviewScope: string;
 *   canReviewPhotos?: boolean;
 *   filterCounts: object;
 *   activeFilter: string;
 *   onFilterChange: (id: string) => void;
 * }} props
 */
export default function ProjectFilterPills({
  reviewScope,
  canReviewPhotos = true,
  filterCounts,
  activeFilter,
  onFilterChange,
}) {
  const { filterItems, scopeCounts, globalCounts } = buildPhotoFilterMenu(
    reviewScope,
    canReviewPhotos,
    filterCounts
  )
  const visibleItems = visiblePhotoFilterItems(filterItems, scopeCounts, globalCounts)

  return (
    <div
      className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto scroll-smooth rounded-full border-[1.5px] border-base-300 bg-base-200/60 p-1 [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Photo filters"
    >
      {visibleItems.map((item) => {
        const isActive = activeFilter === item.id
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] px-4 font-base text-sm font-medium transition-[background-color,color,border-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:shadow-focus ${
              isActive
                ? 'border-base-300 bg-base-100 text-base-content shadow-card'
                : 'cursor-pointer border-transparent bg-transparent text-muted hover:text-base-content'
            }`}
            onClick={() => onFilterChange(item.id)}
          >
            <span>{item.label}</span>
            <span className={`font-semibold ${photoFilterCountToneClass(item.id)}`}>{item.count}</span>
          </button>
        )
      })}
    </div>
  )
}

ProjectFilterPills.propTypes = {
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
