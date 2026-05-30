import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { getProject } from '@/services/projectService.js'
import { fetchProjectGrid, fetchPendingPhotoStatuses } from '@/services/projectGridService.js'
import { listProjectMembers } from '@/services/projectMemberService.js'
import { hasTeamConflict, needsOwnerDecision, REVIEW_SCOPE, PHOTO_FILTER } from '@/utils/projectReviewFilters.js'

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
 * @param {boolean} canReviewPhotos
 * @param {string} reviewScope
 * @param {string} activeFilter
 * @returns {{ scope: string; filter: string }}
 */
function resolveGridQuery(canReviewPhotos, reviewScope, activeFilter) {
  if (!canReviewPhotos) {
    return { scope: REVIEW_SCOPE.TEAM, filter: PHOTO_FILTER.LIKED }
  }
  return { scope: reviewScope, filter: activeFilter }
}

/**
 * @param {object[]} gridPhotos
 * @param {object} project
 * @param {object[]} members
 * @param {{ id?: string; name?: string; email?: string } | null} currentUser
 * @param {object | null} filterCounts
 */
function buildViewData(gridPhotos, project, members, currentUser, filterCounts) {
  const visiblePhotos = gridPhotos.filter((p) => p.status !== 'trashed')
  const trashedPhotos = gridPhotos.filter((p) => p.status === 'trashed')
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
  const reviewProgressPercent =
    counts.mine.all > 0
      ? Math.min(100, Math.round(((counts.mine.all - counts.mine.unreviewed) / counts.mine.all) * 100))
      : 0

  return {
    projectTitle: typeof project.name === 'string' ? project.name : 'Project',
    projectStatus: typeof project.status === 'string' ? project.status : 'active',
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
    photos: canReviewPhotos ? visiblePhotos : visiblePhotos.filter((p) => p.teamIsLiked),
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
  const [isLoadingGrid, setIsLoadingGrid] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [loadedCount, setLoadedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [reviewScope, setReviewScope] = useState(REVIEW_SCOPE.MINE)
  const [activeFilter, setActiveFilter] = useState(PHOTO_FILTER.ALL)
  const prevScopeRef = useRef(null)
  const gridPageRef = useRef(1)
  const projectRef = useRef(null)
  const membersRef = useRef([])
  const filterCountsRef = useRef(null)
  const gridPhotosRef = useRef([])
  const canReviewPhotosRef = useRef(true)
  const [projectReady, setProjectReady] = useState(false)

  const refetch = useCallback(() => {
    setReloadKey((k) => k + 1)
  }, [])

  const setReviewScopeAndReset = useCallback((scope) => {
    setReviewScope(scope)
    setActiveFilter(PHOTO_FILTER.ALL)
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
      setIsLoadingGrid(false)
      setIsLoadingMore(false)
      setError(null)
      setLoadedCount(0)
      setTotalCount(0)
      setReviewScope(REVIEW_SCOPE.MINE)
      setActiveFilter(PHOTO_FILTER.ALL)
      gridPageRef.current = 1
      gridPhotosRef.current = []
      projectRef.current = null
      setProjectReady(false)
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
      setProjectReady(false)

      try {
        const [project, members] = await Promise.all([
          getProject(token, projectId),
          listProjectMembers(token, projectId),
        ])
        if (cancelled) return

        projectRef.current = project
        membersRef.current = members
        const vc = project.viewerContext
        const canReview = vc == null ? true : Boolean(vc.isCreator === true || vc.role !== 'viewer')
        canReviewPhotosRef.current = canReview
        const isCreator = Boolean(vc?.isCreator)
        if (isCreator) {
          setReviewScope(REVIEW_SCOPE.TEAM)
        } else if (canReview) {
          setReviewScope(REVIEW_SCOPE.MINE)
        }
        setProjectReady(true)
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

  useEffect(() => {
    if (!projectId || !token || !projectReady || !projectRef.current) {
      return undefined
    }
    let cancelled = false

    async function run() {
      setIsLoadingGrid(true)
      setError(null)
      gridPageRef.current = 1
      gridPhotosRef.current = []

      const query = resolveGridQuery(canReviewPhotosRef.current, reviewScope, activeFilter)

      try {
        const grid = await fetchProjectGrid(token, projectId, {
          page: 1,
          pageSize: GRID_PAGE_SIZE,
          scope: query.scope,
          filter: query.filter,
        })
        if (cancelled) return

        filterCountsRef.current = grid.filterCounts ?? null
        const mapped = grid.items.map(mapGridItemToPhoto)
        gridPhotosRef.current = mapped
        setLoadedCount(mapped.length)
        setTotalCount(grid.total)
        setData(
          buildViewData(
            mapped,
            projectRef.current,
            membersRef.current,
            currentUser,
            grid.filterCounts ?? null,
          ),
        )
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load photos')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingGrid(false)
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [
    projectId,
    token,
    reviewScope,
    activeFilter,
    reloadKey,
    projectReady,
    currentUser?.id,
    currentUser?.name,
    currentUser?.email,
  ])

  const loadMorePhotos = useCallback(async () => {
    if (!projectId || !token || isLoadingMore || !projectRef.current) return
    if (loadedCount >= totalCount) return

    setIsLoadingMore(true)
    const query = resolveGridQuery(canReviewPhotosRef.current, reviewScope, activeFilter)
    try {
      const nextPage = gridPageRef.current + 1
      const grid = await fetchProjectGrid(token, projectId, {
        page: nextPage,
        pageSize: GRID_PAGE_SIZE,
        scope: query.scope,
        filter: query.filter,
      })
      gridPageRef.current = nextPage
      const mapped = grid.items.map(mapGridItemToPhoto)
      gridPhotosRef.current = [...gridPhotosRef.current, ...mapped]
      setLoadedCount(gridPhotosRef.current.length)
      setTotalCount(grid.total)
      filterCountsRef.current = grid.filterCounts ?? filterCountsRef.current
      setData(
        buildViewData(
          gridPhotosRef.current,
          projectRef.current,
          membersRef.current,
          currentUser,
          filterCountsRef.current,
        ),
      )
    } catch {
      /* keep existing grid on pagination failure */
    } finally {
      setIsLoadingMore(false)
    }
  }, [projectId, token, isLoadingMore, loadedCount, totalCount, reviewScope, activeFilter, currentUser])

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

        const updateById = new Map(updates.map((row) => [row.id, row]))
        let changed = false
        gridPhotosRef.current = gridPhotosRef.current.map((photo) => {
          const update = updateById.get(photo.id)
          if (!update) {
            return photo
          }

          const nextStatus =
            update.status === 'ready' || update.status === 'failed' || update.status === 'trashed'
              ? update.status
              : 'pending'
          const nextWidth =
            typeof update.width === 'number' && update.width > 0 ? update.width : photo.width
          const nextHeight =
            typeof update.height === 'number' && update.height > 0 ? update.height : photo.height
          const nextBlurhash =
            typeof update.blurhash === 'string' ? update.blurhash : photo.blurhash

          if (
            nextStatus === photo.status &&
            nextWidth === photo.width &&
            nextHeight === photo.height &&
            nextBlurhash === photo.blurhash
          ) {
            return photo
          }

          changed = true
          return {
            ...photo,
            status: nextStatus,
            width: nextWidth,
            height: nextHeight,
            blurhash: nextBlurhash,
            isTrashed: nextStatus === 'trashed',
          }
        })

        if (changed && projectRef.current) {
          setData(
            buildViewData(
              gridPhotosRef.current,
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
    isLoadingGrid,
    isLoadingMore,
    error,
    refetch,
    loadMorePhotos,
    hasMorePhotos,
    reviewScope,
    activeFilter,
    setReviewScope: setReviewScopeAndReset,
    setActiveFilter,
  }
}
