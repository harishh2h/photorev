import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import {
  lookupMemberByEmail,
  addProjectMember,
  removeProjectMember,
  updateMemberRole,
} from '@/services/projectMemberService.js'
import CollaboratorTeamRow from './CollaboratorTeamRow.jsx'
import {
  INVITE_ROLE,
  REVIEWER_ROLE_HINT,
  TEAM_ROLE_FILTERS,
  memberMatchesTeamFilter,
} from './collaboratorRoles.js'

function UserPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M20 8v6M23 11h-6" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      className={`shrink-0 text-muted transition-transform duration-250 ease-out ${open ? 'rotate-180' : ''}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

ChevronIcon.propTypes = {
  open: PropTypes.bool.isRequired,
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
  const [teamFilter, setTeamFilter] = useState('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const debounceRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null))

  useEffect(() => {
    if (!isOpen) {
      setEmailDraft('')
      setLookupUser(undefined)
      setTeamFilter('all')
      setInviteOpen(false)
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
  const filteredMembers = members.filter((m) => memberMatchesTeamFilter(m, teamFilter))

  const handleInvite = useCallback(async () => {
    if (!lookupUser || !canInviteLookup) return
    setBusy(true)
    setError('')
    try {
      await addProjectMember(token, projectId, {
        userId: lookupUser.id,
        role: INVITE_ROLE,
      })
      onSaved()
      setEmailDraft('')
      setLookupUser(undefined)
      setInviteOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add member')
    } finally {
      setBusy(false)
    }
  }, [canInviteLookup, lookupUser, onSaved, projectId, token])

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
      const member = members.find((m) => String(m.userId ?? '') === userId)
      if (member && String(member.role) === role) return

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
    [members, onSaved, projectId, token]
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
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="collab-modal-title" className="m-0 font-base text-xl font-bold text-base-content">
                Collaborators
              </h2>
              <p className="mt-1 font-base text-sm text-muted">
                Invite people to collaborate and set their roles.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-circle btn-ghost min-h-11 min-w-11 border-[1.5px] border-transparent text-muted transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-surface-hover active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus"
              aria-label="Close"
              disabled={busy}
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <section className="rounded-md border-[1.5px] border-base-300 bg-bg">
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-4 py-3 font-base text-sm font-semibold text-base-content transition-[background-color] duration-150 ease-out hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-focus"
              aria-expanded={inviteOpen}
              aria-controls="collab-invite-panel"
              onClick={() => setInviteOpen((open) => !open)}
            >
              <span className="flex items-center gap-2">
                <span className="text-accent" aria-hidden>
                  <UserPlusIcon />
                </span>
                Invite collaborator
              </span>
              <ChevronIcon open={inviteOpen} />
            </button>
            {inviteOpen ? (
              <div id="collab-invite-panel" className="border-t-[1.5px] border-base-300 px-4 pb-4 pt-3">
                <label htmlFor="collab-email" className="block font-base text-sm font-medium text-base-content">
                  Email address
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
                  {!lookupPending && lookupUser === null && emailDraft.trim().length >= 3
                    ? 'No account found for this email.'
                    : null}
                  {!lookupPending && lookupUser ? `${lookupUser.name} · ${lookupUser.email}` : null}
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="flex min-w-0 flex-1 flex-col gap-1 font-base text-sm font-medium text-base-content">
                    Role
                    <select
                      value={INVITE_ROLE}
                      disabled
                      className="select select-bordered w-full rounded-full border-[1.5px] border-base-300 bg-base-100 px-4 py-3 font-base text-sm focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
                      aria-describedby="collab-role-hint"
                    >
                      <option value="reviewer">Reviewer</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={!canInviteLookup || busy}
                    onClick={handleInvite}
                    className="btn shrink-0 rounded-full border-0 bg-accent px-6 font-base text-sm font-semibold text-white transition-[transform,opacity,background-color] duration-150 ease-out hover:bg-accent-hover active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
                <p id="collab-role-hint" className="mt-2 mb-0 font-base text-xs text-muted">
                  {REVIEWER_ROLE_HINT}
                </p>
                {lookupUser && memberIds.has(lookupUser.id) ? (
                  <p className="mt-2 mb-0 font-base text-xs text-muted">This person is already on the project.</p>
                ) : null}
              </div>
            ) : null}
          </section>

          {error ? (
            <p className="m-0 font-base text-sm text-error" role="alert">
              {error}
            </p>
          ) : null}

          <section className="rounded-card border-[1.5px] border-base-300 bg-bg p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="m-0 flex items-center gap-2 font-base text-sm font-semibold text-base-content">
                <span className="text-accent" aria-hidden>
                  <UsersIcon />
                </span>
                Team ({members.length})
              </h3>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="select select-bordered select-sm rounded-full border-[1.5px] border-base-300 bg-base-100 font-base text-xs focus:border-accent"
                aria-label="Filter team by role"
              >
                {TEAM_ROLE_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {filteredMembers.map((m) => (
                <CollaboratorTeamRow
                  key={String(m.userId ?? '')}
                  member={m}
                  busy={busy}
                  onRoleChange={handleRoleChange}
                  onRemove={handleRemove}
                />
              ))}
            </ul>
            {filteredMembers.length === 0 ? (
              <p className="m-0 px-1 py-2 font-base text-xs text-muted">No members match this filter.</p>
            ) : null}
          </section>
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
