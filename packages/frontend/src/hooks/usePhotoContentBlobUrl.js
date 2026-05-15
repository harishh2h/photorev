import { useState, useEffect, useRef } from 'react'
import { getApiBaseUrl, notifyUnauthorized } from '@/services/httpClient.js'

/**
 * Fetches `/photos/:photoId/content` with Bearer auth and exposes a blob URL for <img src>.
 * Revokes the object URL on change or unmount.
 * @param {string | null | undefined} photoId
 * @param {string | null | undefined} token
 * @param {'thumbnail' | 'preview' | 'original'} [variant]
 * @returns {{ objectUrl: string | null; isLoading: boolean }}
 */
export function usePhotoContentBlobUrl(photoId, token, variant = 'thumbnail') {
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
    const qs = new URLSearchParams()
    qs.set('variant', variant)
    const url = `${base}/photos/${encodeURIComponent(photoId)}/content?${qs.toString()}`
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!cancelled && res.status === 401) {
          notifyUnauthorized()
        }
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
  }, [photoId, token, variant])
  return { objectUrl, isLoading }
}
