import PropTypes from 'prop-types'
import { viewerChromeBorderClass } from '@/features/photo-viewer/viewerChromeStyles.js'

const voteBtnBase = `flex h-12 min-h-[48px] w-12 min-w-[48px] items-center justify-center rounded-pill ${viewerChromeBorderClass} transition-[color,background-color,border-color,transform] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.96]`

/**
 * Like and reject controls for the photo viewer.
 */
export default function PhotoViewerReviewControls({
  isLiked,
  isRejected,
  onLike,
  onReject,
  canReviewPhotos,
}) {
  if (!canReviewPhotos) {
    return (
      <p className="mx-auto mb-1 max-w-lg rounded-full border-[1.5px] border-accent/45 bg-accent/15 px-5 py-3 text-center font-base text-sm font-medium leading-snug text-accent">
        View-only — favorites and rename are disabled for your role on this project.
      </p>
    )
  }

  return (
    <div className="flex w-full items-center justify-start gap-2">
      <button
        type="button"
        onClick={onLike}
        className={`${voteBtnBase} ${
          isLiked
            ? 'border-accent bg-accent/25 text-accent'
            : 'border-white/15 bg-white/[0.06] text-white/45 hover:border-accent/50 hover:text-accent'
        }`}
        aria-label="Favorite — keyboard: Up arrow"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onReject}
        className={`${voteBtnBase} ${
          isRejected
            ? 'border-error/80 bg-error/20 text-error'
            : 'border-white/15 bg-white/[0.06] text-white/45 hover:border-error/50 hover:text-error'
        }`}
        aria-label="Reject — keyboard: Down arrow"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

PhotoViewerReviewControls.propTypes = {
  isLiked: PropTypes.bool.isRequired,
  isRejected: PropTypes.bool.isRequired,
  onLike: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  canReviewPhotos: PropTypes.bool.isRequired,
}
