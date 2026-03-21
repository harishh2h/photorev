import PropTypes from 'prop-types'
import styles from './ProjectViewToolbar.module.css'

const FILTER_ITEMS = [
  { id: 'all', label: 'All' },
  { id: 'liked', label: 'Liked' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'conflicts', label: 'Conflicts' },
]

/**
 * @param {{ projectTitle: string; filterCounts: Record<string, number>; activeFilter: string; onFilterChange: (id: string) => void }} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectViewToolbar({ projectTitle, filterCounts, activeFilter, onFilterChange }) {
  return (
    <div className={styles.bar}>
      <h1 className={styles.projectTitle}>{projectTitle}</h1>
      <div className={styles.filters} role="tablist" aria-label="Photo filters">
        {FILTER_ITEMS.map((item) => {
          const count = filterCounts[item.id] ?? 0
          const isActive = activeFilter === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.filterBtn} ${isActive ? styles.filterBtnActive : ''}`}
              onClick={() => onFilterChange(item.id)}
            >
              <span className={styles.filterLabel}>{item.label}</span>
              <span className={styles.filterCount}>{count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

ProjectViewToolbar.propTypes = {
  projectTitle: PropTypes.string.isRequired,
  filterCounts: PropTypes.shape({
    all: PropTypes.number.isRequired,
    liked: PropTypes.number.isRequired,
    rejected: PropTypes.number.isRequired,
    conflicts: PropTypes.number.isRequired,
  }).isRequired,
  activeFilter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
}
