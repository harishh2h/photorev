import PropTypes from 'prop-types'
import ProjectFilterPills from './ProjectFilterPills.jsx'
import ProjectFilterDropdown from './ProjectFilterDropdown.jsx'

/**
 * Filter row: desktop pills; mobile filter dropdown.
 * @param {{
 *   reviewScope: string;
 *   filterCounts: object;
 *   activeFilter: string;
 *   onFilterChange: (id: string) => void;
 *   canReviewPhotos?: boolean;
 * }} props
 */
export default function ProjectFilterBar({
  reviewScope,
  filterCounts,
  activeFilter,
  onFilterChange,
  canReviewPhotos = true,
}) {
  if (!canReviewPhotos) return null

  return (
    <div className="border-b-[1.5px] border-base-300 py-3 md:flex md:items-center md:gap-4 md:py-4">
      <ProjectFilterPills
        reviewScope={reviewScope}
        canReviewPhotos={canReviewPhotos}
        filterCounts={filterCounts}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />
      <ProjectFilterDropdown
        reviewScope={reviewScope}
        canReviewPhotos={canReviewPhotos}
        filterCounts={filterCounts}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />
    </div>
  )
}

ProjectFilterBar.propTypes = {
  reviewScope: PropTypes.string.isRequired,
  filterCounts: PropTypes.object.isRequired,
  activeFilter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  canReviewPhotos: PropTypes.bool,
}
