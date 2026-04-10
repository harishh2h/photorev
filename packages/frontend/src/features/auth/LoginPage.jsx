import { useState } from 'react'
import AuthForm from './AuthForm.jsx'

const cardBase =
  'absolute border-[1.5px] border-base-300 bg-base-100 shadow-floating [transform-origin:center] max-lg:opacity-[0.32] max-md:hidden'

export default function LoginPage() {
  const [mode, setMode] = useState('signUp')
  const handleToggleMode = () => setMode((prev) => (prev === 'signIn' ? 'signUp' : 'signIn'))

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-base-100" data-mode={mode}>
      <div
        className="pointer-events-none absolute inset-0 opacity-100 max-md:opacity-45"
        style={{
          backgroundImage: `
            linear-gradient(rgba(122, 138, 130, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(122, 138, 130, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 max-md:hidden" aria-hidden>
        <div
          className={`${cardBase} top-[clamp(24px,4vw,48px)] left-[clamp(-8px,1vw,20px)] aspect-[3/4] w-[clamp(120px,18vw,180px)] -rotate-[4deg] bg-cover bg-center`}
          style={{
            backgroundImage:
              'linear-gradient(to top, rgba(17,17,17,0.16), rgba(17,17,17,0)), url(https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80)',
          }}
        />
        <div
          className={`${cardBase} top-[clamp(88px,13vw,148px)] left-[clamp(120px,18vw,238px)] aspect-square w-[clamp(108px,15vw,154px)] rotate-[3deg] bg-cover bg-center`}
          style={{
            backgroundImage:
              'linear-gradient(to top, rgba(17,17,17,0.2), rgba(17,17,17,0)), url(https://images.unsplash.com/photo-1465804575741-338df8554e02?auto=format&fit=crop&w=600&q=80)',
          }}
        >
          <span className="absolute -right-2 -top-3 rounded-lg bg-[#f8ecac] px-2.5 py-1.5 font-base text-xs font-medium text-[#4f4b3c] shadow-card">
            Keep these -&gt;
          </span>
        </div>
        <div
          className={`${cardBase} top-[clamp(48px,6vw,72px)] right-[clamp(16px,4vw,76px)] aspect-square w-[clamp(130px,19vw,210px)] rotate-[1deg] bg-cover bg-center`}
          style={{
            backgroundImage:
              'linear-gradient(to top, rgba(17,17,17,0.12), rgba(17,17,17,0)), url(https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80)',
          }}
        />
        <div
          className={`${cardBase} bottom-[clamp(48px,6vw,82px)] left-[clamp(12px,4vw,72px)] aspect-[3/4] w-[clamp(120px,17vw,180px)] -rotate-[7deg] bg-cover bg-center`}
          style={{
            backgroundImage:
              'linear-gradient(to top, rgba(17,17,17,0.2), rgba(17,17,17,0)), url(https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80)',
          }}
        />
        <div
          className={`${cardBase} bottom-[clamp(142px,18vw,218px)] right-[clamp(18px,4vw,84px)] aspect-[3/4] w-[clamp(132px,19vw,198px)] rotate-[1.5deg] bg-cover bg-center`}
          style={{
            backgroundImage:
              'linear-gradient(to top, rgba(17,17,17,0.17), rgba(17,17,17,0)), url(https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=650&q=80)',
          }}
        />
        <div
          className={`${cardBase} bottom-[clamp(38px,5vw,78px)] right-[clamp(2px,2vw,42px)] aspect-[3/4] w-[clamp(128px,19vw,206px)] -rotate-[2deg] bg-cover bg-center`}
          style={{
            backgroundImage:
              'linear-gradient(to top, rgba(17,17,17,0.1), rgba(17,17,17,0)), url(https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=650&q=80)',
          }}
        />
      </div>
      <div className="relative z-[2] flex min-h-screen flex-col items-center justify-center gap-10 px-4 py-8 max-md:justify-start max-md:gap-6 max-md:pb-6 max-md:pt-8">
        <div className="w-full max-w-[380px] max-md:max-w-full">
          <AuthForm mode={mode} onToggleMode={handleToggleMode} />
        </div>
        <p className="m-0 max-w-md px-3 text-center font-base text-xs text-muted max-md:px-3">
          Trusted by photographers at Vogue, Nike, and Conde Nast.
        </p>
      </div>
    </div>
  )
}
