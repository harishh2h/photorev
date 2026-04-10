import PropTypes from 'prop-types'
import AuthenticatedPhotoImage from '@/components/AuthenticatedPhotoImage'
import styles from './LibraryCard.module.css'

export default function LibraryCard({
  name,
  status,
  subtitle,
  coverPhotoId = '',
  authToken = '',
  coverImageUrl = '',
  animationDelay = 0,
}) {
  const usePhoto =
    typeof coverPhotoId === 'string' && coverPhotoId.length > 0 && typeof authToken === 'string' && authToken.length > 0
  const legacyUrl = typeof coverImageUrl === 'string' && coverImageUrl.length > 0 ? coverImageUrl : ''
  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className={styles.imageWrap}>
        {usePhoto ? (
          <AuthenticatedPhotoImage
            photoId={coverPhotoId}
            token={authToken}
            legacyImageUrl={legacyUrl}
            placeholderClassName={styles.imagePlaceholder}
            alt=""
          />
        ) : legacyUrl.length > 0 ? (
          <img src={legacyUrl} alt="" />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden />
        )}
      </div>
      <div className={styles.content}>
        <span className={styles.tag}>{status}</span>
        <h3 className={styles.projectName}>{name}</h3>
        <p className={styles.meta}>• {subtitle}</p>
      </div>
    </article>
  )
}

LibraryCard.propTypes = {
  name: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  coverPhotoId: PropTypes.string,
  authToken: PropTypes.string,
  coverImageUrl: PropTypes.string,
  animationDelay: PropTypes.number,
}
