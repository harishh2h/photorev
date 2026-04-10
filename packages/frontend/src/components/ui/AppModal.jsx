import PropTypes from 'prop-types'
import { useEffect } from 'react'

export default function AppModal({ open, title, children, onClose, className = '' }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal modal-open z-modal"
      role="presentation"
    >
      <button
        type="button"
        className="modal-backdrop bg-black/40 cursor-default"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        className={`modal-box rounded-xl border-[1.5px] border-base-300 bg-base-100 font-base shadow-modal max-w-lg ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'app-modal-title' : undefined}
      >
        {title ? (
          <h2 id="app-modal-title" className="font-bold text-lg text-base-content mb-4">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </div>
  )
}

AppModal.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string,
}
