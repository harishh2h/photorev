import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import { useAuth } from '@/features/auth/index.js'
import styles from './PlaceholderPage.module.css'

export default function ProfilePage() {
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
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.lead}>{user?.email || user?.name || 'Signed in'}</p>
      </main>
    </div>
  )
}
