import PropTypes from 'prop-types'
import styles from './DashboardHero.module.css'

export default function DashboardHero({
  displayName = 'there',
  activeSessionCount = 0,
  pendingReviews = 0,
  featuredProject,
  recentActivity = [],
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.greeting}>Good morning, {displayName}.</h1>
          <p className={styles.subtitle}>
            {activeSessionCount} sessions active, <span>{pendingReviews} need attention.</span>
          </p>
        </div>
        <button type="button" className={styles.newProjectBtn}>
          + New Project
        </button>
      </div>
      <div className={styles.overviewGrid}>
        <article className={styles.featuredCard}>
          <div className={styles.featuredImageWrap}>
            <img src={featuredProject.coverImageUrl} alt="" />
            <span className={styles.reviewBadge}>IN REVIEW</span>
          </div>
          <div className={styles.featuredContent}>
            <h2 className={styles.featuredTitle}>{featuredProject.name}</h2>
            <p className={styles.featuredDescription}>{featuredProject.description}</p>
            <div className={styles.metrics}>
              <div>
                <p className={styles.metricValue}>{featuredProject.totalPhotos}</p>
                <p className={styles.metricLabel}>TOTAL PHOTOS</p>
              </div>
              <div>
                <p className={`${styles.metricValue} ${styles.metricWarning}`}>{featuredProject.flaggedPhotos}</p>
                <p className={styles.metricLabel}>FLAGGED</p>
              </div>
            </div>
            <button type="button" className={styles.continueBtn}>
              Continue Review <span aria-hidden>→</span>
            </button>
          </div>
        </article>
        <aside className={styles.activityCard}>
          <h3 className={styles.activityTitle}>Recent Activity</h3>
          <div className={styles.activityList}>
            {recentActivity.map((entry) => (
              <div key={entry.id} className={styles.activityItem}>
                <span className={styles.activityAvatar}>{entry.actorInitial}</span>
                <div>
                  <p className={styles.activityText}>{entry.message}</p>
                  <p className={styles.activityTime}>{entry.timeLabel}</p>
                </div>
                <span className={styles.activityDot} style={{ background: entry.dotColor }} />
              </div>
            ))}
          </div>
          <button type="button" className={styles.auditBtn}>VIEW FULL AUDIT LOG</button>
        </aside>
      </div>
    </section>
  )
}

DashboardHero.propTypes = {
  displayName: PropTypes.string,
  activeSessionCount: PropTypes.number,
  pendingReviews: PropTypes.number,
  featuredProject: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    coverImageUrl: PropTypes.string.isRequired,
    totalPhotos: PropTypes.number.isRequired,
    flaggedPhotos: PropTypes.number.isRequired,
  }).isRequired,
  recentActivity: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      actorInitial: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      timeLabel: PropTypes.string.isRequired,
      dotColor: PropTypes.string.isRequired,
    })
  ),
}
