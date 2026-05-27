import PropTypes from 'prop-types'
import { buildPublicPhotoUrl } from '@/services/publicShareService.js'
import {
  GRID_TILE_HOVER_IMAGE_CLASS,
  GRID_TILE_IMAGE_CLASS,
  GRID_TILE_PLACEHOLDER_BG,
  GRID_TILE_ROOT_CLASS,
  GRID_TILE_SHELL_BUTTON_CENTERED_CLASS,
} from '@/components/photo-grid/gridPhotoTileStyles.js'

/**
 * @param {{
 *   photo: { id: string; originalName?: string | null; width?: number | null; height?: number | null }
 *   token: string
 *   unlockToken: string | null
 *   onSelect: () => void
 *   animationDelay?: string
 * }} props
 */
export default function PublicSharePhotoTile({
  photo,
  token,
  unlockToken,
  onSelect,
  animationDelay = '0ms',
}) {
  const label = photo.originalName || 'Shared photo'

  return (
    <div
      className="animate-fade-up motion-reduce:animate-none h-full w-full"
      style={{ animationDelay }}
    >
      <div className={GRID_TILE_ROOT_CLASS}>
        <button
          type="button"
          onClick={onSelect}
          className={`${GRID_TILE_SHELL_BUTTON_CENTERED_CLASS} ${GRID_TILE_PLACEHOLDER_BG} focus-visible:outline-none focus-visible:shadow-focus`}
          aria-label={`Open ${label} fullscreen`}
        >
          <img
            src={buildPublicPhotoUrl(token, photo.id, 'thumb', unlockToken)}
            loading="lazy"
            decoding="async"
            alt={label}
            className={`${GRID_TILE_IMAGE_CLASS} ${GRID_TILE_HOVER_IMAGE_CLASS}`}
          />
        </button>
      </div>
    </div>
  )
}

PublicSharePhotoTile.propTypes = {
  token: PropTypes.string.isRequired,
  unlockToken: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  animationDelay: PropTypes.string,
  photo: PropTypes.shape({
    id: PropTypes.string.isRequired,
    originalName: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
  }).isRequired,
}
