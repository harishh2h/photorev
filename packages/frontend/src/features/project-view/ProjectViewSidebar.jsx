import { useState, useCallback } from 'react'
import PropTypes from 'prop-types'

/**
 * @param {{ likedCount: number; likedWithNames: string; reviewProgressPercent: number; collaboratorMembers: { id: string; name: string; initial: string }[]; onFinalize: () => void; onShare: () => void; onSettings: () => void }} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectViewSidebar({
  likedCount,
  likedWithNames,
  reviewProgressPercent,
  collaboratorMembers,
  onFinalize,
  onShare,
  onSettings,
}) {
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
            <strong className="font-bold">{likedCount}</strong> Liked
          </span>
        </div>
        <div className="ml-1 mt-3 flex" aria-hidden>
          {previewCollaborators.slice(0, 2).map((c) => (
            <span
              key={c.id}
              className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-accent-mid bg-base-100 font-base text-xs font-semibold text-base-content first:ml-0"
            >
              {c.initial}
            </span>
          ))}
        </div>
        <p className="mb-0 mt-2 font-base text-sm text-muted">with {likedWithNames}</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="m-0 font-base text-xs font-semibold uppercase tracking-[0.08em] text-muted">Review progress</p>
        <div className="flex items-center gap-3">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full border-[1.5px] border-base-300 bg-base-300/80"
            role="progressbar"
            aria-valuenow={reviewProgressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-base-content transition-[width] duration-[700ms] ease-out"
              style={{ width: `${reviewProgressPercent}%` }}
            />
          </div>
          <span className="min-w-[2.5rem] text-right font-base text-sm font-semibold text-muted">
            {reviewProgressPercent}%
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="flex min-h-11 w-full items-center gap-2 rounded-md border-[1.5px] border-base-300 bg-[#F4F9F6] px-3 py-2 text-left font-base text-sm font-semibold text-base-content transition-[border-color,background-color] duration-150 ease-out hover:border-accent-mid hover:bg-base-100 focus-visible:outline-none focus-visible:shadow-focus"
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
                <span className="min-w-0 font-base text-sm text-base-content">{member.name}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="mt-auto flex flex-col gap-3">
        <button
          type="button"
          className="group btn btn-primary flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-0 px-6 font-base text-sm font-semibold uppercase tracking-[0.04em] text-primary-content transition-[background-color,transform] duration-150 ease-out hover:bg-[#222222] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus"
          onClick={onFinalize}
        >
          Finalize review
          <span className="flex transition-transform duration-150 ease-out group-hover:-translate-y-0.5" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </span>
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="btn btn-outline min-h-11 rounded-full border-[1.5px] border-base-300 bg-base-100 font-base text-xs font-semibold uppercase tracking-[0.06em] text-base-content transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-[#F4F9F6] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus"
            onClick={onShare}
          >
            Share
          </button>
          <button
            type="button"
            className="btn btn-outline min-h-11 rounded-full border-[1.5px] border-base-300 bg-base-100 font-base text-xs font-semibold uppercase tracking-[0.06em] text-base-content transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-[#F4F9F6] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus"
            onClick={onSettings}
          >
            Settings
          </button>
        </div>
      </div>
    </aside>
  )
}

ProjectViewSidebar.propTypes = {
  likedCount: PropTypes.number.isRequired,
  likedWithNames: PropTypes.string.isRequired,
  reviewProgressPercent: PropTypes.number.isRequired,
  collaboratorMembers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      initial: PropTypes.string.isRequired,
    })
  ).isRequired,
  onFinalize: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  onSettings: PropTypes.func.isRequired,
}
