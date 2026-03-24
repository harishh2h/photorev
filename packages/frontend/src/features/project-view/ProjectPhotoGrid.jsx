import PropTypes from 'prop-types'
import ProjectPhotoImage from './ProjectPhotoImage.jsx'
import styles from './ProjectPhotoGrid.module.css'

/**
 * @param {{ photos: Array<{ id: string; alt: string; isLiked: boolean; isRejected: boolean; selectionLabel: string | null }>; token: string }} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectPhotoGrid({ photos, token }) {
  return (
    <ul className={styles.grid}>
      {photos.map((photo, index) => (
        <li
          key={photo.id}
          className={styles.cell}
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <article
            className={`${styles.card} ${photo.isRejected ? styles.cardRejected : ''}`}
          >
            <div className={styles.imageWrap}>
              <ProjectPhotoImage
                photoId={photo.id}
                token={token}
                alt={photo.alt}
                className={styles.image}
              />
              <div className={styles.cornerBadges}>
                {photo.isLiked ? (
                  <span className={`${styles.cornerIcon} ${styles.cornerLiked}`} aria-label="Liked">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </span>
                ) : null}
                {photo.isRejected ? (
                  <span className={`${styles.cornerIcon} ${styles.cornerRejected}`} aria-label="Rejected">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </span>
                ) : null}
              </div>
            </div>
            {photo.selectionLabel ? (
              <div className={styles.selectionPill}>
                <span className={styles.selectionIcon} aria-hidden>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </span>
                {photo.selectionLabel}
              </div>
            ) : null}
          </article>
        </li>
      ))}
    </ul>
  )
}

ProjectPhotoGrid.propTypes = {
  token: PropTypes.string.isRequired,
  photos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      alt: PropTypes.string.isRequired,
      isLiked: PropTypes.bool.isRequired,
      isRejected: PropTypes.bool.isRequired,
      selectionLabel: PropTypes.string,
    })
  ).isRequired,
}
