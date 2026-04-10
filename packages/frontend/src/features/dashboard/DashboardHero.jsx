import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import AuthenticatedPhotoImage from '@/components/AuthenticatedPhotoImage'

const featuredPh =
  'illustration-placeholder min-h-[200px] w-full md:min-h-[260px]'
const emptyVisualPh =
  'min-h-[180px] rounded-[calc(1.5rem-8px)] border-[1.5px] border-base-300 bg-base-200 bg-[radial-gradient(circle_at_1px_1px,rgba(16,185,129,0.28)_1px,transparent_0)] bg-[length:14px_14px]'

export default function DashboardHero({
  featuredProject = null,
  authToken = '',
  recentActivity = [],
  onNewProjectClick = undefined,
}) {
  const hasFeatured = featuredProject != null && featuredProject.id != null
  const bannerPhotoId =
    hasFeatured && typeof featuredProject.bannerPhotoId === 'string' ? featuredProject.bannerPhotoId : ''
  const bannerUrl = hasFeatured && typeof featuredProject.bannerUrl === 'string' ? featuredProject.bannerUrl : ''
  const usePhotoBanner = bannerPhotoId.length > 0 && authToken.length > 0
  const useLegacyBanner = !usePhotoBanner && bannerUrl.length > 0
  return (
    <section className="mb-10 md:mb-12">
      <div className="mb-6 flex flex-col items-stretch justify-end gap-4 max-md:items-start md:flex-row md:items-center">
        <button
          type="button"
          className="btn btn-primary ml-auto min-h-11 rounded-full border-0 px-6 font-base text-base font-semibold text-primary-content transition-[background-color,transform] duration-150 ease-out hover:bg-[#222222] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus max-md:ml-0 max-md:w-full md:ml-auto"
          onClick={() => onNewProjectClick?.()}
        >
          + New Project
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <article className="grid grid-cols-1 gap-5 overflow-hidden rounded-card border-[1.5px] border-base-300 bg-base-100 p-4 md:grid-cols-[300px_1fr]">
          {hasFeatured ? (
            <>
              <div className="relative min-h-[200px] overflow-hidden rounded-[calc(1.5rem-8px)] md:min-h-[260px]">
                {usePhotoBanner ? (
                  <AuthenticatedPhotoImage
                    photoId={bannerPhotoId}
                    token={authToken}
                    legacyImageUrl=""
                    placeholderClassName={featuredPh}
                    alt=""
                  />
                ) : useLegacyBanner ? (
                  <img src={bannerUrl} alt="" className="block min-h-[260px] h-auto w-full object-cover" />
                ) : (
                  <div className={featuredPh} aria-hidden />
                )}
                <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-2 font-base text-xs font-bold text-accent-content">
                  {(featuredProject.status || 'active').toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="m-0 font-base text-3xl text-base-content">{featuredProject.name}</h2>
                <p className="my-3 mb-5 font-base text-base text-muted">
                  {featuredProject.description ||
                    'Open this project to upload photos, run reviews, and export selections.'}
                </p>
                <div className="mb-5 flex gap-10 max-md:gap-6">
                  <div>
                    <p className="m-0 font-base text-[2.3rem] font-bold text-base-content">{featuredProject.totalPhotos}</p>
                    <p className="mt-1 font-base text-xs uppercase tracking-[0.06em] text-muted">TOTAL PHOTOS</p>
                  </div>
                  <div>
                    <p className="m-0 font-base text-[2.3rem] font-bold text-warning">{featuredProject.inProgressPhotos}</p>
                    <p className="mt-1 font-base text-xs uppercase tracking-[0.06em] text-muted">IN PROGRESS</p>
                  </div>
                </div>
                <Link
                  to={`/projects/${featuredProject.id}`}
                  className="btn btn-primary inline-flex w-fit min-h-11 items-center gap-2 rounded-full border-0 px-8 font-base text-base font-semibold text-primary-content no-underline transition-[background-color,transform] duration-150 ease-out hover:bg-[#222222] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus"
                >
                  Open project <span aria-hidden>→</span>
                </Link>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 items-center gap-5 p-2 md:grid-cols-[minmax(0,200px)_1fr]">
              <div className={emptyVisualPh} aria-hidden />
              <div className="flex flex-col gap-3">
                <h2 className="m-0 font-base text-3xl text-base-content">No projects yet</h2>
                <p className="font-base text-base text-muted">
                  Create a project to get a dedicated space for uploads and client review sessions.
                </p>
                <button
                  type="button"
                  className="btn btn-primary inline-flex w-fit min-h-11 items-center gap-2 rounded-full border-0 px-8 font-base text-base font-semibold text-primary-content transition-[background-color,transform] duration-150 ease-out hover:bg-[#222222] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus"
                  onClick={() => onNewProjectClick?.()}
                >
                  Create your first project <span aria-hidden>→</span>
                </button>
              </div>
            </div>
          )}
        </article>
        <aside className="flex flex-col rounded-card bg-[#067a4c] p-5 text-[#eafff5]">
          <h3 className="m-0 mb-4 font-base text-2xl font-semibold">Activity</h3>
          <div className="flex flex-1 flex-col gap-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((entry) => (
                <div key={entry.id} className="grid grid-cols-[30px_1fr_auto] items-center gap-3">
                  <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/20 font-base text-xs font-semibold">
                    {entry.actorInitial}
                  </span>
                  <div>
                    <p className="m-0 font-base text-sm text-[#f4fff8]">{entry.message}</p>
                    <p className="mt-0.5 font-base text-xs text-[#b3e7cf]">{entry.timeLabel}</p>
                  </div>
                  <span className="h-[7px] w-[7px] rounded-full" style={{ background: entry.dotColor }} />
                </div>
              ))
            ) : (
              <p className="m-0 font-base text-sm leading-relaxed text-[#d8f5e8]">
                No audit events yet. Uploads and review actions will show up here when the API exposes an activity feed.
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn mt-4 min-h-10 rounded-full border-[1.5px] border-white/20 bg-white/10 font-base text-sm font-semibold text-[#effff6] opacity-45"
            disabled
          >
            Audit log (soon)
          </button>
        </aside>
      </div>
    </section>
  )
}

const featuredShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  status: PropTypes.string,
  totalPhotos: PropTypes.number.isRequired,
  inProgressPhotos: PropTypes.number.isRequired,
  bannerUrl: PropTypes.string,
  bannerPhotoId: PropTypes.string,
})

DashboardHero.propTypes = {
  authToken: PropTypes.string,
  featuredProject: featuredShape,
  recentActivity: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      actorInitial: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      timeLabel: PropTypes.string.isRequired,
      dotColor: PropTypes.string.isRequired,
    })
  ),
  onNewProjectClick: PropTypes.func,
}
