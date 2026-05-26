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

const fallbackClass =
  'min-h-full w-full flex-1 bg-[#EDF7F2] bg-[radial-gradient(circle_at_1px_1px,rgba(110,231,183,0.45)_1px,transparent_0)] bg-[length:14px_14px]'

const pendingShellClass = `${fallbackClass} flex items-center justify-center`

/**
 * @param {{ photoId: string; token: string; alt: string; status?: 'pending' | 'ready' | 'failed'; className?: string; contentVariant?: 'thumbnail' | 'preview' | 'original'; blurhash?: string | null }} props
 */
export default function ProjectPhotoImage({
  photoId,
  token,
  alt,
  status = 'ready',
  className = '',
  contentVariant = 'thumbnail',
  blurhash = null,
}) {
  const lazyEnabled = isPhotoLazyLoadEnabled()
  const signedEnabled = isPhotoSignedUrlsEnabled()
  const { ref, isInViewport } = useInViewport({ enabled: lazyEnabled && status === 'ready' })
  const [displayUrl, setDisplayUrl] = useState(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const shouldLoad = status === 'ready' && (!lazyEnabled || isInViewport)

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

  const showBlurhash = Boolean(blurhash) && !imageLoaded && !hasError

  if (hasError && !displayUrl) {
    return <div className={`${fallbackClass} ${className}`.trim()} role="img" aria-label={alt} />
  }

  return (
    <div ref={ref} className="relative h-full w-full">
      {showBlurhash ? (
        <BlurhashPlaceholder hash={blurhash} className="absolute inset-0 h-full w-full" alt={alt} />
      ) : null}
      {!displayUrl ? (
        !showBlurhash ? (
          <div className={`${fallbackClass} h-full w-full ${className}`.trim()} role="img" aria-label={alt} />
        ) : (
          <div className={`h-full w-full ${className}`.trim()} aria-hidden />
        )
      ) : (
        <img
          src={displayUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setHasError(true)}
          className={`block h-full w-full object-cover transition-opacity duration-200 ${className} ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`.trim()}
        />
      )}
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
}
