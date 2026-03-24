import PropTypes from 'prop-types'
import { NavLink } from 'react-router-dom'
import LibraryCard from './LibraryCard'
import { formatShortDate } from '@/utils/formatDate.js'
import styles from './LibrarySection.module.css'

const STAGGER_MS = 80

/**
 * @param {{ projects?: object[]; isLoading?: boolean }} props
 */
export default function LibrarySection({ projects = [], isLoading = false }) {
  return (
    <section className={styles.section}>
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>Your projects</h2>
        <NavLink to="/projects" className={styles.viewAll}>
          View all
        </NavLink>
      </div>
      {isLoading && projects.length === 0 ? (
        <p className={styles.hint}>Loading…</p>
      ) : null}
      {!isLoading && projects.length === 0 ? (
        <p className={styles.empty}>No projects yet. Use “New Project” above to create one.</p>
      ) : null}
      <div className={styles.grid}>
        {projects.map((project, index) => (
          <NavLink
            key={project.id}
            to={`/projects/${project.id}`}
            className={styles.cardLink}
          >
            <LibraryCard
              name={project.name}
              status={String(project.status || 'active').toUpperCase()}
              subtitle={
                project.createdAt
                  ? `Created ${formatShortDate(project.createdAt)}`
                  : 'Project'
              }
              coverImageUrl=""
              animationDelay={index * STAGGER_MS}
            />
          </NavLink>
        ))}
      </div>
    </section>
  )
}

LibrarySection.propTypes = {
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      status: PropTypes.string,
      createdAt: PropTypes.string,
    })
  ),
  isLoading: PropTypes.bool,
}
