import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { getActiveShareLink } from '@/services/shareLinkService.js'
import { REVIEW_SCOPE } from '@/utils/projectReviewFilters.js'

function formatExpiry(expiresAt) {
  if (!expiresAt) return 'Never expires'
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const days = Math.round(ms / (24 * 60 * 60 * 1000))
  if (days >= 1) return `Expires in ${days}d`
  const hrs = Math.round(ms / (60 * 60 * 1000))
  return `Expires in ${hrs}h`
}

function ViewerSidebar({ selectedCount }) {
  return (
    <aside
      className="z-sticky flex flex-col gap-6 rounded-card border-[1.5px] border-base-300 bg-base-100 p-5 shadow-card lg:fixed lg:right-0 lg:top-16 lg:z-sticky lg:h-[calc(100vh-4rem)] lg:w-[min(300px,100vw)] lg:overflow-y-auto lg:rounded-none lg:border-b-0 lg:border-l-[1.5px] lg:border-r-0 lg:border-t-0 lg:border-base-300 lg:shadow-floating"
      aria-label="Selected photos"
    >
      <div className="rounded-md border-[1.5px] border-accent/25 bg-[#EDF7F2] p-4">
        <div className="flex items-center gap-2">
          <span className="flex text-accent" aria-hidden>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </span>
          <span className="font-base text-base text-base-content">
            <strong className="font-bold">{selectedCount}</strong> Selected
          </span>
        </div>
        <p className="mb-0 mt-2 font-base text-sm text-muted">Team picks ready to view</p>
      </div>
    </aside>
  )
}

ViewerSidebar.propTypes = {
  selectedCount: PropTypes.number.isRequired,
}

