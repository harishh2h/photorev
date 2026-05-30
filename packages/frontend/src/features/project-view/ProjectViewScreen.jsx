import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { ProjectChrome } from '@/features/project-view/chrome/index.js'
import ProjectPhotoTile from './ProjectPhotoTile.jsx'
import { JustifiedPhotoGrid } from '@/components/photo-grid/index.js'
import ProjectGridOverlays from './ProjectGridOverlays.jsx'
import ProjectUploadStatusFloat from './ProjectUploadStatusFloat.jsx'
import { CollaboratorsManageModal } from '@/features/project-collaborators/index.js'
import { ProjectSettingsModal } from '@/features/project-settings/index.js'
import { FinalizeReviewModal } from '@/features/finalize/index.js'
import { ShareLinkModal } from '@/features/share/index.js'
import { useProjectPhotoUpload } from '@/hooks/useProjectPhotoUpload.js'
import { finalizeProject as finalizeProjectApi } from '@/services/projectService.js'
import { useToast } from '@/components/Toast/index.js'
import { REVIEW_SCOPE } from '@/utils/projectReviewFilters.js'
import { isPhotoVirtualGridEnabled } from '@/utils/photoContentUrl.js'

/**
 * @param {{ data: object; token: string; projectId: string; userDisplayName?: string; onLogout?: () => void; onRefresh: () => void; onLoadMorePhotos?: () => void; hasMorePhotos?: boolean; isLoadingMore?: boolean; isLoadingGrid?: boolean; reviewScope: string; activeFilter: string; onReviewScopeChange: (scope: string) => void; onFilterChange: (filter: string) => void }} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectViewScreen({
  data,
  token,
  projectId,
  userDisplayName = 'User',
  onLogout,
  onRefresh,
  onLoadMorePhotos,
  hasMorePhotos = false,
  isLoadingMore = false,
  isLoadingGrid = false,
  reviewScope,
  activeFilter,
  onReviewScopeChange,
  onFilterChange,
}) {
  const navigate = useNavigate()
  const { show: showToast } = useToast()
  const canReviewPhotos = data.canReviewPhotos !== false
  const [collaboratorsOpen, setCollaboratorsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [finalizeOpen, setFinalizeOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const {
    fileInputRef,
    uploadConcurrency,
    handleConcurrencyChange,
    isUploading,
    uploadJobs,
    uploadMessage,
    showUploadPanel,
    canRetryFailed,
    openFilePicker,
    handleFileInputChange,
    dismissUploadPanel,
    retryFailedUploads,
    maxUploadConcurrency,
  } = useProjectPhotoUpload({ token, projectId, onAfterBatch: onRefresh })

  const gridPhotos = data.photos

  const handleReviewScopeChange = useCallback(
    (scope) => {
      onReviewScopeChange(scope)
    },
    [onReviewScopeChange]
  )

  const handleFinalize = useCallback(() => {
    if (data.isProjectCreator) {
      setFinalizeOpen(true)
    }
  }, [data.isProjectCreator])
  const handleShare = useCallback(() => {
    setShareOpen(true)
  }, [])
  const handleFinalizeConfirm = useCallback(
    async (action) => {
      try {
        await finalizeProjectApi(token, projectId, action)
        setFinalizeOpen(false)
        showToast('Project finalized', 'success')
        onRefresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not finalize'
        showToast(msg, 'error')
        throw err
      }
    },
    [token, projectId, onRefresh, showToast]
  )
  const handleSettings = useCallback(() => {
    if (data.isProjectCreator) {
      setSettingsOpen(true)
    }
  }, [data.isProjectCreator])
  const handleManageCollaborators = useCallback(() => {
    if (data.isProjectCreator) {
      setCollaboratorsOpen(true)
    }
  }, [data.isProjectCreator])
  const openPhotoViewer = useCallback(
    (photoId) => {
      navigate(`/projects/${projectId}/photos/${photoId}`, {
        state: { viewerPhotoIds: gridPhotos.map((p) => p.id) },
      })
    },
    [navigate, projectId, gridPhotos]
  )

  const emptyMessage = canReviewPhotos
    ? 'No photos match this filter.'
    : 'No selected photos yet.'
  const useVirtualGrid = isPhotoVirtualGridEnabled()

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={handleFileInputChange}
      />
      <ProjectChrome
        projectTitle={data.projectTitle}
        isFinalized={Boolean(data.isFinalized)}
        userDisplayName={userDisplayName}
        onLogout={onLogout}
        token={token}
        projectId={projectId}
        isProjectCreator={Boolean(data.isProjectCreator)}
        canShare={Boolean(data.isProjectCreator)}
        canReviewPhotos={canReviewPhotos}
        reviewScope={reviewScope}
        onReviewScopeChange={handleReviewScopeChange}
        filterCounts={data.filterCounts}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        sidebarStats={data.sidebarStats}
        collaboratorMembers={data.collaboratorMembers}
        onManageCollaborators={data.isProjectCreator ? handleManageCollaborators : undefined}
        onShare={handleShare}
        onFinalize={handleFinalize}
        onSettings={handleSettings}
        viewerSelectedCount={data.sidebarStats.viewer.selected}
      />
      {showUploadPanel ? (
        <ProjectUploadStatusFloat
          isUploading={isUploading}
          uploadJobs={uploadJobs}
          uploadMessage={uploadMessage}
          uploadConcurrency={uploadConcurrency}
          maxConcurrency={maxUploadConcurrency}
          onConcurrencyChange={handleConcurrencyChange}
          onDismiss={dismissUploadPanel}
          canRetryFailed={canRetryFailed}
          onRetryFailed={retryFailedUploads}
        />
      ) : null}
      <div className={`relative flex flex-col gap-6 pb-28 pt-4 ${canReviewPhotos ? 'lg:pb-16' : 'lg:pb-10'}`}>
        {isLoadingGrid ? (
          <div
            className="pointer-events-none absolute inset-0 z-raised flex items-start justify-center bg-base-100/50 pt-16"
            aria-live="polite"
            aria-busy="true"
          >
            <span className="loading loading-spinner loading-md text-accent" aria-hidden />
            <span className="sr-only">Loading photos…</span>
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="relative pb-8 lg:pb-10">
            {gridPhotos.length > 0 ? (
              <JustifiedPhotoGrid
                photos={gridPhotos}
                virtualized={useVirtualGrid}
                onLoadMore={onLoadMorePhotos}
                hasMore={hasMorePhotos}
                isLoadingMore={isLoadingMore}
                renderTile={({ photo, position, animationDelay }) => (
                  <ProjectPhotoTile
                    as="div"
                    photo={photo}
                    token={token}
                    onOpenPhoto={openPhotoViewer}
                    reviewScope={reviewScope}
                    canReviewPhotos={canReviewPhotos}
                    layoutSlot={position}
                    animationDelay={animationDelay}
                  />
                )}
              />
            ) : (
              <p className="m-0 rounded-card border-[1.5px] border-dashed border-base-300 bg-base-100 px-4 py-10 text-center font-base text-base text-muted">
                {emptyMessage}
              </p>
            )}
            {canReviewPhotos ? (
              <ProjectGridOverlays
                onAddPhotos={openFilePicker}
                isUploading={isUploading}
                showAddPhotos={Boolean(data.canUploadPhotos)}
              />
            ) : null}
          </div>
        </div>
      </div>
      <ProjectSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        token={token}
        projectId={projectId}
        initialProjectName={data.projectTitle}
        collaboratorCount={data.collaboratorMembers.length}
        onRenameSuccess={() => {
          setSettingsOpen(false)
          onRefresh()
        }}
        onOpenTeam={() => setCollaboratorsOpen(true)}
        onProjectDeleted={() => navigate('/projects', { replace: true })}
      />
      <CollaboratorsManageModal
        isOpen={collaboratorsOpen}
        onClose={() => setCollaboratorsOpen(false)}
        token={token}
        projectId={projectId}
        members={Array.isArray(data.collaboratorsRows) ? data.collaboratorsRows : []}
        onSaved={onRefresh}
      />
      <FinalizeReviewModal
        isOpen={finalizeOpen}
        onClose={() => setFinalizeOpen(false)}
        onConfirm={handleFinalizeConfirm}
        projectName={data.projectTitle}
        pendingConflicts={data.filterCounts.pendingConflicts ?? 0}
        isFinalized={Boolean(data.isFinalized)}
      />
      <ShareLinkModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        token={token}
        projectId={projectId}
        projectName={data.projectTitle}
      />
    </div>
  )
}

const photoShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'ready', 'failed', 'trashed']),
  myIsLiked: PropTypes.bool,
  myIsRejected: PropTypes.bool,
  teamIsLiked: PropTypes.bool,
  teamIsRejected: PropTypes.bool,
  hasConflict: PropTypes.bool,
  conflictState: PropTypes.string,
  finalDecision: PropTypes.number,
  isTrashed: PropTypes.bool,
  selectionLabel: PropTypes.string,
})

const collaboratorMemberShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  initial: PropTypes.string.isRequired,
  roleLabel: PropTypes.string,
})

ProjectViewScreen.propTypes = {
  token: PropTypes.string.isRequired,
  projectId: PropTypes.string.isRequired,
  userDisplayName: PropTypes.string,
  onLogout: PropTypes.func,
  onRefresh: PropTypes.func.isRequired,
  onLoadMorePhotos: PropTypes.func,
  hasMorePhotos: PropTypes.bool,
  isLoadingMore: PropTypes.bool,
  isLoadingGrid: PropTypes.bool,
  reviewScope: PropTypes.oneOf([REVIEW_SCOPE.MINE, REVIEW_SCOPE.TEAM]).isRequired,
  activeFilter: PropTypes.string.isRequired,
  onReviewScopeChange: PropTypes.func.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  data: PropTypes.shape({
    projectTitle: PropTypes.string.isRequired,
    collaboratingLabel: PropTypes.string.isRequired,
    sidebarStats: PropTypes.shape({
      mine: PropTypes.object.isRequired,
      team: PropTypes.object.isRequired,
      viewer: PropTypes.object.isRequired,
    }).isRequired,
    reviewProgressPercent: PropTypes.number,
    collaboratorMembers: PropTypes.arrayOf(collaboratorMemberShape).isRequired,
    collaboratorsRows: PropTypes.arrayOf(PropTypes.object),
    viewerContext: PropTypes.object,
    canReviewPhotos: PropTypes.bool,
    canUploadPhotos: PropTypes.bool,
    isProjectCreator: PropTypes.bool,
    filterCounts: PropTypes.shape({
      mine: PropTypes.object.isRequired,
      team: PropTypes.object.isRequired,
      conflicts: PropTypes.number.isRequired,
      pendingConflicts: PropTypes.number.isRequired,
      trashed: PropTypes.number,
    }).isRequired,
    photos: PropTypes.arrayOf(photoShape).isRequired,
    trashedPhotos: PropTypes.arrayOf(photoShape),
    isFinalized: PropTypes.bool,
    finalizedAt: PropTypes.string,
    projectStatus: PropTypes.string,
  }).isRequired,
}
