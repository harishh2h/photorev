/** Placeholder aspect ratio for photos still processing (portrait 3:4). */
export const PLACEHOLDER_ASPECT_RATIO = 3 / 4

/**
 * @param {{ width?: number | null; height?: number | null } | null | undefined} photo
 * @returns {boolean}
 */
export function hasPhotoDimensions(photo) {
  return (
    typeof photo?.width === 'number' &&
    photo.width > 0 &&
    typeof photo?.height === 'number' &&
    photo.height > 0
  )
}

/**
 * Aspect ratio for justified layout. Uses 3:4 until real dimensions exist.
 *
 * @param {{ width?: number | null; height?: number | null } | null | undefined} photo
 * @returns {number}
 */
export function getPhotoAspectRatio(photo) {
  if (hasPhotoDimensions(photo)) {
    return photo.width / photo.height
  }
  return PLACEHOLDER_ASPECT_RATIO
}