/**
 * @param {object} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectViewSidebar({
  sidebarStats,
  reviewScope = REVIEW_SCOPE.MINE,
  canReviewPhotos = true,
  collaboratorMembers,
  showSettings = true,
  isFinalized = false,
  canShare = false,
  isProjectCreator = false,
  token,
  projectId,
  onFinalize,
  onShare,
  onSettings,
  onManageCollaborators,
}) {
  if (!canReviewPhotos) {
    return <ViewerSidebar selectedCount={sidebarStats.viewer.selected} />
  }

  const isTeamScope = reviewScope === REVIEW_SCOPE.TEAM
  const stats = isTeamScope ? sidebarStats.team : sidebarStats.mine
  const likedLabel = isTeamScope ? 'Final liked' : 'Liked by you'
  const rejectedLabel = isTeamScope ? 'Final rejected' : 'Rejected by you'

  const [activeLink, setActiveLink] = useState(null)
  useEffect(() => {
    if (!canShare || !isFinalized) {
      setActiveLink(null)
      return undefined
    }
    let cancelled = false
    const run = async () => {
      try {
        const link = await getActiveShareLink(token, projectId)
        if (!cancelled) setActiveLink(link)
      } catch {
        if (!cancelled) setActiveLink(null)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [canShare, isFinalized, token, projectId])
  const [isMembersOpen, setIsMembersOpen] = useState(false)
  const collaboratorCount = collaboratorMembers.length
  const previewCollaborators = collaboratorMembers.slice(0, 4)
  const overflowCount = Math.max(0, collaboratorCount - previewCollaborators.length)
  const handleToggleMembers = useCallback(() => {
    setIsMembersOpen((open) => !open)
  }, [])

  return (
    <aside
      className="z-sticky flex flex-col gap-6 rounded-card border-[1.5px] border-base-300 bg-base-100 p-5 shadow-card lg:fixed lg:right-0 lg:top-16 lg:z-sticky lg:h-[calc(100vh-4rem)] lg:w-[min(300px,100vw)] lg:overflow-y-auto lg:rounded-none lg:border-b-0 lg:border-l-[1.5px] lg:border-r-0 lg:border-t-0 lg:border-base-300 lg:shadow-floating"
      aria-label="Project review"
    >
      <div className="rounded-md border-[1.5px] border-accent/25 bg-[#EDF7F2] p-4">
        <div className="flex items-center gap-2">
          <span className="flex text-accent" aria-hidden>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </span>
          <span className="font-base text-base text-base-content">
            <strong className="font-bold">{stats.liked}</strong> {likedLabel}
          </span>
        </div>
        <p className="mb-0 mt-2 font-base text-sm text-muted">
          <strong className="font-semibold text-base-content">{stats.rejected}</strong> {rejectedLabel.toLowerCase()}
        </p>
        {isTeamScope && stats.pendingConflicts > 0 ? (
          <p className="mb-0 mt-2 inline-flex w-fit items-center rounded-full bg-warning/15 px-2.5 py-1 font-base text-xs font-semibold text-warning">
            {stats.pendingConflicts} need owner decision
          </p>
        ) : null}
      </div>
      {!isTeamScope ? (
        <div className="flex flex-col gap-2">
          <p className="m-0 font-base text-xs font-semibold uppercase tracking-[0.08em] text-muted">Your progress</p>
          <div className="flex items-center gap-3">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full border-[1.5px] border-base-300 bg-base-300/80"
              role="progressbar"
              aria-valuenow={sidebarStats.mine.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-base-content transition-[width] duration-[700ms] ease-out"
                style={{ width: `${sidebarStats.mine.progressPercent}%` }}
              />
            </div>
            <span className="min-w-[2.5rem] text-right font-base text-sm font-semibold text-muted">
              {sidebarStats.mine.progressPercent}%
            </span>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-3">
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md border-[1.5px] border-base-300 bg-[#F4F9F6] px-3 py-2 text-left font-base text-sm font-semibold text-base-content transition-[border-color,background-color] duration-150 ease-out hover:border-accent-mid hover:bg-base-100 focus-visible:outline-none focus-visible:shadow-focus"
            onClick={handleToggleMembers}
            aria-expanded={isMembersOpen}
            aria-controls="project-collaborators-list"
            id="project-collaborators-trigger"
          >
            <span className="flex shrink-0 text-muted" aria-hidden>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">{collaboratorCount} Collaborators</span>
            <span
              className={`flex shrink-0 text-muted transition-transform duration-[250ms] ease-out ${isMembersOpen ? 'rotate-180' : ''}`}
              aria-hidden
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </button>
          {showSettings && typeof onManageCollaborators === 'function' ? (
            <button
              type="button"
              className="btn btn-outline flex h-auto min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md border-[1.5px] border-base-300 bg-base-100 px-0 font-base text-lg font-semibold text-accent transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-[#EDF7F2] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus"
              aria-label="Add or manage collaborators"
              onClick={onManageCollaborators}
            >
              +
            </button>
          ) : null}
        </div>
        {!isMembersOpen ? (
          <div className="flex flex-wrap items-center gap-0" aria-hidden>
            {previewCollaborators.map((c) => (
              <span
                key={c.id}
                className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-base-300 bg-[#F4F9F6] font-base text-xs font-semibold text-base-content first:ml-0"
              >
                {c.initial}
              </span>
            ))}
            {overflowCount > 0 ? (
              <span className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-accent-mid bg-[#EDF7F2] font-base text-xs font-bold text-accent">
                +{overflowCount}
              </span>
            ) : null}
          </div>
        ) : null}
        {isMembersOpen ? (
          <ul
            className="m-0 max-h-[min(40svh,280px)] list-none overflow-y-auto scroll-smooth rounded-md border-[1.5px] border-base-300 bg-bg p-2"
            id="project-collaborators-list"
            role="list"
            aria-labelledby="project-collaborators-trigger"
          >
            {collaboratorMembers.map((member) => (
              <li key={member.id} className="flex items-center gap-3 rounded-sm px-2 py-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-mid bg-base-100 font-base text-xs font-semibold text-base-content">
                  {member.initial}
                </span>
                <div className="min-w-0 flex flex-col gap-0.5">
                  <span className="font-base text-sm text-base-content">{member.name}</span>
                  {member.roleLabel ? (
                    <span className="inline-flex w-fit rounded-full bg-[#EDF7F2] px-2 py-0.5 font-base text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-accent">
                      {member.roleLabel}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {isProjectCreator ? (
        <div className="mt-auto flex flex-col gap-3">
          {canShare && isFinalized && activeLink ? (
            <div className="relative rounded-md border-[1.5px] border-accent/40 bg-[#EDF7F2] px-4 py-3 shadow-floating">
              <div className="flex items-center gap-2">
                <span className="flex text-accent" aria-hidden>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                    <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
                  </svg>
                </span>
                <span className="font-base text-xs font-semibold uppercase tracking-[0.06em] text-accent">
                  Share link live
                </span>
              </div>
              <p className="m-0 mt-1 font-base text-xs leading-snug text-muted">
                {formatExpiry(activeLink.expiresAt)} · {activeLink.viewCount} view{activeLink.viewCount === 1 ? '' : 's'}
              </p>
              <button
                type="button"
                onClick={onShare}
                className="mt-2 inline-flex items-center gap-1 font-base text-xs font-semibold text-base-content hover:text-accent focus-visible:outline-none focus-visible:shadow-focus"
              >
                Manage
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          ) : null}
          <button
            type="button"
            className="group btn btn-primary flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-0 px-6 font-base text-sm font-semibold uppercase tracking-[0.04em] text-primary-content transition-[background-color,transform] duration-150 ease-out hover:bg-[#222222] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-55"
            onClick={onFinalize}
          >
            {isFinalized ? 'Re-finalize review' : 'Finalize review'}
            <span className="flex transition-transform duration-150 ease-out group-hover:-translate-y-0.5" aria-hidden>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </span>
          </button>
          <div className={`grid gap-3 ${showSettings ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <button
              type="button"
              disabled={canShare && !isFinalized}
              title={canShare && !isFinalized ? 'Finalize the project before sharing' : undefined}
              className="btn btn-outline min-h-11 rounded-full border-[1.5px] border-base-300 bg-base-100 font-base text-xs font-semibold uppercase tracking-[0.06em] text-base-content transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-[#F4F9F6] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-55"
              onClick={onShare}
            >
              Share
            </button>
            {showSettings ? (
              <button
                type="button"
                className="btn btn-outline min-h-11 rounded-full border-[1.5px] border-base-300 bg-base-100 font-base text-xs font-semibold uppercase tracking-[0.06em] text-base-content transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-[#F4F9F6] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus"
                onClick={onSettings}
              >
                Settings
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  )
}

const sidebarStatsShape = PropTypes.shape({
  mine: PropTypes.shape({
    liked: PropTypes.number.isRequired,
    rejected: PropTypes.number.isRequired,
    progressPercent: PropTypes.number.isRequired,
  }).isRequired,
  team: PropTypes.shape({
    liked: PropTypes.number.isRequired,
    rejected: PropTypes.number.isRequired,
    pendingConflicts: PropTypes.number.isRequired,
  }).isRequired,
  viewer: PropTypes.shape({
    selected: PropTypes.number.isRequired,
  }).isRequired,
})

ProjectViewSidebar.propTypes = {
  sidebarStats: sidebarStatsShape.isRequired,
  reviewScope: PropTypes.oneOf([REVIEW_SCOPE.MINE, REVIEW_SCOPE.TEAM]),
  canReviewPhotos: PropTypes.bool,
  collaboratorMembers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      initial: PropTypes.string.isRequired,
      roleLabel: PropTypes.string,
    })
  ).isRequired,
  showSettings: PropTypes.bool,
  isFinalized: PropTypes.bool,
  canShare: PropTypes.bool,
  isProjectCreator: PropTypes.bool,
  token: PropTypes.string.isRequired,
  projectId: PropTypes.string.isRequired,
  onFinalize: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  onSettings: PropTypes.func.isRequired,
  onManageCollaborators: PropTypes.func,
}
