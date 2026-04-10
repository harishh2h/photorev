import PropTypes from 'prop-types'
import ResumeCard from './ResumeCard'

const STAGGER_MS = 80

export default function ResumeSection({ items = [] }) {
  return (
    <section className="mb-12">
      <h2 className="m-0 mb-6 font-base text-xl font-semibold text-base-content">Continue Reviewing</h2>
      <div className="scrollbar-thin flex gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:thin]">
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
