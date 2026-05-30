import PropTypes from 'prop-types'

function LikedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

function RejectedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export default function ProjectCardReviewStats({ liked = 0, rejected = 0 }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5">
      <span
        className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 font-base text-xs font-semibold tabular-nums text-primary-content backdrop-blur-sm"
        title={`${liked} liked`}
      >
        <span className="text-accent-mid">
          <LikedIcon />
        </span>
        {liked}
      </span>
      <span
        className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 font-base text-xs font-semibold tabular-nums text-primary-content backdrop-blur-sm"
        title={`${rejected} rejected`}
      >
        <span className="text-error">
          <RejectedIcon />
        </span>
        {rejected}
      </span>
    </div>
  )
}

ProjectCardReviewStats.propTypes = {
  liked: PropTypes.number.isRequired,
  rejected: PropTypes.number.isRequired,
}
