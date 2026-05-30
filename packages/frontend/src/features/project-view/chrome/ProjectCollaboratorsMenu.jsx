import PropTypes from 'prop-types'
import { useDropdown } from '@/hooks/useDropdown.js'

/**
 * @param {{
 *   collaboratorMembers: object[];
 *   onManageCollaborators?: () => void;
 *   canManage?: boolean;
 * }} props
 */
export default function ProjectCollaboratorsMenu({
  collaboratorMembers,
  onManageCollaborators,
  canManage = false,
}) {
  const menu = useDropdown()
  const collaboratorCount = collaboratorMembers.length
  const previewCollaborators = collaboratorMembers.slice(0, 4)
  const overflowCount = Math.max(0, collaboratorCount - previewCollaborators.length)

  const handleManage = () => {
    menu.close()
    onManageCollaborators?.()
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        ref={menu.triggerRef}
        className="inline-flex min-h-11 max-w-[11rem] items-center gap-2 rounded-full border-[1.5px] border-base-300 bg-base-100 px-3 font-base text-sm font-medium text-base-content transition-[border-color,background-color,box-shadow] duration-150 ease-out hover:border-accent-mid hover:bg-surface-hover focus-visible:outline-none focus-visible:shadow-focus sm:max-w-none sm:px-4"
        onClick={menu.toggle}
        aria-expanded={menu.isOpen}
        aria-haspopup="true"
        aria-label="Collaborators"
      >
        <span className="flex shrink-0 text-muted" aria-hidden>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
        <span className="truncate">{collaboratorCount} Collaborators</span>
        <span
          className={`flex shrink-0 text-muted transition-transform duration-150 ease-out ${menu.isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      {menu.isOpen ? (
        <div
          ref={menu.panelRef}
          className="dropdown-panel-in absolute left-0 top-[calc(100%+0.5rem)] z-dropdown w-[min(18rem,calc(100vw-2rem))] rounded-md border-[1.5px] border-base-300 bg-base-100 p-3 shadow-floating md:left-auto md:right-0"
          role="menu"
        >
          <div className="mb-3 flex flex-wrap items-center gap-0" aria-hidden>
            {previewCollaborators.map((member) => (
              <span
                key={member.id}
                className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-base-300 bg-panel font-base text-xs font-semibold text-base-content first:ml-0"
              >
                {member.initial}
              </span>
            ))}
            {overflowCount > 0 ? (
              <span className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-accent-mid bg-panel font-base text-xs font-bold text-accent">
                +{overflowCount}
              </span>
            ) : null}
          </div>
          <ul className="m-0 max-h-[min(40svh,240px)] list-none overflow-y-auto scroll-smooth p-0" role="list">
            {collaboratorMembers.map((member) => (
              <li key={member.id} className="flex items-center gap-3 rounded-sm px-1 py-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-mid bg-base-100 font-base text-xs font-semibold text-base-content">
                  {member.initial}
                </span>
                <div className="min-w-0 flex flex-col gap-0.5">
                  <span className="truncate font-base text-sm text-base-content">{member.name}</span>
                  {member.roleLabel ? (
                    <span className="inline-flex w-fit rounded-full bg-panel px-2 py-0.5 font-base text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-accent">
                      {member.roleLabel}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          {canManage && typeof onManageCollaborators === 'function' ? (
            <button
              type="button"
              className="mt-2 flex min-h-11 w-full items-center justify-center rounded-full border-[1.5px] border-base-300 bg-base-100 font-base text-sm font-semibold text-accent transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-panel active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus"
              onClick={handleManage}
            >
              Manage collaborators
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

ProjectCollaboratorsMenu.propTypes = {
  collaboratorMembers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      initial: PropTypes.string.isRequired,
      roleLabel: PropTypes.string,
    })
  ).isRequired,
  onManageCollaborators: PropTypes.func,
  canManage: PropTypes.bool,
}
