import PropTypes from 'prop-types'
import {
  viewerChromeMutedTextClass,
  viewerChromePillClass,
} from '@/features/photo-viewer/viewerChromeStyles.js'

/**
 * Current position in the viewer album (e.g. 29 / 37).
 */
export default function PhotoViewerPhotoCounter({ index, total }) {
  return (
    <span
      className={`shrink-0 px-3 py-2 font-base text-xs tabular-nums ${viewerChromePillClass} ${viewerChromeMutedTextClass}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {index + 1} / {total}
    </span>
  )
}

PhotoViewerPhotoCounter.propTypes = {
  index: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
}
