import { useNavigate, useParams } from 'react-router-dom'
import Header from '@/components/Header'
import { ProjectViewScreen } from '@/features/project-view'
import { useAuth } from '@/features/auth/index.js'
import { useProjectViewData } from '@/hooks/useProjectViewData.js'
import styles from './ProjectViewPage.module.css'

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
    <div className={styles.page}>
      <Header userDisplayName={displayName} onLogout={handleLogout} />
      <main className={styles.main}>
        {isLoading ? <p className={styles.feedback}>Loading project…</p> : null}
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {!isLoading && !error && data != null && token ? (
          <ProjectViewScreen data={data} token={token} />
        ) : null}
        {!isLoading && !error && data == null && token ? (
          <p className={styles.feedback}>No data for this project.</p>
        ) : null}
        {!token ? (
          <p className={styles.error} role="alert">
            Sign in to view this project.
          </p>
        ) : null}
      </main>
    </div>
  )
}
