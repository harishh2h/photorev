import { useState, useEffect, useCallback } from 'react'
import { listProjects } from '@/services/projectService.js'

/**
 * @param {string | null} token
 * @returns {{ projects: object[]; isLoading: boolean; error: string | null; refetch: () => Promise<void> }}
 */
export function useProjects(token) {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const refetch = useCallback(async () => {
    if (!token) {
      setProjects([])
      setIsLoading(false)
      setError(null)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = await listProjects(token, { pageSize: 100, isActive: true })
      setProjects(result.items)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects'
      setError(message)
      setProjects([])
    } finally {
      setIsLoading(false)
    }
  }, [token])
  useEffect(() => {
    refetch()
  }, [refetch])
  return { projects, isLoading, error, refetch }
}
