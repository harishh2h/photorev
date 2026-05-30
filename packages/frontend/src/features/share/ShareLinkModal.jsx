import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import {
  createShareLink,
  getActiveShareLink,
  revokeShareLink,
} from '@/services/shareLinkService.js'
import ShareLinkActiveView, { ShareIcon } from './ShareLinkActiveView.jsx'
import ShareLinkCreateForm, { computeShareExpiryISO } from './ShareLinkCreateForm.jsx'
import { buildShareUrl } from './shareLinkDisplay.js'

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

  const handleCreate = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const link = await createShareLink(token, projectId, {
        description: description.trim().length > 0 ? description.trim() : null,
        password: password.trim().length > 0 ? password.trim() : null,
        showMetadata,
        allowDownload,
        expiresAt: computeShareExpiryISO(expiryId),
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

  return createPortal(
    <div
      className="fixed inset-0 z-[340] flex items-end justify-center bg-black/40 backdrop-blur-[2px] md:items-center"
      role="presentation"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget && !submitting) handleClose()
      }}
    >
      <div
        className="flex max-h-[min(90dvh,640px)] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-[32px] border-[1.5px] border-base-300 bg-base-100 p-5 shadow-modal md:rounded-[32px]"
        role="dialog"
        aria-labelledby="share-modal-title"
      >
        <div className="flex items-start justify-between gap-3">
          {!loading && !loadError && !activeLink ? (
            <div className="min-w-0 pr-2">
              <h2 id="share-modal-title" className="m-0 font-base text-xl font-bold text-base-content">
                Create share link
              </h2>
              <p className="m-0 mt-1 font-base text-sm text-muted">
                Anyone with the link can view liked photos only.
              </p>
            </div>
          ) : !loading && !loadError && activeLink ? (
            <h2 id="share-modal-title" className="m-0 flex items-center gap-2 font-base text-xl font-bold text-base-content">
              <span className="text-accent" aria-hidden>
                <ShareIcon />
              </span>
              Share
            </h2>
          ) : (
            <span id="share-modal-title" className="sr-only">
              Share
            </span>
          )}
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost min-h-11 min-w-11 shrink-0 border-[1.5px] border-transparent text-muted transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-surface-hover active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus"
            aria-label="Close"
            disabled={submitting}
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <p className="m-0 font-base text-sm text-muted">Loading…</p>
        ) : loadError ? (
          <p className="m-0 font-base text-sm text-error" role="alert">
            {loadError}
          </p>
        ) : activeLink ? (
          <ShareLinkActiveView
            link={activeLink}
            copied={copied}
            revoking={submitting}
            onCopy={handleCopy}
            onReplace={() => setActiveLink(null)}
            onRevoke={handleRevoke}
          />
        ) : (
          <ShareLinkCreateForm
            description={description}
            password={password}
            expiryId={expiryId}
            showMetadata={showMetadata}
            allowDownload={allowDownload}
            submitting={submitting}
            error={submitError}
            onDescriptionChange={setDescription}
            onPasswordChange={setPassword}
            onExpiryChange={setExpiryId}
            onShowMetadataChange={setShowMetadata}
            onAllowDownloadChange={setAllowDownload}
            onCancel={handleClose}
            onSubmit={handleCreate}
          />
        )}

        {submitError && activeLink ? (
          <p className="m-0 font-base text-sm text-error" role="alert">
            {submitError}
          </p>
        ) : null}
      </div>
    </div>,
    document.body
  )
}

ShareLinkModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  projectId: PropTypes.string.isRequired,
  projectName: PropTypes.string.isRequired,
}
