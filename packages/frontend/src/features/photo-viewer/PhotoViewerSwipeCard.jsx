import PropTypes from 'prop-types'
import { usePhotoViewerGestures } from '@/features/photo-viewer/usePhotoViewerGestures.js'

const overlayBaseClass =
  'pointer-events-none absolute inset-0 flex items-center justify-center rounded-card transition-[opacity,transform] duration-200 ease-out'

/**
 * Mobile-only swipe card wrapper with drag feedback and vote overlays.
 */
export default function PhotoViewerSwipeCard({
  children,
  enabled,
  canVote,
  isSaving,
  hasNext,
  hasPrev,
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
    dragOpacity,
    overlayStrength,
    snapBackMs,
    exitAnimationMs,
    easeOut,
    handlers,
  } = usePhotoViewerGestures({
    onLikeAndNext,
    onRejectAndNext,
    goNext,
    goPrev,
    enabled,
    canVote,
    isSaving,
    hasNext,
    hasPrev,
  })

  const showLikeOverlay = intent === 'like'
  const showRejectOverlay = intent === 'reject'
  const showNextOverlay = intent === 'next'
  const showPrevOverlay = intent === 'prev'

  const transform = isDragging || isExiting
    ? `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${rotation}deg)`
    : 'translate3d(0, 0, 0) rotate(0deg)'

  const transition = isExiting
    ? `transform ${exitAnimationMs}ms ${easeOut}, opacity ${exitAnimationMs}ms ${easeOut}`
    : isDragging
      ? 'none'
      : `transform ${snapBackMs}ms ${easeOut}, opacity ${snapBackMs}ms ${easeOut}`

  const overlayOpacity = Math.min(1, 0.25 + overlayStrength * 0.75)

  return (
    <div
      className="relative flex h-full min-h-0 w-full max-w-full touch-none select-none items-center justify-center"
      style={{ touchAction: 'none' }}
      {...handlers}
    >
      <div
        className="relative flex h-full min-h-0 w-full max-h-full min-w-0 items-center justify-center will-change-transform motion-reduce:transition-none"
        style={{
          transform,
          opacity: dragOpacity,
          transition,
        }}
      >
        {children}

        {canVote && showLikeOverlay ? (
          <div
            className={`${overlayBaseClass} border-[1.5px] border-accent/60 bg-accent/20`}
            style={{ opacity: overlayOpacity }}
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
            style={{ opacity: overlayOpacity }}
            aria-hidden
          >
            <span className="rounded-pill border-[1.5px] border-error/70 bg-error/20 px-5 py-2 font-base text-lg font-semibold uppercase tracking-wide text-error">
              Reject
            </span>
          </div>
        ) : null}

        {showNextOverlay ? (
          <div
            className={`${overlayBaseClass} bg-gradient-to-b from-black/50 to-transparent`}
            style={{ opacity: overlayOpacity }}
            aria-hidden
          >
            <span className="mt-auto mb-8 rounded-pill border-[1.5px] border-white/30 bg-white/10 px-5 py-2 font-base text-sm font-semibold uppercase tracking-wide text-white">
              Next photo
            </span>
          </div>
        ) : null}

        {showPrevOverlay ? (
          <div
            className={`${overlayBaseClass} bg-gradient-to-t from-black/50 to-transparent`}
            style={{ opacity: overlayOpacity }}
            aria-hidden
          >
            <span className="mb-auto mt-8 rounded-pill border-[1.5px] border-white/30 bg-white/10 px-5 py-2 font-base text-sm font-semibold uppercase tracking-wide text-white">
              Previous
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
  hasNext: PropTypes.bool,
  hasPrev: PropTypes.bool,
  onLikeAndNext: PropTypes.func.isRequired,
  onRejectAndNext: PropTypes.func.isRequired,
  goNext: PropTypes.func.isRequired,
  goPrev: PropTypes.func.isRequired,
}
