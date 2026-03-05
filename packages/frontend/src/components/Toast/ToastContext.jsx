import { createContext, useContext, useState, useCallback, useRef } from 'react'
import Toast from './Toast.jsx'

const ToastContext = createContext(null)

const DEFAULT_DURATION = 5000
const EXIT_MS = 250

export function ToastProvider({ children }) {
  const [state, setState] = useState({ message: null, variant: 'info', visible: false, exiting: false })
  const timeoutRef = useRef(null)
  const exitRef = useRef(null)

  const dismiss = useCallback(() => {
    if (exitRef.current) clearTimeout(exitRef.current)
    setState((prev) => (prev.visible ? { ...prev, exiting: true } : prev))
    exitRef.current = setTimeout(() => {
      setState({ message: null, variant: 'info', visible: false, exiting: false })
      exitRef.current = null
    }, EXIT_MS)
  }, [])

  const show = useCallback((message, variant = 'info', duration = DEFAULT_DURATION) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (exitRef.current) {
      clearTimeout(exitRef.current)
      exitRef.current = null
    }
    setState({ message, variant, visible: true, exiting: false })
    if (duration > 0) {
      timeoutRef.current = setTimeout(dismiss, duration)
    }
  }, [dismiss])

  const handleDismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    dismiss()
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {state.visible && state.message && (
        <Toast
          message={state.message}
          variant={state.variant}
          onDismiss={handleDismiss}
          isExiting={state.exiting}
        />
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
