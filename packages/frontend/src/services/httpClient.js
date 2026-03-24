/**
 * @returns {string}
 */
export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

/**
 * @param {unknown} parsed
 * @returns {parsed is { error: boolean; message: string; data: unknown }}
 */
export function isApiEnvelope(parsed) {
  if (parsed === null || typeof parsed !== 'object') return false
  const o = /** @type {Record<string, unknown>} */ (parsed)
  return (
    typeof o.error === 'boolean' &&
    typeof o.message === 'string' &&
    'data' in o
  )
}

/**
 * @param {string} path
 * @param {{ token?: string; method?: string; body?: unknown }} [options]
 * @returns {Promise<{ ok: boolean; status: number; error: boolean; message: string; data: unknown }>}
 */
export async function apiFetch(path, options = {}) {
  const { token, method = 'GET', body } = options
  const base = getApiBaseUrl()
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  /** @type {Record<string, string>} */
  const headers = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  /** @type {unknown} */
  let parsed = null
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const text = await res.text()
    if (text) {
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = null
      }
    }
  }
  if (!isApiEnvelope(parsed)) {
    return {
      ok: false,
      status: res.status,
      error: true,
      message: `Request failed (${res.status})`,
      data: null,
    }
  }
  const ok = res.ok && !parsed.error
  return {
    ok,
    status: res.status,
    error: parsed.error,
    message: parsed.message,
    data: parsed.data,
  }
}
