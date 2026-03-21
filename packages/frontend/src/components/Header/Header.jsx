import PropTypes from 'prop-types'
import { NavLink, Link } from 'react-router-dom'
import { useDropdown } from '@/hooks/useDropdown.js'
import styles from './Header.module.css'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', to: '/', end: true },
  { id: 'projects', label: 'Projects', to: '/projects' },
  { id: 'uploads', label: 'Uploads', to: '/uploads' },
]

export default function Header({ userDisplayName = 'User', onLogout }) {
  const userMenu = useDropdown()
  const handleLogoutClick = () => {
    userMenu.close()
    if (onLogout) onLogout()
  }
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.wordmark}>
        PhotoRev
      </Link>
      <nav className={styles.nav} aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className={styles.userActions}>
        <button type="button" className={styles.iconButton} aria-label="Notifications">
          <span className={styles.notificationDot} aria-hidden />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
            <path d="M9 17a3 3 0 0 0 6 0" />
          </svg>
        </button>
        <div className={styles.dropdownWrap}>
          <button
            type="button"
            ref={userMenu.triggerRef}
            className={styles.avatarButton}
            onClick={userMenu.toggle}
            aria-expanded={userMenu.isOpen}
            aria-haspopup="true"
            aria-label="Account menu"
          >
            {userDisplayName.charAt(0).toUpperCase()}
          </button>
          {userMenu.isOpen && (
            <div ref={userMenu.panelRef} className={styles.panel} role="menu">
              <NavLink
                to="/profile"
                className={styles.panelItem}
                role="menuitem"
                onClick={userMenu.close}
              >
                Profile
              </NavLink>
              <div className={styles.panelSeparator} aria-hidden />
              <button
                type="button"
                className={`${styles.panelItem} ${styles.panelItemLogout}`}
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
  )
}

Header.propTypes = {
  userDisplayName: PropTypes.string,
  onLogout: PropTypes.func,
}
