import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import styles from './AddProjectModal.module.css'

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
      className={styles.overlay}
      role="presentation"
      onMouseDown={handleOverlayPointerDown}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-project-title"
        aria-busy={isSubmitting}
      >
        <div className={styles.shell}>
          <aside className={styles.heroAside} aria-hidden>
            <div className={styles.heroPattern} />
            <p className={styles.heroKicker}>PhotoRev</p>
            <h3 className={styles.heroHeading}>Start a new shoot workspace</h3>
            <p className={styles.heroBody}>
              Projects keep uploads, reviews, and exports together. Only members you invite can see what is inside.
            </p>
            <div className={styles.floatingStat}>
              <span className={styles.floatingStatValue}>Private</span>
              <span className={styles.floatingStatLabel}>by default</span>
            </div>
          </aside>
          <div className={styles.formColumn}>
            <div className={styles.header}>
              <div>
                <p className={styles.eyebrow}>Create</p>
                <h2 id="add-project-title" className={styles.title}>
                  New project
                </h2>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={handleClose}
                disabled={isSubmitting}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="add-project-name" className={styles.label}>
                  Project name
                </label>
                <input
                  ref={inputRef}
                  id="add-project-name"
                  type="text"
                  name="name"
                  className={styles.input}
                  value={name}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (validationError) setValidationError('')
                    if (submitError) setSubmitError('')
                  }}
                  placeholder="e.g. Sterling Wedding, Q4 Lookbook"
                  autoComplete="off"
                />
                {validationError ? (
                  <p className={styles.error} role="alert">
                    {validationError}
                  </p>
                ) : null}
                {submitError ? (
                  <p className={styles.error} role="alert">
                    {submitError}
                  </p>
                ) : null}
                <p className={styles.hint}>
                  Storage path is created for you on the server. Next, add a library and upload photos from the project page.
                </p>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
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
