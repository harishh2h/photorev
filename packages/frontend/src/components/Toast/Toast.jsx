import PropTypes from 'prop-types'
import styles from './Toast.module.css'

const VARIANT_CLASS = {
  error: styles.toastError,
  success: styles.toastSuccess,
  info: styles.toastInfo,
}

export default function Toast({ message, variant = 'info', onDismiss, isExiting }) {
  const variantClass = VARIANT_CLASS[variant] || styles.toastInfo
  return (
    <div
      className={`${styles.toast} ${variantClass} ${isExiting ? styles.toastExiting : ''}`}
      role="alert"
    >
      <span className={styles.message}>{message}</span>
      <button
        type="button"
        className={styles.close}
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
