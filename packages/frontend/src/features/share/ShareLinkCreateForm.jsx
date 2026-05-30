import { useState } from 'react'
import PropTypes from 'prop-types'

const DESCRIPTION_MAX = 100

const EXPIRY_CHOICES = [
  { id: '24h', label: '24 hours', hours: 24 },
  { id: '7d', label: '7 days', hours: 24 * 7 },
  { id: '30d', label: '30 days', hours: 24 * 30 },
  { id: 'never', label: 'Never', hours: null },
]

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

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M1 1l22 22M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

/**
 * @param {{
 *   description: string;
 *   password: string;
 *   expiryId: string;
 *   showMetadata: boolean;
 *   allowDownload: boolean;
 *   submitting: boolean;
 *   error: string;
 *   onDescriptionChange: (v: string) => void;
 *   onPasswordChange: (v: string) => void;
 *   onExpiryChange: (id: string) => void;
 *   onShowMetadataChange: (v: boolean) => void;
 *   onAllowDownloadChange: (v: boolean) => void;
 *   onCancel: () => void;
 *   onSubmit: () => void;
 * }} props
 */
export default function ShareLinkCreateForm({
  description,
  password,
  expiryId,
  showMetadata,
  allowDownload,
  submitting,
  error,
  onDescriptionChange,
  onPasswordChange,
  onExpiryChange,
  onShowMetadataChange,
  onAllowDownloadChange,
  onCancel,
  onSubmit,
}) {
  const [passwordVisible, setPasswordVisible] = useState(false)

  return (
    <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <label className="flex flex-col gap-1.5 font-base text-sm font-medium text-base-content">
          Description
          <div className="relative">
            <input
              type="text"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              maxLength={DESCRIPTION_MAX}
              placeholder="e.g. Summer campaign shortlist"
              className="input input-bordered w-full rounded-full border-[1.5px] border-base-300 bg-base-100 py-3 pl-4 pr-14 font-base text-sm focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
              autoComplete="off"
            />
            <span className="pointer-events-none absolute bottom-3 right-4 font-base text-xs text-muted">
              {description.length}/{DESCRIPTION_MAX}
            </span>
          </div>
        </label>

        <label className="flex flex-col gap-1.5 font-base text-sm font-medium text-base-content">
          Password (optional)
          <div className="relative">
            <input
              type={passwordVisible ? 'text' : 'password'}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              minLength={password ? 4 : undefined}
              maxLength={200}
              placeholder="Add a password to restrict access"
              className="input input-bordered w-full rounded-full border-[1.5px] border-base-300 bg-base-100 py-3 pl-4 pr-12 font-base text-sm focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-[color,background-color] duration-150 ease-out hover:bg-surface-hover hover:text-base-content focus-visible:outline-none focus-visible:shadow-focus"
              onClick={() => setPasswordVisible((v) => !v)}
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            >
              <EyeIcon hidden={passwordVisible} />
            </button>
          </div>
        </label>

        <div>
          <p className="m-0 mb-3 font-base text-sm font-semibold text-base-content">Security &amp; preferences</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <PreferenceToggleCard
              icon={<DownloadIcon />}
              label="Downloads"
              value={allowDownload ? 'On' : 'Off'}
              active={allowDownload}
              onClick={() => onAllowDownloadChange(!allowDownload)}
              ariaLabel={`Downloads ${allowDownload ? 'on' : 'off'}. Click to toggle.`}
            />
            <PreferenceToggleCard
              icon={<InfoIcon />}
              label="Metadata"
              value={showMetadata ? 'Shown' : 'Hidden'}
              active={showMetadata}
              onClick={() => onShowMetadataChange(!showMetadata)}
              ariaLabel={`Metadata ${showMetadata ? 'shown' : 'hidden'}. Click to toggle.`}
            />
            <PreferenceExpiryCard expiryId={expiryId} onExpiryChange={onExpiryChange} />
          </div>
        </div>

        <p className="m-0 flex items-start gap-2 rounded-md border-[1.5px] border-accent/25 bg-panel px-3 py-3 font-base text-xs text-muted">
          <span className="mt-0.5 shrink-0 text-accent" aria-hidden>
            <ShieldIcon />
          </span>
          Only people with this link can access the photos. This link will replace any existing share link.
        </p>

        {error ? (
          <p className="m-0 font-base text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={submitting}
            onClick={onCancel}
            className="btn min-h-12 flex-1 rounded-full border-[1.5px] border-base-300 bg-base-100 font-base text-sm font-semibold text-base-content transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-surface-hover active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-45 sm:flex-none sm:px-8"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn min-h-12 flex-1 rounded-full border-0 bg-action font-base text-sm font-semibold text-white transition-[transform,background-color,opacity] duration-150 ease-out hover:bg-[#222222] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none sm:px-8"
          >
            {submitting ? 'Creating…' : 'Create share link'}
          </button>
        </div>
    </form>
  )
}

/**
 * @param {{
 *   icon: import('react').ReactNode;
 *   label: string;
 *   value: string;
 *   active: boolean;
 *   onClick: () => void;
 *   ariaLabel: string;
 * }} props
 */
function PreferenceToggleCard({ icon, label, value, active, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-md border-[1.5px] px-3 py-3 text-center transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-focus ${
        active ? 'border-accent/40 bg-panel' : 'border-base-300 bg-base-100'
      }`}
    >
      <span className="text-muted">{icon}</span>
      <span className="font-base text-xs font-medium text-muted">{label}</span>
      <span className="font-base text-sm font-semibold text-base-content">{value}</span>
    </button>
  )
}

PreferenceToggleCard.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
}

/**
 * @param {{ expiryId: string; onExpiryChange: (id: string) => void }} props
 */
function SelectChevron() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function PreferenceExpiryCard({ expiryId, onExpiryChange }) {
  return (
    <div className="flex min-h-[5.5rem] w-full min-w-0 flex-col items-center justify-center gap-1 rounded-md border-[1.5px] border-base-300 bg-base-100 px-2 py-3 text-center sm:px-3">
      <span className="text-muted" aria-hidden>
        <CalendarIcon />
      </span>
      <span className="font-base text-xs font-medium text-muted">Expires</span>
      <div className="relative w-full min-w-0 max-w-[8.5rem]">
        <select
          value={expiryId}
          onChange={(e) => onExpiryChange(e.target.value)}
          className="h-9 w-full min-w-0 appearance-none truncate rounded-full border-[1.5px] border-base-300 bg-base-100 py-1 pl-3 pr-8 font-base text-xs font-semibold text-base-content focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
          aria-label="Link expiration"
        >
          {EXPIRY_CHOICES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden
        >
          <SelectChevron />
        </span>
      </div>
    </div>
  )
}

PreferenceExpiryCard.propTypes = {
  expiryId: PropTypes.string.isRequired,
  onExpiryChange: PropTypes.func.isRequired,
}

ShareLinkCreateForm.propTypes = {
  description: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  expiryId: PropTypes.string.isRequired,
  showMetadata: PropTypes.bool.isRequired,
  allowDownload: PropTypes.bool.isRequired,
  submitting: PropTypes.bool.isRequired,
  error: PropTypes.string.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
  onExpiryChange: PropTypes.func.isRequired,
  onShowMetadataChange: PropTypes.func.isRequired,
  onAllowDownloadChange: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export const SHARE_EXPIRY_CHOICES = EXPIRY_CHOICES

/**
 * @param {string} expiryId
 */
export function computeShareExpiryISO(expiryId) {
  const choice = EXPIRY_CHOICES.find((c) => c.id === expiryId) ?? EXPIRY_CHOICES[3]
  if (!choice || choice.hours == null) return null
  return new Date(Date.now() + choice.hours * 60 * 60 * 1000).toISOString()
}
