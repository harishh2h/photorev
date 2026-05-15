import { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import ProjectViewToolbar from './ProjectViewToolbar.jsx'
import ProjectPhotoGrid from './ProjectPhotoGrid.jsx'
import ProjectViewSidebar from './ProjectViewSidebar.jsx'
import ProjectGridOverlays from './ProjectGridOverlays.jsx'
import ProjectUploadStatusFloat from './ProjectUploadStatusFloat.jsx'
import { CollaboratorsManageModal } from '@/features/project-collaborators/index.js'
import { useProjectPhotoUpload } from '@/hooks/useProjectPhotoUpload.js'

/**
 * @param {{ data: object; token: string; projectId: string; onRefresh: () => void }} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectViewScreen({ data, token, projectId, onRefresh }) {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('all')
  const [collaboratorsOpen, setCollaboratorsOpen] = useState(false)
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
    if (activeFilter === 'all') return data.photos
    if (activeFilter === 'liked') return data.photos.filter((p) => p.isLiked)
    if (activeFilter === 'rejected') return data.photos.filter((p) => p.isRejected)
    return data.photos.filter((p) => p.hasConflict)
  }, [activeFilter, data.photos])
  const handleFinalize = useCallback(() => {}, [])
  const handleShare = useCallback(() => {}, [])
  const handleSettings = useCallback(() => {
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
        filterCounts={data.filterCounts}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
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
      <div className="flex flex-col gap-6 pb-28 pt-4 lg:block lg:pb-32">
        <div className="min-w-0">
          <div className="relative pb-8 lg:pb-10">
            {filteredPhotos.length > 0 ? (
              <ProjectPhotoGrid photos={filteredPhotos} token={token} onOpenPhoto={openPhotoViewer} />
            ) : (
              <p className="m-0 rounded-card border-[1.5px] border-dashed border-base-300 bg-base-100 px-4 py-10 text-center font-base text-base text-muted">
                No photos match this filter.
              </p>
            )}
            <ProjectGridOverlays
              collaboratingLabel={data.collaboratingLabel}
              onAddPhotos={openFilePicker}
              isUploading={isUploading}
              showAddPhotos={Boolean(data.canUploadPhotos)}
            />
          </div>
        </div>
        <ProjectViewSidebar
          likedCount={data.likedCount}
          likedWithNames={data.likedWithNames}
          reviewProgressPercent={data.reviewProgressPercent}
          collaboratorMembers={data.collaboratorMembers}
          showSettings={Boolean(data.isProjectCreator)}
          onFinalize={handleFinalize}
          onShare={handleShare}
          onSettings={handleSettings}
        />
      </div>
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
    </div>
  )
}

const photoShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'ready', 'failed']),
  isLiked: PropTypes.bool.isRequired,
  isRejected: PropTypes.bool.isRequired,
  hasConflict: PropTypes.bool.isRequired,
  selectionLabel: PropTypes.string,
  renamedTo: PropTypes.string,
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
  data: PropTypes.shape({
    projectTitle: PropTypes.string.isRequired,
    collaboratingLabel: PropTypes.string.isRequired,
    likedCount: PropTypes.number.isRequired,
    likedWithNames: PropTypes.string.isRequired,
    reviewProgressPercent: PropTypes.number.isRequired,
    collaboratorMembers: PropTypes.arrayOf(collaboratorMemberShape).isRequired,
    collaboratorsRows: PropTypes.arrayOf(PropTypes.object),
    viewerContext: PropTypes.object,
    canReviewPhotos: PropTypes.bool,
    canUploadPhotos: PropTypes.bool,
    isProjectCreator: PropTypes.bool,
    filterCounts: PropTypes.shape({
      all: PropTypes.number.isRequired,
      liked: PropTypes.number.isRequired,
      rejected: PropTypes.number.isRequired,
      conflicts: PropTypes.number.isRequired,
    }).isRequired,
    photos: PropTypes.arrayOf(photoShape).isRequired,
  }).isRequired,
}
