import { useState } from 'react'
import AuthForm from './AuthForm.jsx'
import AuthMobileCollage from './AuthMobileCollage.jsx'
import AuthDesktopCollage from './AuthDesktopCollage.jsx'
import AuthFloatingStatCard from './AuthFloatingStatCard.jsx'

const GRID_BG = {
  backgroundImage: `
    linear-gradient(rgba(122, 138, 130, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(122, 138, 130, 0.08) 1px, transparent 1px)
  `,
  backgroundSize: '40px 40px',
}

export default function LoginPage() {
  const [mode, setMode] = useState('signIn')
  const handleToggleMode = () => setMode((prev) => (prev === 'signIn' ? 'signUp' : 'signIn'))

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-bg" data-mode={mode}>
      {/* Mobile: grid + corner collages + white auth card */}
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
        <div className="pointer-events-none absolute inset-0" style={GRID_BG} aria-hidden />
        <AuthMobileCollage />
        <div className="relative z-[2] w-full max-w-[22rem] -translate-y-3">
          <div className="rounded-card border-[1.5px] border-accent/40 bg-base-100 px-5 py-6 shadow-card">
            <h1 className="m-0 mb-6 text-center font-base text-[2rem] font-bold leading-tight text-accent">PhotoRev</h1>
            <AuthForm mode={mode} onToggleMode={handleToggleMode} showBranding={false} compact centered />
          </div>
        </div>
      </div>

      {/* Desktop: centered card over photo collage */}
      <div className="relative z-[2] hidden min-h-[100dvh] flex-col items-center justify-center px-4 py-10 md:flex">
        <div className="pointer-events-none absolute inset-0" style={GRID_BG} aria-hidden />
        <AuthDesktopCollage />
        <div className="relative w-full max-w-md">
          <AuthFloatingStatCard />
          <div className="rounded-card border-[1.5px] border-accent/40 bg-base-100 p-8 shadow-card">
            <AuthForm mode={mode} onToggleMode={handleToggleMode} />
          </div>
        </div>
      </div>
    </div>
  )
}
