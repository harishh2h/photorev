import PropTypes from 'prop-types'
import {
  buildShareUrl,
  formatShareDownloadsStatus,
  formatShareExpiresLabel,
  formatShareMetadataStatus,
  formatSharePasswordStatus,
} from './shareLinkDisplay.js'

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

function LinkChainIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function ReplaceIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function StatColumn({ icon, label, value }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1 px-2 py-1 text-center">
      <span className="text-muted" aria-hidden>
        {icon}
      </span>
      <span className="font-base text-[0.6875rem] font-medium text-muted">{label}</span>
      <span className="font-base text-sm font-semibold text-base-content">{value}</span>
    </div>
  )
}

StatColumn.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

/**
 * @param {{
 *   link: object;
 *   copied: boolean;
 *   revoking: boolean;
 *   onCopy: () => void;
 *   onReplace: () => void;
 *   onRevoke: () => void;
 * }} props
 */
export default function ShareLinkActiveView({ link, copied, revoking, onCopy, onReplace, onRevoke }) {
  const url = buildShareUrl(link.token)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-mid bg-panel text-accent"
            aria-hidden
          >
            <LinkChainIcon size={22} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="m-0 font-base text-sm font-semibold text-base-content">Share link is active</p>
              <span className="inline-flex rounded-full bg-panel px-2 py-0.5 font-base text-xs font-semibold text-accent">
                Active
              </span>
            </div>
            <p className="m-0 mt-0.5 font-base text-xs text-muted">
              Anyone with the link can view liked photos only.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-4">
          <button
            type="button"
            onClick={onReplace}
            disabled={revoking}
            className="flex min-h-11 min-w-[4.5rem] flex-col items-center gap-1 font-base text-xs font-medium text-muted transition-[color,transform] duration-150 ease-out hover:text-base-content active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-45"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-base-300 bg-base-100 text-base-content">
              <ReplaceIcon />
            </span>
            Replace link
          </button>
          <button
            type="button"
            onClick={onRevoke}
            disabled={revoking}
            className="flex min-h-11 min-w-[4.5rem] flex-col items-center gap-1 font-base text-xs font-medium text-error transition-[color,transform] duration-150 ease-out hover:text-error active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-45"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-error/25 bg-[#FEF2F2] text-error">
              <TrashIcon />
            </span>
            {revoking ? 'Revoking…' : 'Revoke link'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md border-[1.5px] border-base-300 bg-base-100 px-3 py-2.5">
        <span className="shrink-0 text-muted" aria-hidden>
          <LinkChainIcon size={16} />
        </span>
        <p className="m-0 min-w-0 flex-1 truncate font-mono text-xs text-base-content sm:text-sm">{url}</p>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 font-base text-sm font-semibold text-accent transition-[opacity,transform] duration-150 ease-out hover:text-accent-hover active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus"
        >
          <CopyIcon />
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>

      <div className="flex min-w-0 divide-x-[1.5px] divide-base-300 overflow-x-auto rounded-md border-[1.5px] border-base-300 bg-base-100 py-3">
        <StatColumn
          icon={<LockIcon />}
          label="Password"
          value={formatSharePasswordStatus(link.hasPassword)}
        />
        <StatColumn
          icon={<DownloadIcon />}
          label="Downloads"
          value={formatShareDownloadsStatus(link.allowDownload)}
        />
        <StatColumn
          icon={<InfoIcon />}
          label="Metadata"
          value={formatShareMetadataStatus(link.showMetadata)}
        />
        <StatColumn
          icon={<CalendarIcon />}
          label="Expires"
          value={formatShareExpiresLabel(link.expiresAt)}
        />
        <StatColumn icon={<EyeIcon />} label="Link views" value={String(link.viewCount ?? 0)} />
      </div>
    </div>
  )
}

ShareLinkActiveView.propTypes = {
  link: PropTypes.shape({
    token: PropTypes.string.isRequired,
    hasPassword: PropTypes.bool.isRequired,
    allowDownload: PropTypes.bool.isRequired,
    showMetadata: PropTypes.bool.isRequired,
    expiresAt: PropTypes.string,
    viewCount: PropTypes.number.isRequired,
  }).isRequired,
  copied: PropTypes.bool.isRequired,
  revoking: PropTypes.bool.isRequired,
  onCopy: PropTypes.func.isRequired,
  onReplace: PropTypes.func.isRequired,
  onRevoke: PropTypes.func.isRequired,
}

export { ShareIcon }
