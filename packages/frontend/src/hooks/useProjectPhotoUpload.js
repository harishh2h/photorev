import { useCallback, useRef, useState } from 'react'
import { uploadPhoto } from '@/services/photoService.js'

const DEFAULT_UPLOAD_CONCURRENCY = 2
const MAX_UPLOAD_CONCURRENCY = 5

/**
 * @typedef {'queued' | 'uploading' | 'succeeded' | 'failed'} UploadJobStatus
 */

/**
 * @typedef {{ id: string; file: File; label: string; status: UploadJobStatus; errorMessage: string | null }} UploadJob
 */

/**
 * @typedef {{ id: string; label: string; status: UploadJobStatus; errorMessage: string | null }} UploadJobView
 */

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

  const [uploadConcurrency, setUploadConcurrency] = useState(DEFAULT_UPLOAD_CONCURRENCY)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadJobs, setUploadJobs] = useState(/** @type {UploadJobView[]} */ ([]))
  const [uploadMessage, setUploadMessage] = useState(/** @type {string | null} */ (null))
  const [postBatchSummary, setPostBatchSummary] = useState(
    /** @type {{ succeeded: number; failed: number; total: number } | null} */ (null),
  )

  const flushJobs = useCallback(() => {
    setUploadJobs(
      jobsRef.current.map((j) => ({
        id: j.id,
        label: j.label,
        status: j.status,
        errorMessage: j.errorMessage,
      })),
    )
  }, [])

  const completeBatch = useCallback(() => {
    if (runFinishedRef.current) return
    const jobs = jobsRef.current
    if (jobs.some((j) => j.status === 'queued' || j.status === 'uploading')) return

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
    if (failed > 0) {
      setUploadMessage(
        failed === jobs.length
          ? 'All uploads failed. Try again or check your connection.'
          : `${failed} of ${jobs.length} uploads failed.`,
      )
    } else {
      setUploadMessage(null)
    }
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
      flushJobs()

      uploadPhoto(tokenRef.current, projectIdRef.current, next.file)
        .then(() => {
          next.status = 'succeeded'
          next.errorMessage = null
        })
        .catch((err) => {
          next.status = 'failed'
          next.errorMessage = err instanceof Error ? err.message : 'Upload failed'
        })
        .finally(() => {
          flushJobs()
          pump()
          const stillActive = jobsRef.current.some((j) => j.status === 'queued' || j.status === 'uploading')
          if (!stillActive) {
            completeBatch()
          }
        })
    }
  }, [flushJobs, completeBatch])

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
    jobsRef.current = []
    setUploadJobs([])
    setPostBatchSummary(null)
    setUploadMessage(null)
    runFinishedRef.current = true
  }, [])

  const retryFailedUploads = useCallback(() => {
    if (!runFinishedRef.current || isUploading) return
    const jobs = jobsRef.current
    const failed = jobs.filter((j) => j.status === 'failed')
    if (failed.length === 0) return

    failed.forEach((j) => {
      j.status = 'queued'
      j.errorMessage = null
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

      jobsRef.current = files.map((file, idx) => ({
        id: `job-${idx}-${file.lastModified}-${file.size}`,
        file,
        label: file.name || 'Photo',
        status: /** @type {UploadJobStatus} */ ('queued'),
        errorMessage: null,
      }))

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

  const failedCount = uploadJobs.filter((j) => j.status === 'failed').length
  const canRetryFailed = !isUploading && failedCount > 0

  return {
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
    maxUploadConcurrency: MAX_UPLOAD_CONCURRENCY,
  }
}
