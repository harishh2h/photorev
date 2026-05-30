import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { AppButton, AppInput } from '@/components/ui/index.js'
import { useAuth } from './AuthContext.jsx'

export default function SetupForm({ compact = false, centered = false }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const { setupAdmin } = useAuth()
  const navigate = useNavigate()

  const formGap = compact ? 'gap-5' : 'gap-5 max-[420px]:gap-4'
  const fieldGap = compact ? 'gap-4' : 'gap-4'
  const labelClass = 'font-base text-sm font-semibold text-muted max-[420px]:text-xs'
  const fieldWrapClass = 'flex w-full flex-col gap-2'
  const fieldsWrapClass = centered ? 'w-full max-w-[20rem]' : 'w-full'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setFormError('')
    setIsSubmitting(true)
    try {
      const result = await setupAdmin({ email, password, name })
      if (result.success) {
        navigate('/', { replace: true })
        return
      }
      setFormError(result.message || 'Setup failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className={`flex w-full flex-col ${formGap} ${centered ? 'items-center' : ''}`}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className={`${fieldsWrapClass} animate-fade-up motion-reduce:animate-none`}>
        <div className={`flex flex-col ${fieldGap}`}>
          <div className={fieldWrapClass}>
            <label htmlFor="setup-name" className={labelClass}>
              Full name
            </label>
            <AppInput
              id="setup-name"
              type="text"
              className="min-h-11"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor="setup-email" className={labelClass}>
              Email address
            </label>
            <AppInput
              id="setup-email"
              type="email"
              className="min-h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor="setup-password" className={labelClass}>
              Password
            </label>
            <div className="relative flex w-full items-center">
              <AppInput
                id="setup-password"
                type={showPassword ? 'text' : 'password'}
                className="min-h-11 w-full pr-12 max-[420px]:px-4 max-[420px]:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
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
            <p className="m-0 font-base text-xs text-muted">Use at least 8 characters.</p>
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
                Create admin account
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

SetupForm.propTypes = {
  compact: PropTypes.bool,
  centered: PropTypes.bool,
}
