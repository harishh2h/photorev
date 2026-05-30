import PropTypes from 'prop-types'
import { AuthLikedBadge, AuthRejectedBadge } from './AuthReviewBadges.jsx'

/**
 * Decorative collage tile with optional liked / rejected review styling.
 */
export default function AuthCollageTile({ url, variant = 'plain', className = '' }) {
  const isRejected = variant === 'rejected'
  const isLiked = variant === 'liked'

  return (
    <div
      className={`pointer-events-none absolute overflow-hidden rounded-floating border-[1.5px] border-accent/40 bg-base-100 shadow-card [transform-origin:center] ${className}`}
      aria-hidden
    >
      <div
        className={`absolute inset-0 bg-cover bg-center ${
          isRejected ? 'opacity-70 grayscale' : 'opacity-100'
        }`}
        style={{
          backgroundImage: `linear-gradient(to top, rgba(17,17,17,0.2), rgba(17,17,17,0)), url(${url})`,
        }}
      />
      {isRejected ? <div className="absolute inset-0 bg-muted/30" aria-hidden /> : null}
      {isLiked ? <AuthLikedBadge /> : null}
      {isRejected ? <AuthRejectedBadge /> : null}
    </div>
  )
}

AuthCollageTile.propTypes = {
  url: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['plain', 'liked', 'rejected']),
  className: PropTypes.string,
}
