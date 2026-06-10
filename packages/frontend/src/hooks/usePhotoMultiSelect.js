import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * Implicit multi-select (Immich / Google Photos pattern).
 * selectionActive = selectedCount > 0 — no separate "selection mode" toggle.
 *
 * @param {string[]} visiblePhotoIds — photos currently shown in the grid (display order)
 */
export function usePhotoMultiSelect(visiblePhotoIds) {
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const anchorIndexRef = useRef(/** @type {number | null} */ (null))

  useEffect(() => {
    setSelectedIds((prev) => {
      const visible = new Set(visiblePhotoIds)
      const next = new Set()
      for (const id of prev) {
        if (visible.has(id)) next.add(id)
      }
      if (next.size === 0) {
        anchorIndexRef.current = null
      }
      return next.size === prev.size ? prev : next
    })
  }, [visiblePhotoIds])

  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(visiblePhotoIds))
    anchorIndexRef.current = visiblePhotoIds.length > 0 ? visiblePhotoIds.length - 1 : null
  }, [visiblePhotoIds])

  useEffect(() => {
    if (visiblePhotoIds.length === 0) return undefined

    const handleKeyDown = (event) => {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }
      if (event.key === 'Escape' && selectedIds.size > 0) {
        setSelectedIds(new Set())
        anchorIndexRef.current = null
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        selectAllVisible()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visiblePhotoIds.length, selectedIds.size, selectAllVisible])

  const selectedIdList = useMemo(() => [...selectedIds], [selectedIds])
  const selectedCount = selectedIds.size
  const visibleCount = visiblePhotoIds.length
  const selectionActive = selectedCount > 0
  const allVisibleSelected = visibleCount > 0 && selectedCount === visibleCount

  const isSelected = useCallback((photoId) => selectedIds.has(photoId), [selectedIds])

  const selectPhoto = useCallback((photoId, index) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.add(photoId)
      return next
    })
    if (typeof index === 'number') {
      anchorIndexRef.current = index
    }
  }, [])

  const togglePhoto = useCallback((photoId, index) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(photoId)) {
        next.delete(photoId)
      } else {
        next.add(photoId)
      }
      if (next.size === 0) {
        anchorIndexRef.current = null
      }
      return next
    })
    if (typeof index === 'number') {
      anchorIndexRef.current = index
    }
  }, [])

  const selectRange = useCallback(
    (fromIndex, toIndex) => {
      const start = Math.min(fromIndex, toIndex)
      const end = Math.max(fromIndex, toIndex)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (let i = start; i <= end; i += 1) {
          const id = visiblePhotoIds[i]
          if (id) next.add(id)
        }
        return next
      })
      anchorIndexRef.current = toIndex
    },
    [visiblePhotoIds],
  )

  const handlePhotoClick = useCallback(
    (photoId, index, event) => {
      if (selectionActive) {
        if (event?.shiftKey && anchorIndexRef.current != null) {
          selectRange(anchorIndexRef.current, index)
          return true
        }
        togglePhoto(photoId, index)
        return true
      }
      return false
    },
    [selectionActive, selectRange, togglePhoto],
  )

  const handleCheckboxPress = useCallback(
    (photoId, index) => {
      if (isSelected(photoId)) {
        togglePhoto(photoId, index)
      } else {
        selectPhoto(photoId, index)
      }
    },
    [isSelected, selectPhoto, togglePhoto],
  )

  const handleLongPress = useCallback(
    (photoId, index) => {
      if (!isSelected(photoId)) {
        selectPhoto(photoId, index)
      }
    },
    [isSelected, selectPhoto],
  )

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    anchorIndexRef.current = null
  }, [])

  return {
    selectionActive,
    selectedCount,
    selectedIdList,
    allVisibleSelected,
    isSelected,
    selectPhoto,
    togglePhoto,
    selectRange,
    handlePhotoClick,
    handleCheckboxPress,
    handleLongPress,
    selectAllVisible,
    clearSelection,
  }
}
