import { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { fetchPhotoContentBlob } from '@/services/photoService.js'
import {
  buildAuthenticatedPhotoUrl,
  isPhotoSignedUrlsEnabled,
  peekAuthenticatedPhotoUrl,
} from '@/utils/photoContentUrl.js'
import {
  acquirePhotoContentUrl,
  peekPhotoContentUrl,
  releasePhotoContentUrl,
  storePhotoContentUrl,
} from '@/utils/photoContentCache.js'

const ORIGINAL_UPGRADE_MS = 5000

const fallbackClass =
  'min-h-full w-full flex-1 bg-[#EDF7F2] bg-[radial-gradient(circle_at_1px_1px,rgba(110,231,183,0.45)_1px,transparent_0)] bg-[length:14px_14px]'

const pendingShellClass = `${fallbackClass} flex items-center justify-center`

function revokeIfSet(urlRef) {
  if (urlRef.current) {
    URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
  }
}

async function resolvePreviewUrl(token, photoId, signedEnabled) {
  if (signedEnabled) {
    return (
      peekAuthenticatedPhotoUrl(photoId, 'preview') ||
      peekAuthenticatedPhotoUrl(photoId, 'thumbnail') ||
      (await buildAuthenticatedPhotoUrl(token, photoId, 'preview'))
    )
  }
  const cached = peekPhotoContentUrl(photoId, 'preview')
  if (cached) {
    acquirePhotoContentUrl(photoId, 'preview')
    return cached
  }
  const blob = await fetchPhotoContentBlob(token, photoId, { variant: 'preview' })
  const url = URL.createObjectURL(blob)
  storePhotoContentUrl(photoId, 'preview', url)
  acquirePhotoContentUrl(photoId, 'preview')
  return url
}

async function resolveOriginalUrl(token, photoId, signedEnabled) {
  if (signedEnabled) {
    return buildAuthenticatedPhotoUrl(token, photoId, 'original')
  }
  const blob = await fetchPhotoContentBlob(token, photoId, { variant: 'original' })
  return URL.createObjectURL(blob)
}

/**
 * Fullscreen viewer: preview first, upgrade to original after delay or on zoom / multi-touch / double-click.
 */
export default function PhotoViewerProgressiveImage({
  photoId,
  token,
  alt,
  status = 'ready',
  className = '',
}) {
  const [displayUrl, setDisplayUrl] = useState(null)
  const [hasError, setHasError] = useState(false)
  const cancelledForPhotoRef = useRef(false)
  const previewUrlRef = useRef(null)
  const originalUrlRef = useRef(null)
  const idleTimerRef = useRef(null)
  const originalDoneRef = useRef(false)
  const fetchingOriginalRef = useRef(false)
  const upgradeFnRef = useRef(async () => {})
  const signedEnabled = isPhotoSignedUrlsEnabled()

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current != null) {
      window.clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    cancelledForPhotoRef.current = false
    return () => {
      cancelledForPhotoRef.current = true
    }
  }, [photoId])

  useEffect(() => {
    clearIdleTimer()
    if (!signedEnabled) {
      revokeIfSet(previewUrlRef)
    }
    revokeIfSet(originalUrlRef)
    originalDoneRef.current = false
    fetchingOriginalRef.current = false
    setDisplayUrl(null)
    setHasError(false)

    if (status !== 'ready') {
      return undefined
    }

    async function upgradeToOriginal() {
      if (cancelledForPhotoRef.current || originalDoneRef.current || fetchingOriginalRef.current) {
        return
      }
      fetchingOriginalRef.current = true
      clearIdleTimer()
      try {
        const next = await resolveOriginalUrl(token, photoId, signedEnabled)
        if (cancelledForPhotoRef.current) {
          if (!signedEnabled && next.startsWith('blob:')) URL.revokeObjectURL(next)
          return
        }
        if (!signedEnabled) {
          revokeIfSet(originalUrlRef)
          originalUrlRef.current = next
        }
        originalDoneRef.current = true
        setDisplayUrl(next)
      } catch {
        /* keep preview */
      } finally {
        fetchingOriginalRef.current = false
      }
    }

    upgradeFnRef.current = async () => {
      await upgradeToOriginal()
    }

    void (async () => {
      try {
        const url = await resolvePreviewUrl(token, photoId, signedEnabled)
        if (cancelledForPhotoRef.current) return
        if (!signedEnabled) {
          previewUrlRef.current = url
        }
        setDisplayUrl(url)
        idleTimerRef.current = window.setTimeout(() => {
          void upgradeToOriginal()
        }, ORIGINAL_UPGRADE_MS)
      } catch {
        if (!cancelledForPhotoRef.current) setHasError(true)
      }
    })()

    return () => {
      clearIdleTimer()
      if (!signedEnabled) {
        revokeIfSet(previewUrlRef)
        releasePhotoContentUrl(photoId, 'preview')
      }
      revokeIfSet(originalUrlRef)
    }
  }, [photoId, token, status, clearIdleTimer, signedEnabled])

  const scheduleOriginalFromInteraction = useCallback(() => {
    void upgradeFnRef.current()
  }, [])

  const handleWheel = useCallback(
    (e) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      scheduleOriginalFromInteraction()
    },
    [scheduleOriginalFromInteraction],
  )

  const handleTouchStart = useCallback(
    (e) => {
      if (e.touches.length >= 2) {
        scheduleOriginalFromInteraction()
      }
    },
    [scheduleOriginalFromInteraction],
  )

  if (status === 'pending') {
    return (
      <div className={`${pendingShellClass} ${className}`.trim()} role="img" aria-label={`${alt} (processing)`}>
        <span className="loading loading-spinner loading-md text-accent" aria-hidden />
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div
        className={`${pendingShellClass} ${className}`.trim()}
        role="img"
        aria-label={`${alt} (processing failed)`}
      >
        <span className="px-3 text-center font-base text-xs font-medium text-muted">Preview unavailable</span>
      </div>
    )
  }

  if (hasError || !displayUrl) {
    return <div className={`${fallbackClass} ${className}`.trim()} role="img" aria-label={alt} />
  }

  return (
    <div
      className="flex w-full min-h-0 flex-1 flex-col items-center justify-center"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onDoubleClick={scheduleOriginalFromInteraction}
      role="presentation"
    >
      <img src={displayUrl} alt={alt} className={className} decoding="async" />
    </div>
  )
}

PhotoViewerProgressiveImage.propTypes = {
  photoId: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'ready', 'failed']),
  className: PropTypes.string,
}
