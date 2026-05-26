import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import PropTypes from 'prop-types'
import PhotoViewerProgressiveImage from '@/features/photo-viewer/PhotoViewerProgressiveImage.jsx'
import PhotoViewerInfoPanel from '@/features/photo-viewer/PhotoViewerInfoPanel.jsx'
import PhotoViewerSwipeCard from '@/features/photo-viewer/PhotoViewerSwipeCard.jsx'
import PhotoViewerMobileNav from '@/features/photo-viewer/PhotoViewerMobileNav.jsx'
import PhotoViewerReviewControls from '@/features/photo-viewer/PhotoViewerReviewControls.jsx'
import { usePhotoViewerShortcuts } from '@/features/photo-viewer/usePhotoViewerShortcuts.js'
import { upsertPhotoReview } from '@/services/photoReviewService.js'
import { useToast } from '@/components/Toast/index.js'
import { useBreakpoint } from '@/hooks/useBreakpoint.js'

const photoPropShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'ready', 'failed']),
  isLiked: PropTypes.bool.isRequired,
  isRejected: PropTypes.bool.isRequired,
  renamedTo: PropTypes.string,
  selectionLabel: PropTypes.string,
})

const imageClassName =
  'max-h-[min(calc(100dvh-10rem),calc(100vh-10rem))] w-auto max-w-full object-contain'

/**
 * @param {{ photos: object[]; token: string; onRefresh: () => void; collaboratorMembers: Array<{ id: string; name: string }>; canReviewPhotos?: boolean }} props
 */
export default function PhotoViewerScreen({
  photos,
  token,
  onRefresh,
  collaboratorMembers,
  canReviewPhotos = true,
}) {
  const { projectId, photoId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { show: showToast } = useToast()
  const { isMobile } = useBreakpoint()
  const [detailOpen, setDetailOpen] = useState(false)
  const [renameDraft, setRenameDraft] = useState('')
  const [renameFocused, setRenameFocused] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [localPhotos, setLocalPhotos] = useState(photos)
  const [liveMessage, setLiveMessage] = useState('')
  const isSavingRef = useRef(false)

  useEffect(() => {
    setLocalPhotos(photos)
  }, [photos])

  const navState = location.state
  const index = localPhotos.findIndex((p) => p.id === photoId)
  const current = index >= 0 ? localPhotos[index] : null
  const total = localPhotos.length
  const canGoPrev = index > 0
  const canGoNext = index >= 0 && index < total - 1

  useEffect(() => {
    if (current) {
      setRenameDraft(current.renamedTo ?? '')
    }
    setLiveMessage('')
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
      if (!photoId || !token || !canReviewPhotos) return false
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
        return true
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not save', 'error')
        return false
      }
    },
    [canReviewPhotos, onRefresh, patchCurrent, photoId, showToast, token]
  )

  const onLike = useCallback(() => {
    void saveReview({ decision: 1 })
  }, [saveReview])

  const onReject = useCallback(() => {
    void saveReview({ decision: -1 })
  }, [saveReview])

  const onLikeAndNext = useCallback(async () => {
    if (isSavingRef.current) return false
    isSavingRef.current = true
    setIsSaving(true)
    try {
      const ok = await saveReview({ decision: 1 })
      if (ok) {
        setLiveMessage('Photo liked')
        goNext()
      }
      return ok
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }, [goNext, saveReview])

  const onRejectAndNext = useCallback(async () => {
    if (isSavingRef.current) return false
    isSavingRef.current = true
    setIsSaving(true)
    try {
      const ok = await saveReview({ decision: -1 })
      if (ok) {
        setLiveMessage('Photo rejected')
        goNext()
      }
      return ok
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }, [goNext, saveReview])

  const handleRenameSubmit = useCallback(() => {
    const trimmed = renameDraft.trim()
    void saveReview({ renamedTo: trimmed.length > 0 ? trimmed : null })
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
    enabled: Boolean(photoId && current) && !isMobile,
    canReview: canReviewPhotos,
  })

  const swipeEnabled =
    isMobile &&
    Boolean(current) &&
    !detailOpen &&
    !renameFocused &&
    !isSaving

  if (!current) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black px-4 font-base text-sm text-white/50">
        {localPhotos.length === 0 ? 'No photos in this view.' : 'Loading…'}
      </div>
    )
  }

  const imageNode = (
    <PhotoViewerProgressiveImage
      photoId={current.id}
      token={token}
      alt={current.alt}
      status={current.status}
      className={imageClassName}
    />
  )

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

      <div className={`flex min-h-0 flex-1 items-center justify-center px-3 pt-16 sm:px-6 ${isMobile ? 'pb-44' : 'pb-36'}`}>
        {isMobile ? (
          <PhotoViewerSwipeCard
            enabled={swipeEnabled}
            canVote={canReviewPhotos}
            isSaving={isSaving}
            onLikeAndNext={onLikeAndNext}
            onRejectAndNext={onRejectAndNext}
            goNext={goNext}
            goPrev={goPrev}
          >
            {imageNode}
          </PhotoViewerSwipeCard>
        ) : (
          imageNode
        )}
      </div>

      {isMobile && canReviewPhotos ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+11.5rem)] z-10 px-6 text-center font-base text-xs text-white/35">
          Swipe right to like, left to reject. Swipe up or down to browse.
        </p>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <div className="pointer-events-auto flex w-full flex-col gap-3 px-3 sm:px-6">
          {isMobile ? (
            <>
              <PhotoViewerMobileNav
                index={index}
                total={total}
                onPrev={goPrev}
                onNext={goNext}
                canGoPrev={canGoPrev}
                canGoNext={canGoNext}
                disabled={isSaving}
              />
              {canReviewPhotos ? (
                <PhotoViewerReviewControls
                  isLiked={current.isLiked}
                  isRejected={current.isRejected}
                  renameDraft={renameDraft}
                  onRenameChange={setRenameDraft}
                  onRenameSubmit={handleRenameSubmit}
                  onLike={onLike}
                  onReject={onReject}
                  canReviewPhotos={canReviewPhotos}
                  layout="mobile"
                  onRenameFocusChange={setRenameFocused}
                />
              ) : (
                <p className="mx-auto mb-1 max-w-lg rounded-full border-[1.5px] border-accent/45 bg-accent/15 px-5 py-3 text-center font-base text-sm font-medium leading-snug text-accent">
                  View-only — favorites and rename are disabled for your role on this project.
                </p>
              )}
            </>
          ) : (
            <PhotoViewerReviewControls
              isLiked={current.isLiked}
              isRejected={current.isRejected}
              renameDraft={renameDraft}
              onRenameChange={setRenameDraft}
              onRenameSubmit={handleRenameSubmit}
              onLike={onLike}
              onReject={onReject}
              canReviewPhotos={canReviewPhotos}
              layout="desktop"
              onRenameFocusChange={setRenameFocused}
            />
          )}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>

      <PhotoViewerInfoPanel
        open={detailOpen}
        photoId={current.id}
        token={token}
        memberNameByUserId={memberNameByUserId}
        canReviewPhotos={canReviewPhotos}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  )
}

PhotoViewerScreen.propTypes = {
  photos: PropTypes.arrayOf(photoPropShape).isRequired,
  token: PropTypes.string.isRequired,
  onRefresh: PropTypes.func.isRequired,
  canReviewPhotos: PropTypes.bool,
  collaboratorMembers: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired })
  ).isRequired,
}
