import PropTypes from 'prop-types'

export default function AppCard({ className = '', children, hoverable = false, ...rest }) {
  const hover =
    hoverable
      ? 'transition-[transform,box-shadow] duration-[380ms] ease-out hover:-translate-y-1 hover:shadow-card-hover'
      : ''
  return (
    <div
      className={`card border-[1.5px] border-base-300 bg-base-100 shadow-card rounded-card ${hover} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

AppCard.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  hoverable: PropTypes.bool,
}
