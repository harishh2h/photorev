import { useRef, useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useJustifiedPhotoLayout } from '@/hooks/useJustifiedPhotoLayout.js'
import { getJustifiedGridStaggerDelay } from './justifiedGridStagger.js'

/**
 * @param {{ position: { left: number; top?: number }; children: import('react').ReactNode }} props
 */
function PositionedTile({ position, children }) {
  return (
    <div
      className="absolute left-0 top-0"
      style={{
        width: `${position.width}px`,
        height: `${position.height}px`,
        transform: `translate(${position.left}px, ${position.top ?? 0}px)`,
      }}
    >
      {children}
    </div>
  )
}

PositionedTile.propTypes = {
  position: PropTypes.shape({
    left: PropTypes.number.isRequired,
    top: PropTypes.number,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
  children: PropTypes.node.isRequired,
}

/**
 * @param {{
 *   photos: object[]
 *   virtualized?: boolean
 *   onLoadMore?: () => void
 *   hasMore?: boolean
 *   isLoadingMore?: boolean
 *   renderTile: (args: {
 *     photo: object
 *     index: number
 *     position: { top: number; left: number; width: number; height: number }
 *     animationDelay: string
 *   }) => import('react').ReactNode
 * }} props
 */
export default function JustifiedPhotoGrid({
  photos,
  virtualized = false,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  renderTile,
}) {
  const containerRef = useRef(/** @type {HTMLUListElement | null} */ (null))
  const [scrollMargin, setScrollMargin] = useState(0)
  const { layout, rows } = useJustifiedPhotoLayout(photos, containerRef)

  const syncScrollMargin = useCallback(() => {
    const element = containerRef.current
    if (!element) {
      return
    }
    setScrollMargin(element.offsetTop)
  }, [])

  useEffect(() => {
    if (!virtualized) {
      return undefined
    }
    syncScrollMargin()
    window.addEventListener('resize', syncScrollMargin)
    return () => window.removeEventListener('resize', syncScrollMargin)
  }, [virtualized, syncScrollMargin, rows.length, layout.containerHeight])

  const virtualizer = useWindowVirtualizer({
    count: virtualized ? rows.length : 0,
    estimateSize: (index) => rows[index]?.spanHeight ?? 120,
    overscan: 2,
    scrollMargin,
  })

  const virtualItems = virtualizer.getVirtualItems()

  useEffect(() => {
    if (!virtualized) {
      return
    }
    virtualizer.measure()
  }, [virtualized, virtualizer, rows, scrollMargin])

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && typeof onLoadMore === 'function') {
      onLoadMore()
    }
  }, [hasMore, isLoadingMore, onLoadMore])

  useEffect(() => {
    if (!virtualized) {
      return
    }
    const last = virtualItems[virtualItems.length - 1]
    if (last && last.index >= rows.length - 2) {
      handleLoadMore()
    }
  }, [virtualized, virtualItems, rows.length, handleLoadMore])

  const renderPositionedTile = (photo, index, position, rowRelative = false) => {
    const slot = rowRelative ? { ...position, top: 0 } : position
    return (
      <PositionedTile key={photo.id} position={slot}>
        {renderTile({
          photo,
          index,
          position,
          animationDelay: getJustifiedGridStaggerDelay(index, photos.length),
        })}
      </PositionedTile>
    )
  }

  if (!virtualized) {
    return (
      <ul ref={containerRef} className="relative m-0 list-none p-0">
        <li
          className="relative m-0 list-none p-0"
          style={{
            height: layout.containerHeight > 0 ? `${layout.containerHeight}px` : undefined,
            minHeight: layout.containerHeight > 0 ? undefined : '12rem',
          }}
        >
          {photos.map((photo, index) => {
            const position = layout.positions[index]
            if (!position) {
              return null
            }
            return renderPositionedTile(photo, index, position)
          })}
        </li>
      </ul>
    )
  }

  return (
    <ul
      ref={containerRef}
      className="relative m-0 list-none p-0"
      style={{ height: `${virtualizer.getTotalSize()}px` }}
    >
      {virtualItems.map((virtualRow) => {
        const row = rows[virtualRow.index]
        if (!row) {
          return null
        }

        return (
          <li
            key={virtualRow.key}
            className="absolute left-0 top-0 w-full"
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div className="relative w-full" style={{ height: `${row.spanHeight}px` }}>
              {row.items.map(({ photo, index, position }) =>
                renderPositionedTile(photo, index, position, true),
              )}
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

JustifiedPhotoGrid.propTypes = {
  photos: PropTypes.arrayOf(PropTypes.object).isRequired,
  virtualized: PropTypes.bool,
  onLoadMore: PropTypes.func,
  hasMore: PropTypes.bool,
  isLoadingMore: PropTypes.bool,
  renderTile: PropTypes.func.isRequired,
}
