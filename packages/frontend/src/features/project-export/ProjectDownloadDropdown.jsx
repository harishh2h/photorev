import PropTypes from 'prop-types'
import { useDropdown } from '@/hooks/useDropdown.js'

const btnClass =
  'inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-base-300 bg-base-100 px-4 font-base text-sm font-medium text-base-content transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-surface-hover active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-40'

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
  const menu = useDropdown()

  const handleSelect = (action) => {
    menu.close()
    action()
  }

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
    <div className="relative shrink-0">
      <button
        type="button"
        ref={menu.triggerRef}
        className={btnClass}
        disabled={disabled}
        onClick={menu.toggle}
        aria-expanded={menu.isOpen}
        aria-haspopup="menu"
        aria-label="Download selected photos"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 4v12M6 12l6 6 6-6M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Download
        <span
          className={`flex text-muted transition-transform duration-150 ease-out ${menu.isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {menu.isOpen ? (
        <div
          ref={menu.panelRef}
          className="dropdown-panel-in absolute right-0 top-[calc(100%+0.5rem)] z-dropdown w-56 rounded-md border-[1.5px] border-base-300 bg-base-100 p-2 shadow-floating"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            disabled={disabled}
            onClick={() => handleSelect(onSelectFullQuality)}
          >
            Full quality
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            disabled={disabled}
            onClick={() => handleSelect(onSelectCompressed)}
          >
            Compressed
          </button>
        </div>
      ) : null}
    </div>
  )
}

ProjectDownloadDropdown.propTypes = {
  disabled: PropTypes.bool,
  compact: PropTypes.bool,
  onSelectFullQuality: PropTypes.func.isRequired,
  onSelectCompressed: PropTypes.func.isRequired,
}
