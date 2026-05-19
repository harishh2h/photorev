import { useState } from 'react'
import PropTypes from 'prop-types'

/**
 * @param {{ onSubmit: (password: string) => Promise<void> }} props
 */
export default function PublicSharePasswordGate({ onSubmit }) {
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!password.trim()) {
      setError('Enter the password to view this share')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmit(password.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-5 rounded-card border-[1.5px] border-base-300 bg-base-100 px-6 py-8 shadow-card md:px-8"
      >
        <div className="flex flex-col gap-2 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="4" y="11" width="16" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <p className="m-0 font-base text-xs font-semibold uppercase tracking-[0.08em] text-accent">Private share</p>
          <h1 className="m-0 font-base text-2xl font-bold leading-tight text-base-content">Enter password</h1>
          <p className="m-0 font-base text-sm text-muted">
            The photographer protected this gallery. The password was sent to you separately.
          </p>
        </div>
        <label htmlFor="public-share-password" className="flex flex-col gap-2 font-base text-sm font-semibold text-muted">
          Password
          <input
            id="public-share-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="input input-bordered w-full min-h-11 rounded-full border-[1.5px] border-base-300 bg-base-100 px-5 py-3 font-base text-base text-base-content focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
            autoFocus
          />
        </label>
        {error ? (
          <p className="m-0 font-base text-sm font-medium text-error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary min-h-12 rounded-full border-0 font-base text-sm font-semibold text-primary-content transition-[background-color,transform,opacity] duration-150 ease-out hover:bg-[#222222] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-55"
        >
          {submitting ? 'Unlocking…' : 'Unlock gallery'}
        </button>
      </form>
    </div>
  )
}

PublicSharePasswordGate.propTypes = {
  onSubmit: PropTypes.func.isRequired,
}
