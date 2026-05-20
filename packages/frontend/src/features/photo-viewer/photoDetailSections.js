/**
 * Builds read-only detail rows (Google Photos–style) from photo API payload.
 * @param {{ originalName?: string | null; width?: number | null; height?: number | null; fileSize?: number | null; metadata?: unknown }} photo
 * @returns {Array<{ id: string; icon: string; primary: string; secondary?: string | null }>}
 */
export function buildPhotoDetailSections(photo) {
  const meta =
    photo?.metadata && typeof photo.metadata === 'object' ? /** @type {Record<string, unknown>} */ (photo.metadata) : {}
  const exif =
    meta.exif && typeof meta.exif === 'object' ? /** @type {Record<string, unknown>} */ (meta.exif) : {}

  const sections = []

  const dateLines = formatCaptureDateLines(exif.capturedAt, exif.offsetTime)
  if (dateLines) {
    sections.push({
      id: 'date',
      icon: 'calendar',
      primary: dateLines.primary,
      secondary: dateLines.secondary,
    })
  }

  const filePrimary = typeof photo?.originalName === 'string' ? photo.originalName : null
  const fileSecondary = formatFileSummary(photo?.width, photo?.height, photo?.fileSize)
  if (filePrimary || fileSecondary) {
    sections.push({
      id: 'file',
      icon: 'image',
      primary: filePrimary ?? 'Photo',
      secondary: fileSecondary,
    })
  }

  const cameraPrimary = formatCameraName(exif.make, exif.model)
  const cameraSecondary = formatExposureLine(exif.exposureTimeSec, exif.iso)
  if (cameraPrimary || cameraSecondary) {
    sections.push({
      id: 'camera',
      icon: 'camera',
      primary: cameraPrimary ?? 'Camera',
      secondary: cameraSecondary,
    })
  }

  const lensPrimary = formatLensName(exif.make, exif.lensModel)
  const lensSecondary = formatLensLine(exif.fNumber, exif.focalLengthMm)
  if (lensPrimary || lensSecondary) {
    sections.push({
      id: 'lens',
      icon: 'aperture',
      primary: lensPrimary ?? 'Lens',
      secondary: lensSecondary,
    })
  }

  const location = formatLocationLine(exif.latitude, exif.longitude)
  sections.push({
    id: 'location',
    icon: 'pin',
    primary: location.primary,
    secondary: location.secondary,
  })

  return sections
}

/**
 * @param {unknown} capturedAt
 * @param {unknown} offsetTime
 */
export function formatCaptureDateLines(capturedAt, offsetTime) {
  if (typeof capturedAt !== 'string' || !capturedAt) return null
  const d = new Date(capturedAt)
  if (Number.isNaN(d.getTime())) return null

  const primary = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(d)
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(d)
  const offset =
    typeof offsetTime === 'string' && offsetTime.trim() ? `UTC${offsetTime.trim()}` : formatUtcOffset(d)
  const time = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(d)

  return {
    primary,
    secondary: `${weekday}, ${time} ${offset}`,
  }
}

/** @param {Date} d */
function formatUtcOffset(d) {
  const mins = -d.getTimezoneOffset()
  const sign = mins >= 0 ? '+' : '-'
  const abs = Math.abs(mins)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `UTC${sign}${h}${m > 0 ? `:${String(m).padStart(2, '0')}` : ''}`
}

/**
 * @param {unknown} w
 * @param {unknown} h
 * @param {unknown} bytes
 */
export function formatFileSummary(w, h, bytes) {
  const parts = []
  const mp = formatMegapixels(w, h)
  if (mp) parts.push(mp)
  const dims = formatPixelDimensions(w, h)
  if (dims) parts.push(dims)
  const size = formatBinarySize(bytes)
  if (size) parts.push(size)
  return parts.length > 0 ? parts.join('  ') : null
}

/** @param {unknown} w @param {unknown} h */
export function formatMegapixels(w, h) {
  if (typeof w !== 'number' || typeof h !== 'number' || w <= 0 || h <= 0) return null
  const mp = Math.round((w * h) / 1_000_000)
  return mp > 0 ? `${mp} MP` : null
}

/** @param {unknown} w @param {unknown} h */
export function formatPixelDimensions(w, h) {
  if (typeof w !== 'number' || typeof h !== 'number') return null
  return `${w} × ${h}`
}

/** @param {unknown} bytes */
export function formatBinarySize(bytes) {
  if (typeof bytes !== 'number' || bytes < 0 || !Number.isFinite(bytes)) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GiB`
}

/** @param {unknown} make @param {unknown} lensModel */
export function formatLensName(make, lensModel) {
  if (typeof lensModel !== 'string' || !lensModel.trim()) return null
  const model = lensModel.trim()
  const brand = typeof make === 'string' ? make.trim() : ''
  if (brand && !model.toUpperCase().includes(brand.toUpperCase())) {
    return `${brand} ${model}`
  }
  return model
}

/** @param {unknown} make @param {unknown} model */
export function formatCameraName(make, model) {
  const m = typeof make === 'string' ? make.trim() : ''
  const mod = typeof model === 'string' ? model.trim() : ''
  const joined = [m, mod].filter(Boolean).join(' ')
  return joined || null
}

/**
 * @param {unknown} exposureSec
 * @param {unknown} iso
 */
export function formatExposureLine(exposureSec, iso) {
  const parts = []
  const shutter = formatShutterSpeed(exposureSec)
  if (shutter) parts.push(shutter)
  if (typeof iso === 'number' && Number.isFinite(iso)) parts.push(`ISO ${Math.round(iso)}`)
  return parts.length > 0 ? parts.join('  ') : null
}

/** @param {unknown} sec */
export function formatShutterSpeed(sec) {
  if (typeof sec !== 'number' || !Number.isFinite(sec) || sec <= 0) return null
  if (sec >= 1) {
    const rounded = Math.round(sec * 10) / 10
    return `${rounded} s`
  }
  const denom = Math.round(1 / sec)
  return denom > 0 ? `1/${denom} s` : null
}

/**
 * @param {unknown} fNumber
 * @param {unknown} focalMm
 */
export function formatLensLine(fNumber, focalMm) {
  const parts = []
  if (typeof fNumber === 'number' && Number.isFinite(fNumber)) {
    const label = Number.isInteger(fNumber) ? String(fNumber) : fNumber.toFixed(1)
    parts.push(`f/${label}`)
  }
  if (typeof focalMm === 'number' && Number.isFinite(focalMm)) {
    const mm = Math.round(focalMm * 10) / 10
    parts.push(`${mm} mm`)
  }
  return parts.length > 0 ? parts.join('  ') : null
}

/**
 * @param {unknown} lat
 * @param {unknown} lon
 */
export function formatLocationLine(lat, lon) {
  if (typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon)) {
    const latStr = formatCoord(lat, lat >= 0 ? 'N' : 'S')
    const lonStr = formatCoord(lon, lon >= 0 ? 'E' : 'W')
    return { primary: `${latStr}, ${lonStr}`, secondary: null }
  }
  return { primary: 'No location data', secondary: null }
}

/** @param {number} value @param {string} hem */
function formatCoord(value, hem) {
  const abs = Math.abs(value)
  return `${abs.toFixed(5)}° ${hem}`
}
