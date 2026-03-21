import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import LibraryCard from './LibraryCard'
import styles from './LibrarySection.module.css'

const STAGGER_MS = 80

export default function LibrarySection({ projects = [] }) {
  return (
    <section className={styles.section}>
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>Active Projects</h2>
        <a href="/library" className={styles.viewAll}>
          View All
        </a>
      </div>
      <div className={styles.grid}>
        {projects.map((project, index) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className={styles.cardLink}
          >
            <LibraryCard
              name={project.name}
              status={project.status}
              subtitle={project.subtitle}
              coverImageUrl={project.coverImageUrl}
              animationDelay={index * STAGGER_MS}
            />
          </Link>
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
      status: PropTypes.string.isRequired,
      subtitle: PropTypes.string.isRequired,
      coverImageUrl: PropTypes.string.isRequired,
    })
  ),
}
