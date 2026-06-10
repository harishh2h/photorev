import { useEffect } from 'react'

function isTypingTarget(el) {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
}

function isShortcutsHelpKey(e) {
  return e.key === '?' || e.key === '/'
}

/**
 * @param {{
 *   detailOpen: boolean;
 *   setDetailOpen: (v: boolean) => void;
 *   shortcutsOpen: boolean;
 *   onToggleShortcuts: () => void;
 *   onExit: () => void;
 *   goPrev: () => void;
 *   goNext: () => void;
 *   onLike: () => void;
 *   onReject: () => void;
 *   onToggleInfo: () => void;
 *   onOpenRename: () => void;
 *   onToggleZoom: () => void;
 *   onCopyPhoto: () => void;
 *   onDownloadPhoto: () => void;
 *   onOpenDelete?: () => void;
 *   deleteModalOpen?: boolean;
 *   onCloseDeleteModal?: () => void;
 *   enabled: boolean;
 *   canReview?: boolean;
 *   canDelete?: boolean;
 * }} opts
 */
export function usePhotoViewerShortcuts({
  detailOpen,
  setDetailOpen,
  shortcutsOpen,
  onToggleShortcuts,
  onExit,
  goPrev,
  goNext,
  onLike,
  onReject,
  onToggleInfo,
  onOpenRename,
  onToggleZoom,
  onCopyPhoto,
  onDownloadPhoto,
  onOpenDelete,
  deleteModalOpen = false,
  onCloseDeleteModal,
  enabled,
  canReview = true,
  canDelete = false,
}) {
  useEffect(() => {
    if (!enabled) return undefined

    function handleKeyDown(e) {
      const el = e.target

      if (deleteModalOpen) {
        if (e.key === 'Escape') {
          onCloseDeleteModal?.()
          e.preventDefault()
        }
        return
      }

      if (shortcutsOpen) {
        if (!isTypingTarget(el) && isShortcutsHelpKey(e)) {
          onToggleShortcuts()
          e.preventDefault()
        }
        return
      }

      if (!isTypingTarget(el) && isShortcutsHelpKey(e)) {
        onToggleShortcuts()
        e.preventDefault()
        return
      }

      if (e.key === 'Escape') {
        if (isTypingTarget(el)) {
          el.blur()
          e.preventDefault()
          return
        }
        if (detailOpen) {
          setDetailOpen(false)
          e.preventDefault()
          return
        }
        onExit()
        e.preventDefault()
        return
      }

      if (isTypingTarget(el)) {
        return
      }

      if (e.key === ' ') {
        goNext()
        e.preventDefault()
        return
      }

      if (e.key === 'ArrowLeft') {
        goPrev()
        e.preventDefault()
        return
      }

      if (e.key === 'ArrowRight') {
        goNext()
        e.preventDefault()
        return
      }

      const key = e.key.toLowerCase()
      const mod = e.metaKey || e.ctrlKey

      if (mod && key === 'c') {
        onCopyPhoto()
        e.preventDefault()
        return
      }

      if (mod && key === 'd') {
        onDownloadPhoto()
        e.preventDefault()
        return
      }

      if (canDelete && (e.key === 'Delete' || e.key === 'Backspace')) {
        onOpenDelete?.()
        e.preventDefault()
        return
      }

      if (key === 'i') {
        onToggleInfo()
        e.preventDefault()
        return
      }

      if (key === 'z') {
        onToggleZoom()
        e.preventDefault()
        return
      }

      if (canReview && key === 'r') {
        onOpenRename()
        e.preventDefault()
        return
      }

      if (!canReview) {
        return
      }

      if (e.key === 'ArrowUp') {
        onLike()
        e.preventDefault()
        return
      }

      if (e.key === 'ArrowDown') {
        onReject()
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    canDelete,
    canReview,
    deleteModalOpen,
    detailOpen,
    enabled,
    goNext,
    goPrev,
    onCloseDeleteModal,
    onExit,
    onLike,
    onCopyPhoto,
    onDownloadPhoto,
    onOpenDelete,
    onOpenRename,
    onReject,
    onToggleInfo,
    onToggleShortcuts,
    onToggleZoom,
    setDetailOpen,
    shortcutsOpen,
  ])
}
