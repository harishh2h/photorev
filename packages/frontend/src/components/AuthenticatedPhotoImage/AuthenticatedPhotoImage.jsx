import PropTypes from 'prop-types'
import { usePhotoContentBlobUrl } from '@/hooks/usePhotoContentBlobUrl.js'
import styles from './AuthenticatedPhotoImage.module.css'

/**
 * Renders a photo preview from GET /photos/:id/content (auth). Falls back to legacy absolute URL when provided.
 */
export default function AuthenticatedPhotoImage({
  photoId = '',
  token = '',
  legacyImageUrl = '',
  placeholderClassName = '',
  imgClassName = '',
  alt = '',
}) {
  const { objectUrl, isLoading } = usePhotoContentBlobUrl(
    typeof photoId === 'string' && photoId.length > 0 ? photoId : null,
    typeof token === 'string' && token.length > 0 ? token : null,
  )
  const legacy =
    typeof legacyImageUrl === 'string' && legacyImageUrl.length > 0 ? legacyImageUrl : ''
  const src = objectUrl || legacy
  if (!src && isLoading) {
    return <div className={`${styles.loading} ${placeholderClassName}`.trim()} aria-hidden />
  }
  if (!src) {
    return <div className={placeholderClassName} aria-hidden />
  }
  return <img src={src} alt={alt} className={imgClassName} />
}

AuthenticatedPhotoImage.propTypes = {
  photoId: PropTypes.string,
  token: PropTypes.string,
  legacyImageUrl: PropTypes.string,
  placeholderClassName: PropTypes.string,
  imgClassName: PropTypes.string,
  alt: PropTypes.string,
}
