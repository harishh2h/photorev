import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import { useAuth } from '@/features/auth/index.js'
import styles from './PlaceholderPage.module.css'

export default function ProjectsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
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
        <p className={styles.lead}>Create and manage your photo projects here.</p>
      </main>
    </div>
  )
}
