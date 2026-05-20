import PropTypes from 'prop-types'

const ICONS = {
  calendar: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  ),
  image: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10.5" r="1.5" />
      <path d="M21 17l-5.5-5.5a1.5 1.5 0 0 0-2.12 0L5 19" />
    </svg>
  ),
  camera: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 8h4l2-3h4l2 3h4v11H4V8z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  ),
  aperture: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  ),
  pin: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  ),
}

/**
 * @param {{ icon: string; primary: string; secondary?: string | null }} props
 */
export default function PhotoDetailSection({ icon, primary, secondary }) {
  const glyph = ICONS[icon] ?? ICONS.image
  return (
    <div className="flex gap-4 border-b border-white/[0.08] py-4 last:border-b-0">
      <div className="mt-0.5 shrink-0 text-white/45">{glyph}</div>
      <div className="min-w-0 flex-1">
        <p className="m-0 break-words font-base text-[0.9375rem] font-medium leading-snug text-white/95">
          {primary}
        </p>
        {secondary ? (
          <p className="m-0 mt-1 break-words font-base text-sm leading-snug text-white/50">{secondary}</p>
        ) : null}
      </div>
    </div>
  )
}

PhotoDetailSection.propTypes = {
  icon: PropTypes.oneOf(['calendar', 'image', 'camera', 'aperture', 'pin']).isRequired,
  primary: PropTypes.string.isRequired,
  secondary: PropTypes.string,
}
