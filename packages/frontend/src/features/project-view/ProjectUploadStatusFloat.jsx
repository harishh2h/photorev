import PropTypes from 'prop-types'
import { formatBytes, formatBytesPerSecond } from '@/utils/formatBytes.js'

const STATUS_META = {
  queued: { label: 'Waiting', className: 'border-base-300 bg-base-200/80 text-muted' },
  uploading: { label: 'Uploading', className: 'border-accent/40 bg-accent/10 text-accent' },
  succeeded: { label: 'Uploaded', className: 'border-accent/30 bg-accent/5 text-accent' },
  failed: { label: 'Failed', className: 'border-error/40 bg-error/5 text-error' },
  cancelled: { label: 'Cancelled', className: 'border-base-300 bg-base-200/60 text-muted' },
}

/**
 * @param {{ percent: number | null; indeterminate?: boolean }} props
 */
function UploadProgressBar({ percent, indeterminate = false }) {
  const width = indeterminate ? 35 : Math.min(100, Math.max(0, percent ?? 0))

  return (
    <div
      className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-accent/25"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(width)}
      aria-valuetext={indeterminate ? 'Uploading' : `${Math.round(width)}% uploaded`}
    >
      <div
        className={`h-full rounded-full bg-accent transition-[width] duration-150 ease-out ${
          indeterminate ? 'animate-pulse' : ''
        }`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

UploadProgressBar.propTypes = {
  percent: PropTypes.number,
  indeterminate: PropTypes.bool,
}

/**
 * @param {{ label: string; onCancel: () => void }} props
 */
function CancelUploadButton({ label, onCancel }) {
  return (
    <button
      type="button"
      className="btn btn-ghost btn-circle btn-xs min-h-9 min-w-9 shrink-0 border-0 text-muted transition-[color,transform] duration-150 ease-out hover:bg-error/10 hover:text-error active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus"
      aria-label={`Cancel upload of ${label}`}
      onClick={onCancel}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  )
}

CancelUploadButton.propTypes = {
  label: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
}

/**
 * @param {{
 *   isUploading: boolean
 *   uploadJobs: {
 *     id: string
 *     label: string
 *     status: keyof typeof STATUS_META
 *     errorMessage: string | null
 *     bytesTotal: number
 *     bytesLoaded: number
 *     progressPercent: number | null
 *     bytesPerSecond: number
 *   }[]
 *   uploadBatchProgress: { bytesLoaded: number; bytesTotal: number; percent: number; batchSpeed: number }
 *   uploadMessage: string | null
 *   uploadConcurrency: number
 *   maxConcurrency: number
 *   onConcurrencyChange: (value: string) => void
 *   onDismiss: () => void
 *   canRetryFailed: boolean
 *   onRetryFailed: () => void
 *   onCancelJob: (jobId: string) => void
 * }} props
 * @returns {import('react').JSX.Element | null}
 */
export default function ProjectUploadStatusFloat({
  isUploading,
  uploadJobs,
  uploadBatchProgress,
  uploadMessage,
  uploadConcurrency,
  maxConcurrency,
  onConcurrencyChange,
  onDismiss,
  canRetryFailed,
  onRetryFailed,
  onCancelJob,
}) {
  const succeeded = uploadJobs.filter((j) => j.status === 'succeeded').length
  const failed = uploadJobs.filter((j) => j.status === 'failed').length
  const cancelled = uploadJobs.filter((j) => j.status === 'cancelled').length
  const total = uploadJobs.length
  const batchSpeedLabel = formatBytesPerSecond(uploadBatchProgress.batchSpeed)

  return (
    <aside
      className="fixed bottom-4 left-4 z-[210] w-[min(calc(100vw-2rem),20rem)] rounded-floating border-[1.5px] border-base-300 bg-base-100 p-4 shadow-floating"
      aria-label="Photo upload status"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="m-0 flex items-center gap-2 font-base text-sm font-semibold text-base-content">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
            {isUploading ? 'Uploading' : 'Uploads finished'}
          </p>
          <p className="m-0 mt-1 font-base text-xs text-muted">
            {succeeded} uploaded · {failed} failed
            {cancelled > 0 ? ` · ${cancelled} cancelled` : ''} · {total} total
          </p>
          {isUploading && uploadBatchProgress.bytesTotal > 0 ? (
            <>
              <UploadProgressBar percent={uploadBatchProgress.percent} />
              <p className="m-0 mt-1.5 font-base text-[0.65rem] leading-snug text-muted">
                {formatBytes(uploadBatchProgress.bytesLoaded)} / {formatBytes(uploadBatchProgress.bytesTotal)}
                {batchSpeedLabel ? (
                  <>
                    {' '}
                    · <span className="font-medium text-accent">↑ {batchSpeedLabel}</span>
                  </>
                ) : null}
              </p>
            </>
          ) : null}
        </div>
        {!isUploading && uploadJobs.length > 0 ? (
          <button
            type="button"
            className="btn btn-ghost btn-circle btn-sm min-h-9 min-w-9 shrink-0 border-0 text-muted transition-[color,transform] duration-150 ease-out hover:text-base-content active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus"
            aria-label="Dismiss upload panel"
            onClick={onDismiss}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      {uploadJobs.length > 0 ? (
        <ul
          className="m-0 mb-3 max-h-52 list-none space-y-0 overflow-y-auto overflow-x-hidden rounded-lg border-[1.5px] border-base-300 bg-base-200/30 p-0 [scrollbar-width:thin]"
          aria-label="Upload queue"
        >
          {uploadJobs.map((job) => {
            const meta = STATUS_META[job.status] ?? STATUS_META.queued
            const speedLabel = formatBytesPerSecond(job.bytesPerSecond)
            const showProgress = job.status === 'uploading'
            const canCancel = isUploading && (job.status === 'queued' || job.status === 'uploading')
            const percent =
              job.progressPercent ??
              (job.bytesTotal > 0 ? (job.bytesLoaded / job.bytesTotal) * 100 : null)

            return (
              <li
                key={job.id}
                className="border-b-[1.5px] border-base-300 px-3 py-2.5 last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 shrink-0 rounded-full border-[1.5px] px-2 py-0.5 font-base text-[0.65rem] font-semibold uppercase tracking-wide ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate font-base text-xs font-medium text-base-content" title={job.label}>
                      {job.label}
                    </p>
                    {showProgress ? (
                      <>
                        <UploadProgressBar
                          percent={percent}
                          indeterminate={percent == null}
                        />
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-base text-[0.65rem] text-muted">
                          {percent != null ? (
                            <span className="font-medium text-accent">{Math.round(percent)}%</span>
                          ) : (
                            <span className="font-medium text-accent">Sending…</span>
                          )}
                          {speedLabel ? <span>↑ {speedLabel}</span> : null}
                          <span className="hidden min-[360px]:inline">
                            {formatBytes(job.bytesLoaded)} / {formatBytes(job.bytesTotal)}
                          </span>
                        </div>
                      </>
                    ) : null}
                    {job.status === 'failed' && job.errorMessage != null ? (
                      <p className="m-0 mt-1 line-clamp-2 font-base text-[0.65rem] leading-snug text-error" title={job.errorMessage}>
                        {job.errorMessage}
                      </p>
                    ) : null}
                  </div>
                  {canCancel ? (
                    <CancelUploadButton label={job.label} onCancel={() => onCancelJob(job.id)} />
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}

      <label className="mb-1 block font-base text-xs font-medium text-muted">Parallel uploads</label>
      <div className="mb-3 flex items-center gap-3">
        <input
          type="range"
          min={1}
          max={maxConcurrency}
          step={1}
          value={uploadConcurrency}
          onChange={(e) => onConcurrencyChange(e.target.value)}
          className="range range-xs range-accent min-w-0 flex-1"
          aria-valuemin={1}
          aria-valuemax={maxConcurrency}
          aria-valuenow={uploadConcurrency}
          aria-label="Parallel upload slots"
        />
        <span className="w-6 shrink-0 text-center font-base text-sm font-semibold text-accent">{uploadConcurrency}</span>
      </div>

      {canRetryFailed ? (
        <button
          type="button"
          className="btn btn-outline mb-2 h-11 min-h-11 w-full rounded-full border-[1.5px] border-accent font-base text-sm font-semibold text-accent transition-[background-color,color,transform] duration-150 ease-out hover:bg-accent/10 active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus"
          onClick={onRetryFailed}
        >
          Retry failed
        </button>
      ) : null}

      {uploadMessage != null ? (
        <p className="m-0 font-base text-xs leading-snug text-error" role="alert">
          {uploadMessage}
        </p>
      ) : null}
    </aside>
  )
}

const jobShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['queued', 'uploading', 'succeeded', 'failed', 'cancelled']).isRequired,
  errorMessage: PropTypes.string,
  bytesTotal: PropTypes.number.isRequired,
  bytesLoaded: PropTypes.number.isRequired,
  progressPercent: PropTypes.number,
  bytesPerSecond: PropTypes.number.isRequired,
})

const batchProgressShape = PropTypes.shape({
  bytesLoaded: PropTypes.number.isRequired,
  bytesTotal: PropTypes.number.isRequired,
  percent: PropTypes.number.isRequired,
  batchSpeed: PropTypes.number.isRequired,
})

ProjectUploadStatusFloat.propTypes = {
  isUploading: PropTypes.bool.isRequired,
  uploadJobs: PropTypes.arrayOf(jobShape).isRequired,
  uploadBatchProgress: batchProgressShape.isRequired,
  uploadMessage: PropTypes.string,
  uploadConcurrency: PropTypes.number.isRequired,
  maxConcurrency: PropTypes.number.isRequired,
  onConcurrencyChange: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
  canRetryFailed: PropTypes.bool.isRequired,
  onRetryFailed: PropTypes.func.isRequired,
  onCancelJob: PropTypes.func.isRequired,
}
