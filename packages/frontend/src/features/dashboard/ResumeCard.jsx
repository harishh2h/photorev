import { useEffect, useState } from 'react'
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
  const [fillPercent, setFillPercent] = useState(0)

  useEffect(() => {
    if (progressPercent <= 0) {
      setFillPercent(0)
      return
    }
    const timeoutId = window.setTimeout(() => {
      setFillPercent(progressPercent)
    }, 50)
    return () => window.clearTimeout(timeoutId)
  }, [progressPercent])
  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className={styles.imageWrap}>
        {coverImageUrl ? (
          <img src={coverImageUrl} alt="" />
        ) : (
          <div className="illustration-placeholder" aria-hidden />
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.projectName}>{projectName}</h3>
        <p className={styles.albumName}>{albumName || 'All photos'}</p>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <p className={styles.lastActive}>{lastActiveAt}</p>
        <button type="button" className={styles.resumeBtn}>
          Resume <span className={styles.resumeArrow}>→</span>
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
