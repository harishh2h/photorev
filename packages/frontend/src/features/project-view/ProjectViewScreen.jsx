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
import { ShareLinkModal } from '@/features/share/index.js'
import {
  getExportStorageKey,
  ProjectDownloadDropdown,
  ProjectExportResumeChip,
  ProjectExportStatusFloat,
  useProjectExport,
} from '@/features/project-export/index.js'
import { useProjectPhotoUpload } from '@/hooks/useProjectPhotoUpload.js'
import { countForFilter, PHOTO_FILTER, REVIEW_SCOPE } from '@/utils/projectReviewFilters.js'
import { isPhotoVirtualGridEnabled } from '@/utils/photoContentUrl.js'
import { mapPhotosForViewer } from '@/utils/mapPhotosForViewer.js'

/**
 * @param {{ data: object; token: string; projectId: string; userEmail?: string; onLogout?: () => void; onRefresh: () => void; onLoadMorePhotos?: () => void; hasMorePhotos?: boolean; isLoadingMore?: boolean; isLoadingGrid?: boolean; reviewScope: string; activeFilter: string; onReviewScopeChange: (scope: string) => void; onFilterChange: (filter: string) => void }} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectViewScreen({
  data,
  token,
  projectId,
  userEmail = '',
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
  const canReviewPhotos = data.canReviewPhotos !== false
  const [collaboratorsOpen, setCollaboratorsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const exportReviewScope = canReviewPhotos ? reviewScope : REVIEW_SCOPE.TEAM
  const exportActiveFilter = canReviewPhotos ? activeFilter : PHOTO_FILTER.LIKED
  const scopeCounts =
    exportReviewScope === REVIEW_SCOPE.TEAM ? data.filterCounts.team : data.filterCounts.mine
  const globalCounts = {
    conflicts: data.filterCounts.conflicts ?? 0,
    trashed: data.filterCounts.trashed ?? 0,
  }
  const filteredDownloadCount = canReviewPhotos
    ? countForFilter(scopeCounts, exportActiveFilter, globalCounts)
    : (data.sidebarStats?.viewer?.selected ?? 0)
  const exportStorageKey = getExportStorageKey('project', projectId, {
    reviewScope: exportReviewScope,
    activeFilter: exportActiveFilter,
  })
  const exportState = useProjectExport({
    mode: 'project',
    token,
    projectId,
    projectName: data.projectTitle,
    storageKey: exportStorageKey,
    reviewScope: exportReviewScope,
    activeFilter: exportActiveFilter,
  })

  const {
    fileInputRef,
    uploadConcurrency,
    handleConcurrencyChange,
    isUploading,
    uploadJobs,
    uploadBatchProgress,
    uploadMessage,
    showUploadPanel,
    canRetryFailed,
    openFilePicker,
    handleFileInputChange,
    dismissUploadPanel,
    retryFailedUploads,
    cancelUploadJob,
    maxUploadConcurrency,
  } = useProjectPhotoUpload({ token, projectId, onAfterBatch: onRefresh })

  const gridPhotos = data.photos

  const handleReviewScopeChange = useCallback(
    (scope) => {
      onReviewScopeChange(scope)
    },
    [onReviewScopeChange]
  )

  const handleShare = useCallback(() => {
    setShareOpen(true)
  }, [])
  const handleSettings = useCallback(() => {
    if (data.isProjectCreator) {
      setSettingsOpen(true)
    }
  }, [data.isProjectCreator])
  const handleExportFullQuality = useCallback(() => {
    void exportState.startExport('original')
  }, [exportState])
  const handleExportCompressed = useCallback(() => {
    void exportState.startExport('preview')
  }, [exportState])
  const handleManageCollaborators = useCallback(() => {
    if (data.isProjectCreator) {
      setCollaboratorsOpen(true)
    }
  }, [data.isProjectCreator])
  const openPhotoViewer = useCallback(
    (photoId) => {
      navigate(`/projects/${projectId}/photos/${photoId}`, {
        state: {
          viewerPhotoIds: gridPhotos.map((p) => p.id),
          viewerPhotos: mapPhotosForViewer(gridPhotos),
        },
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
        userEmail={userEmail}
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
        onSettings={handleSettings}
        canDownload={filteredDownloadCount > 0}
        onSelectFullQuality={handleExportFullQuality}
        onSelectCompressed={handleExportCompressed}
        exportBusy={exportState.isBusy}
        viewerSelectedCount={data.sidebarStats.viewer.selected}
      />
      <ProjectExportStatusFloat
        show={exportState.showPanel}
        stackAboveUpload={showUploadPanel}
        variantLabel={exportState.variantLabel}
        phase={exportState.phase}
        exportJob={exportState.exportJob}
        progress={exportState.progress}
        isPreparing={exportState.isPreparing}
        downloading={exportState.downloading}
        error={exportState.error}
        zipName={exportState.zipName}
        onDownload={() => {
          void exportState.downloadZip(exportState.zipName)
        }}
        onDismiss={exportState.dismissPanel}
        onClear={exportState.clearExport}
      />
      {exportState.showResumeChip ? (
        <ProjectExportResumeChip
          stackAboveUpload={showUploadPanel}
          label={
            exportState.isPreparing
              ? `Download ${exportState.progress}%`
              : 'Download ready'
          }
          onOpen={exportState.reopenPanel}
        />
      ) : null}
      {showUploadPanel ? (
        <ProjectUploadStatusFloat
          isUploading={isUploading}
          uploadJobs={uploadJobs}
          uploadBatchProgress={uploadBatchProgress}
          uploadMessage={uploadMessage}
          uploadConcurrency={uploadConcurrency}
          maxConcurrency={maxUploadConcurrency}
          onConcurrencyChange={handleConcurrencyChange}
          onDismiss={dismissUploadPanel}
          canRetryFailed={canRetryFailed}
          onRetryFailed={retryFailedUploads}
          onCancelJob={cancelUploadJob}
        />
      ) : null}
      <div className={`relative flex flex-col gap-6 pb-28 pt-4 ${canReviewPhotos ? 'lg:pb-16' : 'lg:pb-10'}`}>
        {isLoadingGrid && gridPhotos.length === 0 ? (
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
        onRenameSuccess={() => {
          setSettingsOpen(false)
          onRefresh()
        }}
        onProjectDeleted={() => navigate('/', { replace: true })}
      />
      <CollaboratorsManageModal
        isOpen={collaboratorsOpen}
        onClose={() => setCollaboratorsOpen(false)}
        token={token}
        projectId={projectId}
        members={Array.isArray(data.collaboratorsRows) ? data.collaboratorsRows : []}
        onSaved={onRefresh}
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
  userEmail: PropTypes.string,
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
    projectStatus: PropTypes.string,
  }).isRequired,
}
