/** Heart + reject badges — matches ProjectPhotoTile / PhotoViewerReviewControls. */
export function AuthLikedBadge({ className = '' }) {
  return (
    <span
      className={`absolute right-1 top-1 z-[2] flex h-6 w-6 items-center justify-center rounded-full bg-accent text-primary-content shadow-card md:right-2 md:top-2 md:h-7 md:w-7 ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width="12" height="12" className="md:h-[14px] md:w-[14px]" fill="currentColor" aria-hidden>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </span>
  )
}

export function AuthRejectedBadge({ className = '' }) {
  return (
    <span
      className={`absolute right-1 top-1 z-[2] flex h-6 w-6 items-center justify-center rounded-full bg-error text-primary-content shadow-card md:right-2 md:top-2 md:h-7 md:w-7 ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width="11" height="11" className="md:h-3 md:w-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      </svg>
    </span>
  )
}
