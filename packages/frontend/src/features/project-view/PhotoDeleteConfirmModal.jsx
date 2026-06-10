import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'

/**
 * @param {{ isOpen: boolean; photoCount: number; busy?: boolean; error?: string; onClose: () => void; onConfirm: () => void | Promise<void> }} props
 */
export default function PhotoDeleteConfirmModal({
  isOpen,
  photoCount,
  busy = false,
  error = '',
  onClose,
  onConfirm,
}) {
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setLocalError('')
      return undefined
    }
    function onKey(e) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, busy, onClose])

  useEffect(() => {
    if (error) setLocalError(error)
  }, [error])

  const handleConfirm = useCallback(async () => {
    setLocalError('')
    try {
      await onConfirm()
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : photoCount === 1
            ? "Couldn't delete this photo"
            : "Couldn't delete these photos"
      )
    }
  }, [onConfirm, photoCount])

  if (!isOpen) return null

  const description =
    photoCount === 1
      ? "This photo will be permanently deleted. You can't undo this."
      : `These ${photoCount} photos will be permanently deleted. You can't undo this.`

  return createPortal(
    <div
      className="fixed inset-0 z-[350] flex items-end justify-center bg-black/45 backdrop-blur-[2px] md:items-center"
      role="presentation"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <div
        className="flex w-full max-w-md flex-col gap-4 rounded-t-[32px] border-[1.5px] border-base-300 bg-base-100 p-5 shadow-modal md:rounded-[32px]"
        role="dialog"
        aria-labelledby="delete-photos-title"
        aria-describedby="delete-photos-desc"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="delete-photos-title" className="m-0 font-base text-xl font-semibold text-base-content">
            Delete {photoCount === 1 ? 'photo' : 'photos'}?
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost min-h-11 min-w-11 border-[1.5px] border-transparent text-muted hover:border-accent-mid hover:bg-[#F4F9F6]"
            aria-label="Close"
            disabled={busy}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <p id="delete-photos-desc" className="m-0 font-base text-sm leading-relaxed text-muted">
          {description}
        </p>
        {localError ? (
          <p className="m-0 font-base text-sm font-medium text-error" role="alert">
            {localError}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn min-h-11 rounded-full border-[1.5px] border-base-300 bg-base-100 font-base text-sm font-medium text-base-content hover:border-accent-mid hover:bg-surface-hover"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn min-h-11 rounded-full border-none bg-error font-base text-sm font-semibold text-primary-content hover:bg-error/90"
            disabled={busy}
            onClick={() => {
              void handleConfirm()
            }}
          >
            {busy ? <span className="loading loading-spinner loading-sm" aria-hidden /> : null}
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

PhotoDeleteConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  photoCount: PropTypes.number.isRequired,
  busy: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
}
