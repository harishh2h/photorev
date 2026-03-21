import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '@/components/Header'
import { ProjectViewScreen } from '@/features/project-view'
import { useAuth } from '@/features/auth/index.js'
import { getProjectViewData } from '@/constants/mockData.js'
import styles from './ProjectViewPage.module.css'

export default function ProjectViewPage() {
  const { projectId } = useParams()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.name || 'User'
  const data = useMemo(() => getProjectViewData(projectId), [projectId])
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }
  return (
    <div className={styles.page}>
      <Header userDisplayName={displayName} onLogout={handleLogout} />
      <main className={styles.main}>
        <ProjectViewScreen data={data} />
      </main>
    </div>
  )
}
