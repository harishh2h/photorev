import { useMemo, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import ProjectViewToolbar from './ProjectViewToolbar.jsx'
import ProjectPhotoTile from './ProjectPhotoTile.jsx'
import ProjectViewSidebar from './ProjectViewSidebar.jsx'
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
import { filterPhotos, REVIEW_SCOPE, PHOTO_FILTER } from '@/utils/projectReviewFilters.js'
import { isPhotoVirtualGridEnabled } from '@/utils/photoContentUrl.js'

/**
 * @param {{ data: object; token: string; projectId: string; onRefresh: () => void; onLoadMorePhotos?: () => void; hasMorePhotos?: boolean; isLoadingMore?: boolean }} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectViewScreen({
  data,
  token,
  projectId,
  onRefresh,
  onLoadMorePhotos,
  hasMorePhotos = false,
  isLoadingMore = false,
}) {
  const navigate = useNavigate()
  const { show: showToast } = useToast()
  const canReviewPhotos = data.canReviewPhotos !== false
  const [reviewScope, setReviewScope] = useState(
    data.isProjectCreator ? REVIEW_SCOPE.TEAM : REVIEW_SCOPE.MINE
  )
  const [activeFilter, setActiveFilter] = useState(PHOTO_FILTER.ALL)
  const [collaboratorsOpen, setCollaboratorsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [finalizeOpen, setFinalizeOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    setReviewScope(data.isProjectCreator ? REVIEW_SCOPE.TEAM : REVIEW_SCOPE.MINE)
    setActiveFilter(PHOTO_FILTER.ALL)
  }, [projectId, data.isProjectCreator])

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

  const filteredPhotos = useMemo(() => {
    if (!canReviewPhotos) {
      return data.photos.filter((p) => p.teamIsLiked)
    }
    return filterPhotos(data.photos, data.trashedPhotos ?? [], {
      scope: reviewScope,
      filter: activeFilter,
    })
  }, [canReviewPhotos, activeFilter, reviewScope, data.photos, data.trashedPhotos])

  const handleReviewScopeChange = useCallback((scope) => {
    setReviewScope(scope)
    setActiveFilter(PHOTO_FILTER.ALL)
  }, [])

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
        state: { viewerPhotoIds: filteredPhotos.map((p) => p.id) },
      })
    },
    [navigate, projectId, filteredPhotos]
  )

  const emptyMessage = canReviewPhotos
    ? 'No photos match this filter.'
    : 'No selected photos yet.'
  const useVirtualGrid = isPhotoVirtualGridEnabled()

  return (
    <div className="lg:pr-[min(300px,100vw)]">
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
      <ProjectViewToolbar
        projectTitle={data.projectTitle}
        canReviewPhotos={canReviewPhotos}
        reviewScope={reviewScope}
        onReviewScopeChange={handleReviewScopeChange}
        filterCounts={data.filterCounts}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        isFinalized={Boolean(data.isFinalized)}
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
      <div className={`flex flex-col gap-6 pb-28 pt-4 lg:block ${canReviewPhotos ? 'lg:pb-32' : 'lg:pb-10'}`}>
        <div className="min-w-0">
          <div className="relative pb-8 lg:pb-10">
            {canReviewPhotos && data.collaboratingLabel !== 'SOLO REVIEW' ? (
              <p className="pointer-events-none mb-4 flex w-fit max-w-full items-center gap-2 rounded-full border-[1.5px] border-base-300 bg-base-100 px-5 py-2 font-base text-xs font-semibold uppercase tracking-[0.06em] text-muted shadow-card">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {data.collaboratingLabel}
              </p>
            ) : null}
            {filteredPhotos.length > 0 ? (
              <JustifiedPhotoGrid
                photos={filteredPhotos}
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
        <ProjectViewSidebar
          sidebarStats={data.sidebarStats}
          reviewScope={reviewScope}
          canReviewPhotos={canReviewPhotos}
          collaboratorMembers={data.collaboratorMembers}
          showSettings={Boolean(data.isProjectCreator)}
          isFinalized={Boolean(data.isFinalized)}
          canShare={Boolean(data.isProjectCreator)}
          isProjectCreator={Boolean(data.isProjectCreator)}
          token={token}
          projectId={projectId}
          onFinalize={handleFinalize}
          onShare={handleShare}
          onSettings={handleSettings}
          onManageCollaborators={data.isProjectCreator ? handleManageCollaborators : undefined}
        />
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
        onSaved={() => {
          setCollaboratorsOpen(false)
          onRefresh()
        }}
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
  onRefresh: PropTypes.func.isRequired,
  onLoadMorePhotos: PropTypes.func,
  hasMorePhotos: PropTypes.bool,
  isLoadingMore: PropTypes.bool,
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
