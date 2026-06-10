import PropTypes from 'prop-types'

const fabClass =
  'pointer-events-auto flex h-14 w-14 min-h-14 min-w-14 items-center justify-center rounded-full border-0 bg-primary text-primary-content shadow-floating transition-[background-color,transform] duration-150 ease-out hover:bg-[#222222] active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40'

/**
 * Fixed upload FAB — stays visible while the grid scrolls.
 */
export default function ProjectGridOverlays({ onAddPhotos, isUploading = false }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[220] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-none relative mx-auto flex max-w-[1400px] justify-end px-4 md:px-6 lg:px-8">
        <button
          type="button"
          className={fabClass}
          aria-label="Add photos"
          aria-busy={isUploading}
          disabled={isUploading}
          onClick={onAddPhotos}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  )
}

ProjectGridOverlays.propTypes = {
  onAddPhotos: PropTypes.func.isRequired,
  isUploading: PropTypes.bool,
}
