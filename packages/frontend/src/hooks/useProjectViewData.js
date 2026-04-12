import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { getProject } from '@/services/projectService.js'
import { listPhotos } from '@/services/photoService.js'
import { listMyPhotoReviews } from '@/services/photoReviewService.js'
import { listProjectMembers } from '@/services/projectMemberService.js'

const PENDING_POLL_MS = 2500

/**
 * @param {string | undefined} projectId
 * @param {string | null} token
 * @param {{ id?: string; name?: string; email?: string } | null} currentUser
 * @returns {{ data: object | null; isLoading: boolean; isRefreshing: boolean; error: string | null; refetch: () => void }}
 */
export function useProjectViewData(projectId, token, currentUser) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  /** @type {import('react').MutableRefObject<{ projectId: string | undefined; token: string | null } | null>} */
  const prevScopeRef = useRef(null)
  const isRefreshingRef = useRef(false)
  isRefreshingRef.current = isRefreshing

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
      setError(null)
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
    async function loadAllPhotos() {
      const first = await listPhotos(token, { projectId, page: 1, pageSize: 100 })
      const items = [...first.items]
      let page = 1
      while (items.length < first.total && page < 25) {
        page += 1
        const next = await listPhotos(token, { projectId, page, pageSize: 100 })
        items.push(...next.items)
        if (next.items.length === 0) break
      }
      return items
    }
    async function loadAllReviews() {
      const items = []
      let page = 1
      while (page < 30) {
        const chunk = await listMyPhotoReviews(token, { projectId, page, pageSize: 100 })
        items.push(...chunk.items)
        if (chunk.items.length < chunk.pageSize) break
        page += 1
      }
      return items
    }
    async function run() {
      if (isColdLoad) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setError(null)
      try {
        const [project, photoItems, reviewItems, members] = await Promise.all([
          getProject(token, projectId),
          loadAllPhotos(),
          loadAllReviews(),
          listProjectMembers(token, projectId),
        ])
        if (cancelled) return
        const decisionByPhoto = new Map()
        reviewItems.forEach((r) => {
          decisionByPhoto.set(r.photoId, r.decision)
        })
        const photos = photoItems.map((p) => {
          const dec = decisionByPhoto.get(p.id)
          const rawStatus = typeof p.status === 'string' ? p.status : 'pending'
          const status = rawStatus === 'ready' || rawStatus === 'failed' ? rawStatus : 'pending'
          return {
            id: p.id,
            alt: typeof p.originalName === 'string' ? p.originalName : 'Photo',
            status,
            isLiked: dec === 1,
            isRejected: dec === -1,
            hasConflict: false,
            selectionLabel: null,
          }
        })
        const likedCount = photos.filter((p) => p.isLiked).length
        const rejectedCount = photos.filter((p) => p.isRejected).length
        const votedPhotoIds = new Set(
          reviewItems.filter((r) => r.decision !== null && r.decision !== undefined).map((r) => r.photoId)
        )
        const totalPhotos = photos.length
        const reviewProgressPercent =
          totalPhotos > 0 ? Math.min(100, Math.round((votedPhotoIds.size / totalPhotos) * 100)) : 0
        let collaboratorMembers = members.map((m) => ({
          id: m.userId,
          name: m.name || m.email || 'Member',
          initial: (m.name || m.email || '?').charAt(0).toUpperCase(),
        }))
        if (collaboratorMembers.length === 0 && currentUser != null) {
          const label = currentUser.name || currentUser.email || 'You'
          collaboratorMembers = [
            {
              id: currentUser.id != null ? String(currentUser.id) : 'self',
              name: label,
              initial: label.charAt(0).toUpperCase(),
            },
          ]
        }
        const nameParts = collaboratorMembers
          .slice(0, 2)
          .map((m) => m.name)
          .filter(Boolean)
        const likedWithNames = nameParts.length > 0 ? nameParts.join(' and ') : 'your team'
        const others = Math.max(0, collaboratorMembers.length - 1)
        const viewData = {
          projectTitle: typeof project.name === 'string' ? project.name : 'Project',
          collaboratingLabel: others > 0 ? `REVIEWING WITH ${others} OTHER${others === 1 ? '' : 'S'}` : 'SOLO REVIEW',
          likedCount,
          likedWithNames,
          reviewProgressPercent,
          collaboratorMembers,
          filterCounts: {
            all: totalPhotos,
            liked: likedCount,
            rejected: rejectedCount,
            conflicts: 0,
          },
          photos,
        }
        setData(viewData)
      } catch (err) {
        if (!cancelled) {
          if (isColdLoad) {
            setData(null)
          }
          setError(err instanceof Error ? err.message : 'Failed to load project')
        }
      } finally {
        if (!cancelled) {
          if (isColdLoad) {
            setIsLoading(false)
          } else {
            setIsRefreshing(false)
          }
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
    reloadKey,
    currentUser?.id,
    currentUser?.name,
    currentUser?.email,
  ])

  const pendingPollSignature = useMemo(() => {
    if (!data?.photos?.length) {
      return ''
    }
    return data.photos
      .filter((p) => p.status === 'pending')
      .map((p) => p.id)
      .sort()
      .join(',')
  }, [data])

  useEffect(() => {
    if (!projectId || !token) {
      return undefined
    }
    if (!pendingPollSignature) {
      return undefined
    }
    const id = window.setInterval(() => {
      if (isRefreshingRef.current) {
        return
      }
      refetch()
    }, PENDING_POLL_MS)
    return () => window.clearInterval(id)
  }, [pendingPollSignature, projectId, token, refetch])

  return { data, isLoading, isRefreshing, error, refetch }
}
