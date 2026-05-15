import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { updateProject } from '@/services/projectService.js'
import ProjectDeleteConfirmModal from './ProjectDeleteConfirmModal.jsx'

/**
 * @param {{ isOpen: boolean; onClose: () => void; token: string; projectId: string; initialProjectName: string; collaboratorCount: number; onRenameSuccess: () => void; onOpenTeam: () => void; onProjectDeleted: () => void }} props
 */
export default function ProjectSettingsModal({
  isOpen,
  onClose,
  token,
  projectId,
  initialProjectName,
  collaboratorCount,
  onRenameSuccess,
  onOpenTeam,
  onProjectDeleted,
}) {
  const [nameDraft, setNameDraft] = useState(initialProjectName)
  const [saveBusy, setSaveBusy] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setDeleteOpen(false)
      return undefined
    }
    setNameDraft(initialProjectName)
    setSaveError('')
    return undefined
  }, [isOpen, initialProjectName])

  useEffect(() => {
    if (!isOpen) return undefined
    function onKey(e) {
      if (e.key === 'Escape' && !saveBusy && !deleteOpen) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, saveBusy, deleteOpen, onClose])

  const handleSaveName = useCallback(async () => {
    const trimmed = nameDraft.trim()
    if (!trimmed || trimmed === initialProjectName) return
    setSaveBusy(true)
    setSaveError('')
    try {
      await updateProject(token, projectId, { name: trimmed })
      onRenameSuccess()
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaveBusy(false)
    }
  }, [initialProjectName, nameDraft, onClose, onRenameSuccess, projectId, token])

  const handleTeam = useCallback(() => {
    onOpenTeam()
    onClose()
  }, [onClose, onOpenTeam])

  if (!isOpen) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[330] flex items-end justify-center bg-black/40 backdrop-blur-[2px] md:items-center"
        role="presentation"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget && !saveBusy && !deleteOpen) onClose()
        }}
      >
        <div
          className="relative flex max-h-[min(90dvh,680px)] w-full max-w-lg flex-col gap-5 overflow-y-auto rounded-t-[32px] border-[1.5px] border-base-300 bg-base-100 p-5 shadow-modal md:rounded-[32px]"
          role="dialog"
          aria-labelledby="project-settings-title"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="project-settings-title" className="m-0 font-base text-xl font-semibold text-base-content">
                Project settings
              </h2>
              <p className="mt-1 font-base text-sm text-muted">Rename, manage team, or remove this project.</p>
              <p className="m-0 mt-2 font-base text-sm font-semibold text-accent sm:hidden">{collaboratorCount} collaborators</p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-circle btn-ghost min-h-11 min-w-11 border-[1.5px] border-transparent text-muted hover:border-accent-mid hover:bg-[#F4F9F6]"
              aria-label="Close"
              disabled={saveBusy || deleteOpen}
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="absolute bottom-4 right-4 hidden rotate-[-1deg] rounded-md border-[1.5px] border-accent/30 bg-base-100 px-3 py-2 shadow-floating sm:block">
            <p className="m-0 font-base text-xs font-semibold uppercase tracking-[0.06em] text-muted">Team</p>
            <p className="m-0 mt-1 font-base text-lg font-bold text-accent">{collaboratorCount}</p>
          </div>

          <div className="rounded-md border-[1.5px] border-accent/25 bg-[#EDF7F2] p-4">
            <label htmlFor="settings-project-name" className="font-base text-xs font-semibold uppercase tracking-[0.06em] text-muted">
              Project name
            </label>
            <input
              id="settings-project-name"
              type="text"
              value={nameDraft}
              disabled={saveBusy}
              onChange={(e) => {
                setNameDraft(e.target.value)
                setSaveError('')
              }}
              className="input input-bordered mt-2 w-full rounded-full border-[1.5px] border-base-300 bg-base-100 px-4 py-3 font-base text-sm text-base-content focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
            />
            {saveError ? (
              <p className="mt-2 mb-0 font-base text-sm text-error" role="alert">
                {saveError}
              </p>
            ) : null}
            <button
              type="button"
              disabled={
                saveBusy ||
                !nameDraft.trim() ||
                nameDraft.trim() === initialProjectName
              }
              onClick={handleSaveName}
              className="btn btn-primary mt-3 w-full rounded-full border-0 font-base text-sm font-semibold transition-[transform,opacity] duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8"
            >
              {saveBusy ? <span className="loading loading-spinner loading-sm" aria-hidden /> : 'Save name'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleTeam}
            disabled={saveBusy}
            className="group flex min-h-11 w-full items-center justify-between gap-2 rounded-full border-[1.5px] border-base-300 bg-base-100 px-5 py-3 font-base text-sm font-semibold text-base-content transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-[#F4F9F6] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-40"
          >
            Team & collaborators
            <span
              className="text-accent transition-transform duration-150 ease-out group-hover:translate-x-1"
              aria-hidden
            >
              →
            </span>
          </button>

          <div className="rounded-card border-[1.5px] border-error/25 bg-[#FEF2F2] p-4">
            <p className="m-0 font-base text-sm font-semibold text-base-content">Danger zone</p>
            <p className="mt-1 mb-3 font-base text-sm text-muted">
              Deletes photo files from storage and marks this project deleted. This cannot be undone.
            </p>
            <button
              type="button"
              disabled={saveBusy}
              onClick={() => setDeleteOpen(true)}
              className="btn btn-outline min-h-11 w-full rounded-full border-[1.5px] border-error font-base text-sm font-semibold text-error transition-[border-color,background-color,transform] duration-150 ease-out hover:bg-error/10 active:scale-[0.97] sm:w-auto"
            >
              Delete project
            </button>
          </div>
        </div>
      </div>
      <ProjectDeleteConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        token={token}
        projectId={projectId}
        displayName={initialProjectName}
        onDeleted={onProjectDeleted}
      />
    </>,
    document.body
  )
}

ProjectSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  projectId: PropTypes.string.isRequired,
  initialProjectName: PropTypes.string.isRequired,
  collaboratorCount: PropTypes.number.isRequired,
  onRenameSuccess: PropTypes.func.isRequired,
  onOpenTeam: PropTypes.func.isRequired,
  onProjectDeleted: PropTypes.func.isRequired,
}
