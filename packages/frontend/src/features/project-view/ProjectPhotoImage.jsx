import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useInViewport } from '@/hooks/useInViewport.js'
import { fetchPhotoContentBlob } from '@/services/photoService.js'
import {
  acquirePhotoContentUrl,
  peekPhotoContentUrl,
  releasePhotoContentUrl,
  storePhotoContentUrl,
} from '@/utils/photoContentCache.js'
import {
  buildAuthenticatedPhotoUrl,
  isPhotoLazyLoadEnabled,
  isPhotoSignedUrlsEnabled,
} from '@/utils/photoContentUrl.js'
import { BlurhashPlaceholder } from '@/components/BlurhashPlaceholder/index.js'
import {
  GRID_TILE_FILL_CLASS,
  GRID_TILE_IMAGE_CLASS,
  GRID_TILE_PENDING_SHELL_CLASS,
  GRID_TILE_PLACEHOLDER_SHELL_CLASS,
  GRID_TILE_SHELL_CLASS,
} from '@/components/photo-grid/gridPhotoTileStyles.js'

/**
 * @param {{ photoId: string; token: string; alt: string; status?: 'pending' | 'ready' | 'failed'; className?: string; contentVariant?: 'thumbnail' | 'preview' | 'original'; blurhash?: string | null; fillSlot?: boolean }} props
 */
export default function ProjectPhotoImage({
  photoId,
  token,
  alt,
  status = 'ready',
  className = '',
  contentVariant = 'thumbnail',
  blurhash = null,
  fillSlot = true,
}) {
  const lazyEnabled = isPhotoLazyLoadEnabled()
  const signedEnabled = isPhotoSignedUrlsEnabled()
  const { ref, isInViewport } = useInViewport({ enabled: lazyEnabled && status === 'ready' })
  const [displayUrl, setDisplayUrl] = useState(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const shouldLoad = status === 'ready' && (!lazyEnabled || isInViewport)

  const rootClassName = fillSlot ? GRID_TILE_FILL_CLASS : 'relative h-full w-full min-h-0'

  useEffect(() => {
    setDisplayUrl(null)
    setImageLoaded(false)
    setHasError(false)
  }, [photoId, contentVariant, status])

  useEffect(() => {
    if (!shouldLoad) {
      return undefined
    }

    if (signedEnabled) {
      let cancelled = false
      buildAuthenticatedPhotoUrl(token, photoId, contentVariant)
        .then((url) => {
          if (!cancelled && url) setDisplayUrl(url)
        })
        .catch(() => {
          if (!cancelled) setHasError(true)
        })
      return () => {
        cancelled = true
      }
    }

    const cached = peekPhotoContentUrl(photoId, contentVariant)
    if (cached) {
      acquirePhotoContentUrl(photoId, contentVariant)
      setDisplayUrl(cached)
      return () => releasePhotoContentUrl(photoId, contentVariant)
    }

    const controller = new AbortController()
    let didAcquire = false
    fetchPhotoContentBlob(token, photoId, { variant: contentVariant, signal: controller.signal })
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        storePhotoContentUrl(photoId, contentVariant, url)
        acquirePhotoContentUrl(photoId, contentVariant)
        didAcquire = true
        setDisplayUrl(url)
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setHasError(true)
      })

    return () => {
      controller.abort()
      if (didAcquire) {
        releasePhotoContentUrl(photoId, contentVariant)
      }
    }
  }, [photoId, token, shouldLoad, contentVariant, signedEnabled])

  if (status === 'pending') {
    return (
      <div className={`${rootClassName} ${GRID_TILE_PENDING_SHELL_CLASS}`} role="img" aria-label={`${alt} (processing)`}>
        <span className="loading loading-spinner loading-md text-accent" aria-hidden />
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className={`${rootClassName} ${GRID_TILE_PENDING_SHELL_CLASS}`} role="img" aria-label={`${alt} (processing failed)`}>
        <span className="px-3 text-center font-base text-xs font-medium text-muted">Preview unavailable</span>
      </div>
    )
  }

  const showBlurhash = Boolean(blurhash) && !imageLoaded && !hasError

  if (hasError && !displayUrl) {
    return (
      <div className={`${rootClassName} ${GRID_TILE_PLACEHOLDER_SHELL_CLASS}`} role="img" aria-label={alt} />
    )
  }

  return (
    <div ref={ref} className={`${rootClassName} ${GRID_TILE_PLACEHOLDER_SHELL_CLASS}`}>
      {showBlurhash ? (
        <BlurhashPlaceholder hash={blurhash} className="absolute inset-0 h-full w-full" alt={alt} />
      ) : null}
      {!displayUrl && !showBlurhash ? (
        <div className={`${GRID_TILE_PLACEHOLDER_SHELL_CLASS} absolute inset-0`} role="img" aria-label={alt} />
      ) : null}
      {displayUrl ? (
        <div className={`${GRID_TILE_SHELL_CLASS} absolute inset-0`}>
          <img
            src={displayUrl}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setHasError(true)}
            className={`${GRID_TILE_IMAGE_CLASS} transition-opacity duration-200 ${className} ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`.trim()}
          />
        </div>
      ) : null}
    </div>
  )
}

ProjectPhotoImage.propTypes = {
  photoId: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'ready', 'failed']),
  className: PropTypes.string,
  contentVariant: PropTypes.oneOf(['thumbnail', 'preview', 'original']),
  blurhash: PropTypes.string,
  fillSlot: PropTypes.bool,
}
