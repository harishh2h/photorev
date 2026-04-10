import PropTypes from 'prop-types'

const FILTER_ITEMS = [
  { id: 'all', label: 'All' },
  { id: 'liked', label: 'Liked' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'conflicts', label: 'Conflicts' },
]

/**
 * @param {{ projectTitle: string; filterCounts: Record<string, number>; activeFilter: string; onFilterChange: (id: string) => void }} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectViewToolbar({ projectTitle, filterCounts, activeFilter, onFilterChange }) {
  return (
    <div className="flex flex-col items-start gap-4 border-b-[1.5px] border-base-300 py-4 pb-6 md:flex-row md:items-center md:justify-between md:gap-6">
      <h1 className="m-0 max-w-full min-w-0 font-base text-2xl font-bold leading-tight text-base-content md:text-3xl lg:text-4xl">
        {projectTitle}
      </h1>
      <div
        className="flex w-full max-w-full items-center gap-1 overflow-x-auto scroll-smooth rounded-full border-[1.5px] border-base-300 bg-base-200/60 p-1 [scrollbar-width:none] md:ml-auto md:w-auto md:flex-initial md:flex-none [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Photo filters"
      >
        {FILTER_ITEMS.map((item) => {
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
  }).isRequired,
  activeFilter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
}
