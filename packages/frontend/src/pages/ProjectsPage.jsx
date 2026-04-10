import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import LibrarySection from '@/features/dashboard/LibrarySection'
import { useAuth } from '@/features/auth/index.js'
import { useProjects } from '@/hooks/useProjects.js'

export default function ProjectsPage() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const { projects, isLoading, error } = useProjects(token)
  const displayName = user?.name || 'User'
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }
  return (
    <div className="min-h-screen bg-base-100">
      <Header userDisplayName={displayName} onLogout={handleLogout} />
      <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6">
        <h1 className="m-0 mb-2 font-base text-3xl font-bold text-base-content">Projects</h1>
        <p className="m-0 mb-4 font-base text-base text-muted">Open a project to upload photos and run reviews.</p>
        {error ? (
          <p className="mb-4 font-base text-base text-error" role="alert">
            {error}
          </p>
        ) : null}
        <LibrarySection projects={projects} isLoading={isLoading} authToken={token || ''} />
      </main>
    </div>
  )
}
