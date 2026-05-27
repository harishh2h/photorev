/**
 * @param {number | null | undefined} width
 * @param {number | null | undefined} height
 * @returns {boolean}
 */
export function hasViewerDimensions(width, height) {
  return typeof width === 'number' && width > 0 && typeof height === 'number' && height > 0
}

/**
 * True when photo has enough pixels to fill the stage with object-cover without upscaling.
 *
 * @param {number} width
 * @param {number} height
 * @param {number} stageWidth
 * @param {number} stageHeight
 */
export function canCoverStageWithoutUpscale(width, height, stageWidth, stageHeight) {
  if (stageWidth <= 0 || stageHeight <= 0) {
    return false
  }
  const coverScale = Math.max(stageWidth / width, stageHeight / height)
  return coverScale <= 1
}

/**
 * Layout for fullscreen viewer image: cover the stage when resolution allows, otherwise
 * contain up to native pixel dimensions (no upscale).
 *
 * @param {number | null | undefined} width
 * @param {number | null | undefined} height
 * @param {number} stageWidth
 * @param {number} stageHeight
 */
export function getViewerImagePresentation(width, height, stageWidth, stageHeight) {
  if (!hasViewerDimensions(width, height)) {
    return {
      frameClassName: 'relative h-full w-full',
      imgClassName: 'h-full w-full object-contain',
      imgStyle: undefined,
    }
  }

  if (canCoverStageWithoutUpscale(width, height, stageWidth, stageHeight)) {
    return {
      frameClassName: 'relative h-full w-full overflow-hidden',
      imgClassName: 'h-full w-full object-cover',
      imgStyle: undefined,
    }
  }

  const landscape = width >= height
  return {
    frameClassName: 'relative flex h-full w-full items-center justify-center',
    imgClassName: landscape
      ? 'h-auto w-full max-h-full object-contain'
      : 'h-full w-auto max-w-full object-contain',
    imgStyle: {
      maxWidth: `min(100%, ${width}px)`,
      maxHeight: `min(100%, ${height}px)`,
    },
  }
}
