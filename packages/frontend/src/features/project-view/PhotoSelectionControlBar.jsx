import PropTypes from 'prop-types'
import { ProjectDownloadDropdown } from '@/features/project-export/index.js'

const iconBtnClass =
  'inline-flex h-11 min-h-11 min-w-11 items-center justify-center rounded-full border-0 bg-transparent font-base text-base-content transition-[background-color,transform] duration-150 ease-out hover:bg-base-200 active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus'

const pillClass =
  'inline-flex min-h-11 items-center rounded-full border-[1.5px] border-base-300 bg-base-100 px-4 font-base text-sm font-medium text-base-content transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-surface-hover active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-40'

/**
 * Top selection chrome (Immich AssetSelectControlBar pattern).
 */
export default function PhotoSelectionControlBar({
  selectedCount,
  allVisibleSelected,
  exportBusy = false,
  canDeletePhotos = false,
  deleteBusy = false,
  onClear,
  onSelectAll,
  onSelectFullQuality,
  onSelectCompressed,
  onDeleteSelected,
  className = '',
}) {
  return (
    <div
      className={`flex min-h-14 items-center gap-2 py-3 md:gap-3 md:py-4 ${className}`}
      role="toolbar"
      aria-label="Photo selection actions"
    >
      <button
        type="button"
        className={iconBtnClass}
        aria-label="Clear selection"
        onClick={onClear}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>
      <p className="m-0 min-w-0 font-base text-sm font-semibold text-base-content md:text-base">
        <span className="text-accent">{selectedCount}</span>
        {` photo${selectedCount === 1 ? '' : 's'} selected`}
      </p>
      <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className={pillClass}
          onClick={allVisibleSelected ? onClear : onSelectAll}
        >
          {allVisibleSelected ? 'Clear all' : 'Select all'}
        </button>
        <ProjectDownloadDropdown
          disabled={exportBusy || deleteBusy}
          selectedCount={selectedCount}
          onSelectFullQuality={onSelectFullQuality}
          onSelectCompressed={onSelectCompressed}
        />
        {canDeletePhotos ? (
          <button
            type="button"
            className={`${pillClass} border-error/35 text-error hover:border-error hover:bg-error/10`}
            disabled={deleteBusy || exportBusy}
            onClick={onDeleteSelected}
          >
            Delete
          </button>
        ) : null}
      </div>
    </div>
  )
}

PhotoSelectionControlBar.propTypes = {
  selectedCount: PropTypes.number.isRequired,
  allVisibleSelected: PropTypes.bool.isRequired,
  exportBusy: PropTypes.bool,
  canDeletePhotos: PropTypes.bool,
  deleteBusy: PropTypes.bool,
  onClear: PropTypes.func.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  onSelectFullQuality: PropTypes.func.isRequired,
  onSelectCompressed: PropTypes.func.isRequired,
  onDeleteSelected: PropTypes.func,
  className: PropTypes.string,
}
