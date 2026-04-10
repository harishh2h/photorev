import PropTypes from 'prop-types'
import { forwardRef } from 'react'

const AppInput = forwardRef(function AppInput(
  { className = '', id, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      id={id}
      className={`input input-bordered w-full rounded-full border-[1.5px] border-base-300 bg-base-100 px-5 py-3 font-base text-base text-base-content transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-muted focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.2)] ${className}`}
      {...rest}
    />
  )
})

AppInput.propTypes = {
  className: PropTypes.string,
  id: PropTypes.string,
}

export default AppInput
