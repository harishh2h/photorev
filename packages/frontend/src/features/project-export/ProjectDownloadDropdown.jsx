import PropTypes from 'prop-types'

const btnClass =
  'inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-base-300 bg-base-100 px-4 font-base text-sm font-medium text-base-content transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-[#F4F9F6] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-40'

const itemClass =
  'flex w-full min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-left font-base text-sm font-medium text-base-content transition-colors duration-150 ease-out hover:bg-base-200 focus-visible:outline-none focus-visible:shadow-focus'

/**
 * @param {{
 *   disabled?: boolean;
 *   compact?: boolean;
 *   onSelectFullQuality: () => void;
 *   onSelectCompressed: () => void;
 * }} props
 */
export default function ProjectDownloadDropdown({
  disabled = false,
  compact = false,
  onSelectFullQuality,
  onSelectCompressed,
}) {
  if (compact) {
    return (
      <div className="flex flex-col gap-1">
        <button type="button" className={itemClass} disabled={disabled} onClick={onSelectFullQuality}>
          Full quality
        </button>
        <button type="button" className={itemClass} disabled={disabled} onClick={onSelectCompressed}>
          Compressed
        </button>
      </div>
    )
  }

  return (
    <div className="dropdown dropdown-end">
      <button
        type="button"
        tabIndex={0}
        className={btnClass}
        disabled={disabled}
        aria-label="Download selected photos"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 4v12M6 12l6 6 6-6M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Download
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <ul
        tabIndex={0}
        className="dropdown-content menu z-dropdown mt-2 w-56 rounded-floating border-[1.5px] border-base-300 bg-base-100 p-2 shadow-floating"
      >
        <li>
          <button type="button" className={itemClass} onClick={onSelectFullQuality}>
            Full quality
          </button>
        </li>
        <li>
          <button type="button" className={itemClass} onClick={onSelectCompressed}>
            Compressed
          </button>
        </li>
      </ul>
    </div>
  )
}

ProjectDownloadDropdown.propTypes = {
  disabled: PropTypes.bool,
  compact: PropTypes.bool,
  onSelectFullQuality: PropTypes.func.isRequired,
  onSelectCompressed: PropTypes.func.isRequired,
}
