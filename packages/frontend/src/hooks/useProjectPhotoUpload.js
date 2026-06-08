import { useCallback, useRef, useState } from 'react'
import { uploadPhoto } from '@/services/photoService.js'
import {
  buildUploadBatchSummary,
  PhotoUploadError,
  UPLOAD_ERROR_KIND,
} from '@/utils/uploadErrors.js'
import {
  computeBatchUploadProgress,
  createProgressThrottle,
  createUploadSpeedState,
  resetUploadSpeed,
  updateUploadSpeed,
} from '@/utils/uploadProgress.js'

const DEFAULT_UPLOAD_CONCURRENCY = 2
const MAX_UPLOAD_CONCURRENCY = 5

/**
 * @typedef {'queued' | 'uploading' | 'succeeded' | 'failed' | 'cancelled'} UploadJobStatus
 */

/**
 * @typedef {import('@/utils/uploadErrors.js').UploadErrorKind} UploadErrorKind
 */

/**
 * @typedef {import('@/utils/uploadProgress.js').UploadSpeedState} UploadSpeedState
 */

/**
 * @typedef {{
 *   id: string
 *   file: File
 *   label: string
 *   status: UploadJobStatus
 *   errorMessage: string | null
 *   errorKind: UploadErrorKind | null
 *   bytesTotal: number
 *   bytesLoaded: number
 *   progressPercent: number | null
 *   bytesPerSecond: number
 *   speedState: UploadSpeedState
 *   abortController: AbortController | null
 * }} UploadJob
 */

/**
 * @typedef {{
 *   id: string
 *   label: string
 *   status: UploadJobStatus
 *   errorMessage: string | null
 *   bytesTotal: number
 *   bytesLoaded: number
 *   progressPercent: number | null
 *   bytesPerSecond: number
 * }} UploadJobView
 */

/**
 * @typedef {{
 *   bytesLoaded: number
 *   bytesTotal: number
 *   percent: number
 *   batchSpeed: number
 * }} UploadBatchProgress
 */

/**
 * @returns {UploadBatchProgress}
 */
function emptyBatchProgress() {
  return { bytesLoaded: 0, bytesTotal: 0, percent: 0, batchSpeed: 0 }
}

/**
 * @param {UploadJob[]} jobs
 * @returns {UploadBatchProgress}
 */
function deriveBatchProgress(jobs) {
  return computeBatchUploadProgress(
    jobs.map((j) => ({
      status: j.status,
      bytesTotal: j.bytesTotal,
      bytesLoaded: j.bytesLoaded,
      bytesPerSecond: j.bytesPerSecond,
    })),
  )
}

/**
 * @param {UploadJob} job
 * @returns {UploadJobView}
 */
function toJobView(job) {
  return {
    id: job.id,
    label: job.label,
    status: job.status,
    errorMessage: job.errorMessage,
    bytesTotal: job.bytesTotal,
    bytesLoaded: job.bytesLoaded,
    progressPercent: job.progressPercent,
    bytesPerSecond: job.bytesPerSecond,
  }
}

/**
 * @param {File} file
 * @param {number} idx
 * @returns {UploadJob}
 */
function createUploadJob(file, idx) {
  return {
    id: `job-${idx}-${file.lastModified}-${file.size}`,
    file,
    label: file.name || 'Photo',
    status: 'queued',
    errorMessage: null,
    errorKind: null,
    bytesTotal: file.size,
    bytesLoaded: 0,
    progressPercent: null,
    bytesPerSecond: 0,
    speedState: createUploadSpeedState(),
    abortController: null,
  }
}

/**
 * @param {UploadJob} job
 */
function resetJobProgress(job) {
  job.bytesLoaded = 0
  job.progressPercent = null
  job.bytesPerSecond = 0
  resetUploadSpeed(job.speedState)
  job.abortController = null
}

/**
 * @param {{ token: string; projectId: string; onAfterBatch: () => void }} args
 */
