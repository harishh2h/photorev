import PropTypes from 'prop-types'
import AppButton from '@/components/ui/AppButton'
import DashboardEmptyHeroIllustration from './DashboardEmptyHeroIllustration.jsx'
import DashboardEmptyFeature from './DashboardEmptyFeature.jsx'
import { IconCheckCircle, IconCloudUpload, IconUsers } from './DashboardEmptyIcons.jsx'

export default function DashboardEmptyHero({ onNewProjectClick }) {
  return (
    <article className="grid grid-cols-1 items-center gap-6 overflow-hidden rounded-card border-[1.5px] border-base-300 bg-base-100 p-4 md:grid-cols-[minmax(0,48%)_1fr] md:gap-10 md:p-6">
      <DashboardEmptyHeroIllustration />
      <div className="flex min-w-0 flex-col gap-4">
        <span className="inline-flex w-fit items-center rounded-pill bg-panel px-3 py-1 font-base text-xs font-semibold text-accent">
          Welcome to PhotoRev!
        </span>
        <h2 className="m-0 font-base text-3xl font-bold text-base-content md:text-4xl">No projects yet</h2>
        <p className="m-0 font-base text-base text-muted">
          Create your first project to start uploading, reviewing and organizing your photos.
        </p>
        <AppButton
          type="button"
          variant="primary"
          className="w-full sm:w-fit"
          onClick={onNewProjectClick}
        >
          + New Project
        </AppButton>
        <div className="grid grid-cols-3 gap-3 border-t-[1.5px] border-base-300 pt-5 sm:gap-6">
          <DashboardEmptyFeature icon={<IconCloudUpload />} title="Upload" description="Add your photos" />
          <DashboardEmptyFeature icon={<IconCheckCircle />} title="Review" description="Like or reject" />
          <DashboardEmptyFeature icon={<IconUsers />} title="Share" description="Share with others" />
        </div>
      </div>
    </article>
  )
}

DashboardEmptyHero.propTypes = {
  onNewProjectClick: PropTypes.func.isRequired,
}
