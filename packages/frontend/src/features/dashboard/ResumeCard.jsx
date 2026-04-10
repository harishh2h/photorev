import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

export default function ResumeCard({
  projectName,
  albumName,
  coverImageUrl,
  selectedCount,
  totalCount,
  lastActiveAt,
  animationDelay = 0,
}) {
  const progressPercent = totalCount > 0 ? (selectedCount / totalCount) * 100 : 0
  const [fillPercent, setFillPercent] = useState(0)

  useEffect(() => {
    if (progressPercent <= 0) {
      setFillPercent(0)
      return
    }
    const timeoutId = window.setTimeout(() => {
      setFillPercent(progressPercent)
    }, 50)
    return () => window.clearTimeout(timeoutId)
  }, [progressPercent])
  return (
    <article
      className="w-[280px] shrink-0 animate-fade-up overflow-hidden rounded-card border-[1.5px] border-base-300 bg-base-100 shadow-card transition-[transform,box-shadow] duration-[380ms] ease-out motion-reduce:animate-none hover:-translate-y-1 hover:shadow-card-hover group"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="relative w-full overflow-hidden pb-[65%] transition-transform duration-[380ms] ease-out group-hover:scale-[1.04]">
        {coverImageUrl ? (
          <img src={coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="illustration-placeholder absolute inset-0" aria-hidden />
        )}
      </div>
      <div className="p-6">
        <h3 className="m-0 mb-1 font-base text-base font-semibold text-base-content">{projectName}</h3>
        <p className="m-0 mb-4 font-base text-sm text-muted">{albumName || 'All photos'}</p>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-base-300">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-[700ms] ease-out"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <p className="m-0 mb-4 font-base text-xs text-muted">{lastActiveAt}</p>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 font-base text-sm font-medium text-accent transition-[color] duration-150 ease-out focus-visible:rounded-full focus-visible:outline-none focus-visible:shadow-focus group-hover:text-[#059669]"
        >
          Resume{' '}
          <span className="inline-block transition-transform duration-150 ease-out group-hover:translate-x-1">→</span>
        </button>
      </div>
    </article>
  )
}

ResumeCard.propTypes = {
  projectName: PropTypes.string.isRequired,
  albumName: PropTypes.string,
  coverImageUrl: PropTypes.string,
  selectedCount: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  lastActiveAt: PropTypes.string.isRequired,
  animationDelay: PropTypes.number,
}