export function useProjectPhotoUpload({ token, projectId, onAfterBatch }) {
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null))
  const tokenRef = useRef(token)
  const projectIdRef = useRef(projectId)
  tokenRef.current = token
  projectIdRef.current = projectId

  const concurrencyRef = useRef(DEFAULT_UPLOAD_CONCURRENCY)
  /** @type {import('react').MutableRefObject<UploadJob[]>} */
  const jobsRef = useRef([])
  /** When false, a batch (initial or retry) is in progress */
  const runFinishedRef = useRef(true)
  /** @type {import('react').MutableRefObject<ReturnType<typeof createProgressThrottle> | null>} */
  const progressThrottleRef = useRef(null)

  const [uploadConcurrency, setUploadConcurrency] = useState(DEFAULT_UPLOAD_CONCURRENCY)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadJobs, setUploadJobs] = useState(/** @type {UploadJobView[]} */ ([]))
  const [uploadBatchProgress, setUploadBatchProgress] = useState(emptyBatchProgress)
  const [uploadMessage, setUploadMessage] = useState(/** @type {string | null} */ (null))
  const [postBatchSummary, setPostBatchSummary] = useState(
    /** @type {{ succeeded: number; failed: number; total: number } | null} */ (null),
  )

  const flushJobs = useCallback(() => {
    const jobs = jobsRef.current
    setUploadJobs(jobs.map(toJobView))
    setUploadBatchProgress(deriveBatchProgress(jobs))
  }, [])

  const flushJobsRef = useRef(flushJobs)
  flushJobsRef.current = flushJobs

  if (progressThrottleRef.current === null) {
    progressThrottleRef.current = createProgressThrottle(() => {
      flushJobsRef.current()
    })
  }

  const scheduleProgressFlush = useCallback(() => {
    progressThrottleRef.current?.schedule()
  }, [])

  const completeBatch = useCallback(() => {
    if (runFinishedRef.current) return
    const jobs = jobsRef.current
    if (jobs.some((j) => j.status === 'queued' || j.status === 'uploading')) return

    progressThrottleRef.current?.flushNow()
    runFinishedRef.current = true
    const succeeded = jobs.filter((j) => j.status === 'succeeded').length
    const failed = jobs.filter((j) => j.status === 'failed').length

    setIsUploading(false)
    flushJobs()
    setPostBatchSummary({
      succeeded,
      failed,
      total: jobs.length,
    })
    onAfterBatch()
    setUploadMessage(failed > 0 ? buildUploadBatchSummary(jobs) : null)
  }, [onAfterBatch, flushJobs])

  const pump = useCallback(() => {
    if (runFinishedRef.current) return
    const jobs = jobsRef.current
    if (jobs.length === 0) return

    const limit = Math.min(MAX_UPLOAD_CONCURRENCY, Math.max(1, Math.floor(concurrencyRef.current)))

    const countUploading = () => jobs.filter((j) => j.status === 'uploading').length

    while (countUploading() < limit) {
      const next = jobs.find((j) => j.status === 'queued')
      if (!next) break

      next.status = 'uploading'
      resetJobProgress(next)
      next.abortController = new AbortController()
      flushJobs()

      uploadPhoto(tokenRef.current, projectIdRef.current, next.file, {
        signal: next.abortController.signal,
        onProgress: ({ loaded, total, percent }) => {
          if (next.status !== 'uploading') return
          next.bytesLoaded = loaded
          next.bytesTotal = total
          next.progressPercent = percent
          next.bytesPerSecond = updateUploadSpeed(next.speedState, loaded)
          scheduleProgressFlush()
        },
      })
        .then(() => {
          if (next.status === 'cancelled') return
          next.status = 'succeeded'
          next.errorMessage = null
          next.bytesLoaded = next.bytesTotal
          next.progressPercent = 100
          next.bytesPerSecond = 0
        })
        .catch((err) => {
          next.bytesPerSecond = 0
          if (err instanceof PhotoUploadError && err.kind === UPLOAD_ERROR_KIND.CANCELLED) {
            next.status = 'cancelled'
            next.errorMessage = null
            next.errorKind = UPLOAD_ERROR_KIND.CANCELLED
            return
          }
          next.status = 'failed'
          if (err instanceof PhotoUploadError) {
            next.errorMessage = err.message
            next.errorKind = err.kind
          } else {
            next.errorMessage = err instanceof Error ? err.message : 'Upload failed'
            next.errorKind = UPLOAD_ERROR_KIND.UNKNOWN
          }
        })
        .finally(() => {
          next.abortController = null
          progressThrottleRef.current?.flushNow()
          flushJobs()
          pump()
          const stillActive = jobsRef.current.some((j) => j.status === 'queued' || j.status === 'uploading')
          if (!stillActive) {
            completeBatch()
          }
        })
    }
  }, [flushJobs, completeBatch, scheduleProgressFlush])

  const cancelUploadJob = useCallback(
    (jobId) => {
      if (runFinishedRef.current) return
      const job = jobsRef.current.find((j) => j.id === jobId)
      if (!job || (job.status !== 'queued' && job.status !== 'uploading')) return

      if (job.status === 'queued') {
        job.status = 'cancelled'
        job.errorMessage = null
        job.errorKind = UPLOAD_ERROR_KIND.CANCELLED
        progressThrottleRef.current?.flushNow()
        flushJobs()
        pump()
        const stillActive = jobsRef.current.some((j) => j.status === 'queued' || j.status === 'uploading')
        if (!stillActive) {
          completeBatch()
        }
        return
      }

      job.abortController?.abort()
    },
    [flushJobs, pump, completeBatch],
  )

  const openFilePicker = useCallback(() => {
    if (!runFinishedRef.current) return
    setUploadMessage(null)
    setPostBatchSummary(null)
    fileInputRef.current?.click()
  }, [])

  const handleConcurrencyChange = useCallback(
    (value) => {
      const n = Number(value)
      if (!Number.isFinite(n)) return
      const clamped = Math.min(MAX_UPLOAD_CONCURRENCY, Math.max(1, Math.floor(n)))
      concurrencyRef.current = clamped
      setUploadConcurrency(clamped)
      queueMicrotask(() => {
        pump()
      })
    },
    [pump],
  )

  const dismissUploadPanel = useCallback(() => {
    progressThrottleRef.current?.clear()
    jobsRef.current = []
    setUploadJobs([])
    setUploadBatchProgress(emptyBatchProgress())
    setPostBatchSummary(null)
    setUploadMessage(null)
    runFinishedRef.current = true
  }, [])

  const retryFailedUploads = useCallback(() => {
    if (!runFinishedRef.current || isUploading) return
    const jobs = jobsRef.current
    const retryable = jobs.filter(
      (j) => j.status === 'failed' && j.errorKind !== UPLOAD_ERROR_KIND.INVALID_IMAGE,
    )
    if (retryable.length === 0) return

    retryable.forEach((j) => {
      j.status = 'queued'
      j.errorMessage = null
      j.errorKind = null
      resetJobProgress(j)
    })
    runFinishedRef.current = false
    setIsUploading(true)
    setPostBatchSummary(null)
    setUploadMessage(null)
    flushJobs()
    pump()
  }, [isUploading, pump, flushJobs])

  const handleFileInputChange = useCallback(
    (event) => {
      const input = event.target
      const files = input.files ? Array.from(input.files) : []
      input.value = ''
      if (files.length === 0) return
      if (!runFinishedRef.current) return

      jobsRef.current = files.map((file, idx) => createUploadJob(file, idx))

      runFinishedRef.current = false
      const clampedConcurrency = Math.min(
        MAX_UPLOAD_CONCURRENCY,
        Math.max(1, Math.floor(concurrencyRef.current)),
      )
      concurrencyRef.current = clampedConcurrency
      setUploadConcurrency(clampedConcurrency)

      setUploadMessage(null)
      setPostBatchSummary(null)
      setIsUploading(true)
      flushJobs()
      pump()
    },
    [pump, flushJobs],
  )

  const showUploadPanel = isUploading || postBatchSummary !== null || uploadJobs.length > 0

  const retryableFailedCount = jobsRef.current.filter(
    (j) => j.status === 'failed' && j.errorKind !== UPLOAD_ERROR_KIND.INVALID_IMAGE,
  ).length
  const canRetryFailed = !isUploading && retryableFailedCount > 0

  return {
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
    maxUploadConcurrency: MAX_UPLOAD_CONCURRENCY,
  }
}
