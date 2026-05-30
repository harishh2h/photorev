/**
 * @returns {string}
 */
export function getApiBaseUrl() {
  if (typeof window === 'undefined') return ''

  // 1. Runtime config — injected by docker/frontend-entrypoint.sh at container start.
  //    Set API_URL env var on the container; no image rebuild needed.
  //    Works for Cloudflare, custom domains, any deployment.
  const runtimeUrl = window.__APP_CONFIG__?.apiUrl
  if (runtimeUrl) return runtimeUrl.replace(/\/$/, '')

  // 2. Build-time env (VITE_API_URL) — kept for explicit local overrides.
  const buildUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

  // 3. No URL configured — auto-derive from current hostname + default port 3000.
  //    Works transparently for local dev, LAN, and Docker on any server.
  if (!buildUrl) {
    return `${window.location.protocol}//${window.location.hostname}:3000`
  }

  // 4. Build URL points at localhost but browser is on a different host
  //    (LAN device, Docker port-mapped to remote IP) — rewrite hostname only.
  try {
    const url = new URL(buildUrl)
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.hostname = window.location.hostname
      return url.origin
    }
  } catch {
    // keep as-is
  }

  return buildUrl
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
