import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'

/**
 * @param {{ isOpen: boolean; onClose: () => void; onCreate: (payload: { name: string }) => Promise<void> }} props
 * @returns {import('react').JSX.Element | null}
 */
export default function AddProjectModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [validationError, setValidationError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef(null)
  const handleClose = useCallback(() => {
    if (isSubmitting) return
    setName('')
    setValidationError('')
    setSubmitError('')
    onClose()
  }, [onClose, isSubmitting])
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    const id = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.cancelAnimationFrame(id)
    }
  }, [isOpen, handleClose])
  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setValidationError('Enter a project name')
      return
    }
    setValidationError('')
    setSubmitError('')
    setIsSubmitting(true)
    try {
      await onCreate({ name: trimmed })
      setName('')
      onClose()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }
  const handleOverlayPointerDown = (event) => {
    if (event.target === event.currentTarget && !isSubmitting) {
      handleClose()
    }
  }
  if (!isOpen) {
    return null
  }
  const modal = (
    <div
      className="modal-overlay-in fixed inset-0 z-modal flex items-end justify-center bg-black/40 p-0 md:items-center md:p-6"
      role="presentation"
      onMouseDown={handleOverlayPointerDown}
    >
      <div
        className="modal-panel-up flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-xl border-[1.5px] border-base-300 bg-base-100 shadow-modal md:max-h-[88vh] md:w-[min(100%,32rem)] md:rounded-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-project-title"
        aria-busy={isSubmitting}
      >
        <div className="flex min-h-0 flex-col">
          <div className="min-w-0 flex-1 overflow-y-auto px-5 py-6 pb-8 md:px-8 md:py-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2
                id="add-project-title"
                className="m-0 font-base text-2xl font-bold leading-tight text-base-content"
              >
                New project
              </h2>
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-base-300 bg-base-100 text-base-content transition-[background-color,border-color,transform,opacity] duration-150 ease-out hover:border-accent-mid hover:bg-base-200 active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-45"
                onClick={handleClose}
                disabled={isSubmitting}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label htmlFor="add-project-name" className="font-base text-sm font-semibold text-muted">
                  Project name
                </label>
                <input
                  ref={inputRef}
                  id="add-project-name"
                  type="text"
                  name="name"
                  className="input input-bordered w-full min-h-11 rounded-full border-[1.5px] border-base-300 bg-base-100 px-5 py-3 font-base text-base text-base-content transition-[border-color,box-shadow,opacity] duration-150 ease-out placeholder:text-base-300 focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.2)] disabled:cursor-not-allowed disabled:opacity-55"
                  value={name}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (validationError) setValidationError('')
                    if (submitError) setSubmitError('')
                  }}
                  autoComplete="off"
                />
                {validationError ? (
                  <p className="m-0 font-base text-sm font-medium text-error" role="alert">
                    {validationError}
                  </p>
                ) : null}
                {submitError ? (
                  <p className="m-0 font-base text-sm font-medium text-error" role="alert">
                    {submitError}
                  </p>
                ) : null}
                <p className="m-0 font-base text-xs leading-normal text-muted">
                  You can change the project name later in settings.
                </p>
              </div>
              <div className="mt-2 flex flex-col-reverse gap-3 md:flex-row md:justify-end">
                <button
                  type="button"
                  className="btn btn-outline min-h-12 rounded-full border-[1.5px] border-base-300 bg-base-100 font-base text-sm font-semibold text-base-content transition-[background-color,border-color,transform,opacity] duration-150 ease-out hover:border-accent-mid hover:bg-base-200 active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-45 md:min-w-28"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary min-h-12 rounded-full border-0 font-base text-sm font-semibold text-primary-content transition-[background-color,transform,opacity] duration-150 ease-out hover:bg-[#222222] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-55 md:min-w-40"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating…' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
  return createPortal(modal, document.body)
}

AddProjectModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
}
