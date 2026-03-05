import PropTypes from 'prop-types'
import { useDropdown } from '@/hooks/useDropdown.js'
import styles from './Header.module.css'

const DROPDOWN_ITEMS = {
  projects: ['All Projects', 'Recent', 'Archived'],
  reviews: ['Active Sessions', 'Completed', 'Shared Links'],
  library: ['All Photos', 'Albums', 'Favorites'],
  user: ['Profile', 'Settings'],
}

function NavDropdown({ label, items, isOpen, onToggle, onClose, triggerRef, panelRef }) {
  return (
    <div className={styles.dropdownWrap}>
      <button
        type="button"
        ref={triggerRef}
        onClick={onToggle}
        className={`${styles.trigger} ${isOpen ? styles.triggerActive : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className={styles.triggerLabel}>{label}</span>
      </button>
      {isOpen && (
        <div ref={panelRef} className={styles.panel} role="menu">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              className={styles.panelItem}
              role="menuitem"
              onClick={onClose}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

NavDropdown.propTypes = {
  label: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  triggerRef: PropTypes.object.isRequired,
  panelRef: PropTypes.object.isRequired,
}

export default function Header({ userDisplayName = 'User', onLogout }) {
  const projects = useDropdown()
  const reviews = useDropdown()
  const library = useDropdown()
  const user = useDropdown()

  const closeAll = () => {
    projects.close()
    reviews.close()
    library.close()
    user.close()
  }

  const openProjects = () => { closeAll(); projects.toggle() }
  const openReviews = () => { closeAll(); reviews.toggle() }
  const openLibrary = () => { closeAll(); library.toggle() }
  const openUser = () => { closeAll(); user.toggle() }

  return (
    <header className={styles.header}>
      <a href="/" className={styles.wordmark}>
        PhotoRev
      </a>
      <nav className={styles.nav}>
        <NavDropdown
          label="Projects"
          items={DROPDOWN_ITEMS.projects}
          isOpen={projects.isOpen}
          onToggle={openProjects}
          onClose={projects.close}
          triggerRef={projects.triggerRef}
          panelRef={projects.panelRef}
        />
        <NavDropdown
          label="Reviews"
          items={DROPDOWN_ITEMS.reviews}
          isOpen={reviews.isOpen}
          onToggle={openReviews}
          onClose={reviews.close}
          triggerRef={reviews.triggerRef}
          panelRef={reviews.panelRef}
        />
        <NavDropdown
          label="Library"
          items={DROPDOWN_ITEMS.library}
          isOpen={library.isOpen}
          onToggle={openLibrary}
          onClose={library.close}
          triggerRef={library.triggerRef}
          panelRef={library.panelRef}
        />
        <div className={styles.dropdownWrap}>
          <button
            type="button"
            ref={user.triggerRef}
            onClick={openUser}
            className={styles.avatarTrigger}
            aria-expanded={user.isOpen}
            aria-haspopup="true"
          >
            {userDisplayName.charAt(0).toUpperCase()}
          </button>
          {user.isOpen && (
            <div ref={user.panelRef} className={styles.panel} role="menu">
              {DROPDOWN_ITEMS.user.filter((item) => item !== 'Logout').map((item) => (
                <button
                  key={item}
                  type="button"
                  className={styles.panelItem}
                  role="menuitem"
                  onClick={user.close}
                >
                  {item}
                </button>
              ))}
              <div className={styles.panelSeparator} aria-hidden />
              <button
                type="button"
                className={`${styles.panelItem} ${styles.panelItemLogout}`}
                role="menuitem"
                onClick={() => {
                  if (onLogout) onLogout()
                  user.close()
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}

Header.propTypes = {
  userDisplayName: PropTypes.string,
  onLogout: PropTypes.func,
}
