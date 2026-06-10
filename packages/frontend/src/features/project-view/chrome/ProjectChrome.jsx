import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { getActiveShareLink } from '@/services/shareLinkService.js'
import PhotoSelectionControlBar from '../PhotoSelectionControlBar.jsx'
import ProjectContextBar from './ProjectContextBar.jsx'
import ProjectFilterBar from './ProjectFilterBar.jsx'
import ProjectMobileActionsSheet from './ProjectMobileActionsSheet.jsx'

/**
 * Project chrome: sticky context row + scrollable filter row.
 * @param {object} props
 */
export default function ProjectChrome({
  projectTitle,
  userEmail = '',
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
  onSettings,
  canDownload = false,
  onSelectFullQuality,
  onSelectCompressed,
  exportBusy = false,
  viewerSelectedCount = 0,
  selectionActive = false,
  selectedCount = 0,
  allVisibleSelected = false,
  onClearSelection,
  onSelectAllVisible,
  onSelectSelectedFullQuality,
  onSelectSelectedCompressed,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeShareLink, setActiveShareLink] = useState(null)

  useEffect(() => {
    if (!canShare || !token || !projectId) {
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
  }, [canShare, token, projectId])

  const shareLinkActive = Boolean(activeShareLink)
  const canManageCollaborators = isProjectCreator && typeof onManageCollaborators === 'function'
  const pendingConflicts = sidebarStats?.team?.pendingConflicts ?? 0
  const sheetHintActive = shareLinkActive || pendingConflicts > 0

  return (
    <>
      <header className="sticky top-0 z-sticky -mx-4 border-b-[1.5px] border-base-300 bg-base-100/95 px-4 backdrop-blur-md md:-mx-6 md:px-6">
        {selectionActive ? (
          <PhotoSelectionControlBar
            selectedCount={selectedCount}
            allVisibleSelected={allVisibleSelected}
            exportBusy={exportBusy}
            onClear={onClearSelection}
            onSelectAll={onSelectAllVisible}
            onSelectFullQuality={onSelectSelectedFullQuality}
            onSelectCompressed={onSelectSelectedCompressed}
          />
        ) : (
          <ProjectContextBar
            projectTitle={projectTitle}
            userEmail={userEmail}
            onLogout={onLogout}
            isProjectCreator={isProjectCreator}
            canShare={canShare}
            shareLinkActive={shareLinkActive}
            onShare={onShare}
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
            canDownload={canDownload}
            onSelectFullQuality={onSelectFullQuality}
            onSelectCompressed={onSelectCompressed}
            exportBusy={exportBusy}
          />
        )}
      </header>
      {!selectionActive ? (
        <div className="-mx-4 px-4 md:-mx-6 md:px-6">
          <ProjectFilterBar
            reviewScope={reviewScope}
            filterCounts={filterCounts}
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            canReviewPhotos={canReviewPhotos}
          />
        </div>
      ) : null}
      <ProjectMobileActionsSheet
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isProjectCreator={isProjectCreator}
        canShare={canShare}
        shareLinkActive={activeShareLink}
        onShare={onShare}
        onManageCollaborators={canManageCollaborators ? onManageCollaborators : undefined}
        onLogout={onLogout}
        userEmail={userEmail}
        canReviewPhotos={canReviewPhotos}
        reviewScope={reviewScope}
        onReviewScopeChange={onReviewScopeChange}
        sidebarStats={sidebarStats}
        collaboratorMembers={collaboratorMembers}
        canDownload={canDownload}
        onSelectFullQuality={onSelectFullQuality}
        onSelectCompressed={onSelectCompressed}
        exportBusy={exportBusy}
      />
    </>
  )
}

ProjectChrome.propTypes = {
  projectTitle: PropTypes.string.isRequired,
  userEmail: PropTypes.string,
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
  onSettings: PropTypes.func,
  canDownload: PropTypes.bool,
  onSelectFullQuality: PropTypes.func,
  onSelectCompressed: PropTypes.func,
  exportBusy: PropTypes.bool,
  viewerSelectedCount: PropTypes.number,
  selectionActive: PropTypes.bool,
  selectedCount: PropTypes.number,
  allVisibleSelected: PropTypes.bool,
  onClearSelection: PropTypes.func,
  onSelectAllVisible: PropTypes.func,
  onSelectSelectedFullQuality: PropTypes.func,
  onSelectSelectedCompressed: PropTypes.func,
}
