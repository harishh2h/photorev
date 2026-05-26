import { useState } from 'react'
import PropTypes from 'prop-types'

const voteBtnBase =
  'flex h-12 min-h-[48px] w-12 min-w-[48px] items-center justify-center rounded-pill border-[1.5px] transition-[color,background-color,border-color,transform] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.96]'

/**
 * Like, reject, and rename controls for the photo viewer.
 */
export default function PhotoViewerReviewControls({
  isLiked,
  isRejected,
  renameDraft,
  onRenameChange,
  onRenameSubmit,
  onLike,
  onReject,
  canReviewPhotos,
  layout = 'desktop',
  onRenameFocusChange,
}) {
  const [renameExpanded, setRenameExpanded] = useState(false)
  const showRenameBtn = renameDraft.trim().length > 0 && canReviewPhotos
  const isMobile = layout === 'mobile'

  if (!canReviewPhotos) {
    return (
      <p className="mx-auto mb-1 max-w-lg rounded-full border-[1.5px] border-accent/45 bg-accent/15 px-5 py-3 text-center font-base text-sm font-medium leading-snug text-accent">
        View-only — favorites and rename are disabled for your role on this project.
      </p>
    )
  }

  const handleRenameFocus = (focused) => {
    onRenameFocusChange?.(focused)
    if (!focused && renameDraft.trim().length === 0) {
      setRenameExpanded(false)
    }
  }

  return (
    <div className={`flex w-full flex-col ${isMobile ? 'gap-3' : 'items-end justify-between gap-2'}`}>
      <div className={`flex w-full items-center ${isMobile ? 'justify-center gap-4' : 'justify-between gap-2'}`}>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onLike}
            className={`${voteBtnBase} ${
              isLiked
                ? 'border-accent bg-accent/25 text-accent'
                : 'border-white/15 bg-white/[0.06] text-white/45 hover:border-accent/50 hover:text-accent'
            }`}
            aria-label="Favorite — keyboard: up arrow"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onReject}
            className={`${voteBtnBase} ${
              isRejected
                ? 'border-error/80 bg-error/20 text-error'
                : 'border-white/15 bg-white/[0.06] text-white/45 hover:border-error/50 hover:text-error'
            }`}
            aria-label="Reject — keyboard: down arrow"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {!isMobile ? (
          <div className="flex min-w-0 max-w-lg flex-1 flex-wrap items-center justify-center gap-2 px-1">
            <RenameField
              renameDraft={renameDraft}
              onRenameChange={onRenameChange}
              onRenameSubmit={onRenameSubmit}
              showRenameBtn={showRenameBtn}
              onRenameFocusChange={onRenameFocusChange}
            />
          </div>
        ) : null}

        {!isMobile ? <div className="w-28 shrink-0 max-[639px]:w-14" aria-hidden /> : null}
      </div>

      {isMobile ? (
        <div className="flex w-full flex-col items-stretch gap-2">
          {!renameExpanded ? (
            <button
              type="button"
              onClick={() => setRenameExpanded(true)}
              className="rounded-pill border-[1.5px] border-white/12 bg-white/[0.06] px-4 py-2.5 font-base text-sm text-white/45 transition-[color,background-color,border-color] duration-150 hover:border-accent/40 hover:text-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {renameDraft.trim().length > 0 ? renameDraft : 'Rename…'}
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <RenameField
                renameDraft={renameDraft}
                onRenameChange={onRenameChange}
                onRenameSubmit={onRenameSubmit}
                showRenameBtn={showRenameBtn}
                onRenameFocusChange={handleRenameFocus}
                autoFocus
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function RenameField({
  renameDraft,
  onRenameChange,
  onRenameSubmit,
  showRenameBtn,
  onRenameFocusChange,
  autoFocus = false,
}) {
  return (
    <>
      <label className="sr-only" htmlFor="photo-viewer-rename">
        Rename suggestion
      </label>
      <input
        id="photo-viewer-rename"
        data-photo-viewer-input
        value={renameDraft}
        onChange={(e) => onRenameChange(e.target.value)}
        onFocus={() => onRenameFocusChange?.(true)}
        onBlur={() => onRenameFocusChange?.(false)}
        placeholder="Rename…"
        autoFocus={autoFocus}
        className="min-w-0 flex-1 rounded-pill border-[1.5px] border-white/12 bg-white/[0.06] px-4 py-2.5 font-base text-sm text-white/90 placeholder:text-white/25 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/35"
        autoComplete="off"
      />
      {showRenameBtn ? (
        <button
          type="button"
          onClick={onRenameSubmit}
          className="shrink-0 rounded-pill bg-action px-4 py-2.5 font-base text-sm font-semibold text-white transition-[background-color,transform,opacity] duration-150 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.97]"
        >
          Rename
        </button>
      ) : null}
    </>
  )
}

RenameField.propTypes = {
  renameDraft: PropTypes.string.isRequired,
  onRenameChange: PropTypes.func.isRequired,
  onRenameSubmit: PropTypes.func.isRequired,
  showRenameBtn: PropTypes.bool.isRequired,
  onRenameFocusChange: PropTypes.func,
  autoFocus: PropTypes.bool,
}

PhotoViewerReviewControls.propTypes = {
  isLiked: PropTypes.bool.isRequired,
  isRejected: PropTypes.bool.isRequired,
  renameDraft: PropTypes.string.isRequired,
  onRenameChange: PropTypes.func.isRequired,
  onRenameSubmit: PropTypes.func.isRequired,
  onLike: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  canReviewPhotos: PropTypes.bool.isRequired,
  layout: PropTypes.oneOf(['desktop', 'mobile']),
  onRenameFocusChange: PropTypes.func,
}
