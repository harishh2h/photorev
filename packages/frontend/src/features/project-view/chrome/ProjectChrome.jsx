import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { getActiveShareLink } from '@/services/shareLinkService.js'
import ProjectContextBar from './ProjectContextBar.jsx'
import ProjectFilterBar from './ProjectFilterBar.jsx'
import ProjectMobileActionsSheet from './ProjectMobileActionsSheet.jsx'

/**
 * Project chrome: sticky context row + scrollable filter row.
 * @param {object} props
 */
export default function ProjectChrome({
  projectTitle,
  isFinalized = false,
  userDisplayName = 'User',
  onLogout,
  token,
  projectId,
  isProjectCreator = false,
  canShare = false,
  canReviewPhotos = true,
  reviewScope,
  onReviewScopeChange,
  filterCounts,
  activeFilter,
  onFilterChange,
  sidebarStats,
  collaboratorMembers,
  onManageCollaborators,
  onShare,
  onFinalize,
  onSettings,
  viewerSelectedCount = 0,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeShareLink, setActiveShareLink] = useState(null)

  useEffect(() => {
    if (!canShare || !isFinalized || !token || !projectId) {
      setActiveShareLink(null)
      return undefined
    }
    let cancelled = false
    const run = async () => {
      try {
        const link = await getActiveShareLink(token, projectId)
        if (!cancelled) setActiveShareLink(link)
      } catch {
        if (!cancelled) setActiveShareLink(null)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [canShare, isFinalized, token, projectId])

  const shareLinkActive = Boolean(activeShareLink)
  const canManageCollaborators = isProjectCreator && typeof onManageCollaborators === 'function'
  const pendingConflicts = sidebarStats?.team?.pendingConflicts ?? 0
  const sheetHintActive = shareLinkActive || pendingConflicts > 0

  return (
    <>
      <header className="sticky top-0 z-sticky -mx-4 border-b-[1.5px] border-base-300 bg-base-100/95 px-4 backdrop-blur-md md:-mx-6 md:px-6">
        <ProjectContextBar
          projectTitle={projectTitle}
          isFinalized={isFinalized}
          userDisplayName={userDisplayName}
          onLogout={onLogout}
          isProjectCreator={isProjectCreator}
          canShare={canShare}
          shareLinkActive={shareLinkActive}
          onShare={onShare}
          onFinalize={onFinalize}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          viewerSelectedCount={viewerSelectedCount}
          canReviewPhotos={canReviewPhotos}
          reviewScope={reviewScope}
          onReviewScopeChange={onReviewScopeChange}
          sidebarStats={sidebarStats}
          collaboratorMembers={collaboratorMembers}
          onManageCollaborators={onManageCollaborators}
          canManageCollaborators={canManageCollaborators}
          sheetHintActive={sheetHintActive}
          onSettings={isProjectCreator ? onSettings : undefined}
        />
      </header>
      <div className="-mx-4 px-4 md:-mx-6 md:px-6">
        <ProjectFilterBar
          reviewScope={reviewScope}
          filterCounts={filterCounts}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          canReviewPhotos={canReviewPhotos}
        />
      </div>
      <ProjectMobileActionsSheet
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isProjectCreator={isProjectCreator}
        canShare={canShare}
        isFinalized={isFinalized}
        shareLinkActive={activeShareLink}
        onShare={onShare}
        onFinalize={onFinalize}
        onManageCollaborators={canManageCollaborators ? onManageCollaborators : undefined}
        onLogout={onLogout}
        canReviewPhotos={canReviewPhotos}
        reviewScope={reviewScope}
        onReviewScopeChange={onReviewScopeChange}
        sidebarStats={sidebarStats}
        collaboratorMembers={collaboratorMembers}
      />
    </>
  )
}

ProjectChrome.propTypes = {
  projectTitle: PropTypes.string.isRequired,
  isFinalized: PropTypes.bool,
  userDisplayName: PropTypes.string,
  onLogout: PropTypes.func,
  token: PropTypes.string.isRequired,
  projectId: PropTypes.string.isRequired,
  isProjectCreator: PropTypes.bool,
  canShare: PropTypes.bool,
  canReviewPhotos: PropTypes.bool,
  reviewScope: PropTypes.string.isRequired,
  onReviewScopeChange: PropTypes.func.isRequired,
  filterCounts: PropTypes.object.isRequired,
  activeFilter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  sidebarStats: PropTypes.object.isRequired,
  collaboratorMembers: PropTypes.array.isRequired,
  onManageCollaborators: PropTypes.func,
  onShare: PropTypes.func,
  onFinalize: PropTypes.func,
  onSettings: PropTypes.func,
  viewerSelectedCount: PropTypes.number,
}
