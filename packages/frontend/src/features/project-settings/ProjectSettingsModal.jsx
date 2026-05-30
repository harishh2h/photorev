import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { updateProject } from '@/services/projectService.js'
import ProjectDeleteConfirmModal from './ProjectDeleteConfirmModal.jsx'
import ProjectSettingsDeleteSection from './ProjectSettingsDeleteSection.jsx'
import ProjectSettingsNameSection from './ProjectSettingsNameSection.jsx'

/**
 * @param {{ isOpen: boolean; onClose: () => void; token: string; projectId: string; initialProjectName: string; onRenameSuccess: () => void; onProjectDeleted: () => void }} props
 */
export default function ProjectSettingsModal({
  isOpen,
  onClose,
  token,
  projectId,
  initialProjectName,
  onRenameSuccess,
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

  const trimmedName = nameDraft.trim()
  const canSave = Boolean(trimmedName) && trimmedName !== initialProjectName

  const handleSaveName = useCallback(async () => {
    if (!canSave) return
    setSaveBusy(true)
    setSaveError('')
    try {
      await updateProject(token, projectId, { name: trimmedName })
      onRenameSuccess()
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaveBusy(false)
    }
  }, [canSave, onClose, onRenameSuccess, projectId, token, trimmedName])

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
          className="flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col gap-5 overflow-y-auto rounded-t-[32px] border-[1.5px] border-base-300 bg-base-100 p-5 shadow-modal md:rounded-[32px] md:p-6"
          role="dialog"
          aria-labelledby="project-settings-title"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 id="project-settings-title" className="m-0 font-base text-xl font-semibold text-base-content">
              Project settings
            </h2>
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-[1.5px] border-base-300 bg-base-100 font-base text-lg text-muted transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent-mid hover:bg-surface-hover hover:text-base-content active:scale-[0.94] focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-40"
              aria-label="Close"
              disabled={saveBusy || deleteOpen}
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <ProjectSettingsNameSection
            nameDraft={nameDraft}
            saveBusy={saveBusy}
            saveError={saveError}
            canSave={canSave}
            onNameChange={(value) => {
              setNameDraft(value)
              setSaveError('')
            }}
            onSave={handleSaveName}
          />

          <ProjectSettingsDeleteSection disabled={saveBusy} onDelete={() => setDeleteOpen(true)} />
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
  onRenameSuccess: PropTypes.func.isRequired,
  onProjectDeleted: PropTypes.func.isRequired,
}
