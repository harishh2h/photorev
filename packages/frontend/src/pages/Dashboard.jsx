import Header from '@/components/Header'
import DashboardHero from '@/features/dashboard/DashboardHero'
import ResumeSection from '@/features/dashboard/ResumeSection'
import LibrarySection from '@/features/dashboard/LibrarySection'
import { USER, DASHBOARD_STATS, RESUME_ITEMS, LIBRARY_PROJECTS } from '@/constants/mockData'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  return (
    <div className={styles.page}>
      <Header userDisplayName={USER.displayName} />
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
