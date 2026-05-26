import PropTypes from 'prop-types'

const navBtnClass =
  'inline-flex h-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-pill border-[1.5px] border-white/15 bg-white/[0.04] text-white/70 transition-[opacity,color,background-color,border-color,transform] duration-150 hover:border-white/30 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-40'

/**
 * Mobile prev/next navigation fallback for the photo viewer.
 */
export default function PhotoViewerMobileNav({
  index,
  total,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
  disabled = false,
}) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canGoPrev || disabled}
        className={navBtnClass}
        aria-label="Previous photo"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M15 6L9 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <span className="font-base text-xs tabular-nums text-white/55" aria-live="polite">
        {index + 1} / {total}
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext || disabled}
        className={navBtnClass}
        aria-label="Next photo"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}

PhotoViewerMobileNav.propTypes = {
  index: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  canGoPrev: PropTypes.bool.isRequired,
  canGoNext: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
}
