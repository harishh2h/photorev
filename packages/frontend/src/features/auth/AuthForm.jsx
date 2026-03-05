import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuth } from './useAuth.js'
import { useToast } from '@/components/Toast/index.js'
import styles from './AuthForm.module.css'

const WELCOME_HEADING = 'Welcome back!'
const WELCOME_SUBTEXT =
  "Simplify your photo review workflow and get client feedback in one place. Get started for free."

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
      <div className={styles.welcomeBlock}>
        <h1 className={styles.heading}>{isSignIn ? WELCOME_HEADING : 'Create account'}</h1>
        <p className={styles.subtext}>
          {isSignIn ? WELCOME_SUBTEXT : 'Join PhotoRev to share sessions and collect client selections.'}
        </p>
      </div>
      {!isSignIn && (
        <div className={styles.fieldGroup}>
          <label htmlFor="auth-name" className={styles.label}>Name</label>
          <input
            id="auth-name"
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            required={!isSignIn}
            disabled={isSubmitting}
          />
        </div>
      )}
      <div className={styles.fieldGroup}>
        <label htmlFor="auth-email" className={styles.label}>Email</label>
        <input
          id="auth-email"
          type="email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className={styles.fieldGroup}>
        <div className={styles.labelRow}>
          <label htmlFor="auth-password" className={styles.label}>Password</label>
          {isSignIn && (
            <a href="#" className={styles.forgotLink} onClick={(e) => e.preventDefault()}>
              Forgot Password?
            </a>
          )}
        </div>
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
      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className={styles.spinner} aria-hidden />
          ) : (
            isSignIn ? 'Login' : 'Sign up'
          )}
        </button>
        {isSignIn && (
          <>
            <div className={styles.divider}>
              <span className={styles.dividerText}>or continue with</span>
            </div>
            <div className={styles.socialRow}>
              <button type="button" className={styles.socialBtn} aria-label="Google">
                <span className={styles.socialIcon} aria-hidden>G</span>
              </button>
              <button type="button" className={styles.socialBtn} aria-label="Apple">
                <svg className={styles.socialIconSvg} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              </button>
              <button type="button" className={styles.socialBtn} aria-label="Facebook">
                <span className={styles.socialIcon} aria-hidden>f</span>
              </button>
            </div>
          </>
        )}
        <div className={styles.toggleWrap}>
          <span className={styles.togglePrompt}>
            {isSignIn ? 'Not a member? ' : 'Already have an account? '}
          </span>
          <button
            type="button"
            className={styles.toggleLink}
            onClick={onToggleMode}
            disabled={isSubmitting}
          >
            {isSignIn ? 'Register now' : 'Sign in'}
            <span className={styles.arrow} aria-hidden>→</span>
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
