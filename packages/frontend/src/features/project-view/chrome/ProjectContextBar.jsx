import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import ProjectAccountMenu from './ProjectAccountMenu.jsx'
import ProjectReviewScopeMenu from './ProjectReviewScopeMenu.jsx'
import ProjectCollaboratorsMenu from './ProjectCollaboratorsMenu.jsx'
import ProjectSettingsButton from './ProjectSettingsButton.jsx'

/**
 * @param {{
 *   projectTitle: string;
 *   isFinalized?: boolean;
 *   userDisplayName?: string;
 *   onLogout?: () => void;
 *   isProjectCreator?: boolean;
 *   canShare?: boolean;
 *   shareLinkActive?: boolean;
 *   onShare?: () => void;
 *   onFinalize?: () => void;
 *   onOpenMobileMenu?: () => void;
 *   viewerSelectedCount?: number;
 *   canReviewPhotos?: boolean;
 *   reviewScope?: string;
 *   onReviewScopeChange?: (scope: string) => void;
 *   sidebarStats?: object;
 *   collaboratorMembers?: object[];
 *   onManageCollaborators?: () => void;
 *   canManageCollaborators?: boolean;
 *   sheetHintActive?: boolean;
 *   onSettings?: () => void;
 * }} props
 */
export default function ProjectContextBar({
  projectTitle,
  isFinalized = false,
  userDisplayName = 'User',
  onLogout,
  isProjectCreator = false,
  canShare = false,
  shareLinkActive = false,
  onShare,
  onFinalize,
  onOpenMobileMenu,
  viewerSelectedCount = 0,
  canReviewPhotos = true,
  reviewScope,
  onReviewScopeChange,
  sidebarStats,
  collaboratorMembers = [],
  onManageCollaborators,
  canManageCollaborators = false,
  sheetHintActive = false,
  onSettings,
}) {
  const showReviewControls = canReviewPhotos && reviewScope && sidebarStats && onReviewScopeChange

  return (
    <div className="flex min-h-14 items-center gap-2 py-3 md:gap-4 md:py-4">
      <Link
        to="/"
        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-1 font-base text-sm font-medium text-muted no-underline transition-colors duration-150 ease-out hover:text-base-content focus-visible:outline-none focus-visible:shadow-focus md:px-2"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="hidden sm:inline">Back to Dashboard</span>
        <span className="sr-only sm:hidden">Back to Dashboard</span>
      </Link>
      <div className="flex min-w-0 flex-1 items-center gap-2 md:max-w-[40%] md:gap-3 lg:max-w-none">
        <h1 className="m-0 min-w-0 truncate font-base text-xl font-bold leading-tight text-base-content md:text-2xl lg:text-3xl">
          {projectTitle}
        </h1>
        {isFinalized ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 font-base text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-accent md:px-3 md:text-xs">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            <span className="hidden sm:inline">Finalized</span>
            <span className="sm:hidden">Done</span>
          </span>
        ) : null}
        {!canReviewPhotos ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 font-base text-xs font-semibold text-accent">
            {viewerSelectedCount} selected
          </span>
        ) : null}
      </div>
      {showReviewControls ? (
        <div className="hidden shrink-0 items-center gap-2 md:flex md:gap-3">
          <ProjectReviewScopeMenu
            reviewScope={reviewScope}
            onReviewScopeChange={onReviewScopeChange}
            sidebarStats={sidebarStats}
          />
          <ProjectCollaboratorsMenu
            collaboratorMembers={collaboratorMembers}
            onManageCollaborators={onManageCollaborators}
            canManage={canManageCollaborators}
          />
        </div>
      ) : null}
      <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
        {isProjectCreator ? (
          <>
            <button
              type="button"
              disabled={canShare && !isFinalized}
              title={canShare && !isFinalized ? 'Finalize the project before sharing' : undefined}
              className="relative hidden min-h-11 items-center gap-2 rounded-full border-[1.5px] border-base-300 bg-base-100 px-4 font-base text-sm font-medium text-base-content transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-[#F4F9F6] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-55 md:inline-flex"
              onClick={onShare}
            >
              {shareLinkActive ? (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-base-100 bg-accent" aria-hidden />
              ) : null}
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
              </svg>
              Share Link
            </button>
            <button
              type="button"
              className="group hidden min-h-11 items-center justify-center gap-2 rounded-full border-0 bg-primary px-4 font-base text-sm font-semibold text-primary-content transition-[background-color,transform] duration-150 ease-out hover:bg-[#222222] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus md:inline-flex lg:px-6"
              onClick={onFinalize}
            >
              {isFinalized ? 'Re-finalize Review' : 'Finalize Review'}
              <span className="flex transition-transform duration-150 ease-out group-hover:-translate-y-0.5" aria-hidden>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </span>
            </button>
            {typeof onSettings === 'function' ? (
              <ProjectSettingsButton onClick={onSettings} />
            ) : null}
          </>
        ) : null}
        <ProjectAccountMenu userDisplayName={userDisplayName} onLogout={onLogout} />
        <button
          type="button"
          className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border-[1.5px] border-base-300 bg-base-100 text-base-content transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-[#F4F9F6] active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus md:hidden"
          aria-label="More actions"
          onClick={onOpenMobileMenu}
        >
          {sheetHintActive ? (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" aria-hidden />
          ) : null}
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>
    </div>
  )
}

ProjectContextBar.propTypes = {
  projectTitle: PropTypes.string.isRequired,
  isFinalized: PropTypes.bool,
  userDisplayName: PropTypes.string,
  onLogout: PropTypes.func,
  isProjectCreator: PropTypes.bool,
  canShare: PropTypes.bool,
  shareLinkActive: PropTypes.bool,
  onShare: PropTypes.func,
  onFinalize: PropTypes.func,
  onOpenMobileMenu: PropTypes.func,
  viewerSelectedCount: PropTypes.number,
  canReviewPhotos: PropTypes.bool,
  reviewScope: PropTypes.string,
  onReviewScopeChange: PropTypes.func,
  sidebarStats: PropTypes.object,
  collaboratorMembers: PropTypes.array,
  onManageCollaborators: PropTypes.func,
  canManageCollaborators: PropTypes.bool,
  sheetHintActive: PropTypes.bool,
  onSettings: PropTypes.func,
}
