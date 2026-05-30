import PropTypes from 'prop-types'
import { useEffect } from 'react'

/**
 * Mobile-first bottom sheet; centered modal on md+.
 * @param {{ open: boolean; onClose: () => void; title?: string; ariaLabel?: string; children: import('react').ReactNode; className?: string }} props
 */
export default function AppBottomSheet({
  open,
  onClose,
  title,
  ariaLabel = 'Actions',
  children,
  className = '',
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-overlay-in fixed inset-0 z-modal flex items-end justify-center bg-black/40 md:items-center"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-transparent"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className={`modal-panel-up relative z-[1] flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-xl border-[1.5px] border-base-300 bg-base-100 shadow-modal md:max-w-md md:rounded-xl ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || ariaLabel}
      >
        <div className="flex shrink-0 items-center justify-between border-b-[1.5px] border-base-300 px-4 py-4 md:px-5">
          {title ? (
            <h2 className="m-0 font-base text-lg font-semibold text-base-content">{title}</h2>
          ) : (
            <span className="mx-auto h-1 w-10 rounded-full bg-base-300 md:hidden" aria-hidden />
          )}
          <button
            type="button"
            className="btn btn-ghost btn-circle ml-auto min-h-11 min-w-11 border-0 font-base text-xl leading-none text-muted"
            onClick={onClose}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3 md:px-5 md:py-4">{children}</div>
      </div>
    </div>
  )
}

AppBottomSheet.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  ariaLabel: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}
