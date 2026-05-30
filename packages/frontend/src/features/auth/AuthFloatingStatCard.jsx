import AuthStatChip from './AuthStatChip.jsx'

export default function AuthFloatingStatCard() {
  return (
    <AuthStatChip className="pointer-events-none absolute -right-2 -top-5 z-10 hidden w-[148px] -rotate-1 animate-fade-up motion-reduce:animate-none lg:block" />
  )
}
