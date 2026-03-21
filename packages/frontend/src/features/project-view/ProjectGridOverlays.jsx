import PropTypes from 'prop-types'
import styles from './ProjectGridOverlays.module.css'

/**
 * @param {{ collaboratingLabel: string; onAddPhotos: () => void }} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectGridOverlays({ collaboratingLabel, onAddPhotos }) {
  return (
    <div className={styles.bottomBar}>
      <p className={styles.statusPill}>
        <span className={styles.statusDot} aria-hidden />
        {collaboratingLabel}
      </p>
      <button type="button" className={styles.fab} aria-label="Add photos" onClick={onAddPhotos}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}

ProjectGridOverlays.propTypes = {
  collaboratingLabel: PropTypes.string.isRequired,
  onAddPhotos: PropTypes.func.isRequired,
}
