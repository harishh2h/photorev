import PropTypes from 'prop-types'
import styles from './ResumeCard.module.css'

export default function ResumeCard({
  projectName,
  albumName,
  coverImageUrl,
  selectedCount,
  totalCount,
  lastActiveAt,
  animationDelay = 0,
}) {
  const progressPercent = totalCount > 0 ? (selectedCount / totalCount) * 100 : 0
  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className={styles.imageWrap}>
        {coverImageUrl ? (
          <img src={coverImageUrl} alt="" />
        ) : (
          <div className={styles.placeholder} aria-hidden />
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.projectName}>{projectName}</h3>
        <p className={styles.albumName}>{albumName || 'All photos'}</p>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className={styles.lastActive}>{lastActiveAt}</p>
        <button type="button" className={styles.resumeBtn}>
          Resume →
        </button>
      </div>
    </article>
  )
}

ResumeCard.propTypes = {
  projectName: PropTypes.string.isRequired,
  albumName: PropTypes.string,
  coverImageUrl: PropTypes.string,
  selectedCount: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  lastActiveAt: PropTypes.string.isRequired,
  animationDelay: PropTypes.number,
}
