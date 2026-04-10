import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import AuthenticatedPhotoImage from '@/components/AuthenticatedPhotoImage'
import styles from './DashboardHero.module.css'

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
    <section className={styles.hero}>
      <div className={styles.topRow}>
        <button
          type="button"
          className={styles.newProjectBtn}
          onClick={() => onNewProjectClick?.()}
        >
          + New Project
        </button>
      </div>
      <div className={styles.overviewGrid}>
        <article className={styles.featuredCard}>
          {hasFeatured ? (
            <>
              <div className={styles.featuredImageWrap}>
                {usePhotoBanner ? (
                  <AuthenticatedPhotoImage
                    photoId={bannerPhotoId}
                    token={authToken}
                    legacyImageUrl=""
                    placeholderClassName={styles.featuredPlaceholder}
                    alt=""
                  />
                ) : useLegacyBanner ? (
                  <img src={bannerUrl} alt="" />
                ) : (
                  <div className={styles.featuredPlaceholder} aria-hidden />
                )}
                <span className={styles.reviewBadge}>
                  {(featuredProject.status || 'active').toUpperCase()}
                </span>
              </div>
              <div className={styles.featuredContent}>
                <h2 className={styles.featuredTitle}>{featuredProject.name}</h2>
                <p className={styles.featuredDescription}>
                  {featuredProject.description || 'Open this project to upload photos, run reviews, and export selections.'}
                </p>
                <div className={styles.metrics}>
                  <div>
                    <p className={styles.metricValue}>{featuredProject.totalPhotos}</p>
                    <p className={styles.metricLabel}>TOTAL PHOTOS</p>
                  </div>
                  <div>
                    <p className={`${styles.metricValue} ${styles.metricWarning}`}>
                      {featuredProject.inProgressPhotos}
                    </p>
                    <p className={styles.metricLabel}>IN PROGRESS</p>
                  </div>
                </div>
                <Link to={`/projects/${featuredProject.id}`} className={styles.continueBtn}>
                  Open project <span aria-hidden>→</span>
                </Link>
              </div>
            </>
          ) : (
            <div className={styles.emptyFeatured}>
              <div className={styles.emptyVisual} aria-hidden />
              <div className={styles.emptyCopy}>
                <h2 className={styles.featuredTitle}>No projects yet</h2>
                <p className={styles.featuredDescription}>
                  Create a project to get a dedicated space for uploads and client review sessions.
                </p>
                <button type="button" className={styles.continueBtn} onClick={() => onNewProjectClick?.()}>
                  Create your first project <span aria-hidden>→</span>
                </button>
              </div>
            </div>
          )}
        </article>
        <aside className={styles.activityCard}>
          <h3 className={styles.activityTitle}>Activity</h3>
          <div className={styles.activityList}>
            {recentActivity.length > 0 ? (
              recentActivity.map((entry) => (
                <div key={entry.id} className={styles.activityItem}>
                  <span className={styles.activityAvatar}>{entry.actorInitial}</span>
                  <div>
                    <p className={styles.activityText}>{entry.message}</p>
                    <p className={styles.activityTime}>{entry.timeLabel}</p>
                  </div>
                  <span className={styles.activityDot} style={{ background: entry.dotColor }} />
                </div>
              ))
            ) : (
              <p className={styles.activityEmpty}>
                No audit events yet. Uploads and review actions will show up here when the API exposes an activity feed.
              </p>
            )}
          </div>
          <button type="button" className={styles.auditBtn} disabled>
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
