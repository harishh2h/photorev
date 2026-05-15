/**
 * @returns {string}
 */
export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

/** @type {(() => void) | null} */
let unauthorizedHandler = null

/**
 * Registers global handler invoked when authenticated API responds 401 (expired session, etc.).
 * @param {(() => void) | null} fn
 */
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn
}

/** Clears JWT session and redirects to login when registered handler is set */
export function notifyUnauthorized() {
  if (typeof unauthorizedHandler === 'function') {
    unauthorizedHandler()
  }
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
 * @param {{ token?: string; method?: string; body?: unknown; skipUnauthorizedHandler?: boolean }} [options]
 * @returns {Promise<{ ok: boolean; status: number; error: boolean; message: string; data: unknown }>}
 */
export async function apiFetch(path, options = {}) {
  const { token, method = 'GET', body, skipUnauthorizedHandler } = options
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
  const status = res.status
  const unauthorized = status === 401
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
    const out = {
      ok: false,
      status,
      error: true,
      message: `Request failed (${status})`,
      data: null,
    }
    if (unauthorized && !skipUnauthorizedHandler) {
      notifyUnauthorized()
    }
    return out
  }
  const ok = res.ok && !parsed.error
  const out = {
    ok,
    status,
    error: parsed.error,
    message: parsed.message,
    data: parsed.data,
  }
  if (unauthorized && !skipUnauthorizedHandler) {
    notifyUnauthorized()
  }
  return out
}
