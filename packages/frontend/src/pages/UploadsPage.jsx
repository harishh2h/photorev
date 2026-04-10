import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import { useAuth } from '@/features/auth/index.js'

export default function UploadsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.name || 'User'
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }
  return (
    <div className="min-h-screen bg-base-100">
      <Header userDisplayName={displayName} onLogout={handleLogout} />
      <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6">
        <h1 className="m-0 mb-2 font-base text-3xl font-bold text-base-content">Uploads</h1>
        <p className="m-0 font-base text-base text-muted">Upload sessions and batches will appear here.</p>
      </main>
    </div>
  )
}
