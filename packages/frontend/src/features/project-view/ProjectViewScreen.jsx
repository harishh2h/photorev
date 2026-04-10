import { useMemo, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import ProjectViewToolbar from './ProjectViewToolbar.jsx'
import ProjectPhotoGrid from './ProjectPhotoGrid.jsx'
import ProjectViewSidebar from './ProjectViewSidebar.jsx'
import ProjectGridOverlays from './ProjectGridOverlays.jsx'

/**
 * @param {{ data: object; token: string }} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectViewScreen({ data, token }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const filteredPhotos = useMemo(() => {
    if (activeFilter === 'all') return data.photos
    if (activeFilter === 'liked') return data.photos.filter((p) => p.isLiked)
    if (activeFilter === 'rejected') return data.photos.filter((p) => p.isRejected)
    return data.photos.filter((p) => p.hasConflict)
  }, [activeFilter, data.photos])
  const handleFinalize = useCallback(() => {}, [])
  const handleShare = useCallback(() => {}, [])
  const handleSettings = useCallback(() => {}, [])
  const handleAddPhotos = useCallback(() => {}, [])
  return (
    <div className="lg:pr-[min(300px,100vw)]">
      <ProjectViewToolbar
        projectTitle={data.projectTitle}
        filterCounts={data.filterCounts}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      <div className="flex flex-col gap-6 pb-20 pt-4 lg:block lg:pb-20">
        <div className="min-w-0">
          <div className="relative pb-16">
            {filteredPhotos.length > 0 ? (
              <ProjectPhotoGrid photos={filteredPhotos} token={token} />
            ) : (
              <p className="m-0 rounded-card border-[1.5px] border-dashed border-base-300 bg-base-100 px-4 py-10 text-center font-base text-base text-muted">
                No photos match this filter.
              </p>
            )}
            <ProjectGridOverlays collaboratingLabel={data.collaboratingLabel} onAddPhotos={handleAddPhotos} />
          </div>
        </div>
        <ProjectViewSidebar
          likedCount={data.likedCount}
          likedWithNames={data.likedWithNames}
          reviewProgressPercent={data.reviewProgressPercent}
          collaboratorMembers={data.collaboratorMembers}
          onFinalize={handleFinalize}
          onShare={handleShare}
          onSettings={handleSettings}
        />
      </div>
    </div>
  )
}

const photoShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  isLiked: PropTypes.bool.isRequired,
  isRejected: PropTypes.bool.isRequired,
  hasConflict: PropTypes.bool.isRequired,
  selectionLabel: PropTypes.string,
})

const collaboratorMemberShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  initial: PropTypes.string.isRequired,
})

ProjectViewScreen.propTypes = {
  token: PropTypes.string.isRequired,
  data: PropTypes.shape({
    projectTitle: PropTypes.string.isRequired,
    collaboratingLabel: PropTypes.string.isRequired,
    likedCount: PropTypes.number.isRequired,
    likedWithNames: PropTypes.string.isRequired,
    reviewProgressPercent: PropTypes.number.isRequired,
    collaboratorMembers: PropTypes.arrayOf(collaboratorMemberShape).isRequired,
    filterCounts: PropTypes.shape({
      all: PropTypes.number.isRequired,
      liked: PropTypes.number.isRequired,
      rejected: PropTypes.number.isRequired,
      conflicts: PropTypes.number.isRequired,
    }).isRequired,
    photos: PropTypes.arrayOf(photoShape).isRequired,
  }).isRequired,
}
