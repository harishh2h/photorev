import { useCallback, useEffect, useId, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { viewerChromePillClass } from '@/features/photo-viewer/viewerChromeStyles.js'

const shellBaseClass = `flex h-11 min-h-[44px] items-center overflow-hidden ${viewerChromePillClass} transition-[max-width,border-color,background-color] duration-300 ease-out`

const toggleBtnClass =
  'flex h-11 w-11 shrink-0 items-center justify-center text-white/45 transition-[color,transform] duration-150 hover:text-white/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.96]'

/**
 * Top-bar rename: subtle icon pill that expands into an input + save control.
 */
export default function PhotoViewerRenameControl({
  photoId,
  renameDraft,
  savedRename = '',
  onRenameChange,
  onRenameSubmit,
  onFocusChange,
}) {
  const inputId = useId()
  const inputRef = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const trimmedDraft = renameDraft.trim()
  const trimmedSaved = savedRename.trim()
  const hasSavedRename = trimmedSaved.length > 0
  const canSubmit = trimmedDraft !== trimmedSaved

  useEffect(() => {
    setExpanded(false)
    onFocusChange?.(false)
  }, [photoId, onFocusChange])

  useEffect(() => {
    if (!expanded) return undefined
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [expanded])

  const setFocused = useCallback(
    (focused) => {
      onFocusChange?.(focused)
    },
    [onFocusChange],
  )

  const collapse = useCallback(() => {
    setExpanded(false)
    setFocused(false)
  }, [setFocused])

  const open = useCallback(() => {
    setExpanded(true)
    setFocused(true)
  }, [setFocused])

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return
    onRenameSubmit()
    collapse()
  }, [canSubmit, collapse, onRenameSubmit])

  const handleToggle = useCallback(() => {
    if (expanded) {
      collapse()
      return
    }
    open()
  }, [collapse, expanded, open])

  const handleInputKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        onRenameChange(savedRename)
        collapse()
      }
    },
    [collapse, handleSubmit, onRenameChange, savedRename],
  )

  const handleInputBlur = useCallback(
    (e) => {
      const next = e.relatedTarget
      if (next instanceof HTMLElement && next.closest('[data-rename-control]')) {
        return
      }
      collapse()
    },
    [collapse],
  )

  return (
    <div
      data-rename-control
      className={`${shellBaseClass} ${
        expanded ? 'max-w-[min(18rem,calc(100vw-6.5rem))]' : 'max-w-11'
      }`.trim()}
    >
      {!expanded ? (
        <button
          type="button"
          onClick={handleToggle}
          className={`${toggleBtnClass} relative`}
          aria-label={hasSavedRename ? `Rename — current: ${trimmedSaved}` : 'Rename photo'}
          aria-expanded={false}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.5 6.5l3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {hasSavedRename ? (
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          ) : null}
        </button>
      ) : (
        <div className="flex w-full min-w-0 items-center gap-1.5 pl-3 pr-1.5">
          <label className="sr-only" htmlFor={inputId}>
            Rename suggestion
          </label>
          <input
            ref={inputRef}
            id={inputId}
            data-photo-viewer-input
            value={renameDraft}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            placeholder="Rename…"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-2 font-base text-sm text-white/90 placeholder:text-white/30 focus:outline-none"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex h-8 shrink-0 items-center justify-center rounded-pill border-[1.5px] border-accent/40 bg-accent/10 px-3 font-base text-xs font-medium text-accent transition-[opacity,transform,border-color,background-color] duration-150 hover:border-accent/55 hover:bg-accent/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Save rename"
          >
            Save
          </button>
          <button
            type="button"
            onClick={collapse}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-white/35 transition-[color,transform] duration-150 hover:text-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.96]"
            aria-label="Close rename"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

PhotoViewerRenameControl.propTypes = {
  photoId: PropTypes.string.isRequired,
  renameDraft: PropTypes.string.isRequired,
  savedRename: PropTypes.string,
  onRenameChange: PropTypes.func.isRequired,
  onRenameSubmit: PropTypes.func.isRequired,
  onFocusChange: PropTypes.func,
}
