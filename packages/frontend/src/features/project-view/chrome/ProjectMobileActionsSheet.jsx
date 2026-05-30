import PropTypes from 'prop-types'
import { NavLink } from 'react-router-dom'
import { AppBottomSheet } from '@/components/ui/index.js'
import { REVIEW_SCOPE } from '@/utils/projectReviewFilters.js'
import { formatShareExpiry } from './formatShareExpiry.js'

const sheetActionClass =
  'flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-base text-base font-medium text-base-content transition-colors duration-150 ease-out hover:bg-base-200 focus-visible:outline-none focus-visible:shadow-focus'

const SCOPE_OPTIONS = [
  { id: REVIEW_SCOPE.MINE, label: 'My Review' },
  { id: REVIEW_SCOPE.TEAM, label: 'Team Review' },
]

/**
 * @param {{
 *   isOpen: boolean;
 *   onClose: () => void;
 *   isProjectCreator?: boolean;
 *   canShare?: boolean;
 *   isFinalized?: boolean;
 *   shareLinkActive?: object | null;
 *   onShare?: () => void;
 *   onFinalize?: () => void;
 *   onManageCollaborators?: () => void;
 *   onLogout?: () => void;
 *   canReviewPhotos?: boolean;
 *   reviewScope?: string;
 *   onReviewScopeChange?: (scope: string) => void;
 *   sidebarStats?: object;
 *   collaboratorMembers?: object[];
 * }} props
 */
