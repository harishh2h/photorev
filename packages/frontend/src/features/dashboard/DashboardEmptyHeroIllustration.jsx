import { AUTH_PHOTOS } from '@/features/auth/authPhotos.js'
import AuthCollageTile from '@/features/auth/AuthCollageTile.jsx'
import AuthStatChip from '@/features/auth/AuthStatChip.jsx'
import { useBreakpoint } from '@/hooks/useBreakpoint.js'

const GRID_BG = {
  backgroundImage: `
    linear-gradient(rgba(122, 138, 130, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(122, 138, 130, 0.07) 1px, transparent 1px)
  `,
  backgroundSize: '32px 32px',
}

const COLLAGE_LAYOUT = [
  {
    photo: AUTH_PHOTOS[2],
    variant: 'liked',
    className:
      'top-[9%] left-[7%] aspect-[3/4] w-[42%] -rotate-[5deg] md:top-[11%] md:left-[9%] md:w-[38%]',
  },
  {
    photo: AUTH_PHOTOS[4],
    variant: 'plain',
    className:
      'top-[7%] right-[6%] aspect-square w-[38%] rotate-[4deg] md:top-[9%] md:right-[8%] md:w-[34%]',
  },
  {
    photo: AUTH_PHOTOS[3],
    variant: 'rejected',
    className:
      'bottom-[9%] left-[18%] aspect-[3/4] w-[40%] -rotate-[3deg] md:bottom-[11%] md:left-[20%] md:w-[36%]',
  },
]

export default function DashboardEmptyHeroIllustration() {
  const { isMobile } = useBreakpoint()
  const imageScale = isMobile ? 0.94 : 0.86

  return (
    <div
      className="relative min-h-[220px] w-full overflow-hidden rounded-[calc(1.5rem-8px)] bg-panel sm:min-h-[250px] md:min-h-[280px]"
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0" style={GRID_BG} />
      <div className="absolute inset-5 sm:inset-6 md:inset-8 md:flex md:items-center md:justify-center">
        <div className="relative h-full min-h-[200px] w-full sm:min-h-[220px] md:min-h-[248px] md:max-w-[400px]">
          {COLLAGE_LAYOUT.map(({ photo, variant, className }) => (
            <AuthCollageTile
              key={photo.id}
              url={photo.url}
              variant={variant}
              className={className}
              imageScale={imageScale}
            />
          ))}
        </div>
      </div>
      <AuthStatChip
        value={0}
        label="Reviewed"
        className="absolute bottom-5 right-4 z-raised -rotate-1 sm:bottom-6 sm:right-5"
      />
    </div>
  )
}
