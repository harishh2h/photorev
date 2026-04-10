import { useState, useEffect, useRef } from 'react'
import { getApiBaseUrl } from '@/services/httpClient.js'

/**
 * Fetches `/photos/:photoId/content` with Bearer auth and exposes a blob URL for <img src>.
 * Revokes the object URL on change or unmount.
 * @param {string | null | undefined} photoId
 * @param {string | null | undefined} token
 * @returns {{ objectUrl: string | null; isLoading: boolean }}
 */
export function usePhotoContentBlobUrl(photoId, token) {
  const [objectUrl, setObjectUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const urlRef = useRef(null)
  useEffect(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    setObjectUrl(null)
    if (!photoId || !token) {
      setIsLoading(false)
      return undefined
    }
    let cancelled = false
    setIsLoading(true)
    const base = getApiBaseUrl()
    const url = `${base}/photos/${encodeURIComponent(photoId)}/content`
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok || cancelled) {
          return null
        }
        return res.blob()
      })
      .then((blob) => {
        if (cancelled || !blob) {
          return
        }
        const next = URL.createObjectURL(blob)
        urlRef.current = next
        setObjectUrl(next)
      })
      .catch(() => {
        if (!cancelled) {
          setObjectUrl(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })
    return () => {
      cancelled = true
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [photoId, token])
  return { objectUrl, isLoading }
}
