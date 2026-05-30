import PropTypes from 'prop-types'

export default function DashboardEmptyFeature({ icon, title, description }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center sm:items-start sm:text-left">
      <div className="mb-0.5">{icon}</div>
      <p className="m-0 font-base text-sm font-semibold text-accent">{title}</p>
      <p className="m-0 font-base text-xs text-muted">{description}</p>
    </div>
  )
}

DashboardEmptyFeature.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
}
