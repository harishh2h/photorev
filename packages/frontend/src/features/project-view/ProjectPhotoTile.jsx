import { memo, useCallback } from 'react'
import PropTypes from 'prop-types'
import ProjectPhotoImage from './ProjectPhotoImage.jsx'
import { PhotoSelectCheckbox } from '@/components/photo-grid/index.js'
import { useLongPress } from '@/hooks/useLongPress.js'
import { REVIEW_SCOPE } from '@/utils/projectReviewFilters.js'
import {
  GRID_TILE_HOVER_IMAGE_CLASS,
  GRID_TILE_PLACEHOLDER_BG,
  GRID_TILE_ROOT_CLASS,
  GRID_TILE_SHELL_BUTTON_CLASS,
} from '@/components/photo-grid/gridPhotoTileStyles.js'

function ConflictBadge({ conflictState }) {
  if (conflictState === 'pending_owner') {
    return (
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full bg-error/95 text-primary-content shadow-card"
        aria-label="Conflict — owner decision needed"
        title="Owner decision needed"
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M12 4v8M12 16h.01" />
        </svg>
      </span>
    )
  }
  if (conflictState === 'resolved_owner') {
    return (
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-primary-content shadow-card"
        aria-label="Resolved split — owner decided"
        title="Resolved by owner"
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.8" aria-hidden>
          <path d="M5 12l5 5L20 7" />
        </svg>
      </span>
    )
  }
  if (conflictState === 'resolved_majority') {
    return (
      <span
        className="flex h-7 w-7 min-w-7 items-center justify-center rounded-full bg-accent/90 px-1.5 font-base text-[0.625rem] font-bold uppercase tracking-wide text-primary-content shadow-card"
        aria-label="Resolved split — majority decided"
        title="Resolved by majority"
      >
        Maj
      </span>
    )
  }
  return null
}

/**
 * @param {{ photo: object; token: string; onOpenPhoto: (photoId: string) => void; reviewScope?: string; canReviewPhotos?: boolean; enableSelection?: boolean; selectionActive?: boolean; isSelected?: boolean; photoIndex?: number; onPhotoClick?: (photoId: string, index: number, event: import('react').MouseEvent) => boolean; onCheckboxPress?: (photoId: string, index: number) => void; onLongPressSelect?: (photoId: string, index: number) => void; animationDelay?: string; as?: 'li' | 'div'; layoutSlot?: { width: number; height: number } }} props
 */
