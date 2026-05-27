import { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import { downloadPhotoOriginal } from '@/features/photo-viewer/photoDownload.js'
import {
  viewerChromeMutedTextClass,
  viewerChromePillClass,
} from '@/features/photo-viewer/viewerChromeStyles.js'

const btnClass = `flex h-11 min-h-[44px] min-w-[44px] items-center justify-center ${viewerChromePillClass} ${viewerChromeMutedTextClass} transition-[color,background-color,border-color,opacity] duration-150 hover:border-white/25 hover:bg-white/[0.08] hover:text-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40`

/**
 * Top-bar download: saves the original file for any project member role.
 */
export default function PhotoViewerDownloadControl({ photoId, filename, token, onError }) {
  const [busy, setBusy] = useState(false)

  const handleDownload = useCallback(async () => {
    if (busy) return
    setBusy(true)
    try {
      await downloadPhotoOriginal({ token, photoId, filename })
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error('Could not download photo'))
    } finally {
      setBusy(false)
    }
  }, [busy, filename, onError, photoId, token])

  return (
    <button
      type="button"
      onClick={() => {
        void handleDownload()
      }}
      disabled={busy}
      className={btnClass}
      aria-label={busy ? 'Preparing download…' : 'Download photo'}
      aria-busy={busy}
    >
      {busy ? (
        <span className="loading loading-spinner loading-sm text-accent" aria-hidden />
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 4v12M6 12l6 6 6-6M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

PhotoViewerDownloadControl.propTypes = {
  photoId: PropTypes.string.isRequired,
  filename: PropTypes.string,
  token: PropTypes.string.isRequired,
  onError: PropTypes.func,
}
