import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import PropTypes from 'prop-types'
import ProjectPhotoImage from '@/features/project-view/ProjectPhotoImage.jsx'
import PhotoViewerInfoPanel from '@/features/photo-viewer/PhotoViewerInfoPanel.jsx'
import { usePhotoViewerShortcuts } from '@/features/photo-viewer/usePhotoViewerShortcuts.js'
import { upsertPhotoReview } from '@/services/photoReviewService.js'
import { useToast } from '@/components/Toast/index.js'

const photoPropShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'ready', 'failed']),
  isLiked: PropTypes.bool.isRequired,
  isRejected: PropTypes.bool.isRequired,
  renamedTo: PropTypes.string,
  selectionLabel: PropTypes.string,
})

/**
 * @param {{ photos: object[]; token: string; onRefresh: () => void; collaboratorMembers: Array<{ id: string; name: string }> }} props
 */
export default function PhotoViewerScreen({ photos, token, onRefresh, collaboratorMembers }) {
  const { projectId, photoId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { show: showToast } = useToast()
  const [detailOpen, setDetailOpen] = useState(false)
  const [renameDraft, setRenameDraft] = useState('')
  const [localPhotos, setLocalPhotos] = useState(photos)

  useEffect(() => {
    setLocalPhotos(photos)
  }, [photos])

  const navState = location.state
  const index = localPhotos.findIndex((p) => p.id === photoId)
  const current = index >= 0 ? localPhotos[index] : null

  useEffect(() => {
    if (current) {
      setRenameDraft(current.renamedTo ?? '')
    }
  }, [current?.id, current?.renamedTo])

  const memberNameByUserId = useMemo(() => {
    const m = new Map()
    collaboratorMembers.forEach((c) => m.set(c.id, c.name))
    return m
  }, [collaboratorMembers])

  const goPhoto = useCallback(
    (id) => {
      navigate(`/projects/${projectId}/photos/${id}`, { replace: true, state: navState })
    },
    [navigate, projectId, navState]
  )

  const goPrev = useCallback(() => {
    if (index <= 0) return
    goPhoto(localPhotos[index - 1].id)
  }, [goPhoto, index, localPhotos])

  const goNext = useCallback(() => {
    if (index < 0 || index >= localPhotos.length - 1) return
    goPhoto(localPhotos[index + 1].id)
  }, [goPhoto, index, localPhotos])

  const patchCurrent = useCallback((patch) => {
    if (!photoId) return
    setLocalPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, ...patch } : p)))
  }, [photoId])

  const saveReview = useCallback(
    async (body) => {
      if (!photoId || !token) return
      try {
        await upsertPhotoReview(token, photoId, body)
        if (typeof body.decision === 'number') {
          patchCurrent({
            isLiked: body.decision === 1,
            isRejected: body.decision === -1,
          })
        }
        if (typeof body.renamedTo !== 'undefined') {
          const label =
            typeof body.renamedTo === 'string' && body.renamedTo.trim().length > 0 ? body.renamedTo.trim() : null
          patchCurrent({
            renamedTo: label,
            selectionLabel: label,
          })
        }
        onRefresh()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not save', 'error')
      }
    },
    [onRefresh, patchCurrent, photoId, showToast, token]
  )

  const onLike = useCallback(() => {
    saveReview({ decision: 1 })
  }, [saveReview])

  const onReject = useCallback(() => {
    saveReview({ decision: -1 })
  }, [saveReview])

  const handleRenameSubmit = useCallback(() => {
    const trimmed = renameDraft.trim()
    saveReview({ renamedTo: trimmed.length > 0 ? trimmed : null })
  }, [renameDraft, saveReview])

  const onExit = useCallback(() => {
    navigate(`/projects/${projectId}`, { state: navState })
  }, [navigate, projectId, navState])

  useEffect(() => {
    if (localPhotos.length === 0 || !projectId) return
    if (index === -1) {
      goPhoto(localPhotos[0].id)
    }
  }, [goPhoto, index, localPhotos, projectId])

  usePhotoViewerShortcuts({
    detailOpen,
    setDetailOpen,
    onExit,
    goPrev,
    goNext,
    onLike,
    onReject,
    enabled: Boolean(photoId && current),
  })

  if (!current) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black px-4 font-base text-sm text-white/50">
        {localPhotos.length === 0 ? 'No photos in this view.' : 'Loading…'}
      </div>
    )
  }

  const showRenameBtn = renameDraft.trim().length > 0

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col bg-black pt-[env(safe-area-inset-top)]"
      role="presentation"
    >
      <div className="absolute left-2 top-[max(0.5rem,env(safe-area-inset-top))] z-10 md:left-4">
        <button
          type="button"
          onClick={onExit}
          className="flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-pill border-[1.5px] border-white/15 bg-white/[0.04] text-white/55 transition-[color,background-color,border-color] duration-150 hover:border-white/25 hover:bg-white/[0.08] hover:text-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Back to grid"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M15 6L9 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="absolute right-2 top-[max(0.5rem,env(safe-area-inset-top))] z-10 md:right-4">
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-pill border-[1.5px] border-white/15 bg-white/[0.04] text-white/55 transition-[color,background-color,border-color] duration-150 hover:border-white/25 hover:bg-white/[0.08] hover:text-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Photo details"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 10v6M11 8.5h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-3 pb-36 pt-16 sm:px-6">
        <ProjectPhotoImage
          photoId={current.id}
          token={token}
          alt={current.alt}
          status={current.status}
          className="max-h-[min(calc(100dvh-10rem),calc(100vh-10rem))] w-auto max-w-full object-contain"
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <div className="pointer-events-auto flex w-full items-end justify-between gap-2 px-3 sm:px-6">
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onLike}
            className={`flex h-12 min-h-[48px] w-12 min-w-[48px] items-center justify-center rounded-pill border-[1.5px] transition-[color,background-color,border-color,transform] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.96] ${
              current.isLiked
                ? 'border-accent bg-accent/25 text-accent'
                : 'border-white/15 bg-white/[0.06] text-white/45 hover:border-accent/50 hover:text-accent'
            }`}
            aria-label="Favorite — keyboard: up arrow"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onReject}
            className={`flex h-12 min-h-[48px] w-12 min-w-[48px] items-center justify-center rounded-pill border-[1.5px] transition-[color,background-color,border-color,transform] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.96] ${
              current.isRejected
                ? 'border-error/80 bg-error/20 text-error'
                : 'border-white/15 bg-white/[0.06] text-white/45 hover:border-error/50 hover:text-error'
            }`}
            aria-label="Reject — keyboard: down arrow"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex min-w-0 max-w-lg flex-1 flex-wrap items-center justify-center gap-2 px-1">
          <label className="sr-only" htmlFor="photo-viewer-rename">
            Rename suggestion
          </label>
          <input
            id="photo-viewer-rename"
            data-photo-viewer-input
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            placeholder="Rename…"
            className="min-w-[12rem] flex-1 rounded-pill border-[1.5px] border-white/12 bg-white/[0.06] px-4 py-2.5 font-base text-sm text-white/90 placeholder:text-white/25 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/35"
            autoComplete="off"
          />
          {showRenameBtn ? (
            <button
              type="button"
              onClick={handleRenameSubmit}
              className="rounded-pill bg-action px-4 py-2.5 font-base text-sm font-semibold text-white transition-[background-color,transform,opacity] duration-150 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.97]"
            >
              Rename
            </button>
          ) : null}
        </div>
        <div className="w-28 shrink-0 max-[639px]:w-14" aria-hidden />
        </div>
      </div>

      <PhotoViewerInfoPanel
        open={detailOpen}
        photoId={current.id}
        token={token}
        memberNameByUserId={memberNameByUserId}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  )
}

PhotoViewerScreen.propTypes = {
  photos: PropTypes.arrayOf(photoPropShape).isRequired,
  token: PropTypes.string.isRequired,
  onRefresh: PropTypes.func.isRequired,
  collaboratorMembers: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired })
  ).isRequired,
}
