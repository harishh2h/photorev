import { useNavigate, useParams } from 'react-router-dom'
import Header from '@/components/Header'
import { ProjectViewScreen } from '@/features/project-view'
import { useAuth } from '@/features/auth/index.js'
import { useProjectViewData } from '@/hooks/useProjectViewData.js'

export default function ProjectViewPage() {
  const { projectId } = useParams()
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.name || 'User'
  const { data, isLoading, error } = useProjectViewData(projectId, token, user)
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }
  return (
    <div className="min-h-screen bg-base-100">
      <Header userDisplayName={displayName} onLogout={handleLogout} />
      <main className="mx-auto max-w-[1400px] px-4 pb-10 pt-0 md:px-6 md:pb-12 lg:px-8">
        {isLoading ? <p className="mb-4 font-base text-sm text-muted">Loading project…</p> : null}
        {error ? (
          <p className="mb-4 font-base text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
        {!isLoading && !error && data != null && token ? (
          <ProjectViewScreen data={data} token={token} />
        ) : null}
        {!isLoading && !error && data == null && token ? (
          <p className="mb-4 font-base text-sm text-muted">No data for this project.</p>
        ) : null}
        {!token ? (
          <p className="mb-4 font-base text-sm text-error" role="alert">
            Sign in to view this project.
          </p>
        ) : null}
      </main>
    </div>
  )
}
