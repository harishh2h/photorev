import PropTypes from 'prop-types'
import AppModal from '@/components/ui/AppModal.jsx'
import { PHOTO_VIEWER_SHORTCUT_SECTIONS } from '@/features/photo-viewer/photoViewerShortcutDefs.js'

const kbdClass =
  'inline-flex min-h-[1.75rem] min-w-[1.75rem] items-center justify-center rounded-pill border-[1.5px] border-base-300 bg-base-100 px-2 font-mono text-xs font-medium text-base-content shadow-sm'

function ShortcutKey({ children }) {
  return <kbd className={kbdClass}>{children}</kbd>
}

ShortcutKey.propTypes = {
  children: PropTypes.node.isRequired,
}

/**
 * @param {{ keys: string[]; label: string; detail?: string }} entry
 */
function ShortcutRow({ entry }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="m-0 font-base text-sm font-medium text-base-content">{entry.label}</p>
        {entry.detail ? (
          <p className="m-0 mt-0.5 font-base text-xs text-muted">{entry.detail}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
        {entry.keys.map((key, index) => (
          <span key={`${entry.label}-${key}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? <span className="font-base text-xs text-muted">+</span> : null}
            <ShortcutKey>{key}</ShortcutKey>
          </span>
        ))}
      </div>
    </div>
  )
}

ShortcutRow.propTypes = {
  entry: PropTypes.shape({
    keys: PropTypes.arrayOf(PropTypes.string).isRequired,
    label: PropTypes.string.isRequired,
    detail: PropTypes.string,
  }).isRequired,
}

/**
 * Desktop keyboard shortcuts reference for photo review.
 */
export default function PhotoViewerShortcutsModal({ open, onClose }) {
  return (
    <AppModal
      open={open}
      title="Keyboard shortcuts"
      onClose={onClose}
      className="max-w-md w-[calc(100%-2rem)]"
    >
      <div>
        <p className="m-0 mb-4 font-base text-sm text-muted">
          Desktop photo viewer and project grid. Shortcuts pause while you type in a field.
        </p>

        <div className="mb-5 rounded-floating border-[1.5px] border-accent/30 bg-accent/10 px-4 py-3">
          <p className="m-0 font-base text-xs font-medium text-accent">
            Press <ShortcutKey>?</ShortcutKey> or <ShortcutKey>/</ShortcutKey> anytime to open or close this guide.
          </p>
        </div>

        <div className="max-h-[min(52vh,28rem)] overflow-y-auto pr-1">
          {PHOTO_VIEWER_SHORTCUT_SECTIONS.map((section, sectionIndex) => (
            <section
              key={section.id}
              className={sectionIndex > 0 ? 'mt-5 border-t-[1.5px] border-base-300 pt-5' : ''}
            >
              <h3 className="m-0 mb-1 font-base text-xs font-semibold uppercase tracking-wide text-accent">
                {section.title}
              </h3>
              <div className="divide-y divide-base-300/80">
                {section.entries.map((entry) => (
                  <ShortcutRow key={`${section.id}-${entry.label}`} entry={entry} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppModal>
  )
}

PhotoViewerShortcutsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}
