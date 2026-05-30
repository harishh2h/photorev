import PropTypes from 'prop-types'
import {
  collaboratorAvatarTone,
  MEMBER_ROLE_OPTIONS,
  memberRoleLabel,
  normalizeMemberRole,
} from './collaboratorRoles.js'

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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

/**
 * @param {{
 *   member: object;
 *   busy: boolean;
 *   onRoleChange: (userId: string, role: string) => void;
 *   onRemove: (userId: string) => void;
 * }} props
 */
export default function CollaboratorTeamRow({ member, busy, onRoleChange, onRemove }) {
  const uid = String(member.userId ?? '')
  const creator = Boolean(member.isCreator)
  const label = member.name || member.email || 'Member'
  const initial = (member.name || member.email || '?').charAt(0).toUpperCase()
  const tone = collaboratorAvatarTone(uid || label)
  const role = normalizeMemberRole(member.role)

  return (
    <li className="flex items-center gap-3 rounded-md border-[1.5px] border-base-300 bg-base-100 px-3 py-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[1.5px] font-base text-sm font-semibold ${tone}`}
        aria-hidden
      >
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="m-0 truncate font-base text-sm font-semibold text-base-content">{label}</p>
          {creator ? (
            <span className="inline-flex rounded-full bg-panel px-2 py-0.5 font-base text-xs font-semibold text-accent">
              Owner
            </span>
          ) : null}
        </div>
        <p className="m-0 truncate font-base text-xs text-muted">{member.email}</p>
      </div>
      {creator ? (
        <span className="inline-flex shrink-0 items-center gap-1.5 font-base text-xs font-medium text-muted">
          <ShieldIcon />
          Full access
        </span>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <select
            value={role}
            disabled={busy}
            onChange={(e) => {
              const next = normalizeMemberRole(e.target.value)
              if (next !== role) onRoleChange(uid, next)
            }}
            className="select select-bordered select-sm rounded-full border-[1.5px] border-base-300 bg-base-100 font-base text-xs focus:border-accent"
            aria-label={`Role for ${label}`}
          >
            {MEMBER_ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {memberRoleLabel(r)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() => onRemove(uid)}
            className="btn btn-ghost btn-sm min-h-11 min-w-11 rounded-full border-[1.5px] border-transparent p-0 text-error transition-[background-color,transform] duration-150 ease-out hover:border-error/30 hover:bg-[#FEF2F2] active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus"
            aria-label={`Remove ${label}`}
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </li>
  )
}

CollaboratorTeamRow.propTypes = {
  member: PropTypes.object.isRequired,
  busy: PropTypes.bool.isRequired,
  onRoleChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
}
