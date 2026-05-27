import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { getProject } from '@/services/projectService.js'
import { fetchProjectGrid, fetchPendingPhotoStatuses } from '@/services/projectGridService.js'
import { listProjectMembers } from '@/services/projectMemberService.js'
import { hasTeamConflict, needsOwnerDecision } from '@/utils/projectReviewFilters.js'

const PENDING_POLL_MS = 2500
const GRID_PAGE_SIZE = 100

function collaboratorRoleLabel(member) {
  if (member != null && member.isCreator === true) return 'Owner'
  const role = typeof member?.role === 'string' ? member.role : ''
  if (role === 'viewer') return 'Viewer'
  if (role === 'contributor') return 'Contributor'
  return 'Reviewer'
}

/**
 * @param {object} p
 * @returns {object}
 */
function mapGridItemToPhoto(p) {
  const rawStatus = typeof p.status === 'string' ? p.status : 'pending'
  const status =
    rawStatus === 'ready' || rawStatus === 'failed' || rawStatus === 'trashed'
      ? rawStatus
      : 'pending'
  const conflictState = typeof p.conflictState === 'string' ? p.conflictState : null
  const finalDecision = typeof p.teamDecision === 'number' ? p.teamDecision : null
  const myDecision = typeof p.myDecision === 'number' ? p.myDecision : null
  const renamedTo = typeof p.renamedTo === 'string' ? p.renamedTo : null
  const myIsLiked = myDecision === 1
  const myIsRejected = myDecision === -1
  const myIsUnreviewed = myDecision === null
  const teamIsLiked = finalDecision === 1
  const teamIsRejected = finalDecision === -1

  return {
    id: p.id,
    alt: typeof p.originalName === 'string' ? p.originalName : 'Photo',
    status,
    width: typeof p.width === 'number' && p.width > 0 ? p.width : null,
    height: typeof p.height === 'number' && p.height > 0 ? p.height : null,
    blurhash: typeof p.blurhash === 'string' ? p.blurhash : null,
    myDecision,
    myIsLiked,
    myIsRejected,
    myIsUnreviewed,
    teamIsLiked,
    teamIsRejected,
    isLiked: myIsLiked,
    isRejected: myIsRejected,
    hasConflict: hasTeamConflict(conflictState),
    needsOwnerDecision: needsOwnerDecision(conflictState),
    conflictState,
    finalDecision,
    finalDecidedBy: null,
    finalDecidedAt: null,
    isTrashed: status === 'trashed',
    selectionLabel: renamedTo ? renamedTo : null,
    renamedTo,
  }
}

/**
 * @param {object[]} allPhotos
 * @param {object} project
 * @param {object[]} members
 * @param {{ id?: string; name?: string; email?: string } | null} currentUser
 * @param {object | null} filterCounts
 */
function buildViewData(allPhotos, project, members, currentUser, filterCounts) {
  const visiblePhotos = allPhotos.filter((p) => p.status !== 'trashed')
  const trashedPhotos = allPhotos.filter((p) => p.status === 'trashed')
  const votedPhotoIds = new Set(
    allPhotos.filter((p) => p.myDecision !== null && p.myDecision !== undefined).map((p) => p.id),
  )
  const totalPhotos = visiblePhotos.length
  const reviewProgressPercent =
    totalPhotos > 0 ? Math.min(100, Math.round((votedPhotoIds.size / totalPhotos) * 100)) : 0
  const vc = project.viewerContext
  const canReviewPhotos = vc == null ? true : Boolean(vc.isCreator === true || vc.role !== 'viewer')
  const canUploadPhotos = vc == null ? true : Boolean(vc.isCreator === true || vc.role === 'contributor')
  const isProjectCreator = Boolean(vc?.isCreator)

  let collaboratorMembers = members.map((m) => ({
    id: m.userId,
    name: m.name || m.email || 'Member',
    initial: (m.name || m.email || '?').charAt(0).toUpperCase(),
    roleLabel: collaboratorRoleLabel(m),
  }))
  if (collaboratorMembers.length === 0 && currentUser != null) {
    const label = currentUser.name || currentUser.email || 'You'
    collaboratorMembers = [
      {
        id: currentUser.id != null ? String(currentUser.id) : 'self',
        name: label,
        initial: label.charAt(0).toUpperCase(),
        roleLabel: isProjectCreator ? 'Owner' : '',
      },
    ]
  }
  const others = Math.max(0, collaboratorMembers.length - 1)
  const counts = filterCounts ?? {
    mine: { all: 0, liked: 0, rejected: 0, unreviewed: 0 },
    team: { all: 0, liked: 0, rejected: 0 },
    conflicts: 0,
    pendingConflicts: 0,
    trashed: 0,
    viewerSelected: 0,
  }

  return {
    projectTitle: typeof project.name === 'string' ? project.name : 'Project',
    projectStatus: typeof project.status === 'string' ? project.status : 'active',
    isFinalized: project.status === 'finalized',
    finalizedAt: typeof project.finalizedAt === 'string' ? project.finalizedAt : null,
    collaboratingLabel: others > 0 ? `REVIEWING WITH ${others} OTHER${others === 1 ? '' : 'S'}` : 'SOLO REVIEW',
    reviewProgressPercent,
    sidebarStats: {
      mine: {
        liked: counts.mine.liked,
        rejected: counts.mine.rejected,
        progressPercent: reviewProgressPercent,
      },
      team: {
        liked: counts.team.liked,
        rejected: counts.team.rejected,
        pendingConflicts: counts.pendingConflicts,
      },
      viewer: {
        selected: counts.viewerSelected,
      },
    },
    collaboratorMembers,
    collaboratorsRows: members,
    viewerContext: vc ?? null,
    canReviewPhotos,
    canUploadPhotos,
    isProjectCreator,
    filterCounts: {
      mine: counts.mine,
      team: counts.team,
      conflicts: counts.conflicts,
      pendingConflicts: counts.pendingConflicts,
      trashed: counts.trashed,
    },
    photos: visiblePhotos,
    trashedPhotos,
  }
}

