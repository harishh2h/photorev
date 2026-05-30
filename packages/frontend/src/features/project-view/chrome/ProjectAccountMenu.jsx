import PropTypes from 'prop-types'
import { UserAccountMenu } from '@/components/UserAccountMenu/index.js'

/**
 * Desktop-only account menu for project chrome; mobile uses bottom sheet.
 * @param {{ userEmail?: string; onLogout?: () => void }} props
 */
export default function ProjectAccountMenu({ userEmail = '', onLogout }) {
  return (
    <UserAccountMenu
      userEmail={userEmail}
      onLogout={onLogout}
      className="hidden md:block"
    />
  )
}

ProjectAccountMenu.propTypes = {
  userEmail: PropTypes.string,
  onLogout: PropTypes.func,
}
