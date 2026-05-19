import { useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  buildPublicDownloadUrl,
  buildPublicPhotoUrl,
} from '@/services/publicShareService.js'

/**
 * @param {{ token: string; unlockToken: string | null; photos: Array<{ id: string; originalName: string | null; width: number | null; height: number | null; fileSize: number | null; metadata: unknown }>; index: number; onClose: () => void; onChange: (next: number) => void; allowDownload: boolean; showMetadata: boolean }} props
 */
export default function PublicShareLightbox({
  token,
  unlockToken,
  photos,
  index,
  onClose,
  onChange,
  allowDownload,
  showMetadata,
}) {
  const total = photos.length
  const current = photos[index]
  const goPrev = useCallback(() => {
    if (index > 0) onChange(index - 1)
  }, [index, onChange])
  const goNext = useCallback(() => {
    if (index < total - 1) onChange(index + 1)
  }, [index, total, onChange])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, goPrev, goNext])

  if (!current) return null

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-black pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 min-w-[44px] items-center gap-2 rounded-pill border-[1.5px] border-white/15 bg-white/[0.04] px-3 text-white/70 transition-[color,background-color,border-color] duration-150 hover:border-white/30 hover:text-white"
          aria-label="Close fullscreen"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <span className="font-base text-xs text-white/55">
          {index + 1} / {total}
        </span>
        {allowDownload ? (
          <a
            href={buildPublicDownloadUrl(token, current.id, unlockToken)}
            download={current.originalName || `photo-${current.id}.jpg`}
            className="inline-flex h-11 min-w-[44px] items-center gap-2 rounded-pill border-[1.5px] border-accent/55 bg-accent/15 px-4 font-base text-sm font-semibold text-accent transition-[background-color,border-color] duration-150 hover:bg-accent/25"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 4v12M6 12l6 6 6-6M5 21h14" />
            </svg>
            Download
          </a>
        ) : (
          <span className="h-11 w-11" aria-hidden />
        )}
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-3 pb-6 sm:px-6">
        <img
          src={buildPublicPhotoUrl(token, current.id, 'preview', unlockToken)}
          alt={current.originalName || 'Shared photo'}
          className="max-h-[calc(100dvh-10rem)] w-auto max-w-full object-contain"
        />
      </div>
      {showMetadata && current.metadata && typeof current.metadata === 'object' ? (
        <div className="border-t border-white/[0.08] px-5 py-3 font-base text-xs text-white/55">
          <pre className="m-0 max-h-32 overflow-auto whitespace-pre-wrap break-all">
            {JSON.stringify(current.metadata, null, 2)}
          </pre>
        </div>
      ) : null}
      <div className="flex items-center justify-between px-4 pb-6 pt-2 md:px-6">
        <button
          type="button"
          onClick={goPrev}
          disabled={index <= 0}
          className="inline-flex h-12 min-w-[48px] items-center justify-center rounded-pill border-[1.5px] border-white/15 bg-white/[0.04] text-white/70 transition-[opacity,color,background-color] duration-150 hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous photo"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M15 6L9 12l6 6" />
          </svg>
        </button>
        <span className="truncate font-base text-xs text-white/55">
          {current.originalName || 'Photo'}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={index >= total - 1}
          className="inline-flex h-12 min-w-[48px] items-center justify-center rounded-pill border-[1.5px] border-white/15 bg-white/[0.04] text-white/70 transition-[opacity,color,background-color] duration-150 hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next photo"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
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
  allowDownload: PropTypes.bool.isRequired,
  showMetadata: PropTypes.bool.isRequired,
}
