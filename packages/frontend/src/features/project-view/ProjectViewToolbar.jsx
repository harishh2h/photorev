import PropTypes from 'prop-types'

const BASE_FILTER_ITEMS = [
  { id: 'all', label: 'All' },
  { id: 'liked', label: 'Liked' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'conflicts', label: 'Conflicts' },
]

/**
 * @param {{ projectTitle: string; filterCounts: Record<string, number>; activeFilter: string; onFilterChange: (id: string) => void; isFinalized?: boolean }} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectViewToolbar({
  projectTitle,
  filterCounts,
  activeFilter,
  onFilterChange,
  isFinalized = false,
}) {
  const filterItems = [...BASE_FILTER_ITEMS]
  const trashedCount = filterCounts.trashed ?? 0
  if (trashedCount > 0) {
    filterItems.push({ id: 'trashed', label: 'Trash' })
  }
  return (
    <div className="flex flex-col items-start gap-4 border-b-[1.5px] border-base-300 py-4 pb-6 md:flex-row md:items-center md:justify-between md:gap-6">
      <div className="flex min-w-0 max-w-full flex-1 flex-col gap-1">
        <h1 className="m-0 max-w-full min-w-0 font-base text-2xl font-bold leading-tight text-base-content md:text-3xl lg:text-4xl">
          {projectTitle}
        </h1>
        {isFinalized ? (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 font-base text-xs font-semibold uppercase tracking-[0.06em] text-accent">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            Finalized
          </span>
        ) : null}
      </div>
      <div
        className="flex w-full max-w-full items-center gap-1 overflow-x-auto scroll-smooth rounded-full border-[1.5px] border-base-300 bg-base-200/60 p-1 [scrollbar-width:none] md:ml-auto md:w-auto md:flex-initial md:flex-none [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Photo filters"
      >
        {filterItems.map((item) => {
          const count = filterCounts[item.id] ?? 0
          const isActive = activeFilter === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] px-4 font-base text-sm font-medium transition-[background-color,color,border-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:shadow-focus ${
                isActive
                  ? 'border-base-300 bg-base-100 text-base-content shadow-card'
                  : 'cursor-pointer border-transparent bg-transparent text-muted hover:text-base-content'
              }`}
              onClick={() => onFilterChange(item.id)}
            >
              <span>{item.label}</span>
              <span className="font-semibold text-accent">{count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

ProjectViewToolbar.propTypes = {
  projectTitle: PropTypes.string.isRequired,
  filterCounts: PropTypes.shape({
    all: PropTypes.number.isRequired,
    liked: PropTypes.number.isRequired,
    rejected: PropTypes.number.isRequired,
    conflicts: PropTypes.number.isRequired,
    trashed: PropTypes.number,
  }).isRequired,
  activeFilter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  isFinalized: PropTypes.bool,
}
