import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * Shared dropdown state and refs for trigger/panel. Handles outside click and Escape.
 * @param {Object} [options]
 * @param {boolean} [options.defaultOpen=false]
 * @returns {{ isOpen: boolean, open: () => void, close: () => void, toggle: () => void, triggerRef: React.RefObject, panelRef: React.RefObject }}
 */
export function useDropdown(options = {}) {
  const { defaultOpen = false } = options
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  const close = useCallback(() => setIsOpen(false), [])
  const open = useCallback(() => setIsOpen(true), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event) => {
      const trigger = triggerRef.current
      const panel = panelRef.current
      if (
        trigger &&
        panel &&
        !trigger.contains(event.target) &&
        !panel.contains(event.target)
      ) {
        close()
      }
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, close])

  return { isOpen, open, close, toggle, triggerRef, panelRef }
}
