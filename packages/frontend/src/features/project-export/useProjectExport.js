import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createProjectExport,
  createShareExport,
  fetchProjectExportStatus,
  fetchProjectExportZipBlob,
  fetchShareExportStatus,
  fetchShareExportZipBlob,
} from '@/services/projectExportService.js'
import { clearActiveExport, readActiveExport, writeActiveExport } from './exportStorage.js'
import { EXPORT_VARIANT_LABELS } from './exportLabels.js'

const POLL_MS = 2500
const ACTIVE_STATUSES = new Set(['queued', 'processing', 'done', 'failed'])

/**
 * @param {Blob} blob
 * @param {string} filename
 */
function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function phaseFromStatus(status, downloadAvailable) {
  if (status === 'queued' || status === 'processing') return 'polling'
  if (status === 'done' && downloadAvailable) return 'ready'
  if (status === 'failed') return 'failed'
  if (status === 'expired') return 'idle'
  return 'idle'
}

/**
 * @param {{
 *   mode: 'project' | 'share';
 *   token: string;
 *   projectId?: string;
 *   shareToken?: string;
 *   unlockToken?: string | null;
 *   projectName: string;
 *   storageKey: string;
 *   reviewScope?: string;
 *   activeFilter?: string;
 * }} config
 */
export function useProjectExport({
  mode,
  token,
  projectId,
  shareToken,
  unlockToken = null,
  projectName,
  storageKey,
  reviewScope = 'mine',
  activeFilter = 'all',
}) {
  const [exportJob, setExportJob] = useState(null)
  const [phase, setPhase] = useState('idle')
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeVariant, setActiveVariant] = useState(null)
  const exportIdRef = useRef(null)
  const restoredRef = useRef(false)

  const fetchStatus = useCallback(
    async (exportId) => {
      if (mode === 'project' && projectId) {
        return fetchProjectExportStatus(token, projectId, exportId)
      }
      if (mode === 'share' && shareToken) {
        return fetchShareExportStatus(shareToken, exportId, unlockToken)
      }
      return null
    },
    [mode, token, projectId, shareToken, unlockToken],
  )

  const applyJob = useCallback(
    (row, variant) => {
      if (!row) return
      setExportJob(row)
      if (variant) setActiveVariant(variant)
      const nextPhase = phaseFromStatus(row.status, row.downloadAvailable)
      setPhase(nextPhase)
      if (ACTIVE_STATUSES.has(row.status)) {
        setPanelOpen(true)
      }
    },
    [],
  )

  useEffect(() => {
    if (!storageKey || restoredRef.current) return undefined
    restoredRef.current = true
    const saved = readActiveExport(storageKey)
    if (!saved?.exportId) return undefined

    let cancelled = false
    exportIdRef.current = saved.exportId
    setActiveVariant(saved.variant)

    void (async () => {
      try {
        const row = await fetchStatus(saved.exportId)
        if (cancelled) return
        if (!row || row.status === 'expired') {
          clearActiveExport(storageKey)
          return
        }
        applyJob(row, saved.variant)
      } catch {
        /* ignore restore errors */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [storageKey, fetchStatus, applyJob])

  useEffect(() => {
    const exportId = exportIdRef.current
    if (!exportId || phase !== 'polling') return undefined
    let cancelled = false

    const tick = async () => {
      try {
        const row = await fetchStatus(exportId)
        if (cancelled || !row) return
        setExportJob(row)
        if (row.status === 'done' && row.downloadAvailable) {
          setPhase('ready')
        } else if (row.status === 'failed' || row.status === 'expired') {
          setPhase(row.status === 'failed' ? 'failed' : 'idle')
          if (row.status === 'expired') clearActiveExport(storageKey)
        }
      } catch {
        /* transient */
      }
    }

    void tick()
    const id = window.setInterval(() => {
      void tick()
    }, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [phase, fetchStatus, storageKey])

  const startExport = useCallback(
    async (variant) => {
      setError(null)
      setActiveVariant(variant)
      setPanelOpen(true)
      setPhase('starting')
      try {
        const created =
          mode === 'project' && projectId
            ? await createProjectExport(token, projectId, variant, {
                scope: reviewScope,
                filter: activeFilter,
              })
            : mode === 'share' && shareToken
              ? await createShareExport(shareToken, variant, unlockToken)
              : null
        if (!created) throw new Error('Could not start export')
        exportIdRef.current = created.id
        writeActiveExport(storageKey, {
          exportId: created.id,
          variant,
          projectName,
        })
        setExportJob(created)
        if (created.reused && created.downloadAvailable) {
          setPhase('ready')
        } else if (created.status === 'done' && created.downloadAvailable) {
          setPhase('ready')
        } else {
          setPhase('polling')
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Could not start export'))
        setPhase('idle')
        setPanelOpen(false)
      }
    },
    [mode, token, projectId, shareToken, unlockToken, storageKey, projectName, reviewScope, activeFilter],
  )

  const downloadZip = useCallback(
    async (filename) => {
      const exportId = exportIdRef.current
      if (!exportId || !exportJob?.downloadAvailable) return
      setDownloading(true)
      setError(null)
      try {
        const blob =
          mode === 'project' && projectId
            ? await fetchProjectExportZipBlob(token, projectId, exportId)
            : mode === 'share' && shareToken
              ? await fetchShareExportZipBlob(shareToken, exportId, unlockToken)
              : null
        if (!blob) throw new Error('Download failed')
        triggerBlobDownload(blob, filename)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Download failed'))
      } finally {
        setDownloading(false)
      }
    },
    [mode, token, projectId, shareToken, unlockToken, exportJob],
  )

  const dismissPanel = useCallback(() => {
    setPanelOpen(false)
  }, [])

  const reopenPanel = useCallback(() => {
    setPanelOpen(true)
  }, [])

  const clearExport = useCallback(() => {
    exportIdRef.current = null
    setExportJob(null)
    setPhase('idle')
    setError(null)
    setDownloading(false)
    setPanelOpen(false)
    setActiveVariant(null)
    clearActiveExport(storageKey)
  }, [storageKey])

  const zipName = `${(projectName || 'project').replace(/[^\w\s-]/g, '').trim() || 'project'}-selected.zip`
  const variantLabel = activeVariant ? EXPORT_VARIANT_LABELS[activeVariant] : null
  const showPanel = panelOpen && phase !== 'idle'
  const isPreparing = phase === 'starting' || phase === 'polling'
  const progress = exportJob?.progressPercent ?? 0
  const hasActiveJob = phase !== 'idle'
  const showResumeChip = hasActiveJob && !panelOpen

  return {
    exportJob,
    phase,
    error,
    downloading,
    showPanel,
    isPreparing,
    progress,
    variantLabel,
    zipName,
    startExport,
    downloadZip,
    dismissPanel,
    reopenPanel,
    clearExport,
    showResumeChip,
    hasActiveJob,
    isBusy: isPreparing || downloading,
  }
}
