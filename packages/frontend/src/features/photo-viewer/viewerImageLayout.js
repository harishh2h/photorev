/**
 * @param {number | null | undefined} width
 * @param {number | null | undefined} height
 * @returns {boolean}
 */
export function hasViewerDimensions(width, height) {
  return typeof width === 'number' && width > 0 && typeof height === 'number' && height > 0
}

/**
 * Fullscreen viewer layout: always fit the full photo on screen (object-contain).
 * Never crop or upscale — avoids flex + intrinsic-size blowups from width/height attrs.
 *
 * @param {number | null | undefined} width
 * @param {number | null | undefined} height
 */
export function getViewerImagePresentation(width, height) {
  return {
    frameClassName:
      'relative flex h-full w-full min-h-0 min-w-0 items-center justify-center overflow-hidden',
    imgClassName: 'block h-auto w-auto max-h-full max-w-full object-contain',
    imgStyle: hasViewerDimensions(width, height)
      ? { aspectRatio: `${width} / ${height}` }
      : undefined,
  }
}
