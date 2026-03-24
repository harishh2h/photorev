import PropTypes from 'prop-types'
import styles from './LibraryCard.module.css'

export default function LibraryCard({
  name,
  status,
  subtitle,
  coverImageUrl = '',
  animationDelay = 0,
}) {
  const hasCover = typeof coverImageUrl === 'string' && coverImageUrl.length > 0
  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className={styles.imageWrap}>
        {hasCover ? (
          <img src={coverImageUrl} alt="" />
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
  coverImageUrl: PropTypes.string,
  animationDelay: PropTypes.number,
}
