import PropTypes from 'prop-types'
import PhotoDetailSection from '@/features/photo-viewer/PhotoDetailSection.jsx'

/**
 * @param {{
 *   sections: Array<{ id: string; icon: string; primary: string; secondary?: string | null }>;
 *   className?: string;
 *   banner?: import('react').ReactNode;
 * }} props
 */
export default function PhotoDetailsList({ sections, className = '', banner = null }) {
  if (!sections?.length && !banner) return null
  return (
    <div className={className}>
      {banner}
      {sections.map((section) => (
        <PhotoDetailSection
          key={section.id}
          icon={section.icon}
          primary={section.primary}
          secondary={section.secondary}
        />
      ))}
    </div>
  )
}

PhotoDetailsList.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      primary: PropTypes.string.isRequired,
      secondary: PropTypes.string,
    })
  ).isRequired,
  className: PropTypes.string,
  banner: PropTypes.node,
}
