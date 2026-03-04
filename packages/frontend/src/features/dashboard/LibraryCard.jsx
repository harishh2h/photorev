import PropTypes from 'prop-types'
import styles from './LibraryCard.module.css'

export default function LibraryCard({
  name,
  photoCount,
  createdAt,
  status,
  coverImageUrls = [],
  animationDelay = 0,
}) {
  const hasPhotos = coverImageUrls.length > 0
  const isSingle = coverImageUrls.length === 1
  const displayUrls = coverImageUrls.slice(0, 4)
  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className={styles.imageWrap}>
        {!hasPhotos && <div className={styles.placeholder} aria-hidden />}
        {hasPhotos && isSingle && (
          <div className={styles.imageGridSingle}>
            <img src={displayUrls[0]} alt="" />
          </div>
        )}
        {hasPhotos && !isSingle && (
          <div className={styles.imageGrid}>
            {displayUrls.map((url, i) => (
              <img key={i} src={url} alt="" />
            ))}
          </div>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.projectName}>{name}</h3>
        <p className={styles.meta}>
          {photoCount} photo{photoCount !== 1 ? 's' : ''} · {createdAt}
        </p>
        <div className={styles.tags}>
          <span className={styles.tag}>{status}</span>
        </div>
      </div>
    </article>
  )
}

LibraryCard.propTypes = {
  name: PropTypes.string.isRequired,
  photoCount: PropTypes.number.isRequired,
  createdAt: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  coverImageUrls: PropTypes.arrayOf(PropTypes.string),
  animationDelay: PropTypes.number,
}
