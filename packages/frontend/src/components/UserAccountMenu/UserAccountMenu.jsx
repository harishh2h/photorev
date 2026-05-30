import PropTypes from 'prop-types'
import { NavLink } from 'react-router-dom'
import { useDropdown } from '@/hooks/useDropdown.js'

/**
 * Avatar dropdown with Profile and Log out.
 * @param {{ userDisplayName?: string; onLogout?: () => void; className?: string }} props
 */
export default function UserAccountMenu({ userDisplayName = 'User', onLogout, className = '' }) {
  const menu = useDropdown()
  const initial = userDisplayName.charAt(0).toUpperCase()

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
          className="dropdown-panel-in absolute right-0 top-[calc(100%+0.5rem)] z-dropdown min-w-[11rem] rounded-md border-[1.5px] border-base-300 bg-base-100 p-2 shadow-floating"
          role="menu"
        >
          <NavLink
            to="/profile"
            className="block w-full rounded-sm px-3 py-2 text-left font-base text-sm font-medium text-base-content no-underline transition-colors duration-150 ease-out hover:bg-base-200 focus-visible:outline-none focus-visible:shadow-focus"
            role="menuitem"
            onClick={menu.close}
          >
            Profile
          </NavLink>
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
  userDisplayName: PropTypes.string,
  onLogout: PropTypes.func,
  className: PropTypes.string,
}
