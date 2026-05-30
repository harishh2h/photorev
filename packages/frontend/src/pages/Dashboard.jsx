import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MinimalHeader } from '@/components/Header'
import DashboardHero from '@/features/dashboard/DashboardHero'
import ProjectsSection from '@/features/dashboard/ProjectsSection'
import { AddProjectModal } from '@/features/projects'
import { useAuth } from '@/features/auth/index.js'
import { useProjects } from '@/hooks/useProjects.js'
import { createProject, fetchRandomProjectCoverPhotoId } from '@/services/projectService.js'
import { fetchProjectGrid } from '@/services/projectGridService.js'

export default function Dashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const { projects, isLoading, isLoadingMore, hasMore, error, refetch, loadMore } = useProjects(token)
  const userEmail = user?.email || ''
  const featured = useMemo(() => {
    if (projects.length === 0) return null
    return [...projects].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })[0]
  }, [projects])
  const [featuredStats, setFeaturedStats] = useState(null)
  const [heroFallbackCoverPhotoId, setHeroFallbackCoverPhotoId] = useState(/** @type {string | null} */ (null))

  const featuredBannerKey = useMemo(() => {
    if (!featured) return ''
    const meta = featured.metadata || {}
    const p = typeof meta.bannerPhotoId === 'string' ? meta.bannerPhotoId : ''
    const b = typeof meta.banner === 'string' ? meta.banner : ''
    return `${p}\0${b}`
  }, [featured])
  useEffect(() => {
    if (!token || !featured?.id) {
      setFeaturedStats(null)
      return undefined
    }
    let cancelled = false
    fetchProjectGrid(token, featured.id, { pageSize: 1 })
      .then((grid) => {
        if (cancelled) return
        const counts = grid.filterCounts ?? {}
        const mine = counts.mine ?? {}
        const team = counts.team ?? {}
        const isCreator = featured.viewerContext?.isCreator === true
        const total = typeof mine.all === 'number' ? mine.all : grid.total ?? 0
        const liked = isCreator
          ? typeof team.liked === 'number'
            ? team.liked
            : 0
          : typeof mine.liked === 'number'
            ? mine.liked
            : 0
        const rejected = isCreator
          ? typeof team.rejected === 'number'
            ? team.rejected
            : 0
          : typeof mine.rejected === 'number'
            ? mine.rejected
            : 0
        const pendingReview = isCreator
          ? Math.max(0, total - liked - rejected)
          : typeof mine.unreviewed === 'number'
            ? mine.unreviewed
            : 0
        setFeaturedStats({ total, liked, rejected, pendingReview })
      })
      .catch(() => {
        if (!cancelled) setFeaturedStats(null)
      })
    return () => {
      cancelled = true
    }
  }, [token, featured?.id, featured?.viewerContext?.isCreator])

  useEffect(() => {
    if (!token || !featured?.id) {
      setHeroFallbackCoverPhotoId(null)
      return undefined
    }
    const meta = featured.metadata || {}
    const explicitPhoto =
      typeof meta.bannerPhotoId === 'string' && meta.bannerPhotoId.length > 0 ? meta.bannerPhotoId : ''
    const explicitBanner = typeof meta.banner === 'string' && meta.banner.length > 0 ? meta.banner : ''
    if (explicitPhoto || explicitBanner) {
      setHeroFallbackCoverPhotoId(null)
      return undefined
    }
    setHeroFallbackCoverPhotoId(null)
    let cancelled = false
    fetchRandomProjectCoverPhotoId(token, featured.id)
      .then((id) => {
        if (!cancelled) {
          setHeroFallbackCoverPhotoId(id)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHeroFallbackCoverPhotoId(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [token, featured?.id, featuredBannerKey])

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
      totalPhotos: featuredStats?.total ?? 0,
      likedPhotos: featuredStats?.liked ?? 0,
      rejectedPhotos: featuredStats?.rejected ?? 0,
      pendingReviewPhotos: featuredStats?.pendingReview ?? 0,
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
      <MinimalHeader
        userEmail={userEmail}
        onLogout={handleLogout}
        onNewProjectClick={handleOpenAddProject}
      />
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
          fallbackCoverPhotoId={heroFallbackCoverPhotoId || ''}
          showEmptyWelcome={!isLoading && projects.length === 0}
          onNewProjectClick={handleOpenAddProject}
        />
        <ProjectsSection
          projects={projects}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onNewProjectClick={handleOpenAddProject}
          authToken={token || ''}
          coverContentVariant="preview"
        />
      </main>
      <AddProjectModal
        isOpen={isAddProjectOpen}
        onClose={handleCloseAddProject}
        onCreate={handleCreateProject}
      />
    </div>
  )
}
