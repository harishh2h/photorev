import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import {
  createShareLink,
  getActiveShareLink,
  revokeShareLink,
} from '@/services/shareLinkService.js'

const EXPIRY_CHOICES = [
  { id: '24h', label: '24h', hours: 24 },
  { id: '7d', label: '7 days', hours: 24 * 7 },
  { id: '30d', label: '30 days', hours: 24 * 30 },
  { id: 'never', label: 'Never', hours: null },
]

function computeExpiryISO(choice) {
  if (!choice || choice.hours == null) return null
  return new Date(Date.now() + choice.hours * 60 * 60 * 1000).toISOString()
}

function buildShareUrl(token) {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/s/${token}`
}

/**
 * @param {{ isOpen: boolean; onClose: () => void; token: string; projectId: string; projectName: string }} props
 */
export default function ShareLinkModal({ isOpen, onClose, token, projectId, projectName }) {
  const [activeLink, setActiveLink] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [description, setDescription] = useState('')
  const [password, setPassword] = useState('')
  const [showMetadata, setShowMetadata] = useState(false)
  const [allowDownload, setAllowDownload] = useState(true)
  const [expiryId, setExpiryId] = useState('never')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [copied, setCopied] = useState(false)

  const expiryChoice = useMemo(
    () => EXPIRY_CHOICES.find((c) => c.id === expiryId) ?? EXPIRY_CHOICES[3],
    [expiryId]
  )

  const loadActive = useCallback(async () => {
    if (!token || !projectId) return
    setLoading(true)
    setLoadError('')
    try {
      const link = await getActiveShareLink(token, projectId)
      setActiveLink(link)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load share link')
    } finally {
      setLoading(false)
    }
  }, [token, projectId])

  useEffect(() => {
    if (!isOpen) return
    setDescription('')
    setPassword('')
    setShowMetadata(false)
    setAllowDownload(true)
    setExpiryId('never')
    setSubmitError('')
    setCopied(false)
    void loadActive()
  }, [isOpen, loadActive])

  const handleClose = useCallback(() => {
    if (submitting) return
    onClose()
  }, [submitting, onClose])

  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, handleClose])

  const handleCreate = async (event) => {
    event?.preventDefault?.()
    setSubmitting(true)
    setSubmitError('')
    try {
      const link = await createShareLink(token, projectId, {
        description: description.trim().length > 0 ? description.trim() : null,
        password: password.trim().length > 0 ? password.trim() : null,
        showMetadata,
        allowDownload,
        expiresAt: computeExpiryISO(expiryChoice),
      })
      setActiveLink(link)
      setCopied(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not create share link')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async () => {
    if (!activeLink) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await revokeShareLink(token, projectId, activeLink.id)
      setActiveLink(null)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not revoke share link')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = async () => {
    if (!activeLink) return
    try {
      await navigator.clipboard.writeText(buildShareUrl(activeLink.token))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  if (!isOpen) return null

  const node = (
    <div
      className="modal-overlay-in fixed inset-0 z-modal flex items-end justify-center bg-black/40 p-0 md:items-center md:p-6"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="modal-panel-up flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-xl border-[1.5px] border-base-300 bg-base-100 shadow-modal md:max-h-[88vh] md:w-[min(100%,48rem)] md:rounded-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b-[1.5px] border-base-300 px-5 py-5 md:px-7 md:py-6">
          <div>
            <p className="m-0 font-base text-xs font-semibold uppercase tracking-[0.08em] text-accent">Share</p>
            <h2 id="share-modal-title" className="m-0 font-base text-2xl font-bold leading-tight text-base-content">
              {activeLink ? 'Active share link' : `Share ${projectName}`}
            </h2>
            <p className="m-0 mt-1 font-base text-sm text-muted">
              Anyone with the link will see liked photos only. Creating a new link revokes any existing one.
            </p>
          </div>
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-base-300 bg-base-100 text-base-content transition-[background-color,border-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-base-200 active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-45"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto px-5 py-6 md:px-7 md:py-7">
          {loading ? (
            <p className="m-0 font-base text-sm text-muted">Loading…</p>
          ) : loadError ? (
            <p className="m-0 font-base text-sm text-error" role="alert">
              {loadError}
            </p>
          ) : activeLink ? (
            <ActiveLinkPanel
              link={activeLink}
              copied={copied}
              onCopy={handleCopy}
              onRevoke={handleRevoke}
              revoking={submitting}
              onReplace={() => setActiveLink(null)}
            />
          ) : (
            <form className="flex flex-col gap-5" onSubmit={handleCreate}>
              <FormField label="Description (optional)">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                  placeholder="For Sarah and Tom — wedding shortlist"
                  className="input input-bordered w-full min-h-11 rounded-full border-[1.5px] border-base-300 bg-base-100 px-5 py-3 font-base text-base text-base-content focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Password (optional)">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={password ? 4 : undefined}
                  maxLength={200}
                  placeholder="Leave empty for anonymous access"
                  className="input input-bordered w-full min-h-11 rounded-full border-[1.5px] border-base-300 bg-base-100 px-5 py-3 font-base text-base text-base-content focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
                  autoComplete="new-password"
                />
              </FormField>
              <FormField label="Expires">
                <div className="flex flex-wrap gap-2">
                  {EXPIRY_CHOICES.map((c) => {
                    const isActive = c.id === expiryId
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setExpiryId(c.id)}
                        className={`inline-flex min-h-11 items-center rounded-full border-[1.5px] px-4 font-base text-sm font-medium transition-[background-color,border-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:shadow-focus ${
                          isActive
                            ? 'border-accent bg-accent/15 text-accent'
                            : 'border-base-300 bg-base-100 text-base-content hover:border-accent-mid'
                        }`}
                      >
                        {c.label}
                      </button>
                    )
                  })}
                </div>
              </FormField>
              <div className="flex flex-col gap-3">
                <ToggleRow
                  label="Show EXIF metadata"
                  description="Reveal camera, exposure, density and file info to the recipient."
                  checked={showMetadata}
                  onChange={setShowMetadata}
                />
                <ToggleRow
                  label="Allow original download"
                  description="Recipients can download the full-resolution file."
                  checked={allowDownload}
                  onChange={setAllowDownload}
                />
              </div>
              {submitError ? (
                <p className="m-0 font-base text-sm font-medium text-error" role="alert">
                  {submitError}
                </p>
              ) : null}
            </form>
          )}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t-[1.5px] border-base-300 px-5 py-4 md:flex-row md:justify-end md:px-7">
          <button
            type="button"
            className="btn btn-outline min-h-12 rounded-full border-[1.5px] border-base-300 bg-base-100 font-base text-sm font-semibold text-base-content transition-[background-color,border-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-base-200 active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-45 md:min-w-28"
            onClick={handleClose}
            disabled={submitting}
          >
            Close
          </button>
          {!activeLink && !loading ? (
            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting}
              className="btn btn-primary min-h-12 rounded-full border-0 font-base text-sm font-semibold text-primary-content transition-[background-color,transform,opacity] duration-150 ease-out hover:bg-[#222222] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-55 md:min-w-40"
            >
              {submitting ? 'Creating…' : 'Create share link'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}

function FormField({ label, children }) {
  return (
    <label className="flex flex-col gap-2 font-base text-sm font-semibold text-muted">
      <span>{label}</span>
      {children}
    </label>
  )
}

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-start gap-3 rounded-md border-[1.5px] px-4 py-3 text-left transition-[border-color,background-color] duration-150 ease-out focus-visible:outline-none focus-visible:shadow-focus ${
        checked ? 'border-accent/55 bg-accent/[0.06]' : 'border-base-300 bg-base-100 hover:border-accent-mid'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full border-[1.5px] transition-[background-color,border-color] duration-150 ease-out ${
          checked ? 'border-accent bg-accent' : 'border-base-300 bg-base-200'
        }`}
        aria-hidden
      >
        <span
          className={`block h-3.5 w-3.5 rounded-full bg-base-100 shadow-card transition-transform duration-150 ease-out ${
            checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
          }`}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-base text-sm font-semibold text-base-content">{label}</span>
        <span className="mt-0.5 block font-base text-xs leading-snug text-muted">{description}</span>
      </span>
    </button>
  )
}

