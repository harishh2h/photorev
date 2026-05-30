import PropTypes from 'prop-types'
import AppButton from '@/components/ui/AppButton'
import { IconFolder } from './DashboardEmptyIcons.jsx'

export default function ProjectsListEmpty({ onNewProjectClick }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border-[1.5px] border-dashed border-base-300 bg-base-100 px-6 py-14 text-center">
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-floating bg-panel"
        aria-hidden
      >
        <IconFolder className="h-6 w-6 text-accent" />
      </div>
      <h3 className="m-0 mb-2 font-base text-lg font-bold text-base-content sm:text-xl">No projects to show</h3>
      <p className="m-0 mb-6 max-w-sm font-base text-sm text-muted">
        Create a new project to keep your photos organized.
      </p>
      <AppButton type="button" variant="outline" className="w-full sm:w-auto" onClick={onNewProjectClick}>
        + New Project
      </AppButton>
    </div>
  )
}

ProjectsListEmpty.propTypes = {
  onNewProjectClick: PropTypes.func.isRequired,
}
