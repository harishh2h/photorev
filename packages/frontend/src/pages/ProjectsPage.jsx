import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import LibrarySection from '@/features/dashboard/LibrarySection'
import { useAuth } from '@/features/auth/index.js'
import { useProjects } from '@/hooks/useProjects.js'
import styles from './PlaceholderPage.module.css'

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
    <div className={styles.page}>
      <Header userDisplayName={displayName} onLogout={handleLogout} />
      <main className={styles.main}>
        <h1 className={styles.title}>Projects</h1>
        <p className={styles.lead}>Open a project to upload photos and run reviews.</p>
        {error ? (
          <p className={styles.errorText} role="alert">
            {error}
          </p>
        ) : null}
        <LibrarySection projects={projects} isLoading={isLoading} />
      </main>
    </div>
  )
}
