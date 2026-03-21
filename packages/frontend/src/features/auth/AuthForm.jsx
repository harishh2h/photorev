import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuth } from './useAuth.js'
import { useToast } from '@/components/Toast/index.js'
import styles from './AuthForm.module.css'

const BRAND_MONOGRAM = 'PR'

export default function AuthForm({ mode, onToggleMode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const isSignIn = mode === 'signIn'
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      if (isSignIn) {
        const result = await login({ email, password })
        if (result.success) {
          navigate('/', { replace: true })
          return
        }
        toast.show(result.message || 'Login failed', 'error')
      } else {
        const result = await register({ email, password, name })
        if (result.success) {
          navigate('/', { replace: true })
          return
        }
        toast.show(result.message || 'Sign up failed', 'error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.brandBlock}>
        <span className={styles.monogram}>{BRAND_MONOGRAM}</span>
        <h1 className={styles.heading}>PhotoRev</h1>
      </div>
      <div className={styles.modeTabs} role="tablist" aria-label="Account mode">
        <button
          type="button"
          role="tab"
          aria-selected={isSignIn}
          className={`${styles.modeTab} ${isSignIn ? styles.modeTabActive : ''}`}
          onClick={() => !isSignIn && onToggleMode()}
          disabled={isSubmitting}
        >
          Login
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isSignIn}
          className={`${styles.modeTab} ${!isSignIn ? styles.modeTabActive : ''}`}
          onClick={() => isSignIn && onToggleMode()}
          disabled={isSubmitting}
        >
          Register
        </button>
      </div>
      <div key={mode} className={styles.formBody}>
        <div className={styles.fieldsShell}>
          {!isSignIn && (
            <div className={styles.fieldGroup}>
              <label htmlFor="auth-name" className={styles.label}>Full name</label>
              <input
                id="auth-name"
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                autoComplete="name"
                required={!isSignIn}
                disabled={isSubmitting}
              />
            </div>
          )}
          <div className={styles.fieldGroup}>
            <label htmlFor="auth-email" className={styles.label}>Email address</label>
            <input
              id="auth-email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="enter@email.com"
              autoComplete="email"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="auth-password" className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignIn ? 'current-password' : 'new-password'}
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className={styles.spinner} aria-hidden />
            ) : (
              isSignIn ? 'Login' : 'Create account'
            )}
            {!isSubmitting && <span className={styles.arrow} aria-hidden>→</span>}
          </button>
        </div>
      </div>
    </form>
  )
}

AuthForm.propTypes = {
  mode: PropTypes.oneOf(['signIn', 'signUp']).isRequired,
  onToggleMode: PropTypes.func.isRequired,
}
