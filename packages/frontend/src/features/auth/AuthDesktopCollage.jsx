import { AUTH_PHOTOS } from './authPhotos.js'
import AuthCollageTile from './AuthCollageTile.jsx'

const DESKTOP_LAYOUT = [
  { photo: AUTH_PHOTOS[0], className: 'top-[clamp(24px,4vw,48px)] left-[clamp(-8px,1vw,20px)] aspect-[3/4] w-[clamp(120px,18vw,180px)] -rotate-[4deg]', variant: 'liked' },
  { photo: AUTH_PHOTOS[1], className: 'top-[clamp(88px,13vw,148px)] left-[clamp(120px,18vw,238px)] aspect-square w-[clamp(108px,15vw,154px)] rotate-[3deg]', variant: 'liked' },
  { photo: AUTH_PHOTOS[2], className: 'top-[clamp(48px,6vw,72px)] right-[clamp(16px,4vw,76px)] aspect-square w-[clamp(130px,19vw,210px)] rotate-[1deg]', variant: 'plain' },
  { photo: AUTH_PHOTOS[3], className: 'bottom-[clamp(48px,6vw,82px)] left-[clamp(12px,4vw,72px)] aspect-[3/4] w-[clamp(120px,17vw,180px)] -rotate-[7deg]', variant: 'rejected' },
  { photo: AUTH_PHOTOS[4], className: 'bottom-[clamp(142px,18vw,218px)] right-[clamp(18px,4vw,84px)] aspect-[3/4] w-[clamp(132px,19vw,198px)] rotate-[1.5deg]', variant: 'plain' },
  { photo: AUTH_PHOTOS[5], className: 'bottom-[clamp(38px,5vw,78px)] right-[clamp(2px,2vw,42px)] aspect-[3/4] w-[clamp(128px,19vw,206px)] -rotate-[2deg]', variant: 'rejected' },
]

export default function AuthDesktopCollage() {
  return (
    <div className="pointer-events-none absolute inset-0 max-md:hidden" aria-hidden>
      {DESKTOP_LAYOUT.map(({ photo, className, variant }) => (
        <AuthCollageTile key={photo.id} url={photo.url} variant={variant} className={`${className} max-lg:opacity-90`} />
      ))}
    </div>
  )
}
