import { useCallback, useEffect, useState } from 'react'
import { getPublicShareListing, unlockShare } from '@/services/publicShareService.js'

function storageKey(token) {
  return `photorev_share_unlock_${token}`
}

/**
 * @param {string | undefined} token
 */
export function usePublicShare(token) {
  const [unlockToken, setUnlockToken] = useState(() => {
    if (!token || typeof window === 'undefined') return null
    try {
      return window.sessionStorage.getItem(storageKey(token))
    } catch {
      return null
    }
  })
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [requiresPassword, setRequiresPassword] = useState(false)

  const persistUnlock = useCallback(
    (value) => {
      if (!token) return
      try {
        if (value) window.sessionStorage.setItem(storageKey(token), value)
        else window.sessionStorage.removeItem(storageKey(token))
      } catch {
        // ignore quota / privacy errors
      }
    },
    [token]
  )

  const load = useCallback(
    async (passedToken) => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const payload = await getPublicShareListing(token, passedToken ?? unlockToken)
        setListing(payload)
        setRequiresPassword(false)
      } catch (err) {
        if (err && err.status === 401) {
          setRequiresPassword(true)
          setListing(null)
        } else if (err && err.status === 410) {
          setError(err.message || 'Share link no longer available')
          setListing(null)
        } else {
          setError(err instanceof Error ? err.message : 'Could not load share')
          setListing(null)
        }
      } finally {
        setLoading(false)
      }
    },
    [token, unlockToken]
  )

  useEffect(() => {
    if (!token) return
    void load()
  }, [token, load])

  const submitPassword = useCallback(
    async (password) => {
      if (!token) return
      const { unlockToken: next } = await unlockShare(token, password)
      setUnlockToken(next)
      persistUnlock(next)
      await load(next)
    },
    [token, load, persistUnlock]
  )

  const clearSession = useCallback(() => {
    setUnlockToken(null)
    persistUnlock(null)
  }, [persistUnlock])

  return {
    listing,
    loading,
    error,
    requiresPassword,
    unlockToken,
    submitPassword,
    clearSession,
    reload: () => load(),
  }
}
