import { useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/index.js'
import PhotoViewerScreen from '@/features/photo-viewer/PhotoViewerScreen.jsx'
import { useProjectViewData } from '@/hooks/useProjectViewData.js'

export default function PhotoViewerPage() {
  const { projectId } = useParams()
  const location = useLocation()
  const { user, token } = useAuth()
  const { data, isLoading, error, refetch } = useProjectViewData(projectId, token, user)
  const viewerPhotoIds = location.state?.viewerPhotoIds

  const photosForViewer = useMemo(() => {
    if (!data?.photos?.length) return []
    const byId = new Map(data.photos.map((p) => [p.id, p]))
    if (Array.isArray(viewerPhotoIds) && viewerPhotoIds.length > 0) {
      return viewerPhotoIds.map((id) => byId.get(id)).filter(Boolean)
    }
    return data.photos
  }, [data, viewerPhotoIds])

  const collaboratorMembers = data?.collaboratorMembers ?? []

  if (!token) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black px-4 font-base text-sm text-white/60">
        Sign in to view photos.
      </div>
    )
  }

  if (isLoading && data == null) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black font-base text-sm text-white/50">
        Loading…
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

  if (data == null) {
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
    />
  )
}
