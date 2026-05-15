import PropTypes from 'prop-types'

/**
 * Fixed overlays: collaborator pill + add-photos FAB stay visible while the grid scrolls.
 *
 * @param {{ collaboratingLabel: string; onAddPhotos: () => void; isUploading?: boolean; showAddPhotos?: boolean }} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectGridOverlays({
  collaboratingLabel,
  onAddPhotos,
  isUploading = false,
  showAddPhotos = true,
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[220] pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:pr-[min(300px,100vw)]">
      <div className="pointer-events-none relative mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8">
        <p className="pointer-events-auto mx-auto mb-16 flex w-fit max-w-[min(100%,20rem)] items-center justify-center gap-2 rounded-full border-[1.5px] border-base-300 bg-base-100 px-5 py-2 text-center font-base text-xs font-semibold uppercase tracking-[0.06em] text-muted shadow-card">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
          {collaboratingLabel}
        </p>
        {showAddPhotos ? (
          <button
            type="button"
            className="pointer-events-auto absolute bottom-0 right-4 flex h-14 w-14 min-h-14 min-w-14 items-center justify-center rounded-full border-0 bg-primary text-primary-content shadow-floating transition-[background-color,transform] duration-150 ease-out hover:bg-[#222222] active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 md:right-6 lg:right-8"
            aria-label="Add photos"
            aria-busy={isUploading}
            disabled={isUploading}
            onClick={onAddPhotos}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  )
}

ProjectGridOverlays.propTypes = {
  collaboratingLabel: PropTypes.string.isRequired,
  onAddPhotos: PropTypes.func.isRequired,
  isUploading: PropTypes.bool,
  showAddPhotos: PropTypes.bool,
}
