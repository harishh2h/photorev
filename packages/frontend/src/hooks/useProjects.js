import { useState, useEffect, useCallback, useRef } from 'react'
import { listProjects } from '@/services/projectService.js'

const PROJECTS_PAGE_SIZE = 12

/**
 * @param {string | null} token
 * @returns {{
 *   projects: object[]
 *   isLoading: boolean
 *   isLoadingMore: boolean
 *   hasMore: boolean
 *   error: string | null
 *   refetch: () => Promise<void>
 *   loadMore: () => Promise<void>
 * }}
 */
export function useProjects(token) {
  const [projects, setProjects] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const loadMoreInFlight = useRef(false)

  const fetchPage = useCallback(
    async (pageNum, { append }) => {
      if (!token) {
        setProjects([])
        setTotal(0)
        setPage(1)
        setError(null)
        return
      }
      const result = await listProjects(token, {
        page: pageNum,
        pageSize: PROJECTS_PAGE_SIZE,
        isActive: true,
      })
      setTotal(result.total)
      setPage(pageNum)
      setProjects((prev) => (append ? [...prev, ...result.items] : result.items))
    },
    [token],
  )

  const refetch = useCallback(async () => {
    if (!token) {
      setProjects([])
      setTotal(0)
      setPage(1)
      setIsLoading(false)
      setIsLoadingMore(false)
      setError(null)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      await fetchPage(1, { append: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects'
      setError(message)
      setProjects([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [token, fetchPage])

  const loadMore = useCallback(async () => {
    if (!token || isLoading || isLoadingMore || loadMoreInFlight.current) return
    if (projects.length >= total) return
    loadMoreInFlight.current = true
    setIsLoadingMore(true)
    setError(null)
    try {
      await fetchPage(page + 1, { append: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects'
      setError(message)
    } finally {
      setIsLoadingMore(false)
      loadMoreInFlight.current = false
    }
  }, [token, isLoading, isLoadingMore, projects.length, total, page, fetchPage])

  useEffect(() => {
    refetch()
  }, [refetch])

  const hasMore = projects.length < total

  return { projects, isLoading, isLoadingMore, hasMore, error, refetch, loadMore }
}
