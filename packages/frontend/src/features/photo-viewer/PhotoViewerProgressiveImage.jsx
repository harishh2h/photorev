import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { getViewerImagePresentation } from '@/features/photo-viewer/viewerImageLayout.js'
import { useViewerStageSize } from '@/features/photo-viewer/useViewerStageSize.js'
import { resolveOriginalUrl, resolvePreviewUrl } from '@/features/photo-viewer/photoContentLoader.js'
import { isPhotoSignedUrlsEnabled } from '@/utils/photoContentUrl.js'
import { releasePhotoContentUrl } from '@/utils/photoContentCache.js'

const ORIGINAL_UPGRADE_MS = 3000

const fallbackClass =
  'min-h-full w-full flex-1 bg-[#EDF7F2] bg-[radial-gradient(circle_at_1px_1px,rgba(110,231,183,0.45)_1px,transparent_0)] bg-[length:14px_14px]'

const pendingShellClass = `${fallbackClass} flex items-center justify-center`

function releaseBlobVariant(photoId, variant) {
  releasePhotoContentUrl(photoId, variant)
}

/**
 * Fullscreen viewer: preview first, upgrade to original after delay or on zoom / multi-touch / double-click.
 */
export default function PhotoViewerProgressiveImage({
  photoId,
  token,
  alt,
  status = 'ready',
  width = null,
  height = null,
  className = '',
}) {
  const [displayUrl, setDisplayUrl] = useState(null)
  const [hasError, setHasError] = useState(false)
  const cancelledForPhotoRef = useRef(false)
  const idleTimerRef = useRef(null)
  const originalDoneRef = useRef(false)
  const fetchingOriginalRef = useRef(false)
  const upgradeFnRef = useRef(async () => {})
  const signedEnabled = isPhotoSignedUrlsEnabled()
  const { stageRef, stageWidth, stageHeight } = useViewerStageSize()

  const presentation = useMemo(
    () => getViewerImagePresentation(width, height, stageWidth, stageHeight),
    [width, height, stageWidth, stageHeight],
  )

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
          if (!signedEnabled) {
            releaseBlobVariant(photoId, 'original')
          }
          return
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
        if (cancelledForPhotoRef.current) {
          if (!signedEnabled) {
            releaseBlobVariant(photoId, 'preview')
          }
          return
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
        releaseBlobVariant(photoId, 'preview')
        releaseBlobVariant(photoId, 'original')
      }
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

  const interactionProps = {
    onWheel: handleWheel,
    onTouchStart: handleTouchStart,
    onDoubleClick: scheduleOriginalFromInteraction,
  }

  const frameClassName = `${presentation.frameClassName} ${className}`.trim()

  const renderFrame = (content) => (
    <div ref={stageRef} className={frameClassName} role="presentation" {...interactionProps}>
      {content}
    </div>
  )

  if (status === 'pending') {
    return renderFrame(
      <div className={`${pendingShellClass} h-full w-full`.trim()} role="img" aria-label={`${alt} (processing)`}>
        <span className="loading loading-spinner loading-md text-accent" aria-hidden />
      </div>,
    )
  }

  if (status === 'failed') {
    return renderFrame(
      <div
        className={`${pendingShellClass} h-full w-full`.trim()}
        role="img"
        aria-label={`${alt} (processing failed)`}
      >
        <span className="px-3 text-center font-base text-xs font-medium text-muted">Preview unavailable</span>
      </div>,
    )
  }

  if (hasError || !displayUrl) {
    return renderFrame(
      <div className={`${fallbackClass} h-full w-full`.trim()} role="img" aria-label={alt} />,
    )
  }

  return renderFrame(
    <img
      src={displayUrl}
      alt={alt}
      width={width ?? undefined}
      height={height ?? undefined}
      className={presentation.imgClassName}
      style={presentation.imgStyle}
      decoding="async"
    />,
  )
}

PhotoViewerProgressiveImage.propTypes = {
  photoId: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'ready', 'failed']),
  width: PropTypes.number,
  height: PropTypes.number,
  className: PropTypes.string,
}
