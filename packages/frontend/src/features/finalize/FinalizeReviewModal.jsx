import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'

const ACTIONS = [
  {
    id: 'keep_all',
    title: 'Keep everything',
    body: 'Lock the project for review but keep every photo on disk. Safest option.',
    tone: 'neutral',
  },
  {
    id: 'soft_delete_rejected',
    title: 'Move rejected to Trash',
    body: 'Rejected photos go to a 15-day trash. Restore by switching a vote back to liked.',
    tone: 'accent',
  },
  {
    id: 'hard_delete_rejected',
    title: 'Permanently delete rejected',
    body: 'Files are removed from disk. This cannot be undone. Type the project name to confirm.',
    tone: 'danger',
  },
]

/**
 * @param {{ isOpen: boolean; onClose: () => void; onConfirm: (action: string) => Promise<void>; projectName: string; pendingConflicts: number; isFinalized: boolean }} props
 */
export default function FinalizeReviewModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  pendingConflicts,
  isFinalized,
}) {
  const [selected, setSelected] = useState('keep_all')
  const [confirmText, setConfirmText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setSelected('keep_all')
    setConfirmText('')
    setSubmitError('')
  }, [isOpen])

  const handleClose = useCallback(() => {
    if (submitting) return
    onClose()
  }, [submitting, onClose])

  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, handleClose])

  if (!isOpen) return null

  const isHardDelete = selected === 'hard_delete_rejected'
  const confirmGate = isHardDelete && confirmText.trim() !== projectName.trim()
  const blockedByConflict = pendingConflicts > 0
  const ctaDisabled = submitting || confirmGate || blockedByConflict || isFinalized

  const handleSubmit = async () => {
    if (ctaDisabled) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await onConfirm(selected)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not finalize')
    } finally {
      setSubmitting(false)
    }
  }

  const node = (
    <div
      className="modal-overlay-in fixed inset-0 z-modal flex items-end justify-center bg-black/40 p-0 md:items-center md:p-6"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="modal-panel-up flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-xl border-[1.5px] border-base-300 bg-base-100 shadow-modal md:max-h-[88vh] md:w-[min(100%,48rem)] md:rounded-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="finalize-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b-[1.5px] border-base-300 px-5 py-5 md:px-7 md:py-6">
          <div>
            <p className="m-0 font-base text-xs font-semibold uppercase tracking-[0.08em] text-accent">Finalize</p>
            <h2 id="finalize-modal-title" className="m-0 font-base text-2xl font-bold leading-tight text-base-content">
              Lock in review for {projectName}
            </h2>
            <p className="m-0 mt-1 font-base text-sm text-muted">
              Reviewers can still change votes after finalize; rejected photos are handled by the action you pick.
            </p>
          </div>
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-base-300 bg-base-100 text-base-content transition-[background-color,border-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-base-200 active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-45"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto px-5 py-6 md:px-7 md:py-7">
          {blockedByConflict ? (
            <div className="mb-5 rounded-md border-[1.5px] border-error/50 bg-error/10 px-4 py-3 font-base text-sm font-medium text-error">
              {pendingConflicts} photo{pendingConflicts === 1 ? '' : 's'} still need an owner decision. Resolve conflicts first.
            </div>
          ) : null}
          {isFinalized ? (
            <div className="mb-5 rounded-md border-[1.5px] border-accent/50 bg-accent/10 px-4 py-3 font-base text-sm font-medium text-accent">
              This project is already finalized. You can still tweak votes; rejected handling stays as the original choice.
            </div>
          ) : null}
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {ACTIONS.map((action) => {
              const isActive = selected === action.id
              const accentRing =
                action.tone === 'danger'
                  ? 'border-error/55 bg-error/5'
                  : action.tone === 'accent'
                  ? 'border-accent/50 bg-accent/[0.06]'
                  : 'border-accent-mid bg-base-200/40'
              return (
                <li key={action.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(action.id)}
                    className={`flex w-full items-start gap-4 rounded-card border-[1.5px] px-4 py-4 text-left transition-[border-color,background-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:shadow-focus ${
                      isActive ? `${accentRing} shadow-card` : 'border-base-300 bg-base-100'
                    }`}
                    aria-pressed={isActive}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                        isActive ? 'border-accent bg-accent text-primary-content' : 'border-base-300 bg-base-100 text-transparent'
                      }`}
                      aria-hidden
                    >
                      <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M3 8.5l3 3 7-7" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-base text-base font-semibold text-base-content">{action.title}</span>
                      <span className="mt-1 block font-base text-sm leading-snug text-muted">{action.body}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {isHardDelete ? (
            <div className="mt-5 flex flex-col gap-2">
              <label htmlFor="finalize-confirm-name" className="font-base text-sm font-semibold text-muted">
                Type <span className="font-mono text-error">{projectName}</span> to confirm
              </label>
              <input
                id="finalize-confirm-name"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="input input-bordered w-full min-h-11 rounded-full border-[1.5px] border-base-300 bg-base-100 px-5 py-3 font-base text-base text-base-content focus:border-error focus:outline-none focus:shadow-[0_0_0_3px_rgba(239,68,68,0.18)]"
                placeholder="Project name"
                autoComplete="off"
              />
            </div>
          ) : null}
          {submitError ? (
            <p className="mt-4 font-base text-sm font-medium text-error" role="alert">
              {submitError}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t-[1.5px] border-base-300 px-5 py-4 md:flex-row md:justify-end md:px-7">
          <button
            type="button"
            className="btn btn-outline min-h-12 rounded-full border-[1.5px] border-base-300 bg-base-100 font-base text-sm font-semibold text-base-content transition-[background-color,border-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-base-200 active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-45 md:min-w-28"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={ctaDisabled}
            className={`btn min-h-12 rounded-full border-0 font-base text-sm font-semibold text-primary-content transition-[background-color,transform,opacity] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-55 md:min-w-44 ${
              isHardDelete ? 'bg-error hover:bg-error/90' : 'btn-primary hover:bg-[#222222]'
            }`}
          >
            {submitting ? 'Finalizing…' : 'Finalize project'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}

FinalizeReviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  projectName: PropTypes.string.isRequired,
  pendingConflicts: PropTypes.number.isRequired,
  isFinalized: PropTypes.bool.isRequired,
}
