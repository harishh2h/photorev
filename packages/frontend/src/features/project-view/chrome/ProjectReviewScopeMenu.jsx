import PropTypes from 'prop-types'
import { useDropdown } from '@/hooks/useDropdown.js'
import { REVIEW_SCOPE } from '@/utils/projectReviewFilters.js'

const SCOPE_OPTIONS = [
  { id: REVIEW_SCOPE.MINE, label: 'My Review' },
  { id: REVIEW_SCOPE.TEAM, label: 'Team Review' },
]

/**
 * @param {{
 *   reviewScope: string;
 *   onReviewScopeChange: (scope: string) => void;
 *   sidebarStats: object;
 * }} props
 */
export default function ProjectReviewScopeMenu({ reviewScope, onReviewScopeChange, sidebarStats }) {
  const menu = useDropdown()
  const activeLabel = reviewScope === REVIEW_SCOPE.TEAM ? 'Team Review' : 'My Review'
  const mineStats = sidebarStats.mine
  const teamStats = sidebarStats.team

  const handleSelect = (scope) => {
    onReviewScopeChange(scope)
    menu.close()
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        ref={menu.triggerRef}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-base-300 bg-base-100 px-4 font-base text-sm font-medium text-base-content transition-[border-color,background-color,box-shadow] duration-150 ease-out hover:border-accent-mid hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-focus"
        onClick={menu.toggle}
        aria-expanded={menu.isOpen}
        aria-haspopup="listbox"
        aria-label="Review scope"
      >
        <span className="flex text-accent" aria-hidden>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>
        <span>{activeLabel}</span>
        <span
          className={`flex text-muted transition-transform duration-150 ease-out ${menu.isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      {menu.isOpen ? (
        <div
          ref={menu.panelRef}
          className="dropdown-panel-in absolute left-0 top-[calc(100%+0.5rem)] z-dropdown min-w-[14rem] rounded-md border-[1.5px] border-base-300 bg-base-100 p-2 shadow-floating md:left-auto md:right-0"
          role="listbox"
          aria-label="Review scope options"
        >
          {SCOPE_OPTIONS.map((option) => {
            const isActive = reviewScope === option.id
            const stats = option.id === REVIEW_SCOPE.TEAM ? teamStats : mineStats
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`flex w-full flex-col gap-1 rounded-sm px-3 py-2.5 text-left font-base transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:shadow-focus ${
                  isActive ? 'bg-accent/10 text-base-content' : 'text-base-content hover:bg-base-200'
                }`}
                onClick={() => handleSelect(option.id)}
              >
                <span className="text-sm font-semibold">{option.label}</span>
                {option.id === REVIEW_SCOPE.MINE ? (
                  <span className="text-xs text-muted">
                    {stats.liked} liked · {stats.rejected} rejected · {stats.progressPercent}% done
                  </span>
                ) : (
                  <span className="text-xs text-muted">
                    {stats.liked} liked · {stats.rejected} rejected
                    {stats.pendingConflicts > 0 ? (
                      <span className="text-warning"> · {stats.pendingConflicts} need decision</span>
                    ) : null}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

ProjectReviewScopeMenu.propTypes = {
  reviewScope: PropTypes.oneOf([REVIEW_SCOPE.MINE, REVIEW_SCOPE.TEAM]).isRequired,
  onReviewScopeChange: PropTypes.func.isRequired,
  sidebarStats: PropTypes.shape({
    mine: PropTypes.shape({
      liked: PropTypes.number.isRequired,
      rejected: PropTypes.number.isRequired,
      progressPercent: PropTypes.number.isRequired,
    }).isRequired,
    team: PropTypes.shape({
      liked: PropTypes.number.isRequired,
      rejected: PropTypes.number.isRequired,
      pendingConflicts: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
}