/**
 * @param {string | undefined} projectId
 * @param {string | null} token
 * @param {{ id?: string; name?: string; email?: string } | null} currentUser
 */
export function useProjectViewData(projectId, token, currentUser) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [loadedCount, setLoadedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const prevScopeRef = useRef(null)
  const gridPageRef = useRef(1)
  const projectRef = useRef(null)
  const membersRef = useRef([])
  const filterCountsRef = useRef(null)
  const allPhotosRef = useRef([])

  const refetch = useCallback(() => {
    setReloadKey((k) => k + 1)
  }, [])

  useEffect(() => {
    const prev = prevScopeRef.current
    if (prev == null) {
      prevScopeRef.current = { projectId, token }
      return
    }
    if (prev.projectId !== projectId || prev.token !== token) {
      prevScopeRef.current = { projectId, token }
      setReloadKey(0)
      setData(null)
      setIsLoading(true)
      setIsRefreshing(false)
      setIsLoadingMore(false)
      setError(null)
      setLoadedCount(0)
      setTotalCount(0)
      gridPageRef.current = 1
      allPhotosRef.current = []
    }
  }, [projectId, token])

  useEffect(() => {
    if (!projectId || !token) {
      setData(null)
      setIsLoading(false)
      setIsRefreshing(false)
      setError(!token ? 'Sign in required' : null)
      return undefined
    }
    const isColdLoad = reloadKey === 0
    let cancelled = false

    async function run() {
      if (isColdLoad) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setError(null)
      gridPageRef.current = 1
      allPhotosRef.current = []

      try {
        const [project, grid, members] = await Promise.all([
          getProject(token, projectId),
          fetchProjectGrid(token, projectId, { page: 1, pageSize: GRID_PAGE_SIZE }),
          listProjectMembers(token, projectId),
        ])
        if (cancelled) return

        projectRef.current = project
        membersRef.current = members
        filterCountsRef.current = grid.filterCounts ?? null
        const mapped = grid.items.map(mapGridItemToPhoto)
        allPhotosRef.current = mapped
        setLoadedCount(mapped.length)
        setTotalCount(grid.total)
        setData(buildViewData(mapped, project, members, currentUser, grid.filterCounts ?? null))
      } catch (err) {
        if (!cancelled) {
          if (isColdLoad) setData(null)
          setError(err instanceof Error ? err.message : 'Failed to load project')
        }
      } finally {
        if (!cancelled) {
          if (isColdLoad) setIsLoading(false)
          else setIsRefreshing(false)
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [projectId, token, reloadKey, currentUser?.id, currentUser?.name, currentUser?.email])

  const loadMorePhotos = useCallback(async () => {
    if (!projectId || !token || isLoadingMore) return
    if (loadedCount >= totalCount) return

    setIsLoadingMore(true)
    try {
      const nextPage = gridPageRef.current + 1
      const grid = await fetchProjectGrid(token, projectId, {
        page: nextPage,
        pageSize: GRID_PAGE_SIZE,
      })
      gridPageRef.current = nextPage
      const mapped = grid.items.map(mapGridItemToPhoto)
      allPhotosRef.current = [...allPhotosRef.current, ...mapped]
      setLoadedCount(allPhotosRef.current.length)
      setTotalCount(grid.total)
      if (projectRef.current) {
        setData(
          buildViewData(
            allPhotosRef.current,
            projectRef.current,
            membersRef.current,
            currentUser,
            filterCountsRef.current,
          ),
        )
      }
    } catch {
      /* keep existing grid on pagination failure */
    } finally {
      setIsLoadingMore(false)
    }
  }, [projectId, token, isLoadingMore, loadedCount, totalCount, currentUser])

  const hasMorePhotos = loadedCount < totalCount

  const pendingPhotoIds = useMemo(() => {
    if (!data?.photos?.length) return []
    return data.photos.filter((p) => p.status === 'pending').map((p) => p.id)
  }, [data?.photos])

  useEffect(() => {
    if (!projectId || !token || pendingPhotoIds.length === 0) {
      return undefined
    }

    let cancelled = false
    const poll = async () => {
      try {
        const updates = await fetchPendingPhotoStatuses(token, projectId, pendingPhotoIds)
        if (cancelled || updates.length === 0) return

        const statusById = new Map(updates.map((row) => [row.id, row.status]))
        let changed = false
        allPhotosRef.current = allPhotosRef.current.map((photo) => {
          const nextStatus = statusById.get(photo.id)
          if (!nextStatus || nextStatus === photo.status) {
            return photo
          }
          changed = true
          const normalized =
            nextStatus === 'ready' || nextStatus === 'failed' || nextStatus === 'trashed'
              ? nextStatus
              : 'pending'
          return {
            ...photo,
            status: normalized,
            isTrashed: normalized === 'trashed',
          }
        })

        if (changed && projectRef.current) {
          setData(
            buildViewData(
              allPhotosRef.current,
              projectRef.current,
              membersRef.current,
              currentUser,
              filterCountsRef.current,
            ),
          )
        }
      } catch {
        /* ignore transient poll errors */
      }
    }

    const id = window.setInterval(poll, PENDING_POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [pendingPhotoIds, projectId, token, currentUser])

  return {
    data,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    refetch,
    loadMorePhotos,
    hasMorePhotos,
  }
}
