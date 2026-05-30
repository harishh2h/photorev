import PropTypes from 'prop-types'
import { TrashIcon } from './projectSettingsIcons.jsx'

/**
 * @param {{ disabled: boolean; onDelete: () => void }} props
 */
export default function ProjectSettingsDeleteSection({ disabled, onDelete }) {
  return (
    <section className="rounded-card border-[1.5px] border-base-300 bg-base-100 p-4 sm:p-5">
      <div className="flex gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-error/15 text-error"
          aria-hidden
        >
          <TrashIcon />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 font-base text-base font-semibold text-base-content">Delete project</h3>
            <span className="inline-flex rounded-full bg-error/15 px-2.5 py-0.5 font-base text-xs font-semibold text-error">
              Permanent
            </span>
          </div>
          <p className="mt-1 mb-0 font-base text-sm text-muted">
            Removes the project and all photos permanently.
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-start">
        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="btn btn-outline inline-flex min-h-11 w-full items-center justify-start gap-2 rounded-full border-[1.5px] border-error bg-transparent px-6 font-base text-sm font-semibold text-error transition-[border-color,background-color,transform] duration-150 ease-out hover:bg-error/10 active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          <TrashIcon />
          Delete project
        </button>
      </div>
    </section>
  )
}

ProjectSettingsDeleteSection.propTypes = {
  disabled: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
}
