import { useEffect, useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import { buildPublicPhotoUrl } from '@/services/publicShareService.js'
import PhotoViewerInfoPanel from '@/features/photo-viewer/PhotoViewerInfoPanel.jsx'

const lightboxIconBtnClass =
  'flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-pill border-[1.5px] border-white/15 bg-white/[0.04] text-white/55 transition-[color,background-color,border-color] duration-150 hover:border-white/25 hover:bg-white/[0.08] hover:text-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent'

/**
 * @param {{ token: string; unlockToken: string | null; photos: Array<{ id: string; originalName: string | null; width: number | null; height: number | null; fileSize: number | null; metadata: unknown }>; index: number; onClose: () => void; onChange: (next: number) => void; showMetadata: boolean }} props
 */
export default function PublicShareLightbox({
  token,
  unlockToken,
  photos,
  index,
  onClose,
  onChange,
  showMetadata,
}) {
  const [detailOpen, setDetailOpen] = useState(false)
  const total = photos.length
  const current = photos[index]
  const goPrev = useCallback(() => {
    if (index > 0) onChange(index - 1)
  }, [index, onChange])
  const goNext = useCallback(() => {
    if (index < total - 1) onChange(index + 1)
  }, [index, total, onChange])

  useEffect(() => {
    setDetailOpen(false)
  }, [index])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (detailOpen) {
          setDetailOpen(false)
          return
        }
        onClose()
      } else if (!detailOpen && e.key === 'ArrowLeft') goPrev()
      else if (!detailOpen && e.key === 'ArrowRight') goNext()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, goPrev, goNext, detailOpen])

  if (!current) return null

  const detailPhoto = {
    originalName: current.originalName,
    width: current.width,
    height: current.height,
    fileSize: current.fileSize,
    metadata: current.metadata,
  }

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-black pt-[env(safe-area-inset-top)]" role="presentation">
      <div className="absolute left-2 top-[max(0.5rem,env(safe-area-inset-top))] z-10 md:left-4">
        <button
          type="button"
          onClick={onClose}
          className={lightboxIconBtnClass}
          aria-label="Close fullscreen"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {showMetadata ? (
        <div className="absolute right-2 top-[max(0.5rem,env(safe-area-inset-top))] z-10 flex items-center gap-2 md:right-4">
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className={lightboxIconBtnClass}
            aria-label="Photo details"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 10v6M11 8.5h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 items-center justify-center px-3 pb-24 pt-16 sm:px-6">
        <img
          src={buildPublicPhotoUrl(token, current.id, 'preview', unlockToken)}
          alt={current.originalName || 'Shared photo'}
          className="max-h-[min(calc(100dvh-10rem),calc(100vh-10rem))] w-auto max-w-full object-contain"
        />
      </div>

      <div className="flex items-center justify-between px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 md:px-6">
        <button
          type="button"
          onClick={goPrev}
          disabled={index <= 0}
          className="inline-flex h-12 min-w-[48px] items-center justify-center rounded-pill border-[1.5px] border-white/15 bg-white/[0.04] text-white/70 transition-[opacity,color,background-color,border-color] duration-150 hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous photo"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M15 6L9 12l6 6" />
          </svg>
        </button>
        <span className="truncate px-2 font-base text-xs text-white/55">
          {current.originalName || 'Photo'}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={index >= total - 1}
          className="inline-flex h-12 min-w-[48px] items-center justify-center rounded-pill border-[1.5px] border-white/15 bg-white/[0.04] text-white/70 transition-[opacity,color,background-color,border-color] duration-150 hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next photo"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      {showMetadata ? (
        <PhotoViewerInfoPanel
          open={detailOpen}
          photo={detailPhoto}
          onClose={() => setDetailOpen(false)}
          canReviewPhotos={false}
        />
      ) : null}
    </div>
  )
}

PublicShareLightbox.propTypes = {
  token: PropTypes.string.isRequired,
  unlockToken: PropTypes.string,
  photos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      originalName: PropTypes.string,
      width: PropTypes.number,
      height: PropTypes.number,
      fileSize: PropTypes.number,
      metadata: PropTypes.any,
    })
  ).isRequired,
  index: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  showMetadata: PropTypes.bool.isRequired,
}
