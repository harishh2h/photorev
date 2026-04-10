import PropTypes from 'prop-types'
import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useDropdown } from '@/hooks/useDropdown.js'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', to: '/', end: true },
  { id: 'projects', label: 'Projects', to: '/projects' },
  { id: 'uploads', label: 'Uploads', to: '/uploads' },
]

const navLinkClass = ({ isActive }) =>
  `inline-flex min-h-9 items-center justify-center rounded-full border-[1.5px] px-4 font-base text-sm font-medium transition-[background-color,border-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:shadow-focus md:min-h-9 ${
    isActive
      ? 'border-transparent bg-accent text-accent-content'
      : 'border-transparent bg-transparent text-base-content hover:bg-base-200'
  }`

export default function Header({ userDisplayName = 'User', onLogout }) {
  const userMenu = useDropdown()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const handleLogoutClick = () => {
    userMenu.close()
    setMobileNavOpen(false)
    if (onLogout) onLogout()
  }
  const closeMobileNav = () => setMobileNavOpen(false)

  return (
    <>
      <header className="sticky top-0 z-sticky flex min-h-16 items-center gap-3 border-b-[1.5px] border-base-300 bg-base-100/95 px-4 py-3 backdrop-blur-md md:gap-6 md:px-6">
        <button
          type="button"
          className="btn btn-ghost btn-circle btn-sm min-h-11 min-w-11 border-0 md:hidden"
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-nav-sheet"
          aria-label="Open menu"
          onClick={() => setMobileNavOpen(true)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <Link to="/" className="font-base text-xl font-bold text-base-content no-underline md:text-2xl">
          PhotoRev
        </Link>
        <nav className="ml-4 hidden items-center gap-2 md:inline-flex" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.id} to={item.to} end={item.end} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border-0 bg-transparent text-base-content transition-colors duration-150 ease-out hover:bg-base-200 focus-visible:outline-none focus-visible:shadow-focus md:min-h-11 md:min-w-11"
            aria-label="Notifications"
          >
            <span
              className="absolute right-2 top-[7px] h-[7px] w-[7px] rounded-full bg-error"
              aria-hidden
            />
            <svg
              className="h-[18px] w-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
              <path d="M9 17a3 3 0 0 0 6 0" />
            </svg>
          </button>
          <div className="relative">
            <button
              type="button"
              ref={userMenu.triggerRef}
              className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-base-300 bg-[#f3ead8] font-base text-sm font-semibold text-[#755f35] transition-shadow duration-150 ease-out focus-visible:outline-none focus-visible:shadow-focus md:h-9 md:w-9"
              onClick={userMenu.toggle}
              aria-expanded={userMenu.isOpen}
              aria-haspopup="true"
              aria-label="Account menu"
            >
              {userDisplayName.charAt(0).toUpperCase()}
            </button>
            {userMenu.isOpen && (
              <div
                ref={userMenu.panelRef}
                className="dropdown-panel-in absolute right-0 top-[calc(100%+0.5rem)] z-dropdown min-w-[11rem] rounded-md border-[1.5px] border-base-300 bg-base-100 p-2 shadow-floating"
                role="menu"
              >
                <NavLink
                  to="/profile"
                  className="block w-full rounded-sm px-3 py-2 text-left font-base text-sm font-medium text-base-content no-underline transition-colors duration-150 ease-out hover:bg-base-200 focus-visible:outline-none focus-visible:shadow-focus"
                  role="menuitem"
                  onClick={userMenu.close}
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
            )}
          </div>
        </div>
      </header>

      {mobileNavOpen ? (
        <div
          className="fixed inset-0 z-modal flex flex-col bg-base-100 md:hidden"
          id="mobile-nav-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div className="flex items-center justify-between border-b-[1.5px] border-base-300 px-4 py-4">
            <span className="font-base text-lg font-bold text-base-content">Menu</span>
            <button
              type="button"
              className="btn btn-ghost btn-circle min-h-11 min-w-11 border-0"
              aria-label="Close menu"
              onClick={closeMobileNav}
            >
              ×
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-2 p-4" aria-label="Main mobile">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-5 py-4 font-base text-base font-medium no-underline transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:shadow-focus ${
                    isActive ? 'bg-accent text-accent-content' : 'bg-base-200 text-base-content'
                  }`
                }
                onClick={closeMobileNav}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  )
}

Header.propTypes = {
  userDisplayName: PropTypes.string,
  onLogout: PropTypes.func,
}
