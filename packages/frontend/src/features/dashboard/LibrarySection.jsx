import PropTypes from 'prop-types'
import LibraryCard from './LibraryCard'
import styles from './LibrarySection.module.css'

const STAGGER_MS = 80

export default function LibrarySection({ projects = [] }) {
  return (
    <section className={styles.section}>
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>Your Libraries</h2>
        <a href="/library" className={styles.viewAll}>
          View all →
        </a>
      </div>
      <div className={styles.grid}>
        {projects.map((project, index) => (
          <LibraryCard
            key={project.id}
            name={project.name}
            photoCount={project.photoCount}
            createdAt={project.createdAt}
            status={project.status}
            coverImageUrls={project.coverImageUrls}
            animationDelay={index * STAGGER_MS}
          />
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
      photoCount: PropTypes.number.isRequired,
      createdAt: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      coverImageUrls: PropTypes.arrayOf(PropTypes.string),
    })
  ),
}
