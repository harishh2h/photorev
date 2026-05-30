import { useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/index.js'
import PhotoViewerScreen from '@/features/photo-viewer/PhotoViewerScreen.jsx'
import { useProjectViewData } from '@/hooks/useProjectViewData.js'
import { mapPhotosForViewer } from '@/utils/mapPhotosForViewer.js'

export default function PhotoViewerPage() {
  const { projectId } = useParams()
  const location = useLocation()
  const { user, token } = useAuth()
  const { data, isLoading, error, refetch } = useProjectViewData(projectId, token, user)
  const viewerPhotoIds = location.state?.viewerPhotoIds
  const viewerPhotosFromNav = location.state?.viewerPhotos

  const photosForViewer = useMemo(() => {
    const orderedIds =
      Array.isArray(viewerPhotoIds) && viewerPhotoIds.length > 0 ? viewerPhotoIds : null

    if (data?.photos?.length) {
      const byId = new Map(data.photos.map((p) => [p.id, p]))
      if (orderedIds) {
        const ordered = orderedIds.map((id) => byId.get(id)).filter(Boolean)
        if (ordered.length > 0) return mapPhotosForViewer(ordered)
      }
      return mapPhotosForViewer(data.photos)
    }

    if (Array.isArray(viewerPhotosFromNav) && viewerPhotosFromNav.length > 0) {
      return viewerPhotosFromNav
    }
    return []
  }, [data, viewerPhotoIds, viewerPhotosFromNav])

  const collaboratorMembers = data?.collaboratorMembers ?? []

  if (!token) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black px-4 font-base text-sm text-white/60">
        Sign in to view photos.
      </div>
    )
  }

  if (isLoading && data == null && photosForViewer.length === 0) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black font-base text-sm text-white/50">
        <span className="loading loading-spinner loading-md text-accent" aria-hidden />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black px-4 font-base text-sm text-error" role="alert">
        {error}
      </div>
    )
  }

  if (data == null && photosForViewer.length === 0) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black px-4 font-base text-sm text-white/60">
        No project data.
      </div>
    )
  }

  return (
    <PhotoViewerScreen
      photos={photosForViewer}
      token={token}
      onRefresh={refetch}
      collaboratorMembers={collaboratorMembers}
      canReviewPhotos={data?.canReviewPhotos !== false}
    />
  )
}
