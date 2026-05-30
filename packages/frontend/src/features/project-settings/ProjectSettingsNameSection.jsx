import PropTypes from 'prop-types'
import { PencilIcon, SaveIcon } from './projectSettingsIcons.jsx'

/**
 * @param {{
 *   nameDraft: string;
 *   saveBusy: boolean;
 *   saveError: string;
 *   canSave: boolean;
 *   onNameChange: (value: string) => void;
 *   onSave: () => void;
 * }} props
 */
export default function ProjectSettingsNameSection({
  nameDraft,
  saveBusy,
  saveError,
  canSave,
  onNameChange,
  onSave,
}) {
  return (
    <section className="rounded-card border-[1.5px] border-base-300 bg-base-100 p-4 sm:p-5">
      <div className="flex gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-panel text-accent"
          aria-hidden
        >
          <PencilIcon />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 font-base text-base font-semibold text-base-content">Project name</h3>
        </div>
      </div>

      <label htmlFor="settings-project-name" className="sr-only">
        Project name
      </label>
      <input
        id="settings-project-name"
        type="text"
        value={nameDraft}
        disabled={saveBusy}
        onChange={(e) => onNameChange(e.target.value)}
        className="input input-bordered mt-4 w-full rounded-full border-[1.5px] border-base-300 bg-base-100 px-4 py-3 font-base text-sm text-base-content focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
      />

      {saveError ? (
        <p className="mt-2 mb-0 font-base text-sm text-error" role="alert">
          {saveError}
        </p>
      ) : null}

      <div className="mt-4 flex justify-start">
        <button
          type="button"
          disabled={saveBusy || !canSave}
          onClick={onSave}
          className="btn inline-flex min-h-11 w-full items-center justify-start gap-2 rounded-full border-0 bg-accent px-6 font-base text-sm font-semibold text-white transition-[transform,background-color,opacity] duration-150 ease-out hover:bg-accent-hover active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {saveBusy ? (
            <span className="loading loading-spinner loading-sm" aria-hidden />
          ) : (
            <SaveIcon />
          )}
          Save changes
        </button>
      </div>
    </section>
  )
}

ProjectSettingsNameSection.propTypes = {
  nameDraft: PropTypes.string.isRequired,
  saveBusy: PropTypes.bool.isRequired,
  saveError: PropTypes.string.isRequired,
  canSave: PropTypes.bool.isRequired,
  onNameChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
}
