import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/index.js'
import { LoginPage } from '@/features/auth/index.js'

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/" replace />
  return <LoginPage />
}
