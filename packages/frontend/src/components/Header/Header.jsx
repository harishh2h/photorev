import PropTypes from 'prop-types'
import styles from './Header.module.css'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '#', isActive: true },
  { id: 'projects', label: 'Projects', href: '#' },
  { id: 'uploads', label: 'Uploads', href: '#' },
]

export default function Header({ userDisplayName = 'User', onLogout }) {
  return (
    <header className={styles.header}>
      <a href="/" className={styles.wordmark}>
        PhotoRev
      </a>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={`${styles.navLink} ${item.isActive ? styles.navLinkActive : ''}`}
          >
            {item.label}
          </a>
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
        <button type="button" className={styles.avatarButton} onClick={onLogout} title="Sign out">
          {userDisplayName.charAt(0).toUpperCase()}
        </button>
      </div>
    </header>
  )
}

Header.propTypes = {
  userDisplayName: PropTypes.string,
  onLogout: PropTypes.func,
}