export default function ProjectMobileActionsSheet({
  isOpen,
  onClose,
  isProjectCreator = false,
  canShare = false,
  isFinalized = false,
  shareLinkActive = null,
  onShare,
  onFinalize,
  onManageCollaborators,
  onLogout,
  canReviewPhotos = true,
  reviewScope,
  onReviewScopeChange,
  sidebarStats,
  collaboratorMembers = [],
}) {
  const handleAction = (action) => {
    onClose()
    action?.()
  }

  const handleScopeSelect = (scope) => {
    onReviewScopeChange?.(scope)
    onClose()
  }

  const mineStats = sidebarStats?.mine
  const teamStats = sidebarStats?.team
  const previewCollaborators = collaboratorMembers.slice(0, 4)
  const overflowCount = Math.max(0, collaboratorMembers.length - previewCollaborators.length)

  return (
    <AppBottomSheet open={isOpen} onClose={onClose} title="Project actions" ariaLabel="Project actions">
      <div className="flex flex-col gap-1 pb-2">
        {canReviewPhotos && reviewScope && sidebarStats && onReviewScopeChange ? (
          <div className="mb-2">
            <p className="m-0 px-3 pb-2 font-base text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              Review scope
            </p>
            <ul className="m-0 list-none p-0" role="listbox" aria-label="Review scope">
              {SCOPE_OPTIONS.map((option) => {
                const isActive = reviewScope === option.id
                const stats = option.id === REVIEW_SCOPE.TEAM ? teamStats : mineStats
                return (
                  <li key={option.id} role="none">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      className={`flex w-full flex-col gap-0.5 rounded-md px-3 py-2.5 text-left font-base transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:shadow-focus ${
                        isActive ? 'bg-accent/10 text-base-content' : 'text-base-content hover:bg-base-200'
                      }`}
                      onClick={() => handleScopeSelect(option.id)}
                    >
                      <span className="text-sm font-semibold">{option.label}</span>
                      {option.id === REVIEW_SCOPE.MINE && stats ? (
                        <span className="text-xs text-muted">
                          {stats.liked} liked · {stats.rejected} rejected · {stats.progressPercent}% done
                        </span>
                      ) : null}
                      {option.id === REVIEW_SCOPE.TEAM && stats ? (
                        <span className="text-xs text-muted">
                          {stats.liked} liked · {stats.rejected} rejected
                          {stats.pendingConflicts > 0 ? (
                            <span className="text-warning"> · {stats.pendingConflicts} need decision</span>
                          ) : null}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
        {canReviewPhotos && collaboratorMembers.length > 0 ? (
          <div className="mb-2 rounded-md border-[1.5px] border-base-300 bg-panel px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 font-base text-sm font-semibold text-base-content">
                  {collaboratorMembers.length} Collaborators
                </p>
                <div className="mt-2 flex items-center" aria-hidden>
                  {previewCollaborators.map((member) => (
                    <span
                      key={member.id}
                      className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-base-300 bg-base-100 font-base text-xs font-semibold text-base-content first:ml-0"
                    >
                      {member.initial}
                    </span>
                  ))}
                  {overflowCount > 0 ? (
                    <span className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-accent-mid bg-base-100 font-base text-xs font-bold text-accent">
                      +{overflowCount}
                    </span>
                  ) : null}
                </div>
              </div>
              {isProjectCreator && typeof onManageCollaborators === 'function' ? (
                <button
                  type="button"
                  className="shrink-0 rounded-full border-[1.5px] border-base-300 bg-base-100 px-3 py-2 font-base text-xs font-semibold text-accent transition-colors duration-150 ease-out hover:border-accent-mid hover:bg-base-100 focus-visible:outline-none focus-visible:shadow-focus"
                  onClick={() => handleAction(onManageCollaborators)}
                >
                  Manage
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        {(canReviewPhotos && reviewScope) || (canReviewPhotos && collaboratorMembers.length > 0) ? (
          <div className="my-2 h-[1.5px] bg-base-300" aria-hidden />
        ) : null}
        {isProjectCreator ? (
          <>
            <button
              type="button"
              className={`${sheetActionClass} rounded-full border-[1.5px] border-transparent bg-primary font-semibold text-primary-content hover:bg-[#222222] hover:text-primary-content`}
              onClick={() => handleAction(onFinalize)}
            >
              {isFinalized ? 'Re-finalize Review' : 'Finalize Review'}
            </button>
            <button
              type="button"
              disabled={canShare && !isFinalized}
              className={`${sheetActionClass} disabled:cursor-not-allowed disabled:opacity-55`}
              onClick={() => handleAction(onShare)}
            >
              <span className="flex text-accent" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                  <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
                </svg>
              </span>
              Share Link
            </button>
            {canShare && isFinalized && shareLinkActive ? (
              <p className="mx-3 mb-1 mt-0 font-base text-xs text-muted">
                Link live · {formatShareExpiry(shareLinkActive.expiresAt)} · {shareLinkActive.viewCount} view
                {shareLinkActive.viewCount === 1 ? '' : 's'}
              </p>
            ) : null}
            {canShare && !isFinalized ? (
              <p className="mx-3 mb-1 mt-0 font-base text-xs text-muted">Finalize the project before sharing.</p>
            ) : null}
            <div className="my-2 h-[1.5px] bg-base-300" aria-hidden />
          </>
        ) : null}
        <NavLink to="/profile" className={`${sheetActionClass} no-underline`} onClick={onClose}>
          Profile
        </NavLink>
        <button
          type="button"
          className={`${sheetActionClass} text-muted hover:bg-error/10 hover:text-error`}
          onClick={() => handleAction(onLogout)}
        >
          Log out
        </button>
      </div>
    </AppBottomSheet>
  )
}

ProjectMobileActionsSheet.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isProjectCreator: PropTypes.bool,
  canShare: PropTypes.bool,
  isFinalized: PropTypes.bool,
  shareLinkActive: PropTypes.shape({
    expiresAt: PropTypes.string,
    viewCount: PropTypes.number,
  }),
  onShare: PropTypes.func,
  onFinalize: PropTypes.func,
  onManageCollaborators: PropTypes.func,
  onLogout: PropTypes.func,
  canReviewPhotos: PropTypes.bool,
  reviewScope: PropTypes.string,
  onReviewScopeChange: PropTypes.func,
  sidebarStats: PropTypes.object,
  collaboratorMembers: PropTypes.array,
}
