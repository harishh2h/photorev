import PropTypes from 'prop-types'

/**
 * @param {{ collaboratingLabel: string; onAddPhotos: () => void }} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectGridOverlays({ collaboratingLabel, onAddPhotos }) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-0 right-0 z-raised flex items-center justify-center">
      <p className="pointer-events-auto m-0 inline-flex items-center gap-2 rounded-full border-[1.5px] border-base-300 bg-base-100 px-5 py-2 font-base text-xs font-semibold uppercase tracking-[0.06em] text-muted shadow-card">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
        {collaboratingLabel}
      </p>
      <button
        type="button"
        className="pointer-events-auto absolute bottom-0 right-2 flex h-14 w-14 min-h-14 min-w-14 items-center justify-center rounded-full border-0 bg-primary text-primary-content shadow-floating transition-[background-color,transform] duration-150 ease-out hover:bg-[#222222] active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus md:right-4"
        aria-label="Add photos"
        onClick={onAddPhotos}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}

ProjectGridOverlays.propTypes = {
  collaboratingLabel: PropTypes.string.isRequired,
  onAddPhotos: PropTypes.func.isRequired,
}
