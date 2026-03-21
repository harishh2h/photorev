import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import { useAuth } from '@/features/auth/index.js'
import styles from './PlaceholderPage.module.css'

export default function UploadsPage() {
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
        <h1 className={styles.title}>Uploads</h1>
        <p className={styles.lead}>Upload sessions and batches will appear here.</p>
      </main>
    </div>
  )
}
