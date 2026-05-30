import PropTypes from 'prop-types'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/index.js'

export default function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base-100 px-4"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Loading"
      >
        <span className="loading loading-spinner loading-lg text-accent" />
        <span className="font-base text-sm text-muted">Loading…</span>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/" replace />

  return children
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
}
