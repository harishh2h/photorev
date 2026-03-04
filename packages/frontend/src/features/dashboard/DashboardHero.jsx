import PropTypes from 'prop-types'
import StatCard from './StatCard'
import styles from './DashboardHero.module.css'

export default function DashboardHero({
  displayName = 'there',
  activeReviewCount = 0,
  totalProjects = 0,
  photosProcessed = 0,
  pendingReviews = 0,
}) {
  return (
    <section className={styles.hero}>
      <h1 className={styles.greeting}>Good morning, {displayName}</h1>
      <p className={styles.subtitle}>
        You have {activeReviewCount} active review session{activeReviewCount !== 1 ? 's' : ''}
      </p>
      <div className={styles.stats}>
        <StatCard label="Total Projects" value={totalProjects} animationDelay={0} />
        <StatCard label="Photos Processed" value={photosProcessed} animationDelay={80} />
        <StatCard label="Pending Reviews" value={pendingReviews} animationDelay={160} />
      </div>
    </section>
  )
}

DashboardHero.propTypes = {
  displayName: PropTypes.string,
  activeReviewCount: PropTypes.number,
  totalProjects: PropTypes.number,
  photosProcessed: PropTypes.number,
  pendingReviews: PropTypes.number,
}
