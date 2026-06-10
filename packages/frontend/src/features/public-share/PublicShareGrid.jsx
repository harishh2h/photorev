import PropTypes from 'prop-types'
import { JustifiedPhotoGrid } from '@/components/photo-grid/index.js'
import PublicSharePhotoTile from './PublicSharePhotoTile.jsx'

/**
 * @param {{ token: string; unlockToken: string | null; photos: Array<{ id: string; originalName: string | null; width: number | null; height: number | null }>; onSelect: (index: number) => void; enableSelection?: boolean; selectionActive?: boolean; isSelected?: (photoId: string) => boolean; onPhotoClick?: (photoId: string, index: number, event: import('react').MouseEvent) => boolean; onCheckboxPress?: (photoId: string, index: number) => void; onLongPressSelect?: (photoId: string, index: number) => void }} props
 */
export default function PublicShareGrid({
  token,
  unlockToken,
  photos,
  onSelect,
  enableSelection = true,
  selectionActive = false,
  isSelected,
  onPhotoClick,
  onCheckboxPress,
  onLongPressSelect,
}) {
  if (photos.length === 0) {
    return (
      <p className="m-0 rounded-card border-[1.5px] border-dashed border-base-300 bg-base-100 px-4 py-10 text-center font-base text-base text-muted">
        No photos have been published in this share yet.
      </p>
    )
  }

  return (
    <JustifiedPhotoGrid
      photos={photos}
      renderTile={({ photo, index, animationDelay }) => (
        <PublicSharePhotoTile
          photo={photo}
          token={token}
          unlockToken={unlockToken}
          onSelect={() => onSelect(index)}
          enableSelection={enableSelection}
          selectionActive={selectionActive}
          isSelected={isSelected?.(photo.id) ?? false}
          photoIndex={index}
          onPhotoClick={onPhotoClick}
          onCheckboxPress={onCheckboxPress}
          onLongPressSelect={onLongPressSelect}
          animationDelay={animationDelay}
        />
      )}
    />
  )
}

PublicShareGrid.propTypes = {
  token: PropTypes.string.isRequired,
  unlockToken: PropTypes.string,
  photos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      originalName: PropTypes.string,
      width: PropTypes.number,
      height: PropTypes.number,
    }),
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  enableSelection: PropTypes.bool,
  selectionActive: PropTypes.bool,
  isSelected: PropTypes.func,
  onPhotoClick: PropTypes.func,
  onCheckboxPress: PropTypes.func,
  onLongPressSelect: PropTypes.func,
}
