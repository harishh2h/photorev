import PropTypes from 'prop-types'

/**
 * @param {{ label: string; onOpen: () => void; stackAboveUpload?: boolean }} props
 */
export default function ProjectExportResumeChip({ label, onOpen, stackAboveUpload = false }) {
  return (
    <button
      type="button"
      className={`fixed left-4 z-[211] flex min-h-11 max-w-[min(calc(100vw-2rem),16rem)] items-center gap-2 rounded-full border-[1.5px] border-accent/40 bg-base-100 px-4 py-2 font-base text-sm font-semibold text-accent shadow-floating transition-[transform,background-color] duration-150 ease-out hover:bg-accent/10 active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus ${
        stackAboveUpload ? 'bottom-28' : 'bottom-4'
      }`}
      onClick={onOpen}
      aria-label="Open download progress"
    >
      <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  )
}

ProjectExportResumeChip.propTypes = {
  label: PropTypes.string.isRequired,
  onOpen: PropTypes.func.isRequired,
  stackAboveUpload: PropTypes.bool,
}
