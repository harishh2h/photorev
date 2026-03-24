import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { fetchPhotoContentBlob } from '@/services/photoService.js'
import styles from './ProjectPhotoImage.module.css'

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
      <div
        className={`${styles.fallback} ${className}`.trim()}
        role="img"
        aria-label={alt}
      />
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
