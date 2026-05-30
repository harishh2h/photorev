const REVIEW_PERCENT = 68
const RING_SIZE = 40
const STROKE = 3

function ProgressRing({ value, size = RING_SIZE, stroke = STROKE }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <svg width={size} height={size} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-accent-mid/60" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className="stroke-accent"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: 'stroke-dashoffset 700ms cubic-bezier(0, 0, 0.2, 1)',
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%',
        }}
      />
    </svg>
  )
}

export default function AuthStatChip({ className = '' }) {
  return (
    <div
      className={`rounded-floating border-[1.5px] border-accent/40 bg-base-100 px-3.5 py-2.5 shadow-floating ${className}`}
      aria-hidden
    >
      <div className="flex items-center gap-2.5">
        <ProgressRing value={REVIEW_PERCENT} size={36} />
        <div className="min-w-0">
          <p className="m-0 font-base text-base font-bold tabular-nums text-accent">{REVIEW_PERCENT}%</p>
          <p className="m-0 font-base text-[0.625rem] font-medium uppercase tracking-[0.06em] text-muted">Reviewed</p>
        </div>
      </div>
    </div>
  )
}
