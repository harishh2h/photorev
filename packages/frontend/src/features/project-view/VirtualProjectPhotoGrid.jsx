import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import ProjectPhotoTile from './ProjectPhotoTile.jsx'
import { REVIEW_SCOPE } from '@/utils/projectReviewFilters.js'

const GAP_PX = 16
const GAP_MD_PX = 20
const STAGGER_CAP_MS = 700
const STAGGER_STEP_MS = 70
const STAGGER_MAX_INDEX = 50

function useColumnCount() {
  const [cols, setCols] = useState(1)
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w >= 1024) setCols(4)
      else if (w >= 768) setCols(3)
      else if (w >= 480) setCols(2)
      else setCols(1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return cols
}

function staggerDelay(index, total) {
  if (total > STAGGER_MAX_INDEX) return '0ms'
  return `${Math.min(index * STAGGER_STEP_MS, STAGGER_CAP_MS)}ms`
}

/**
 * @param {{ photos: object[]; token: string; onOpenPhoto: (photoId: string) => void; reviewScope?: string; canReviewPhotos?: boolean; onLoadMore?: () => void; hasMore?: boolean; isLoadingMore?: boolean }} props
 */
export default function VirtualProjectPhotoGrid({
  photos,
  token,
  onOpenPhoto,
  reviewScope = REVIEW_SCOPE.MINE,
  canReviewPhotos = true,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}) {
  const listRef = useRef(/** @type {HTMLUListElement | null} */ (null))
  const columnCount = useColumnCount()
  const gap = columnCount >= 3 ? GAP_MD_PX : GAP_PX
  const rowCount = Math.ceil(photos.length / columnCount) || 0
  const [listWidth, setListWidth] = useState(0)
  const [scrollMargin, setScrollMargin] = useState(0)

  useEffect(() => {
    const el = listRef.current
    if (!el) return undefined
    const ro = new ResizeObserver((entries) => {
      setListWidth(entries[0]?.contentRect.width ?? 0)
    })
    ro.observe(el)
    setListWidth(el.clientWidth)
    setScrollMargin(el.offsetTop)
    return () => ro.disconnect()
  }, [])

  const itemWidth = listWidth > 0 ? (listWidth - gap * (columnCount - 1)) / columnCount : 0
  const rowHeight = itemWidth > 0 ? itemWidth * (4 / 3) : 280

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => rowHeight + gap,
    overscan: 2,
    scrollMargin,
  })

  const virtualItems = virtualizer.getVirtualItems()

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && typeof onLoadMore === 'function') {
      onLoadMore()
    }
  }, [hasMore, isLoadingMore, onLoadMore])

  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1]
    if (last && last.index >= rowCount - 2) {
      handleLoadMore()
    }
  }, [virtualItems, rowCount, handleLoadMore])

  const rows = useMemo(() => {
    const grouped = []
    for (let i = 0; i < rowCount; i += 1) {
      grouped.push(photos.slice(i * columnCount, i * columnCount + columnCount))
    }
    return grouped
  }, [photos, rowCount, columnCount])

  return (
    <ul ref={listRef} className="relative m-0 list-none p-0" style={{ height: `${virtualizer.getTotalSize()}px` }}>
      {virtualItems.map((virtualRow) => {
        const rowPhotos = rows[virtualRow.index] ?? []
        return (
          <li
            key={virtualRow.key}
            className="absolute left-0 top-0 w-full"
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div
              className="grid w-full"
              style={{
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                gap: `${gap}px`,
              }}
            >
              {rowPhotos.map((photo, colIndex) => {
                const index = virtualRow.index * columnCount + colIndex
                return (
                  <ProjectPhotoTile
                    key={photo.id}
                    as="div"
                    photo={photo}
                    token={token}
                    onOpenPhoto={onOpenPhoto}
                    reviewScope={reviewScope}
                    canReviewPhotos={canReviewPhotos}
                    animationDelay={staggerDelay(index, photos.length)}
                  />
                )
              })}
            </div>
          </li>
        )
      })}
      {isLoadingMore ? (
        <li className="absolute bottom-0 left-0 flex w-full justify-center py-4">
          <span className="loading loading-spinner loading-md text-accent" aria-label="Loading more photos" />
        </li>
      ) : null}
    </ul>
  )
}

VirtualProjectPhotoGrid.propTypes = {
  token: PropTypes.string.isRequired,
  onOpenPhoto: PropTypes.func.isRequired,
  reviewScope: PropTypes.oneOf([REVIEW_SCOPE.MINE, REVIEW_SCOPE.TEAM]),
  canReviewPhotos: PropTypes.bool,
  onLoadMore: PropTypes.func,
  hasMore: PropTypes.bool,
  isLoadingMore: PropTypes.bool,
  photos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      alt: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['pending', 'ready', 'failed', 'trashed']),
      blurhash: PropTypes.string,
      myIsLiked: PropTypes.bool,
      myIsRejected: PropTypes.bool,
      teamIsLiked: PropTypes.bool,
      teamIsRejected: PropTypes.bool,
      hasConflict: PropTypes.bool,
      conflictState: PropTypes.string,
      selectionLabel: PropTypes.string,
    }),
  ).isRequired,
}
