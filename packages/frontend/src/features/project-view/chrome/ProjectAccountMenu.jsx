import PropTypes from 'prop-types'
import { UserAccountMenu } from '@/components/UserAccountMenu/index.js'

/**
 * Desktop-only account menu for project chrome; mobile uses bottom sheet.
 * @param {{ userDisplayName?: string; onLogout?: () => void }} props
 */
export default function ProjectAccountMenu({ userDisplayName = 'User', onLogout }) {
  return (
    <UserAccountMenu
      userDisplayName={userDisplayName}
      onLogout={onLogout}
      className="hidden md:block"
    />
  )
}

ProjectAccountMenu.propTypes = {
  userDisplayName: PropTypes.string,
  onLogout: PropTypes.func,
}
