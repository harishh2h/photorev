import { getApiBaseUrl, isApiEnvelope } from './httpClient.js'

const baseUrl = getApiBaseUrl()

/**
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<{ success: boolean, data?: { token: string, user: { id: string, email: string, name: string } }, message?: string }>}
 */
export async function login({ email, password }) {
  try {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const body = await res.json().catch(() => null)
    if (!isApiEnvelope(body)) {
      return { success: false, message: 'Request failed' }
    }
    if (res.ok && !body.error && body.data && typeof body.data === 'object') {
      const d = /** @type {{ token?: string; user?: { id: string; email: string; name: string } }} */ (
        body.data
      )
      if (d.token && d.user) {
        return {
          success: true,
          data: { token: d.token, user: d.user },
          message: body.message,
        }
      }
    }
    return { success: false, message: body.message || 'Request failed' }
  } catch {
    return { success: false, message: 'Request failed' }
  }
}

/**
 * @param {{ email: string, password: string, name: string }} payload
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
export async function register({ email, password, name }) {
  try {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    const body = await res.json().catch(() => null)
    if (!isApiEnvelope(body)) {
      return { success: false, message: 'Request failed' }
    }
    if (res.ok && !body.error) {
      return { success: true, message: body.message }
    }
    return { success: false, message: body.message || 'Request failed' }
  } catch {
    return { success: false, message: 'Request failed' }
  }
}
