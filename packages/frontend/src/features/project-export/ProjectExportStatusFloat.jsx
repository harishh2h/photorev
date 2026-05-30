import PropTypes from 'prop-types'
import AppButton from '@/components/ui/AppButton.jsx'
import { EXPORT_TTL_HINT } from './exportLabels.js'

function formatExpiry(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return null
  }
}

/**
 * @param {{
 *   show: boolean;
 *   stackAboveUpload?: boolean;
 *   variantLabel: string | null;
 *   phase: string;
 *   exportJob: object | null;
 *   progress: number;
 *   isPreparing: boolean;
 *   downloading: boolean;
 *   error: Error | null;
 *   zipName: string;
 *   onDownload: () => void;
 *   onDismiss: () => void;
 *   onClear: () => void;
 * }} props
 */
export default function ProjectExportStatusFloat({
  show,
  stackAboveUpload = false,
  variantLabel,
  phase,
  exportJob,
  progress,
  isPreparing,
  downloading,
  error,
  zipName,
  onDownload,
  onDismiss,
  onClear,
}) {
  if (!show) return null

  const ready = phase === 'ready' && exportJob?.downloadAvailable
  const failed = phase === 'failed' || exportJob?.status === 'failed'
  const reused = Boolean(exportJob?.reused)

  return (
    <aside
      className={`fixed left-4 z-[211] w-[min(calc(100vw-2rem),22rem)] rounded-floating border-[1.5px] border-base-300 bg-base-100 p-4 shadow-floating ${
        stackAboveUpload ? 'bottom-28' : 'bottom-4'
      }`}
      aria-label="Download export status"
      role="status"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="m-0 flex items-center gap-2 font-base text-sm font-semibold text-base-content">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
            {isPreparing ? 'Preparing download' : ready ? 'Download ready' : failed ? 'Download failed' : 'Download'}
          </p>
          {variantLabel ? (
            <p className="m-0 mt-1 font-base text-xs text-muted">{variantLabel}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-circle btn-sm min-h-9 min-w-9 shrink-0 border-0 text-muted transition-[color,transform] duration-150 ease-out hover:text-base-content active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus"
          aria-label="Minimize download panel"
          onClick={onDismiss}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isPreparing ? (
        <div className="mb-3">
          <p className="m-0 mb-2 font-base text-xs text-muted">
            {exportJob
              ? `${exportJob.processedCount} / ${exportJob.photoCount} photos`
              : 'Starting…'}
            {reused ? ' · using existing ZIP' : ''}
          </p>
          <progress
            className="progress progress-accent h-2 w-full"
            value={progress}
            max={100}
            aria-valuenow={progress}
            aria-label="Export progress"
          />
          <p className="m-0 mt-2 font-base text-[0.65rem] leading-snug text-muted">{EXPORT_TTL_HINT}</p>
        </div>
      ) : null}

      {ready ? (
        <div className="mb-3 flex flex-col gap-2">
          <p className="m-0 font-base text-xs text-accent">
            {reused ? 'Ready — same selection as before' : 'Your ZIP is ready'}
            {exportJob.byteSize
              ? ` · ${(exportJob.byteSize / (1024 * 1024)).toFixed(1)} MB`
              : ''}
          </p>
          {formatExpiry(exportJob.expiresAt) ? (
            <p className="m-0 font-base text-[0.65rem] text-muted">Expires {formatExpiry(exportJob.expiresAt)}</p>
          ) : null}
          <AppButton
            variant="primary"
            size="sm"
            className="w-full"
            disabled={downloading}
            onClick={onDownload}
          >
            {downloading ? 'Downloading…' : 'Download ZIP'}
          </AppButton>
        </div>
      ) : null}

      {failed ? (
        <p className="m-0 mb-3 font-base text-xs text-error" role="alert">
          {exportJob?.errorMessage || error?.message || 'Export failed'}
        </p>
      ) : null}

      {!isPreparing && !ready ? (
        <p className="m-0 mb-3 font-base text-[0.65rem] text-muted">{EXPORT_TTL_HINT}</p>
      ) : null}

      {(ready || failed) && !isPreparing ? (
        <button
          type="button"
          className="font-base text-xs font-medium text-muted underline-offset-2 transition-colors duration-150 hover:text-base-content hover:underline"
          onClick={onClear}
        >
          Dismiss
        </button>
      ) : null}
    </aside>
  )
}

ProjectExportStatusFloat.propTypes = {
  show: PropTypes.bool.isRequired,
  stackAboveUpload: PropTypes.bool,
  variantLabel: PropTypes.string,
  phase: PropTypes.string.isRequired,
  exportJob: PropTypes.object,
  progress: PropTypes.number.isRequired,
  isPreparing: PropTypes.bool.isRequired,
  downloading: PropTypes.bool.isRequired,
  error: PropTypes.instanceOf(Error),
  zipName: PropTypes.string.isRequired,
  onDownload: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
}
