import { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import styles from './ProjectViewSidebar.module.css'

/**
 * @param {{ likedCount: number; likedWithNames: string; reviewProgressPercent: number; collaboratorMembers: { id: string; name: string; initial: string }[]; onFinalize: () => void; onShare: () => void; onSettings: () => void }} props
 * @returns {import('react').JSX.Element}
 */
export default function ProjectViewSidebar({
  likedCount,
  likedWithNames,
  reviewProgressPercent,
  collaboratorMembers,
  onFinalize,
  onShare,
  onSettings,
}) {
  const [isMembersOpen, setIsMembersOpen] = useState(false)
  const collaboratorCount = collaboratorMembers.length
  const previewCollaborators = collaboratorMembers.slice(0, 4)
  const overflowCount = Math.max(0, collaboratorCount - previewCollaborators.length)
  const handleToggleMembers = useCallback(() => {
    setIsMembersOpen((open) => !open)
  }, [])
  return (
    <aside className={styles.aside} aria-label="Project review">
      <div className={styles.likedBlock}>
        <div className={styles.likedRow}>
          <span className={styles.heartIcon} aria-hidden>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </span>
          <span className={styles.likedText}>
            <strong>{likedCount}</strong> Liked
          </span>
        </div>
        <div className={styles.avatarRow} aria-hidden>
          {previewCollaborators.slice(0, 2).map((c) => (
            <span key={c.id} className={styles.avatar}>
              {c.initial}
            </span>
          ))}
        </div>
        <p className={styles.withNames}>with {likedWithNames}</p>
      </div>
      <div className={styles.flowBlock}>
        <p className={styles.flowLabel}>Review progress</p>
        <div className={styles.flowRow}>
          <div
            className={styles.track}
            role="progressbar"
            aria-valuenow={reviewProgressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={styles.fill} style={{ width: `${reviewProgressPercent}%` }} />
          </div>
          <span className={styles.flowPercent}>{reviewProgressPercent}%</span>
        </div>
      </div>
      <div className={styles.collabBlock}>
        <button
          type="button"
          className={styles.collabTrigger}
          onClick={handleToggleMembers}
          aria-expanded={isMembersOpen}
          aria-controls="project-collaborators-list"
          id="project-collaborators-trigger"
        >
          <span className={styles.groupIcon} aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <span className={styles.collabTitle}>{collaboratorCount} Collaborators</span>
          <span className={`${styles.chevron} ${isMembersOpen ? styles.chevronOpen : ''}`} aria-hidden>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>
        {!isMembersOpen ? (
          <div className={styles.avatarRowWide} aria-hidden>
            {previewCollaborators.map((c) => (
              <span key={c.id} className={styles.avatarMuted}>
                {c.initial}
              </span>
            ))}
            {overflowCount > 0 ? (
              <span className={styles.avatarMore}>+{overflowCount}</span>
            ) : null}
          </div>
        ) : null}
        {isMembersOpen ? (
          <ul className={styles.memberList} id="project-collaborators-list" role="list" aria-labelledby="project-collaborators-trigger">
            {collaboratorMembers.map((member) => (
              <li key={member.id} className={styles.memberItem}>
                <span className={styles.memberAvatar}>{member.initial}</span>
                <span className={styles.memberName}>{member.name}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.btnPrimary} onClick={onFinalize}>
          Finalize review
          <span className={styles.btnIcon} aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </span>
        </button>
        <div className={styles.secondaryRow}>
          <button type="button" className={styles.btnGhost} onClick={onShare}>
            Share
          </button>
          <button type="button" className={styles.btnGhost} onClick={onSettings}>
            Settings
          </button>
        </div>
      </div>
    </aside>
  )
}

ProjectViewSidebar.propTypes = {
  likedCount: PropTypes.number.isRequired,
  likedWithNames: PropTypes.string.isRequired,
  reviewProgressPercent: PropTypes.number.isRequired,
  collaboratorMembers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      initial: PropTypes.string.isRequired,
    })
  ).isRequired,
  onFinalize: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  onSettings: PropTypes.func.isRequired,
}
