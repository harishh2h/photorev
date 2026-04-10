import PropTypes from 'prop-types'
import ProjectPhotoImage from './ProjectPhotoImage.jsx'

/**
 * @param {{ photos: Array<{ id: string; alt: string; isLiked: boolean; isRejected: boolean; selectionLabel: string | null }>; token: string }} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectPhotoGrid({ photos, token }) {
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 min-[480px]:grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
      {photos.map((photo, index) => (
        <li
          key={photo.id}
          className="animate-fade-up motion-reduce:animate-none"
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <article
            className={`group relative overflow-hidden rounded-card border-[1.5px] bg-base-100 shadow-card transition-[transform,box-shadow] duration-[380ms] ease-out hover:-translate-y-1 hover:shadow-card-hover ${
              photo.isRejected ? 'border-muted/55' : 'border-base-300'
            }`}
          >
            <div
              className={`relative flex aspect-[3/4] overflow-hidden bg-[#EDF7F2] bg-[radial-gradient(circle_at_1px_1px,rgba(110,231,183,0.45)_1px,transparent_0)] bg-[length:14px_14px] ${
                photo.isRejected ? 'bg-base-300 bg-none after:pointer-events-none after:absolute after:inset-0 after:bg-muted/30' : ''
              }`}
            >
              <ProjectPhotoImage
                photoId={photo.id}
                token={token}
                alt={photo.alt}
                className={`block h-full w-full object-cover transition-transform duration-[380ms] ease-out group-hover:scale-[1.04] ${
                  photo.isRejected ? 'opacity-70 grayscale group-hover:opacity-[0.82]' : ''
                }`}
              />
              <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
                {photo.isLiked ? (
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-primary-content shadow-card"
                    aria-label="Liked"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </span>
                ) : null}
                {photo.isRejected ? (
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-error text-primary-content shadow-card"
                    aria-label="Rejected"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </span>
                ) : null}
              </div>
            </div>
            {photo.selectionLabel ? (
              <div className="absolute bottom-3 left-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full bg-black/70 px-3 py-2 font-base text-xs font-semibold text-primary-content backdrop-blur-md">
                <span className="flex text-accent-mid" aria-hidden>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </span>
                {photo.selectionLabel}
              </div>
            ) : null}
          </article>
        </li>
      ))}
    </ul>
  )
}

ProjectPhotoGrid.propTypes = {
  token: PropTypes.string.isRequired,
  photos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      alt: PropTypes.string.isRequired,
      isLiked: PropTypes.bool.isRequired,
      isRejected: PropTypes.bool.isRequired,
      selectionLabel: PropTypes.string,
    })
  ).isRequired,
}
