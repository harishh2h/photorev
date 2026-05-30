/** @typedef {'viewer' | 'reviewer' | 'contributor'} CollaboratorRole */

export const INVITE_ROLE = /** @type {const} */ ('reviewer')

/** Roles owners can assign to existing members (invite flow stays reviewer-only). */
export const MEMBER_ROLE_OPTIONS = /** @type {const} */ (['viewer', 'reviewer', 'contributor'])

export const REVIEWER_ROLE_HINT =
  "They'll only be able to review and vote. No uploads or project changes."

const MEMBER_ROLE_LABELS = {
  viewer: 'Viewer',
  reviewer: 'Reviewer',
  contributor: 'Contributor',
}

/**
 * @param {unknown} role
 * @returns {'viewer' | 'reviewer' | 'contributor'}
 */
export function normalizeMemberRole(role) {
  if (role === 'viewer' || role === 'reviewer' || role === 'contributor') return role
  return 'reviewer'
}

/**
 * @param {unknown} role
 */
export function memberRoleLabel(role) {
  return MEMBER_ROLE_LABELS[normalizeMemberRole(role)]
}

export const TEAM_ROLE_FILTERS = /** @type {const} */ ([
  { value: 'all', label: 'All roles' },
  { value: 'owner', label: 'Owners' },
  { value: 'reviewer', label: 'Reviewers' },
])

const AVATAR_TONES = [
  'border-[#E8D4B8] bg-[#F5E6D3] text-[#6B5344]',
  'border-[#D4C8F0] bg-[#EDE8FA] text-[#5B4F8C]',
  'border-accent-mid bg-panel text-accent',
  'border-[#C8E6D8] bg-[#E8F5EE] text-[#3D6B52]',
]

/**
 * @param {string} seed
 */
export function collaboratorAvatarTone(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length
  }
  return AVATAR_TONES[hash]
}

/**
 * @param {object | null | undefined} member
 */
export function collaboratorDisplayRoleLabel(member) {
  if (member != null && member.isCreator === true) return 'Owner'
  return memberRoleLabel(member?.role)
}

/**
 * @param {object} member
 * @param {string} filter
 */
export function memberMatchesTeamFilter(member, filter) {
  if (filter === 'all') return true
  if (filter === 'owner') return Boolean(member.isCreator)
  if (filter === 'reviewer') return !member.isCreator
  return true
}
