import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/index.js'
import SetupForm from '@/features/auth/SetupForm.jsx'
import AuthMobileCollage from '@/features/auth/AuthMobileCollage.jsx'
import AuthDesktopCollage from '@/features/auth/AuthDesktopCollage.jsx'

const GRID_BG = {
  backgroundImage: `
    linear-gradient(rgba(122, 138, 130, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(122, 138, 130, 0.08) 1px, transparent 1px)
  `,
  backgroundSize: '40px 40px',
}

function SetupHeading({ compact = false }) {
  return (
    <div className="flex flex-col gap-1 text-center">
      <h1 className={`m-0 font-base font-bold text-accent ${compact ? 'text-[2rem]' : 'text-3xl'}`}>
        PhotoRev
      </h1>
      <p className="m-0 font-base text-sm text-muted">Create your admin account to get started.</p>
    </div>
  )
}

export default function SetupPage() {
  const { isAuthenticated, isLoading, isInitialized } = useAuth()

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base-100 px-4"
        role="status"
        aria-busy="true"
        aria-label="Loading"
      >
        <span className="loading loading-spinner loading-lg text-accent" />
        <span className="font-base text-sm text-muted">Loading…</span>
      </div>
    )
  }

  // Already authenticated → go to dashboard
  if (isAuthenticated) return <Navigate to="/" replace />
  // Already initialized → setup complete, go to login
  if (isInitialized) return <Navigate to="/login" replace />

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-bg">
      {/* Mobile */}
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
        <div className="pointer-events-none absolute inset-0" style={GRID_BG} aria-hidden />
        <AuthMobileCollage />
        <div className="relative z-[2] w-full max-w-[22rem] -translate-y-3">
          <div className="rounded-card border-[1.5px] border-accent/40 bg-base-100 px-5 py-6 shadow-card">
            <SetupHeading compact />
            <div className="mt-6">
              <SetupForm compact centered />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="relative z-[2] hidden min-h-[100dvh] flex-col items-center justify-center px-4 py-10 md:flex">
        <div className="pointer-events-none absolute inset-0" style={GRID_BG} aria-hidden />
        <AuthDesktopCollage />
        <div className="relative w-full max-w-md">
          <div className="rounded-card border-[1.5px] border-accent/40 bg-base-100 p-8 shadow-card">
            <SetupHeading />
            <div className="mt-6">
              <SetupForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
