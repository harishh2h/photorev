/** @typedef {'invalid_image' | 'network' | 'server' | 'unknown' | 'cancelled'} UploadErrorKind */

export const UPLOAD_ERROR_KIND = {
  INVALID_IMAGE: /** @type {const} */ ('invalid_image'),
  NETWORK: /** @type {const} */ ('network'),
  SERVER: /** @type {const} */ ('server'),
  UNKNOWN: /** @type {const} */ ('unknown'),
  CANCELLED: /** @type {const} */ ('cancelled'),
}

export const INVALID_IMAGE_MESSAGE = 'This is not a supported image'

/**
 * @param {string | undefined | null} message
 */
export function isInvalidImageServerMessage(message) {
  if (typeof message !== 'string' || message.trim().length === 0) return false
  const lower = message.toLowerCase()
  return (
    lower.includes('unsupported or invalid image') ||
    lower.includes('unsupported image') ||
    lower.includes('invalid image') ||
    lower === 'empty file'
  )
}

/**
 * @param {number} status
 * @param {string | undefined} serverMessage
 * @returns {UploadErrorKind}
 */
export function classifyUploadFailure(status, serverMessage) {
  if (status === 400 && isInvalidImageServerMessage(serverMessage)) {
    return UPLOAD_ERROR_KIND.INVALID_IMAGE
  }
  if (status === 0 || status === 408 || status === 502 || status === 503 || status === 504) {
    return UPLOAD_ERROR_KIND.NETWORK
  }
  if (status >= 500) {
    return UPLOAD_ERROR_KIND.SERVER
  }
  return UPLOAD_ERROR_KIND.UNKNOWN
}

/**
 * @param {UploadErrorKind} kind
 * @param {string | undefined} serverMessage
 */
export function messageForUploadFailure(kind, serverMessage) {
  if (kind === UPLOAD_ERROR_KIND.INVALID_IMAGE) {
    return INVALID_IMAGE_MESSAGE
  }
  if (kind === UPLOAD_ERROR_KIND.NETWORK) {
    return 'Could not reach the server. Check your connection and try again.'
  }
  if (typeof serverMessage === 'string' && serverMessage.trim().length > 0) {
    return serverMessage
  }
  if (kind === UPLOAD_ERROR_KIND.SERVER) {
    return 'The server could not save this file. Try again in a moment.'
  }
  return 'Upload failed. Try again.'
}

/**
 * @param {{ status: UploadJobStatus; errorKind?: UploadErrorKind | null }[]} jobs
 * @returns {string | null}
 */
export function buildUploadBatchSummary(jobs) {
  const failed = jobs.filter((j) => j.status === 'failed')
  if (failed.length === 0) return null

  const invalidCount = failed.filter((j) => j.errorKind === UPLOAD_ERROR_KIND.INVALID_IMAGE).length
  const retryableCount = failed.length - invalidCount

  if (failed.length === jobs.length) {
    if (invalidCount === failed.length) {
      return INVALID_IMAGE_MESSAGE
    }
    if (retryableCount === 0) {
      return `${failed.length} upload(s) failed.`
    }
    return 'All uploads failed. Try again or check your connection.'
  }

  if (invalidCount > 0) {
    return INVALID_IMAGE_MESSAGE
  }
  return `${failed.length} of ${jobs.length} uploads failed.`
}

/** @typedef {'queued' | 'uploading' | 'succeeded' | 'failed' | 'cancelled'} UploadJobStatus */

export class PhotoUploadError extends Error {
  /** @type {UploadErrorKind} */
  kind

  /** @type {number | undefined} */
  status

  /**
   * @param {string} message
   * @param {{ kind?: UploadErrorKind; status?: number }} [options]
   */
  constructor(message, options = {}) {
    super(message)
    this.name = 'PhotoUploadError'
    this.kind = options.kind ?? UPLOAD_ERROR_KIND.UNKNOWN
    this.status = options.status
  }
}
