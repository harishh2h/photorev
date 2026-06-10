import PropTypes from 'prop-types'

/**
 * @param {{ checked: boolean; onToggle: () => void; label?: string; visible?: boolean }} props
 */
export default function PhotoSelectCheckbox({ checked, onToggle, label = 'Select photo', visible = true }) {
  return (
    <button
      type="button"
      className={`absolute left-2 top-2 z-[2] flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-full border-[1.5px] shadow-card transition-[opacity,background-color,border-color,transform] duration-150 ease-out focus-visible:outline-none focus-visible:shadow-focus active:scale-[0.94] ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100'
      } ${
        checked
          ? 'border-accent bg-accent text-primary-content'
          : 'border-base-300 bg-base-100/95 text-base-content backdrop-blur-sm hover:border-accent-mid'
      }`}
      aria-label={checked ? `Deselect ${label}` : `Select ${label}`}
      aria-pressed={checked}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
    >
      {checked ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.8" aria-hidden>
          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <span className="h-3.5 w-3.5 rounded-full border-[1.5px] border-muted" aria-hidden />
      )}
    </button>
  )
}

PhotoSelectCheckbox.propTypes = {
  checked: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  label: PropTypes.string,
  visible: PropTypes.bool,
}
