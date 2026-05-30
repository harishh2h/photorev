import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { UserAccountMenu } from '@/components/UserAccountMenu/index.js'

/**
 * Minimal app header: PhotoRev brand + account menu only.
 * @param {{ userDisplayName?: string; onLogout?: () => void }} props
 */
export default function MinimalHeader({ userDisplayName = 'User', onLogout }) {
  return (
    <header className="sticky top-0 z-sticky flex min-h-16 items-center gap-3 border-b-[1.5px] border-base-300 bg-base-100/95 px-4 py-3 backdrop-blur-md md:px-6">
      <Link to="/" className="font-base text-xl font-bold text-base-content no-underline md:text-2xl">
        PhotoRev
      </Link>
      <div className="ml-auto flex items-center">
        <UserAccountMenu userDisplayName={userDisplayName} onLogout={onLogout} />
      </div>
    </header>
  )
}

MinimalHeader.propTypes = {
  userDisplayName: PropTypes.string,
  onLogout: PropTypes.func,
}
