import { AUTH_PHOTOS } from './authPhotos.js'
import AuthCollageTile from './AuthCollageTile.jsx'

/** Corner tiles — sized to fill margin space around the centered auth card. */
const MOBILE_LAYOUT = [
  { photo: AUTH_PHOTOS[0], className: 'top-[5%] left-0 h-[98px] w-[74px] -rotate-[7deg]', variant: 'liked' },
  { photo: AUTH_PHOTOS[1], className: 'top-[7%] right-0 h-[88px] w-[88px] rotate-[5deg]', variant: 'rejected' },
  { photo: AUTH_PHOTOS[3], className: 'bottom-[10%] left-0 h-[94px] w-[70px] -rotate-[6deg]', variant: 'plain' },
  { photo: AUTH_PHOTOS[5], className: 'bottom-[6%] right-0 h-[102px] w-[76px] rotate-[4deg]', variant: 'rejected' },
]

export default function AuthMobileCollage() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] md:hidden" aria-hidden>
      {MOBILE_LAYOUT.map(({ photo, className, variant }) => (
        <AuthCollageTile key={photo.id} url={photo.url} variant={variant} className={className} />
      ))}
    </div>
  )
}
