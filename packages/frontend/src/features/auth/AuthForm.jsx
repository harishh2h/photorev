import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { AppButton, AppInput } from '@/components/ui/index.js'
import { useAuth } from './AuthContext.jsx'

function AuthModeTabs({ isSignIn, onSelectSignIn, onSelectSignUp, disabled }) {
  const tabClass = (active) =>
    `flex-1 min-h-11 rounded-full border-0 px-4 font-base text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:shadow-focus max-[420px]:text-base ${
      active
        ? 'bg-accent text-primary-content shadow-card'
        : 'cursor-pointer bg-transparent text-muted hover:text-base-content'
    }`

  return (
    <div
      className="flex rounded-full border-[1.5px] border-base-300 bg-panel p-1"
      role="tablist"
      aria-label="Account mode"
    >
      <button
        type="button"
        role="tab"
        aria-selected={isSignIn}
        className={tabClass(isSignIn)}
        onClick={onSelectSignIn}
        disabled={disabled}
      >
        Login
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={!isSignIn}
        className={tabClass(!isSignIn)}
        onClick={onSelectSignUp}
        disabled={disabled}
      >
        Register
      </button>
    </div>
  )
}

AuthModeTabs.propTypes = {
  isSignIn: PropTypes.bool.isRequired,
  onSelectSignIn: PropTypes.func.isRequired,
  onSelectSignUp: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
}

export default function AuthForm({ mode, onToggleMode, showBranding = true, compact = false, centered = false }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const isSignIn = mode === 'signIn'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setFormError('')
    setIsSubmitting(true)
    try {
      if (isSignIn) {
        const result = await login({ email, password })
        if (result.success) {
          navigate('/', { replace: true })
          return
        }
        setFormError(result.message || 'Login failed')
      } else {
        const result = await register({ email, password, name })
        if (result.success) {
          navigate('/', { replace: true })
          return
        }
        setFormError(result.message || 'Sign up failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectSignIn = () => {
    if (!isSignIn) {
      setFormError('')
      onToggleMode()
    }
  }

  const handleSelectSignUp = () => {
    if (isSignIn) {
      setFormError('')
      onToggleMode()
    }
  }

  const formGap = compact ? 'gap-5' : 'gap-5 max-[420px]:gap-4'
  const fieldGap = compact ? 'gap-4' : 'gap-4'
  const fieldsMinHeight = compact ? '' : 'min-h-[176px] max-[420px]:min-h-[160px]'
  const labelClass = 'font-base text-sm font-semibold text-muted max-[420px]:text-xs'
  const fieldWrapClass = 'flex w-full flex-col gap-2'
  const fieldsWrapClass = centered ? 'w-full max-w-[20rem]' : 'w-full'

  return (
    <form className={`flex w-full flex-col ${formGap} ${centered ? 'items-center' : ''}`} onSubmit={handleSubmit} noValidate>
      {showBranding ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="m-0 font-base text-3xl font-bold text-accent max-[420px]:text-2xl">PhotoRev</h1>
        </div>
      ) : null}

      <div className={centered ? 'w-full max-w-[20rem]' : 'w-full'}>
        <AuthModeTabs
          isSignIn={isSignIn}
          onSelectSignIn={handleSelectSignIn}
          onSelectSignUp={handleSelectSignUp}
          disabled={isSubmitting}
        />
      </div>

      <div key={mode} className={`${fieldsWrapClass} ${compact ? '' : 'animate-fade-up motion-reduce:animate-none'}`}>
        <div className={`flex flex-col ${fieldGap} ${fieldsMinHeight}`}>
          {!isSignIn && (
            <div className={fieldWrapClass}>
              <label htmlFor="auth-name" className={labelClass}>
                Full name
              </label>
              <AppInput
                id="auth-name"
                type="text"
                className="min-h-11"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                autoComplete="name"
                required={!isSignIn}
                disabled={isSubmitting}
              />
            </div>
          )}
          <div className={fieldWrapClass}>
            <label htmlFor="auth-email" className={labelClass}>
              Email address
            </label>
            <AppInput
              id="auth-email"
              type="email"
              className="min-h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="enter@email.com"
              autoComplete="email"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor="auth-password" className={labelClass}>
              Password
            </label>
            <div className="relative flex w-full items-center">
              <AppInput
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="min-h-11 w-full pr-12 max-[420px]:px-4 max-[420px]:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignIn ? 'current-password' : 'new-password'}
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute right-3 flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-full border-0 bg-transparent text-muted transition-[color,background-color] duration-150 ease-out hover:bg-base-200 hover:text-base-content focus-visible:outline-none focus-visible:shadow-focus"
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
            {!isSignIn ? (
              <p className="m-0 font-base text-xs text-muted">Use at least 8 characters.</p>
            ) : null}
          </div>
        </div>

        {formError ? (
          <p className="mt-4 m-0 font-base text-sm font-medium text-error" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="mt-5">
          <AppButton type="submit" variant="primary" className="group w-full gap-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="loading loading-spinner loading-sm text-primary-content" aria-hidden />
            ) : (
              <>
                {isSignIn ? 'Login' : 'Create account'}
                <span className="inline-block transition-transform duration-150 ease-out group-hover:translate-x-1" aria-hidden>
                  →
                </span>
              </>
            )}
          </AppButton>
        </div>
      </div>
    </form>
  )
}

AuthForm.propTypes = {
  mode: PropTypes.oneOf(['signIn', 'signUp']).isRequired,
  onToggleMode: PropTypes.func.isRequired,
  showBranding: PropTypes.bool,
  compact: PropTypes.bool,
  centered: PropTypes.bool,
}
