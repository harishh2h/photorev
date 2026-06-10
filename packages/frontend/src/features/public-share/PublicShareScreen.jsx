import { useState, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import PublicSharePasswordGate from './PublicSharePasswordGate.jsx'
import PublicShareGrid from './PublicShareGrid.jsx'
import PublicShareLightbox from './PublicShareLightbox.jsx'
import PhotoSelectionControlBar from '@/features/project-view/PhotoSelectionControlBar.jsx'
import { usePublicShare } from './usePublicShare.js'
import { usePhotoMultiSelect } from '@/hooks/usePhotoMultiSelect.js'
import {
  getExportStorageKey,
  ProjectDownloadDropdown,
  ProjectExportResumeChip,
  ProjectExportStatusFloat,
  useProjectExport,
} from '@/features/project-export/index.js'

/**
 * @param {{ token: string }} props
 */
export default function PublicShareScreen({ token }) {
  const { listing, loading, error, requiresPassword, unlockToken, submitPassword } =
    usePublicShare(token)
  const [activeIndex, setActiveIndex] = useState(null)

  const exportStorageKey = getExportStorageKey('share', token)
  const exportState = useProjectExport({
    mode: 'share',
    token: '',
    shareToken: token,
    unlockToken,
    projectName: listing?.meta?.projectName ?? 'Gallery',
    storageKey: exportStorageKey,
  })

  const handleExportFullQuality = useCallback(() => {
    void exportState.startExport('original')
  }, [exportState])

  const handleExportCompressed = useCallback(() => {
    void exportState.startExport('preview')
  }, [exportState])

  const photoIds = useMemo(() => (listing?.photos ?? []).map((photo) => photo.id), [listing?.photos])
  const multiSelect = usePhotoMultiSelect(photoIds)

  const handleExportSelectedFullQuality = useCallback(() => {
    if (multiSelect.selectedCount === 0) return
    void exportState.startExport('original', multiSelect.selectedIdList)
    multiSelect.clearSelection()
  }, [exportState, multiSelect])

  const handleExportSelectedCompressed = useCallback(() => {
    if (multiSelect.selectedCount === 0) return
    void exportState.startExport('preview', multiSelect.selectedIdList)
    multiSelect.clearSelection()
  }, [exportState, multiSelect])

  if (loading && !listing) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-4 font-base text-sm text-muted">
        Loading shared gallery…
      </div>
    )
  }

  if (requiresPassword && !listing) {
    return <PublicSharePasswordGate onSubmit={submitPassword} />
  }

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-4 font-base text-sm text-error" role="alert">
        {error}
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-4 font-base text-sm text-muted">
        Share link not available.
      </div>
    )
  }

  const { meta, photos } = listing
  const allowDownload = meta.allowDownload && photos.length > 0

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-sticky border-b-[1.5px] border-base-300 bg-base-100/95 backdrop-blur-md">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8">
          {multiSelect.selectionActive ? (
            <PhotoSelectionControlBar
              selectedCount={multiSelect.selectedCount}
              allVisibleSelected={multiSelect.allVisibleSelected}
              exportBusy={exportState.isBusy}
              onClear={multiSelect.clearSelection}
              onSelectAll={multiSelect.selectAllVisible}
              onSelectFullQuality={handleExportSelectedFullQuality}
              onSelectCompressed={handleExportSelectedCompressed}
            />
          ) : (
            <div className="flex flex-col gap-2 py-6 md:flex-row md:items-end md:justify-between md:py-8">
              <div className="flex flex-col gap-1">
                <p className="m-0 font-base text-xs font-semibold uppercase tracking-[0.08em] text-accent">
                  Shared gallery
                </p>
                <h1 className="m-0 font-base text-3xl font-bold leading-tight text-base-content md:text-4xl">
                  {meta.projectName}
                </h1>
                {meta.description ? (
                  <p className="m-0 max-w-prose font-base text-sm text-muted">{meta.description}</p>
                ) : null}
              </div>
              {allowDownload ? (
                <div className="flex shrink-0 items-center md:pb-1">
                  <ProjectDownloadDropdown
                    disabled={exportState.isBusy}
                    onSelectFullQuality={handleExportFullQuality}
                    onSelectCompressed={handleExportCompressed}
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 md:px-8 md:pt-10">
        <PublicShareGrid
          token={token}
          unlockToken={unlockToken}
          photos={photos}
          onSelect={(i) => setActiveIndex(i)}
          enableSelection={allowDownload}
          selectionActive={multiSelect.selectionActive}
          isSelected={multiSelect.isSelected}
          onPhotoClick={multiSelect.handlePhotoClick}
          onCheckboxPress={multiSelect.handleCheckboxPress}
          onLongPressSelect={multiSelect.handleLongPress}
        />
      </main>
      <ProjectExportStatusFloat
        show={exportState.showPanel}
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
          label={
            exportState.isPreparing
              ? `Download ${exportState.progress}%`
              : 'Download ready'
          }
          onOpen={exportState.reopenPanel}
        />
      ) : null}
      {activeIndex != null ? (
        <PublicShareLightbox
          token={token}
          unlockToken={unlockToken}
          photos={photos}
          index={activeIndex}
          showMetadata={meta.showMetadata}
          onClose={() => setActiveIndex(null)}
          onChange={(next) => setActiveIndex(next)}
        />
      ) : null}
    </div>
  )
}

PublicShareScreen.propTypes = {
  token: PropTypes.string.isRequired,
}
