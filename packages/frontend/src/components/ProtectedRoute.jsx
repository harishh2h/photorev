import PropTypes from 'prop-types'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/index.js'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return null
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
}
