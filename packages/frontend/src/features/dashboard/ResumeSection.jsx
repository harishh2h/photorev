import PropTypes from 'prop-types'
import ResumeCard from './ResumeCard'
import styles from './ResumeSection.module.css'

const STAGGER_MS = 80

export default function ResumeSection({ items = [] }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Continue Reviewing</h2>
      <div className={styles.row}>
        {items.map((item, index) => (
          <ResumeCard
            key={item.id}
            projectName={item.projectName}
            albumName={item.albumName}
            coverImageUrl={item.coverImageUrl}
            selectedCount={item.selectedCount}
            totalCount={item.totalCount}
            lastActiveAt={item.lastActiveAt}
            animationDelay={index * STAGGER_MS}
          />
        ))}
      </div>
    </section>
  )
}

ResumeSection.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      projectName: PropTypes.string.isRequired,
      albumName: PropTypes.string,
      coverImageUrl: PropTypes.string,
      selectedCount: PropTypes.number.isRequired,
      totalCount: PropTypes.number.isRequired,
      lastActiveAt: PropTypes.string.isRequired,
    })
  ),
}
