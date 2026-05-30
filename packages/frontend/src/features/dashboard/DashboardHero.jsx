import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import AuthenticatedPhotoImage from '@/components/AuthenticatedPhotoImage'

const coverFrameClass =
  'relative aspect-video w-full overflow-hidden rounded-[calc(1.5rem-8px)] bg-accent/10'
const featuredPh = 'absolute inset-0 h-full w-full min-h-0'
const coverImgClass = 'absolute inset-0 block h-full w-full min-h-0 object-cover object-center'
const emptyVisualPh =
  `${coverFrameClass} bg-base-200 bg-[radial-gradient(circle_at_1px_1px,rgba(16,185,129,0.28)_1px,transparent_0)] bg-[length:14px_14px]`

function FeaturedCover({ usePhotoBanner, useLegacyBanner, effectivePhotoId, authToken, bannerUrl }) {
  return (
    <div className={coverFrameClass}>
      {usePhotoBanner ? (
        <AuthenticatedPhotoImage
          photoId={effectivePhotoId}
          token={authToken}
          legacyImageUrl=""
          placeholderClassName={`illustration-placeholder ${featuredPh}`}
          imgClassName={coverImgClass}
          contentVariant="preview"
          alt=""
        />
      ) : useLegacyBanner ? (
        <img src={bannerUrl} alt="" className={coverImgClass} />
      ) : (
        <div className={`illustration-placeholder ${featuredPh}`} aria-hidden />
      )}
    </div>
  )
}

FeaturedCover.propTypes = {
  usePhotoBanner: PropTypes.bool.isRequired,
  useLegacyBanner: PropTypes.bool.isRequired,
  effectivePhotoId: PropTypes.string.isRequired,
  authToken: PropTypes.string.isRequired,
  bannerUrl: PropTypes.string.isRequired,
}

function StatItem({ label, value, valueClassName = 'text-base-content' }) {
  return (
    <div className="min-w-0">
      <p className={`m-0 font-base text-xl font-bold tabular-nums sm:text-2xl ${valueClassName}`}>{value}</p>
      <p className="mt-1 font-base text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted">{label}</p>
    </div>
  )
}

StatItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  valueClassName: PropTypes.string,
}

function ReviewProgress({ total, pendingReview }) {
  const reviewed = Math.max(0, total - pendingReview)
  const progressPercent = total > 0 ? Math.round((reviewed / total) * 100) : 0
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="m-0 font-base text-sm font-medium text-base-content">Review progress</p>
        <p className="m-0 font-base text-sm tabular-nums text-muted">{progressPercent}%</p>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-accent-mid/40"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Review progress ${progressPercent} percent`}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}

ReviewProgress.propTypes = {
  total: PropTypes.number.isRequired,
  pendingReview: PropTypes.number.isRequired,
}

export default function DashboardHero({
  featuredProject = null,
  authToken = '',
  fallbackCoverPhotoId = '',
}) {
  const hasFeatured = featuredProject != null && featuredProject.id != null
  const bannerPhotoId =
    hasFeatured && typeof featuredProject.bannerPhotoId === 'string' ? featuredProject.bannerPhotoId : ''
  const fallbackId =
    typeof fallbackCoverPhotoId === 'string' && fallbackCoverPhotoId.length > 0 ? fallbackCoverPhotoId : ''
  const effectivePhotoId = bannerPhotoId.length > 0 ? bannerPhotoId : fallbackId
  const bannerUrl = hasFeatured && typeof featuredProject.bannerUrl === 'string' ? featuredProject.bannerUrl : ''
  const usePhotoBanner = effectivePhotoId.length > 0 && authToken.length > 0
  const useLegacyBanner = !usePhotoBanner && bannerUrl.length > 0

  return (
    <section className="mb-10 md:mb-12">
      <article className="grid grid-cols-1 items-center gap-5 overflow-hidden rounded-card border-[1.5px] border-accent/40 bg-base-100 p-4 md:grid-cols-[minmax(0,52%)_1fr] md:gap-10 md:p-6">
        {hasFeatured ? (
          <>
            <FeaturedCover
              usePhotoBanner={usePhotoBanner}
              useLegacyBanner={useLegacyBanner}
              effectivePhotoId={effectivePhotoId}
              authToken={authToken}
              bannerUrl={bannerUrl}
            />
            <div className="flex min-w-0 flex-col justify-center">
              <p className="m-0 mb-2 font-base text-sm font-semibold text-accent">Latest updated project</p>
              <h2 className="m-0 mb-5 font-base text-3xl text-base-content md:text-4xl">{featuredProject.name}</h2>
              <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                <StatItem label="Photos" value={featuredProject.totalPhotos} />
                <StatItem label="Liked" value={featuredProject.likedPhotos} valueClassName="text-accent" />
                <StatItem label="Rejected" value={featuredProject.rejectedPhotos} />
                <StatItem label="Pending" value={featuredProject.pendingReviewPhotos} valueClassName="text-warning" />
              </div>
              <ReviewProgress
                total={featuredProject.totalPhotos}
                pendingReview={featuredProject.pendingReviewPhotos}
              />
              <Link
                to={`/projects/${featuredProject.id}`}
                className="btn ml-auto inline-flex w-fit min-h-11 items-center gap-2 rounded-full border-0 bg-accent px-8 font-base text-base font-semibold text-white no-underline transition-[background-color,transform] duration-150 ease-out hover:bg-accent-hover active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus"
              >
                Open project <span aria-hidden>→</span>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className={emptyVisualPh} aria-hidden />
            <div className="flex min-w-0 flex-col gap-3">
              <h2 className="m-0 font-base text-3xl text-base-content md:text-4xl">No projects yet</h2>
              <p className="font-base text-base text-muted">
                Use <span className="font-semibold text-base-content">+ New Project</span> above to create your first one.
              </p>
            </div>
          </>
        )}
      </article>
    </section>
  )
}

const featuredShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  totalPhotos: PropTypes.number.isRequired,
  likedPhotos: PropTypes.number.isRequired,
  rejectedPhotos: PropTypes.number.isRequired,
  pendingReviewPhotos: PropTypes.number.isRequired,
  bannerUrl: PropTypes.string,
  bannerPhotoId: PropTypes.string,
})

DashboardHero.propTypes = {
  authToken: PropTypes.string,
  fallbackCoverPhotoId: PropTypes.string,
  featuredProject: featuredShape,
}
