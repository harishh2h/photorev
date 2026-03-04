import PropTypes from 'prop-types'
import { useCountUp } from './useCountUp'
import styles from './DashboardHero.module.css'

export default function StatCard({ label, value, animationDelay = 0 }) {
  const displayValue = useCountUp(value, 700)
  return (
    <div
      className={styles.statCard}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <p className={styles.statValue}>{displayValue}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  )
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  animationDelay: PropTypes.number,
}