ToggleRow.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
}

function ActiveLinkPanel({ link, copied, onCopy, onRevoke, revoking, onReplace }) {
  const url = buildShareUrl(link.token)
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-card border-[1.5px] border-accent/40 bg-accent/[0.06] p-4">
        <p className="m-0 font-base text-xs font-semibold uppercase tracking-[0.08em] text-accent">Share URL</p>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
          <input
            readOnly
            value={url}
            className="input input-bordered w-full min-h-11 rounded-full border-[1.5px] border-accent/40 bg-base-100 px-4 py-3 font-mono text-sm text-base-content focus:outline-none"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            onClick={onCopy}
            className="btn btn-primary min-h-11 shrink-0 rounded-full border-0 px-5 font-base text-sm font-semibold text-primary-content transition-[background-color,transform] duration-150 ease-out hover:bg-[#222222] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
        <ul className="m-0 mt-3 grid list-none grid-cols-2 gap-x-4 gap-y-1 p-0 font-base text-xs text-muted">
          <li>Password: <span className="font-medium text-base-content">{link.hasPassword ? 'Yes' : 'No'}</span></li>
          <li>Downloads: <span className="font-medium text-base-content">{link.allowDownload ? 'Enabled' : 'Disabled'}</span></li>
          <li>Metadata: <span className="font-medium text-base-content">{link.showMetadata ? 'Shown' : 'Hidden'}</span></li>
          <li>
            Expires:{' '}
            <span className="font-medium text-base-content">
              {link.expiresAt ? new Date(link.expiresAt).toLocaleString() : 'Never'}
            </span>
          </li>
          <li>Views: <span className="font-medium text-base-content">{link.viewCount}</span></li>
        </ul>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onReplace}
          disabled={revoking}
          className="btn btn-outline min-h-11 rounded-full border-[1.5px] border-base-300 bg-base-100 font-base text-sm font-semibold text-base-content hover:border-accent-mid hover:bg-base-200 active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-45"
        >
          Replace with new link
        </button>
        <button
          type="button"
          onClick={onRevoke}
          disabled={revoking}
          className="btn min-h-11 rounded-full border-[1.5px] border-error bg-error/10 px-5 font-base text-sm font-semibold text-error hover:bg-error/20 active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-45"
        >
          {revoking ? 'Revoking…' : 'Revoke link'}
        </button>
      </div>
    </div>
  )
}

ActiveLinkPanel.propTypes = {
  link: PropTypes.shape({
    id: PropTypes.string.isRequired,
    token: PropTypes.string.isRequired,
    hasPassword: PropTypes.bool.isRequired,
    allowDownload: PropTypes.bool.isRequired,
    showMetadata: PropTypes.bool.isRequired,
    expiresAt: PropTypes.string,
    viewCount: PropTypes.number.isRequired,
  }).isRequired,
  copied: PropTypes.bool.isRequired,
  onCopy: PropTypes.func.isRequired,
  onRevoke: PropTypes.func.isRequired,
  revoking: PropTypes.bool.isRequired,
  onReplace: PropTypes.func.isRequired,
}

ShareLinkModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  projectId: PropTypes.string.isRequired,
  projectName: PropTypes.string.isRequired,
}
