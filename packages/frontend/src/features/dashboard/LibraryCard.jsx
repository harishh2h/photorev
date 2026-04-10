import PropTypes from 'prop-types'
import AuthenticatedPhotoImage from '@/components/AuthenticatedPhotoImage'

const placeholderClass =
  'h-full min-h-[260px] w-full bg-[#EDF7F2] bg-[radial-gradient(circle_at_1px_1px,rgba(110,231,183,0.42)_1px,transparent_0)] bg-[length:14px_14px] transition-transform duration-[380ms] ease-out group-hover:scale-[1.04]'

export default function LibraryCard({
  name,
  status,
  subtitle,
  coverPhotoId = '',
  authToken = '',
  coverImageUrl = '',
  animationDelay = 0,
}) {
  const usePhoto =
    typeof coverPhotoId === 'string' && coverPhotoId.length > 0 && typeof authToken === 'string' && authToken.length > 0
  const legacyUrl = typeof coverImageUrl === 'string' && coverImageUrl.length > 0 ? coverImageUrl : ''
  return (
    <article
      className="group relative min-h-[280px] animate-fade-up overflow-hidden rounded-card bg-accent/10 transition-[transform,box-shadow] duration-[380ms] ease-out motion-reduce:animate-none hover:-translate-y-1 hover:shadow-card-hover"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="absolute inset-0">
        {usePhoto ? (
          <AuthenticatedPhotoImage
            photoId={coverPhotoId}
            token={authToken}
            legacyImageUrl={legacyUrl}
            placeholderClassName={placeholderClass}
            alt=""
          />
        ) : legacyUrl.length > 0 ? (
          <img
            src={legacyUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-[380ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className={placeholderClass} aria-hidden />
        )}
      </div>
      <div className="absolute inset-x-4 bottom-4 z-[2] text-primary-content">
        <span className="inline-flex rounded-full bg-white/20 px-3 py-1 font-base text-xs font-bold text-accent-mid">
          {status}
        </span>
        <h3 className="my-2 mb-1 font-base text-2xl font-semibold text-primary-content">{name}</h3>
        <p className="m-0 font-base text-sm text-accent-mid">• {subtitle}</p>
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-black/10"
        aria-hidden
      />
    </article>
  )
}

LibraryCard.propTypes = {
  name: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  coverPhotoId: PropTypes.string,
  authToken: PropTypes.string,
  coverImageUrl: PropTypes.string,
  animationDelay: PropTypes.number,
}
