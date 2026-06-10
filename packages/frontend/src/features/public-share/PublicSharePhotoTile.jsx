import { useCallback } from 'react'
import PropTypes from 'prop-types'
import { buildPublicPhotoUrl } from '@/services/publicShareService.js'
import { PhotoSelectCheckbox } from '@/components/photo-grid/index.js'
import { useLongPress } from '@/hooks/useLongPress.js'
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
 *   enableSelection?: boolean
 *   selectionActive?: boolean
 *   isSelected?: boolean
 *   photoIndex?: number
 *   onPhotoClick?: (photoId: string, index: number, event: import('react').MouseEvent) => boolean
 *   onCheckboxPress?: (photoId: string, index: number) => void
 *   onLongPressSelect?: (photoId: string, index: number) => void
 *   animationDelay?: string
 * }} props
 */
export default function PublicSharePhotoTile({
  photo,
  token,
  unlockToken,
  onSelect,
  enableSelection = true,
  selectionActive = false,
  isSelected = false,
  photoIndex = 0,
  onPhotoClick,
  onCheckboxPress,
  onLongPressSelect,
  animationDelay = '0ms',
}) {
  const label = photo.originalName || 'Shared photo'

  const handleLongPress = useCallback(() => {
    onLongPressSelect?.(photo.id, photoIndex)
  }, [onLongPressSelect, photo.id, photoIndex])

  const longPress = useLongPress(handleLongPress)

  const handleClick = (event) => {
    if (enableSelection && onPhotoClick?.(photo.id, photoIndex, event)) {
      return
    }
    onSelect()
  }

  const selectedRingClass =
    selectionActive && isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-base-100' : ''

  return (
    <div
      className="animate-fade-up motion-reduce:animate-none h-full w-full"
      style={{ animationDelay }}
    >
      <div className={`${GRID_TILE_ROOT_CLASS} ${selectedRingClass}`}>
        <button
          type="button"
          onClick={handleClick}
          onClickCapture={longPress.onClickCapture}
          onPointerDown={longPress.onPointerDown}
          onPointerUp={longPress.onPointerUp}
          onPointerLeave={longPress.onPointerLeave}
          onPointerCancel={longPress.onPointerCancel}
          className={`${GRID_TILE_SHELL_BUTTON_CENTERED_CLASS} ${GRID_TILE_PLACEHOLDER_BG} focus-visible:outline-none focus-visible:shadow-focus`}
          aria-label={selectionActive ? `${isSelected ? 'Deselect' : 'Select'} ${label}` : `Open ${label} fullscreen`}
        >
          {enableSelection ? (
            <PhotoSelectCheckbox
              checked={isSelected}
              visible={selectionActive || isSelected}
              label={label}
              onToggle={() => onCheckboxPress?.(photo.id, photoIndex)}
            />
          ) : null}
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
  enableSelection: PropTypes.bool,
  selectionActive: PropTypes.bool,
  isSelected: PropTypes.bool,
  photoIndex: PropTypes.number,
  onPhotoClick: PropTypes.func,
  onCheckboxPress: PropTypes.func,
  onLongPressSelect: PropTypes.func,
  animationDelay: PropTypes.string,
  photo: PropTypes.shape({
    id: PropTypes.string.isRequired,
    originalName: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
  }).isRequired,
}
