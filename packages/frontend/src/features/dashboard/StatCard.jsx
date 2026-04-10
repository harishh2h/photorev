import PropTypes from 'prop-types'
import { useCountUp } from './useCountUp'

export default function StatCard({ label, value, animationDelay = 0 }) {
  const displayValue = useCountUp(value, 700)
  return (
    <div
      className="animate-fade-up rounded-floating border-[1.5px] border-base-300 bg-base-100 p-4 shadow-card motion-reduce:animate-none"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <p className="m-0 font-base text-4xl font-bold text-base-content">{displayValue}</p>
      <p className="mt-1 font-base text-xs uppercase tracking-[0.06em] text-muted">{label}</p>
    </div>
  )
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  animationDelay: PropTypes.number,
}
