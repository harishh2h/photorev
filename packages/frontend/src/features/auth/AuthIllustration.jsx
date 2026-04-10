import illustrationSvg from '@/assets/undraw_photo-session_flr1.svg'

const TAGLINE = 'Make your photo review easier and organized with PhotoRev.'

export default function AuthIllustration() {
  return (
    <div className="flex w-full animate-fade-up flex-col items-center gap-6 motion-reduce:animate-none" aria-hidden>
      <img src={illustrationSvg} alt="" className="mx-auto block h-auto w-full max-w-[420px]" />
      <p className="m-0 max-w-[320px] text-center font-base text-base font-medium leading-relaxed text-base-content">
        {TAGLINE}
      </p>
    </div>
  )
}
