import PropTypes from 'prop-types'
import ProjectPhotoTile from './ProjectPhotoTile.jsx'
import { REVIEW_SCOPE } from '@/utils/projectReviewFilters.js'

const STAGGER_CAP_MS = 700
const STAGGER_STEP_MS = 70
const STAGGER_MAX_INDEX = 50

function staggerDelay(index, total) {
  if (total > STAGGER_MAX_INDEX) return '0ms'
  return `${Math.min(index * STAGGER_STEP_MS, STAGGER_CAP_MS)}ms`
}

/**
 * @param {{ photos: object[]; token: string; onOpenPhoto: (photoId: string) => void; reviewScope?: string; canReviewPhotos?: boolean }} props
 */
export default function ProjectPhotoGrid({
  photos,
  token,
  onOpenPhoto,
  reviewScope = REVIEW_SCOPE.MINE,
  canReviewPhotos = true,
}) {
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 min-[480px]:grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
      {photos.map((photo, index) => (
        <ProjectPhotoTile
          key={photo.id}
          photo={photo}
          token={token}
          onOpenPhoto={onOpenPhoto}
          reviewScope={reviewScope}
          canReviewPhotos={canReviewPhotos}
          animationDelay={staggerDelay(index, photos.length)}
        />
      ))}
    </ul>
  )
}

ProjectPhotoGrid.propTypes = {
  token: PropTypes.string.isRequired,
  onOpenPhoto: PropTypes.func.isRequired,
  reviewScope: PropTypes.oneOf([REVIEW_SCOPE.MINE, REVIEW_SCOPE.TEAM]),
  canReviewPhotos: PropTypes.bool,
  photos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      alt: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['pending', 'ready', 'failed', 'trashed']),
      blurhash: PropTypes.string,
      myIsLiked: PropTypes.bool,
      myIsRejected: PropTypes.bool,
      teamIsLiked: PropTypes.bool,
      teamIsRejected: PropTypes.bool,
      hasConflict: PropTypes.bool,
      conflictState: PropTypes.string,
      selectionLabel: PropTypes.string,
    }),
  ).isRequired,
}
