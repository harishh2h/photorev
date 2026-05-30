import { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import PublicSharePasswordGate from './PublicSharePasswordGate.jsx'
import PublicShareGrid from './PublicShareGrid.jsx'
import PublicShareLightbox from './PublicShareLightbox.jsx'
import { usePublicShare } from './usePublicShare.js'
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
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b-[1.5px] border-base-300 bg-base-100">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-6 md:flex-row md:items-end md:justify-between md:px-8 md:py-8">
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
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <div className="relative -rotate-1 self-start rounded-md border-[1.5px] border-accent/40 bg-base-100 px-4 py-3 shadow-floating sm:self-end">
              <span className="block font-base text-sm font-bold leading-tight text-accent">
                {photos.length} photo{photos.length === 1 ? '' : 's'}
              </span>
              <span className="font-base text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                {meta.allowDownload ? 'Downloads on' : 'Downloads off'}
              </span>
            </div>
            {meta.allowDownload && photos.length > 0 ? (
              <ProjectDownloadDropdown
                disabled={exportState.isBusy}
                onSelectFullQuality={handleExportFullQuality}
                onSelectCompressed={handleExportCompressed}
              />
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 md:px-8 md:pt-10">
        <PublicShareGrid
          token={token}
          unlockToken={unlockToken}
          photos={photos}
          onSelect={(i) => setActiveIndex(i)}
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
          allowDownload={meta.allowDownload}
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
