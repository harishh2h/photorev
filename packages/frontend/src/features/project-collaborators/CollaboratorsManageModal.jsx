import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import {
  lookupMemberByEmail,
  addProjectMember,
  removeProjectMember,
  updateMemberRole,
} from '@/services/projectMemberService.js'

const ROLE_OPTIONS = /** @type {const} */ (['viewer', 'reviewer', 'contributor'])

const ROLE_HINT = {
  viewer: 'View photos only — no voting or uploads.',
  reviewer: 'Vote and rename — no uploads.',
  contributor: 'Vote, rename, and upload photos.',
}

function roleLabel(role) {
  if (role === 'viewer') return 'Viewer'
  if (role === 'contributor') return 'Contributor'
  return 'Reviewer'
}

/**
 * @param {{ isOpen: boolean; onClose: () => void; token: string; projectId: string; members: object[]; onSaved: () => void }} props
 */
export default function CollaboratorsManageModal({
  isOpen,
  onClose,
  token,
  projectId,
  members,
  onSaved,
}) {
  const [emailDraft, setEmailDraft] = useState('')
  const [lookupUser, setLookupUser] = useState(/** @type {{ id: string; name: string; email: string } | null | undefined} */ (undefined))
  const [lookupPending, setLookupPending] = useState(false)
  const [inviteRole, setInviteRole] = useState('reviewer')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const debounceRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null))

  useEffect(() => {
    if (!isOpen) {
      setEmailDraft('')
      setLookupUser(undefined)
      setInviteRole('reviewer')
      setError('')
      setBusy(false)
      return undefined
    }
    function onKey(e) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, busy, onClose])

  useEffect(() => {
    if (!isOpen || !token || !projectId) return undefined
    const q = emailDraft.trim()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 3) {
      setLookupUser(undefined)
      setLookupPending(false)
      return undefined
    }
    setLookupPending(true)
    debounceRef.current = setTimeout(async () => {
      debounceRef.current = null
      try {
        const { user } = await lookupMemberByEmail(token, projectId, q)
        setLookupUser(user ?? null)
      } catch (err) {
        setLookupUser(null)
        setError(err instanceof Error ? err.message : 'Lookup failed')
      } finally {
        setLookupPending(false)
      }
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [emailDraft, isOpen, projectId, token])

  const memberIds = new Set(members.map((m) => String(m.userId ?? '')))
  const canInviteLookup = Boolean(lookupUser && !memberIds.has(lookupUser.id))

  const handleInvite = useCallback(async () => {
    if (!lookupUser || !canInviteLookup) return
    setBusy(true)
    setError('')
    try {
      await addProjectMember(token, projectId, {
        userId: lookupUser.id,
        role: /** @type {'viewer' | 'reviewer' | 'contributor'} */ (inviteRole),
      })
      onSaved()
      setEmailDraft('')
      setLookupUser(undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add member')
    } finally {
      setBusy(false)
    }
  }, [canInviteLookup, inviteRole, lookupUser, onSaved, projectId, token])

  const handleRemove = useCallback(
    async (userId) => {
      setBusy(true)
      setError('')
      try {
        await removeProjectMember(token, projectId, userId)
        onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not remove')
      } finally {
        setBusy(false)
      }
    },
    [onSaved, projectId, token]
  )

  const handleRoleChange = useCallback(
    async (userId, role) => {
      setBusy(true)
      setError('')
      try {
        await updateMemberRole(token, projectId, userId, {
          role: /** @type {'viewer' | 'reviewer' | 'contributor'} */ (role),
        })
        onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not update role')
      } finally {
        setBusy(false)
      }
    },
    [onSaved, projectId, token]
  )

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[340] flex items-end justify-center bg-black/40 backdrop-blur-[2px] md:items-center"
      role="presentation"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <div
        className="flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-[32px] border-[1.5px] border-base-300 bg-base-100 p-5 shadow-modal md:rounded-[32px]"
        role="dialog"
        aria-labelledby="collab-modal-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="collab-modal-title" className="m-0 font-base text-xl font-semibold text-base-content">
              Collaborators
            </h2>
            <p className="mt-1 font-base text-sm text-muted">Invite by email and set roles. Only you can manage this list.</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost min-h-11 min-w-11 border-[1.5px] border-transparent text-muted hover:border-accent-mid hover:bg-[#F4F9F6]"
            aria-label="Close"
            disabled={busy}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="rounded-md border-[1.5px] border-accent/25 bg-[#EDF7F2] p-4">
          <label htmlFor="collab-email" className="font-base text-xs font-semibold uppercase tracking-[0.06em] text-muted">
            Email lookup
          </label>
          <input
            id="collab-email"
            type="email"
            autoComplete="off"
            placeholder="name@studio.com"
            value={emailDraft}
            onChange={(e) => {
              setEmailDraft(e.target.value)
              setError('')
            }}
            className="input input-bordered mt-2 w-full rounded-full border-[1.5px] border-base-300 bg-base-100 px-4 py-3 font-base text-sm text-base-content placeholder:text-muted focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
          />
          <p className="mt-2 mb-0 font-base text-xs text-muted">
            {lookupPending ? 'Searching…' : null}
            {!lookupPending && lookupUser === null && emailDraft.trim().length >= 3 ? 'No account found for this email.' : null}
            {!lookupPending && lookupUser ? `${lookupUser.name} · ${lookupUser.email}` : null}
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 font-base text-xs font-semibold uppercase tracking-[0.06em] text-muted">
              Role
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="select select-bordered w-full rounded-full border-[1.5px] border-base-300 bg-base-100 px-4 py-3 font-base text-sm focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!canInviteLookup || busy}
              onClick={handleInvite}
              className="btn btn-primary shrink-0 rounded-full border-0 px-6 font-base text-sm font-semibold transition-[transform,opacity] duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add
            </button>
          </div>
          <p className="mt-2 mb-0 font-base text-xs text-accent">{ROLE_HINT[inviteRole]}</p>
          {lookupUser && memberIds.has(lookupUser.id) ? (
            <p className="mt-2 mb-0 font-base text-xs text-muted">This person is already on the project.</p>
          ) : null}
        </div>

        {error ? (
          <p className="m-0 font-base text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="rounded-card border-[1.5px] border-base-300 bg-bg p-3">
          <p className="m-0 mb-2 font-base text-xs font-semibold uppercase tracking-[0.08em] text-muted">Team</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {members.map((m) => {
              const uid = String(m.userId ?? '')
              const creator = Boolean(m.isCreator)
              return (
                <li
                  key={uid}
                  className="flex flex-col gap-2 rounded-md border-[1.5px] border-base-300 bg-base-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="m-0 truncate font-base text-sm font-semibold text-base-content">{m.name || m.email}</p>
                    <p className="m-0 truncate font-base text-xs text-muted">{m.email}</p>
                    {creator ? (
                      <span className="mt-1 inline-flex rounded-full bg-[#EDF7F2] px-2 py-0.5 font-base text-xs font-semibold text-accent">
                        Owner
                      </span>
                    ) : null}
                  </div>
                  {!creator ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={String(m.role ?? 'reviewer')}
                        disabled={busy}
                        onChange={(e) => handleRoleChange(uid, e.target.value)}
                        className="select select-bordered select-sm rounded-full border-[1.5px] border-base-300 bg-base-100 font-base text-xs focus:border-accent"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {roleLabel(r)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleRemove(uid)}
                        className="btn btn-outline btn-sm rounded-full border-[1.5px] border-base-300 font-base text-xs font-semibold text-base-content hover:border-accent-mid hover:bg-[#F4F9F6]"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>,
    document.body
  )
}

CollaboratorsManageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  projectId: PropTypes.string.isRequired,
  members: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSaved: PropTypes.func.isRequired,
}
