import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuth } from './AuthContext.jsx'
import { useToast } from '@/components/Toast/index.js'

const BRAND_MONOGRAM = 'PR'

const inputClass =
  'input input-bordered w-full min-h-11 rounded-full border-[1.5px] border-base-300 bg-[#fbfbfb] px-5 py-3 font-base text-base text-base-content transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-base-300 focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.2)] max-[420px]:px-4 max-[420px]:text-sm'

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

  const tabClass = (active) =>
    `border-b-2 bg-transparent px-0 pb-1 font-base text-base font-medium transition-[color,border-color] duration-150 ease-out focus-visible:rounded-md focus-visible:outline-none focus-visible:shadow-focus max-[420px]:text-lg ${
      active ? 'border-accent text-base-content' : 'cursor-pointer border-transparent text-muted'
    }`

  return (
    <form className="flex w-full flex-col gap-4 max-[420px]:gap-3" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent font-base text-base font-bold text-accent-content">
          {BRAND_MONOGRAM}
        </span>
        <h1 className="m-0 font-base text-3xl font-bold text-base-content max-[420px]:text-2xl">PhotoRev</h1>
      </div>
      <div className="mb-1 flex justify-center gap-4 max-[420px]:gap-3" role="tablist" aria-label="Account mode">
        <button
          type="button"
          role="tab"
          aria-selected={isSignIn}
          className={tabClass(isSignIn)}
          onClick={() => !isSignIn && onToggleMode()}
          disabled={isSubmitting}
        >
          Login
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isSignIn}
          className={tabClass(!isSignIn)}
          onClick={() => isSignIn && onToggleMode()}
          disabled={isSubmitting}
        >
          Register
        </button>
      </div>
      <div key={mode} className="animate-fade-up motion-reduce:animate-none">
        <div className="flex min-h-[200px] flex-col gap-4 max-[420px]:min-h-[176px]">
          {!isSignIn && (
            <div className="flex flex-col gap-2">
              <label htmlFor="auth-name" className="font-base text-sm font-medium text-muted max-[420px]:text-xs">
                Full name
              </label>
              <input
                id="auth-name"
                type="text"
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                autoComplete="name"
                required={!isSignIn}
                disabled={isSubmitting}
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label htmlFor="auth-email" className="font-base text-sm font-medium text-muted max-[420px]:text-xs">
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="enter@email.com"
              autoComplete="email"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="auth-password" className="font-base text-sm font-medium text-muted max-[420px]:text-xs">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className={`${inputClass} pr-12`}
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
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-4">
          <button
            type="submit"
            className="btn btn-primary inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-0 px-8 font-base text-base font-semibold text-primary-content transition-[background-color,transform] duration-150 ease-out hover:bg-[#222222] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-40 max-[420px]:w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-sm text-primary-content" aria-hidden />
            ) : (
              <>
                {isSignIn ? 'Login' : 'Create account'}
                <span aria-hidden>→</span>
              </>
            )}
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