function ProjectPhotoTile({
  photo,
  token,
  onOpenPhoto,
  reviewScope = REVIEW_SCOPE.MINE,
  canReviewPhotos = true,
  enableSelection = true,
  selectionActive = false,
  isSelected = false,
  photoIndex = 0,
  onPhotoClick,
  onCheckboxPress,
  onLongPressSelect,
  animationDelay = '0ms',
  as: Tag = 'li',
  layoutSlot,
}) {
  const handleLongPress = useCallback(() => {
    onLongPressSelect?.(photo.id, photoIndex)
  }, [onLongPressSelect, photo.id, photoIndex])

  const longPress = useLongPress(handleLongPress)

  const handleTileClick = (event) => {
    if (enableSelection && onPhotoClick?.(photo.id, photoIndex, event)) {
      return
    }
    onOpenPhoto(photo.id)
  }

  const tileAriaLabel = selectionActive
    ? `${isSelected ? 'Deselect' : 'Select'} ${photo.alt || 'photo'}`
    : `Open ${photo.alt || 'photo'} fullscreen`

  const selectionCheckbox =
    enableSelection ? (
      <PhotoSelectCheckbox
        checked={isSelected}
        visible={selectionActive || isSelected}
        label={photo.alt || 'photo'}
        onToggle={() => onCheckboxPress?.(photo.id, photoIndex)}
      />
    ) : null

  const selectedRingClass =
    selectionActive && isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-base-100' : ''
  const showScopeBadges = canReviewPhotos
  const useTeamScope = reviewScope === REVIEW_SCOPE.TEAM
  const showLiked = showScopeBadges && (useTeamScope ? photo.teamIsLiked : photo.myIsLiked)
  const showRejected = showScopeBadges && (useTeamScope ? photo.teamIsRejected : photo.myIsRejected)
  const dimRejected = showScopeBadges && showRejected

  if (layoutSlot) {
    return (
      <Tag
        className="animate-fade-up motion-reduce:animate-none h-full w-full"
        style={{ animationDelay }}
      >
        <div
          className={`${GRID_TILE_ROOT_CLASS} ${dimRejected ? 'border-muted/55 opacity-90' : ''} ${selectedRingClass}`}
        >
          <button
            type="button"
            className={`${GRID_TILE_SHELL_BUTTON_CLASS} ${GRID_TILE_PLACEHOLDER_BG} ${
              dimRejected ? 'after:pointer-events-none after:absolute after:inset-0 after:bg-muted/30' : ''
            } focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base-100`}
            onClick={handleTileClick}
            onClickCapture={longPress.onClickCapture}
            onPointerDown={longPress.onPointerDown}
            onPointerUp={longPress.onPointerUp}
            onPointerLeave={longPress.onPointerLeave}
            onPointerCancel={longPress.onPointerCancel}
            aria-label={tileAriaLabel}
          >
            {selectionCheckbox}
            <ProjectPhotoImage
              photoId={photo.id}
              token={token}
              alt={photo.alt}
              status={photo.status}
              blurhash={photo.blurhash}
              fillSlot
              className={`${GRID_TILE_HOVER_IMAGE_CLASS} ${
                dimRejected ? 'opacity-70 grayscale group-hover:opacity-[0.82]' : ''
              }`}
            />
            {showScopeBadges ? (
              <div className="absolute right-2 top-2 z-[1] flex flex-col items-end gap-2">
                {showLiked ? (
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-primary-content shadow-card"
                    aria-label={useTeamScope ? 'Team liked' : 'Liked by you'}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </span>
                ) : null}
                {showRejected ? (
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-error text-primary-content shadow-card"
                    aria-label={useTeamScope ? 'Team rejected' : 'Rejected by you'}
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </span>
                ) : null}
                {photo.hasConflict ? <ConflictBadge conflictState={photo.conflictState} /> : null}
              </div>
            ) : null}
          </button>
          {photo.selectionLabel ? (
            <div className="pointer-events-none absolute bottom-2 left-2 z-[1] inline-flex max-w-[calc(100%-1rem)] items-center gap-2 rounded-full bg-black/70 px-3 py-2 font-base text-xs font-semibold text-primary-content backdrop-blur-md">
              <span className="flex text-accent-mid" aria-hidden>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </span>
              {photo.selectionLabel}
            </div>
          ) : null}
        </div>
      </Tag>
    )
  }

  return (
    <Tag className="animate-fade-up motion-reduce:animate-none" style={{ animationDelay }}>
      <article
        className={`group relative overflow-hidden rounded-sm border-[1.5px] bg-base-100 text-left shadow-card transition-[transform,box-shadow] duration-[380ms] ease-out hover:-translate-y-1 hover:shadow-card-hover ${
          dimRejected ? 'border-muted/55' : 'border-base-300'
        } ${selectedRingClass}`}
      >
        <button
          type="button"
          className={`relative flex aspect-[3/4] w-full cursor-pointer overflow-hidden border-0 bg-[#EDF7F2] bg-[radial-gradient(circle_at_1px_1px,rgba(110,231,183,0.45)_1px,transparent_0)] bg-[length:14px_14px] p-0 text-left outline-none transition-[transform] duration-[380ms] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 ${
            dimRejected ? 'bg-base-300 bg-none after:pointer-events-none after:absolute after:inset-0 after:bg-muted/30' : ''
          }`}
          onClick={handleTileClick}
          onClickCapture={longPress.onClickCapture}
          onPointerDown={longPress.onPointerDown}
          onPointerUp={longPress.onPointerUp}
          onPointerLeave={longPress.onPointerLeave}
          onPointerCancel={longPress.onPointerCancel}
          aria-label={tileAriaLabel}
        >
          {selectionCheckbox}
          <ProjectPhotoImage
            photoId={photo.id}
            token={token}
            alt={photo.alt}
            status={photo.status}
            blurhash={photo.blurhash}
            fillSlot={false}
            className={`${GRID_TILE_HOVER_IMAGE_CLASS} ${
              dimRejected ? 'opacity-70 grayscale group-hover:opacity-[0.82]' : ''
            }`}
          />
          {showScopeBadges ? (
            <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
              {showLiked ? (
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-primary-content shadow-card"
                  aria-label={useTeamScope ? 'Team liked' : 'Liked by you'}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </span>
              ) : null}
              {showRejected ? (
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-error text-primary-content shadow-card"
                  aria-label={useTeamScope ? 'Team rejected' : 'Rejected by you'}
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </span>
              ) : null}
              {photo.hasConflict ? <ConflictBadge conflictState={photo.conflictState} /> : null}
            </div>
          ) : null}
        </button>
        {photo.selectionLabel ? (
          <div className="absolute bottom-3 left-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full bg-black/70 px-3 py-2 font-base text-xs font-semibold text-primary-content backdrop-blur-md">
            <span className="flex text-accent-mid" aria-hidden>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </span>
            {photo.selectionLabel}
          </div>
        ) : null}
      </article>
    </Tag>
  )
}

ProjectPhotoTile.propTypes = {
  token: PropTypes.string.isRequired,
  onOpenPhoto: PropTypes.func.isRequired,
  reviewScope: PropTypes.oneOf([REVIEW_SCOPE.MINE, REVIEW_SCOPE.TEAM]),
  canReviewPhotos: PropTypes.bool,
  enableSelection: PropTypes.bool,
  selectionActive: PropTypes.bool,
  isSelected: PropTypes.bool,
  photoIndex: PropTypes.number,
  onPhotoClick: PropTypes.func,
  onCheckboxPress: PropTypes.func,
  onLongPressSelect: PropTypes.func,
  animationDelay: PropTypes.string,
  as: PropTypes.oneOf(['li', 'div']),
  layoutSlot: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }),
  photo: PropTypes.shape({
    id: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['pending', 'ready', 'failed', 'trashed']),
    width: PropTypes.number,
    height: PropTypes.number,
    blurhash: PropTypes.string,
    myIsLiked: PropTypes.bool,
    myIsRejected: PropTypes.bool,
    teamIsLiked: PropTypes.bool,
    teamIsRejected: PropTypes.bool,
    hasConflict: PropTypes.bool,
    conflictState: PropTypes.string,
    selectionLabel: PropTypes.string,
  }).isRequired,
}

export default memo(ProjectPhotoTile)
