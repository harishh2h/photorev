import PropTypes from 'prop-types'

/**
 * @param {{ onClick?: () => void; className?: string }} props
 */
export default function ProjectSettingsButton({ onClick, className = '' }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border-[1.5px] border-base-300 bg-base-100 text-muted transition-[border-color,background-color,color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-[#F4F9F6] hover:text-base-content active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus ${className}`.trim()}
      aria-label="Project settings"
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  )
}

ProjectSettingsButton.propTypes = {
  onClick: PropTypes.func,
  className: PropTypes.string,
}
