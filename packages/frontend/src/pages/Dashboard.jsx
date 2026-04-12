import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import DashboardHero from '@/features/dashboard/DashboardHero'
import ProjectsSection from '@/features/dashboard/ProjectsSection'
import { AddProjectModal } from '@/features/projects'
import { useAuth } from '@/features/auth/index.js'
import { useProjects } from '@/hooks/useProjects.js'
import { createProject } from '@/services/projectService.js'
import { listPhotos } from '@/services/photoService.js'

export default function Dashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const { projects, isLoading, error, refetch } = useProjects(token)
  const displayName = user?.name || 'Karthik'
  const featured = projects[0]
  const [featuredStats, setFeaturedStats] = useState(null)
  useEffect(() => {
    if (!token || !featured?.id) {
      setFeaturedStats(null)
      return undefined
    }
    let cancelled = false
    listPhotos(token, { projectId: featured.id, pageSize: 100 })
      .then((result) => {
        if (cancelled) return
        const inProgress = result.items.filter(
          (p) => p.status === 'pending' || p.status === 'processing'
        ).length
        setFeaturedStats({ total: result.total, inProgress })
      })
      .catch(() => {
        if (!cancelled) setFeaturedStats(null)
      })
    return () => {
      cancelled = true
    }
  }, [token, featured?.id])
  const featuredProject = useMemo(() => {
    if (!featured) return null
    const meta = featured.metadata || {}
    const bannerPhotoId =
      typeof meta.bannerPhotoId === 'string' && meta.bannerPhotoId.length > 0 ? meta.bannerPhotoId : ''
    const banner = meta.banner
    const bannerUrl = typeof banner === 'string' && banner.length > 0 ? banner : ''
    return {
      id: featured.id,
      name: featured.name,
      description: '',
      status: featured.status,
      totalPhotos: featuredStats?.total ?? 0,
      inProgressPhotos: featuredStats?.inProgress ?? 0,
      bannerPhotoId,
      bannerUrl,
    }
  }, [featured, featuredStats])
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }
  const handleOpenAddProject = useCallback(() => setIsAddProjectOpen(true), [])
  const handleCloseAddProject = useCallback(() => setIsAddProjectOpen(false), [])
  const handleCreateProject = useCallback(
    async ({ name }) => {
      if (!token) throw new Error('Sign in required')
      const created = await createProject(token, { name })
      const id = created?.id
      if (!id) throw new Error('Invalid response from server')
      await refetch()
      navigate(`/projects/${id}`)
    },
    [token, refetch, navigate]
  )
  return (
    <div className="min-h-screen bg-base-100">
      <Header userDisplayName={displayName} onLogout={handleLogout} />
      <main className="mx-auto max-w-[1280px] px-4 py-6 pb-10 md:px-6 md:py-8 md:pb-10">
        {error ? (
          <p className="mb-4 font-base text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
        {isLoading && projects.length === 0 ? (
          <p className="mb-4 font-base text-sm text-muted">Loading projects…</p>
        ) : null}
        <DashboardHero
          featuredProject={featuredProject}
          authToken={token || ''}
          recentActivity={[]}
          onNewProjectClick={handleOpenAddProject}
        />
        <ProjectsSection projects={projects} isLoading={isLoading} authToken={token || ''} />
      </main>
      <AddProjectModal
        isOpen={isAddProjectOpen}
        onClose={handleCloseAddProject}
        onCreate={handleCreateProject}
      />
    </div>
  )
}
