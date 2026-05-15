import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { deleteProject } from '@/services/projectService.js'

const REQUIRED = 'DELETE'

/**
 * @param {{ isOpen: boolean; onClose: () => void; token: string; projectId: string; displayName: string; onDeleted: () => void }} props
 */
export default function ProjectDeleteConfirmModal({
  isOpen,
  onClose,
  token,
  projectId,
  displayName,
  onDeleted,
}) {
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setDraft('')
      setBusy(false)
      setError('')
      return undefined
    }
    function onKey(e) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, busy, onClose])

  const canSubmit = draft.trim() === REQUIRED && !busy

  const handleConfirm = useCallback(async () => {
    if (!canSubmit) return
    setBusy(true)
    setError('')
    try {
      await deleteProject(token, projectId)
      onDeleted()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete project')
    } finally {
      setBusy(false)
    }
  }, [canSubmit, onClose, onDeleted, projectId, token])

  if (!isOpen) return null

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
        aria-labelledby="delete-project-title"
        aria-describedby="delete-project-desc"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="delete-project-title" className="m-0 font-base text-xl font-semibold text-base-content">
            Delete project?
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost min-h-11 min-w-11 border-[1.5px] border-transparent text-muted hover:border-accent-mid hover:bg-[#F4F9F6]"
            aria-label="Close"
            disabled={busy}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <p id="delete-project-desc" className="m-0 font-base text-sm text-muted">
          This removes all photo files for{' '}
          <strong className="font-semibold text-base-content">{displayName}</strong> from storage and marks the project
          deleted. Type <strong className="text-accent">{REQUIRED}</strong> to confirm.
        </p>
        <input
          type="text"
          autoComplete="off"
          value={draft}
          disabled={busy}
          onChange={(e) => {
            setDraft(e.target.value)
            setError('')
          }}
          placeholder={REQUIRED}
          className="input input-bordered w-full rounded-full border-[1.5px] border-base-300 bg-base-100 px-4 py-3 font-base text-sm uppercase tracking-widest text-base-content placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
          aria-invalid={draft.length > 0 && !canSubmit}
        />
        {error ? (
          <p className="m-0 font-base text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="btn btn-outline min-h-11 flex-1 rounded-full border-[1.5px] border-base-300 font-base text-sm font-semibold transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-[#F4F9F6] active:scale-[0.97] sm:flex-none"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleConfirm}
            className="btn min-h-11 flex-1 rounded-full border-0 bg-error font-base text-sm font-semibold text-error-content transition-[transform,opacity] duration-150 ease-out hover:bg-error/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
          >
            {busy ? <span className="loading loading-spinner loading-sm" aria-hidden /> : 'OK'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

ProjectDeleteConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  projectId: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  onDeleted: PropTypes.func.isRequired,
}
