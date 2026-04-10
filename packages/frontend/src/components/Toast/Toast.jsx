import PropTypes from 'prop-types'

const VARIANT_CLASSES = {
  error: 'bg-error/10 border-error text-error',
  success: 'bg-accent/10 border-accent text-accent',
  info: 'bg-base-100 border-base-300 text-base-content',
}

export default function Toast({ message, variant = 'info', onDismiss, isExiting }) {
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.info
  const motion = isExiting ? 'toast-exit' : 'toast-enter'
  return (
    <div
      className={`fixed top-4 right-4 z-toast flex min-h-11 items-center gap-3 rounded-floating border-[1.5px] px-5 py-3 font-base text-sm shadow-floating ${variantClass} ${motion}`}
      role="alert"
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        className="btn btn-ghost btn-circle btn-sm min-h-11 min-w-11 shrink-0 border-0 text-inherit opacity-80 transition-[opacity,transform] duration-150 ease-out hover:opacity-100 active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['error', 'success', 'info']),
  onDismiss: PropTypes.func.isRequired,
  isExiting: PropTypes.bool,
}
