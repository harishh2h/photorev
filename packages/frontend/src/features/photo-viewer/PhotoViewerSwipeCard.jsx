import PropTypes from 'prop-types'
import { usePhotoViewerGestures } from '@/features/photo-viewer/usePhotoViewerGestures.js'

const overlayBaseClass =
  'pointer-events-none absolute inset-0 flex items-center justify-center rounded-card transition-opacity duration-150'

/**
 * Mobile-only swipe card wrapper with drag feedback and vote overlays.
 */
export default function PhotoViewerSwipeCard({
  children,
  enabled,
  canVote,
  isSaving,
  onLikeAndNext,
  onRejectAndNext,
  goNext,
  goPrev,
}) {
  const {
    offsetX,
    offsetY,
    rotation,
    intent,
    isDragging,
    isExiting,
    handlers,
  } = usePhotoViewerGestures({
    onLikeAndNext,
    onRejectAndNext,
    goNext,
    goPrev,
    enabled,
    canVote,
    isSaving,
  })

  const showLikeOverlay = intent === 'like'
  const showRejectOverlay = intent === 'reject'

  const transform = isDragging || isExiting
    ? `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${rotation}deg)`
    : 'translate3d(0, 0, 0) rotate(0deg)'

  return (
    <div
      className="relative flex h-full w-full max-w-full touch-none select-none items-center justify-center"
      style={{ touchAction: 'none' }}
      {...handlers}
    >
      <div
        className="relative flex max-h-full w-full items-center justify-center will-change-transform"
        style={{
          transform,
          transition: isExiting
            ? 'transform 260ms cubic-bezier(0, 0, 0.2, 1)'
            : isDragging
              ? 'none'
              : 'transform 250ms cubic-bezier(0, 0, 0.2, 1)',
        }}
      >
        {children}

        {canVote && showLikeOverlay ? (
          <div
            className={`${overlayBaseClass} border-[1.5px] border-accent/60 bg-accent/20`}
            aria-hidden
          >
            <span className="rounded-pill border-[1.5px] border-accent bg-accent/25 px-5 py-2 font-base text-lg font-semibold uppercase tracking-wide text-accent">
              Like
            </span>
          </div>
        ) : null}

        {canVote && showRejectOverlay ? (
          <div
            className={`${overlayBaseClass} border-[1.5px] border-error/60 bg-error/15`}
            aria-hidden
          >
            <span className="rounded-pill border-[1.5px] border-error/70 bg-error/20 px-5 py-2 font-base text-lg font-semibold uppercase tracking-wide text-error">
              Reject
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

PhotoViewerSwipeCard.propTypes = {
  children: PropTypes.node.isRequired,
  enabled: PropTypes.bool.isRequired,
  canVote: PropTypes.bool.isRequired,
  isSaving: PropTypes.bool.isRequired,
  onLikeAndNext: PropTypes.func.isRequired,
  onRejectAndNext: PropTypes.func.isRequired,
  goNext: PropTypes.func.isRequired,
  goPrev: PropTypes.func.isRequired,
}
