import PropTypes from 'prop-types'
import ProjectCard from './ProjectCard'
import { useLazyRandomProjectCover } from '@/hooks/useLazyRandomProjectCover.js'

/**
 * Dashboard project tile: uses explicit banner photo/url when set; otherwise fetches
 * a random ready preview photo id once the card enters the viewport.
 */
export default function LazyCoverProjectCard({
  projectId,
  authToken = '',
  explicitCoverPhotoId = '',
  explicitCoverImageUrl = '',
  name,
  status,
  subtitle,
  animationDelay = 0,
}) {
  const hasExplicitPhoto =
    typeof explicitCoverPhotoId === 'string' &&
    explicitCoverPhotoId.length > 0 &&
    typeof authToken === 'string' &&
    authToken.length > 0
  const legacyUrl =
    typeof explicitCoverImageUrl === 'string' && explicitCoverImageUrl.length > 0
      ? explicitCoverImageUrl
      : ''
  const skipLazy = hasExplicitPhoto || legacyUrl.length > 0

  const { coverPhotoId, rootRef } = useLazyRandomProjectCover({
    projectId,
    authToken,
    skip: skipLazy,
  })

  const effectiveCoverPhotoId = hasExplicitPhoto ? explicitCoverPhotoId : coverPhotoId || ''
  const effectiveCoverUrl = hasExplicitPhoto ? '' : legacyUrl

  return (
    <div ref={rootRef} className="block h-full min-h-0">
      <ProjectCard
        name={name}
        status={status}
        subtitle={subtitle}
        coverPhotoId={effectiveCoverPhotoId}
        authToken={authToken}
        coverImageUrl={effectiveCoverUrl}
        animationDelay={animationDelay}
      />
    </div>
  )
}

LazyCoverProjectCard.propTypes = {
  projectId: PropTypes.string.isRequired,
  authToken: PropTypes.string,
  explicitCoverPhotoId: PropTypes.string,
  explicitCoverImageUrl: PropTypes.string,
  name: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  animationDelay: PropTypes.number,
}
