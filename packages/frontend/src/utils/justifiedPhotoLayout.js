import createJustifiedLayout from 'justified-layout'
import { getPhotoAspectRatio } from '@/utils/photoDisplayDimensions.js'

const SPACING_MOBILE_PX = 4
const SPACING_TABLET_PX = 8
const TABLET_BREAKPOINT_PX = 768
const TARGET_ROW_HEIGHT_MOBILE_PX = 100
const TARGET_ROW_HEIGHT_DESKTOP_PX = 180
const TARGET_ROW_HEIGHT_TOLERANCE = 0.25

/**
 * @param {number} containerWidth
 * @returns {number}
 */
export function getLayoutSpacing(containerWidth) {
  return containerWidth >= TABLET_BREAKPOINT_PX ? SPACING_TABLET_PX : SPACING_MOBILE_PX
}

/**
 * @param {number} containerWidth
 * @returns {number}
 */
export function getTargetRowHeight(containerWidth) {
  return containerWidth >= TABLET_BREAKPOINT_PX
    ? TARGET_ROW_HEIGHT_DESKTOP_PX
    : TARGET_ROW_HEIGHT_MOBILE_PX
}

/**
 * @typedef {{ top: number; left: number; width: number; height: number }} LayoutPosition
 * @typedef {{ containerHeight: number; positions: LayoutPosition[] }} JustifiedLayoutResult
 * @typedef {{ top: number; height: number; spanHeight: number; items: Array<{ photo: object; index: number; position: LayoutPosition }> }} JustifiedLayoutRow
 */

/**
 * @param {object[]} photos
 * @param {{ containerWidth: number; targetRowHeight?: number; spacing?: number }} options
 * @returns {JustifiedLayoutResult}
 */
export function computeJustifiedPhotoLayout(photos, options) {
  const { containerWidth } = options
  if (!photos.length || containerWidth <= 0) {
    return { containerHeight: 0, positions: [] }
  }

  const spacing = options.spacing ?? getLayoutSpacing(containerWidth)
  const targetRowHeight = options.targetRowHeight ?? getTargetRowHeight(containerWidth)
  const aspectRatios = photos.map((photo) => getPhotoAspectRatio(photo))

  const result = createJustifiedLayout(aspectRatios, {
    containerWidth: Math.floor(containerWidth),
    targetRowHeight,
    boxSpacing: spacing,
    targetRowHeightTolerance: TARGET_ROW_HEIGHT_TOLERANCE,
    containerPadding: 0,
    showWidows: true,
  })

  return {
    containerHeight: result.containerHeight,
    positions: result.boxes.map((box) => ({
      top: box.top,
      left: box.left,
      width: box.width,
      height: box.height,
    })),
  }
}

/**
 * @param {JustifiedLayoutResult} layout
 * @param {object[]} photos
 * @returns {JustifiedLayoutRow[]}
 */
export function groupLayoutIntoRows(layout, photos) {
  if (!layout.positions.length || !photos.length) {
    return []
  }

  /** @type {Map<number, JustifiedLayoutRow>} */
  const rowByTop = new Map()

  for (let index = 0; index < layout.positions.length; index += 1) {
    const position = layout.positions[index]
    const photo = photos[index]
    if (!photo) {
      continue
    }

    let row = rowByTop.get(position.top)
    if (!row) {
      row = {
        top: position.top,
        height: position.height,
        spanHeight: position.height,
        items: [],
      }
      rowByTop.set(position.top, row)
    }

    row.height = Math.max(row.height, position.height)
    row.items.push({ photo, index, position })
  }

  const rows = [...rowByTop.values()].sort((a, b) => a.top - b.top)

  for (let i = 0; i < rows.length; i += 1) {
    const nextTop = i < rows.length - 1 ? rows[i + 1].top : layout.containerHeight
    rows[i].spanHeight = Math.max(rows[i].height, nextTop - rows[i].top)
  }

  return rows
}
