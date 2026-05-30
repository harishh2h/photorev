import PropTypes from 'prop-types'
import ProjectCard from './ProjectCard'
import { useLazyProjectCardMeta } from '@/hooks/useLazyProjectCardMeta.js'

/**
 * Dashboard project tile: lazy cover + review stats when the card enters the viewport.
 */
export default function LazyCoverProjectCard({
  projectId,
  authToken = '',
  explicitCoverPhotoId = '',
  explicitCoverImageUrl = '',
  name,
  subtitle,
  animationDelay = 0,
  coverContentVariant = 'thumbnail',
  ownershipBadge = '',
  isCreator = true,
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
  const skipCover = hasExplicitPhoto || legacyUrl.length > 0

  const { coverPhotoId, reviewStats, rootRef } = useLazyProjectCardMeta({
    projectId,
    authToken,
    isCreator,
    skipCover,
  })

  const effectiveCoverPhotoId = hasExplicitPhoto ? explicitCoverPhotoId : coverPhotoId || ''
  const effectiveCoverUrl = hasExplicitPhoto ? '' : legacyUrl

  return (
    <div ref={rootRef} className="block h-full min-h-0">
      <ProjectCard
        name={name}
        subtitle={subtitle}
        coverPhotoId={effectiveCoverPhotoId}
        authToken={authToken}
        coverImageUrl={effectiveCoverUrl}
        animationDelay={animationDelay}
        coverContentVariant={coverContentVariant}
        ownershipBadge={ownershipBadge}
        reviewStats={reviewStats}
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
  subtitle: PropTypes.string.isRequired,
  animationDelay: PropTypes.number,
  coverContentVariant: PropTypes.oneOf(['thumbnail', 'preview', 'original']),
  ownershipBadge: PropTypes.string,
  isCreator: PropTypes.bool,
}
