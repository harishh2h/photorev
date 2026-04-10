import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { fetchPhotoContentBlob } from '@/services/photoService.js'

const fallbackClass =
  'min-h-full w-full flex-1 bg-[#EDF7F2] bg-[radial-gradient(circle_at_1px_1px,rgba(110,231,183,0.45)_1px,transparent_0)] bg-[length:14px_14px]'

/**
 * @param {{ photoId: string; token: string; alt: string; className?: string }} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectPhotoImage({ photoId, token, alt, className = '' }) {
  const [objectUrl, setObjectUrl] = useState(null)
  const [hasError, setHasError] = useState(false)
  useEffect(() => {
    let url = null
    let alive = true
    setHasError(false)
    setObjectUrl(null)
    fetchPhotoContentBlob(token, photoId)
      .then((blob) => {
        url = URL.createObjectURL(blob)
        if (alive) setObjectUrl(url)
      })
      .catch(() => {
        if (alive) setHasError(true)
      })
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [photoId, token])
  if (hasError || !objectUrl) {
    return (
      <div className={`${fallbackClass} ${className}`.trim()} role="img" aria-label={alt} />
    )
  }
  return <img src={objectUrl} alt={alt} className={className} />
}

ProjectPhotoImage.propTypes = {
  photoId: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
}
