import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import DashboardHero from '@/features/dashboard/DashboardHero'
import ResumeSection from '@/features/dashboard/ResumeSection'
import LibrarySection from '@/features/dashboard/LibrarySection'
import { useAuth } from '@/features/auth/index.js'
import { USER, DASHBOARD_STATS, RESUME_ITEMS, LIBRARY_PROJECTS } from '@/constants/mockData'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.name || USER.displayName
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }
  return (
    <div className={styles.page}>
      <Header userDisplayName={displayName} onLogout={handleLogout} />
      <main className={styles.main}>
        <DashboardHero
        displayName={USER.displayName}
        activeReviewCount={DASHBOARD_STATS.pendingReviews}
        totalProjects={DASHBOARD_STATS.totalProjects}
        photosProcessed={DASHBOARD_STATS.photosProcessed}
        pendingReviews={DASHBOARD_STATS.pendingReviews}
      />
        <ResumeSection items={RESUME_ITEMS} />
        <LibrarySection projects={LIBRARY_PROJECTS} />
      </main>
    </div>
  )
}
