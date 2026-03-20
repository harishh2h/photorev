import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import DashboardHero from '@/features/dashboard/DashboardHero'
import LibrarySection from '@/features/dashboard/LibrarySection'
import { useAuth } from '@/features/auth/index.js'
import { DASHBOARD_OVERVIEW, LIBRARY_PROJECTS } from '@/constants/mockData'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.name || 'Karthik'
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }
  return (
    <div className={styles.page}>
      <Header userDisplayName={displayName} onLogout={handleLogout} />
      <main className={styles.main}>
        <DashboardHero
          displayName={displayName}
          activeSessionCount={DASHBOARD_OVERVIEW.activeSessionCount}
          pendingReviews={DASHBOARD_OVERVIEW.pendingReviews}
          featuredProject={DASHBOARD_OVERVIEW.featuredProject}
          recentActivity={DASHBOARD_OVERVIEW.recentActivity}
        />
        <LibrarySection projects={LIBRARY_PROJECTS} />
      </main>
    </div>
  )
}
