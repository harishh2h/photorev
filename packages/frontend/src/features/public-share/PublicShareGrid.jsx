import PropTypes from 'prop-types'
import { buildPublicPhotoUrl } from '@/services/publicShareService.js'

/**
 * @param {{ token: string; unlockToken: string | null; photos: Array<{ id: string; originalName: string | null; width: number | null; height: number | null }>; onSelect: (index: number) => void }} props
 */
export default function PublicShareGrid({ token, unlockToken, photos, onSelect }) {
  if (photos.length === 0) {
    return (
      <p className="m-0 rounded-card border-[1.5px] border-dashed border-base-300 bg-base-100 px-4 py-10 text-center font-base text-base text-muted">
        No photos have been published in this share yet.
      </p>
    )
  }
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 min-[480px]:grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
      {photos.map((photo, index) => (
        <li
          key={photo.id}
          className="animate-fade-up motion-reduce:animate-none"
          style={{ animationDelay: `${Math.min(index * 35, 700)}ms` }}
        >
          <button
            type="button"
            onClick={() => onSelect(index)}
            className="group relative flex aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-card border-[1.5px] border-base-300 bg-[#EDF7F2] p-0 text-left transition-[transform,box-shadow] duration-[380ms] ease-out hover:-translate-y-1 hover:shadow-card-hover focus-visible:outline-none focus-visible:shadow-focus"
            aria-label={`Open ${photo.originalName || 'photo'} fullscreen`}
          >
            <img
              src={buildPublicPhotoUrl(token, photo.id, 'thumb', unlockToken)}
              loading="lazy"
              decoding="async"
              alt={photo.originalName || 'Shared photo'}
              className="block h-full w-full object-cover transition-transform duration-[380ms] ease-out group-hover:scale-[1.04]"
            />
          </button>
        </li>
      ))}
    </ul>
  )
}

PublicShareGrid.propTypes = {
  token: PropTypes.string.isRequired,
  unlockToken: PropTypes.string,
  photos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      originalName: PropTypes.string,
      width: PropTypes.number,
      height: PropTypes.number,
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
}
