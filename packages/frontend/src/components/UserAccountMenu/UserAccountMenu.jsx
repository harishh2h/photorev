import PropTypes from 'prop-types'
import { useDropdown } from '@/hooks/useDropdown.js'

/**
 * Avatar dropdown with signed-in email and Log out.
 * @param {{ userEmail?: string; onLogout?: () => void; className?: string }} props
 */
export default function UserAccountMenu({ userEmail = '', onLogout, className = '' }) {
  const menu = useDropdown()
  const initial = (userEmail.charAt(0) || 'U').toUpperCase()
  const emailLabel = userEmail || 'Signed in'

  const handleLogoutClick = () => {
    menu.close()
    onLogout?.()
  }

  return (
    <div className={`relative ${className}`.trim()}>
      <button
        type="button"
        ref={menu.triggerRef}
        className="flex h-9 w-9 min-h-11 min-w-11 items-center justify-center rounded-full border-[1.5px] border-base-300 bg-[#f3ead8] font-base text-sm font-semibold text-[#755f35] transition-shadow duration-150 ease-out focus-visible:outline-none focus-visible:shadow-focus md:h-9 md:w-9 md:min-h-0 md:min-w-0"
        onClick={menu.toggle}
        aria-expanded={menu.isOpen}
        aria-haspopup="true"
        aria-label="Account menu"
      >
        {initial}
      </button>
      {menu.isOpen ? (
        <div
          ref={menu.panelRef}
          className="dropdown-panel-in absolute right-0 top-[calc(100%+0.5rem)] z-dropdown w-max max-w-[min(calc(100vw-2rem),24rem)] rounded-md border-[1.5px] border-base-300 bg-base-100 p-2 shadow-floating"
          role="menu"
        >
          <p
            className="m-0 max-w-full break-all px-3 py-2 font-base text-sm font-medium text-base-content"
            role="presentation"
          >
            {emailLabel}
          </p>
          <div className="my-2 h-[1.5px] bg-base-300" aria-hidden />
          <button
            type="button"
            className="block w-full rounded-sm px-3 py-2 text-left font-base text-sm font-medium text-muted transition-colors duration-150 ease-out hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:shadow-focus"
            role="menuitem"
            onClick={handleLogoutClick}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  )
}

UserAccountMenu.propTypes = {
  userEmail: PropTypes.string,
  onLogout: PropTypes.func,
  className: PropTypes.string,
}
