import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { UserAccountMenu } from '@/components/UserAccountMenu/index.js'

/**
 * Minimal app header: PhotoRev brand + optional actions + account menu.
 * @param {{ userEmail?: string; onLogout?: () => void; onNewProjectClick?: () => void }} props
 */
export default function MinimalHeader({ userEmail = '', onLogout, onNewProjectClick }) {
  return (
    <header className="sticky top-0 z-sticky flex min-h-16 items-center gap-3 border-b-[1.5px] border-base-300 bg-base-100/95 px-4 py-3 backdrop-blur-md md:px-6">
      <Link to="/" className="font-base text-xl font-bold text-accent no-underline transition-colors duration-150 ease-out hover:text-accent-hover md:text-2xl">
        PhotoRev
      </Link>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {typeof onNewProjectClick === 'function' ? (
          <button
            type="button"
            className="btn btn-primary min-h-11 rounded-full border-0 px-4 font-base text-sm font-semibold text-primary-content transition-[background-color,transform] duration-150 ease-out hover:bg-[#222222] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus sm:px-6 sm:text-base"
            onClick={onNewProjectClick}
          >
            + New Project
          </button>
        ) : null}
        <UserAccountMenu userEmail={userEmail} onLogout={onLogout} />
      </div>
    </header>
  )
}

MinimalHeader.propTypes = {
  userEmail: PropTypes.string,
  onLogout: PropTypes.func,
  onNewProjectClick: PropTypes.func,
}
