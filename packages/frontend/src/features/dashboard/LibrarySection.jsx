import PropTypes from 'prop-types'
import { NavLink } from 'react-router-dom'
import LibraryCard from './LibraryCard'
import { formatShortDate } from '@/utils/formatDate.js'

const STAGGER_MS = 80

/**
 * @param {{ projects?: object[]; isLoading?: boolean; authToken?: string }} props
 */
export default function LibrarySection({ projects = [], isLoading = false, authToken = '' }) {
  return (
    <section className="mb-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="m-0 font-base text-2xl font-semibold text-base-content sm:text-3xl">Your projects</h2>
        <NavLink
          to="/projects"
          className="font-base text-base font-medium text-accent transition-colors duration-150 ease-out hover:text-[#059669] focus-visible:rounded-full focus-visible:outline-none focus-visible:shadow-focus"
        >
          View all
        </NavLink>
      </div>
      {isLoading && projects.length === 0 ? (
        <p className="mb-4 font-base text-sm text-muted">Loading…</p>
      ) : null}
      {!isLoading && projects.length === 0 ? (
        <p className="mb-6 font-base text-sm text-muted">No projects yet. Use “New Project” above to create one.</p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {projects.map((project, index) => (
          <NavLink
            key={project.id}
            to={`/projects/${project.id}`}
            className="block rounded-card text-inherit no-underline focus-visible:outline-none focus-visible:shadow-focus"
          >
            <LibraryCard
              name={project.name}
              status={String(project.status || 'active').toUpperCase()}
              subtitle={
                project.createdAt ? `Created ${formatShortDate(project.createdAt)}` : 'Project'
              }
              coverPhotoId={
                typeof project.metadata?.bannerPhotoId === 'string' ? project.metadata.bannerPhotoId : ''
              }
              authToken={authToken}
              coverImageUrl={typeof project.metadata?.banner === 'string' ? project.metadata.banner : ''}
              animationDelay={index * STAGGER_MS}
            />
          </NavLink>
        ))}
      </div>
    </section>
  )
}

LibrarySection.propTypes = {
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      status: PropTypes.string,
      createdAt: PropTypes.string,
      metadata: PropTypes.shape({
        banner: PropTypes.string,
        bannerPhotoId: PropTypes.string,
      }),
    })
  ),
  isLoading: PropTypes.bool,
  authToken: PropTypes.string,
}
