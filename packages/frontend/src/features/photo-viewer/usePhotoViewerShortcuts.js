import { useEffect } from 'react'

/**
 * @param {{ detailOpen: boolean; setDetailOpen: (v: boolean) => void; onExit: () => void; goPrev: () => void; goNext: () => void; onLike: () => void; onReject: () => void; enabled: boolean }} opts
 */
export function usePhotoViewerShortcuts({
  detailOpen,
  setDetailOpen,
  onExit,
  goPrev,
  goNext,
  onLike,
  onReject,
  enabled,
}) {
  useEffect(() => {
    if (!enabled) return undefined
    function handleKeyDown(e) {
      const el = e.target
      if (e.key === 'Escape') {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
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
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
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
  }, [detailOpen, enabled, goNext, goPrev, onExit, onLike, onReject, setDetailOpen])
}
