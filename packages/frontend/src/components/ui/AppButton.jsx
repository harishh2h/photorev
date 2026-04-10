import PropTypes from 'prop-types'

const VARIANT_CLASSES = {
  primary: 'btn-primary text-primary-content',
  accent: 'btn-accent text-accent-content',
  ghost: 'btn-ghost border-0',
  outline: 'btn-outline border-[1.5px] border-base-300 text-base-content',
}

const SIZE_CLASSES = {
  md: 'min-h-11 px-8 text-sm font-semibold rounded-full',
  sm: 'min-h-9 px-4 text-sm font-medium rounded-full',
  icon: 'btn-circle min-h-11 min-w-11 p-0',
}

export default function AppButton({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  disabled = false,
  children,
  ...rest
}) {
  const v = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary
  const s = SIZE_CLASSES[size] || SIZE_CLASSES.md
  return (
    <button
      type={type}
      disabled={disabled}
      className={`btn ${v} ${s} transition-[background-color,transform,opacity] duration-150 ease-out active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:shadow-focus ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

AppButton.propTypes = {
  variant: PropTypes.oneOf(['primary', 'accent', 'ghost', 'outline']),
  size: PropTypes.oneOf(['md', 'sm', 'icon']),
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled: PropTypes.bool,
  children: PropTypes.node,
}
