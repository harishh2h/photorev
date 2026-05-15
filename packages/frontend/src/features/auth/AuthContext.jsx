import PropTypes from 'prop-types'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin, register as apiRegister } from '@/services/authService.js'
import { apiFetch, setUnauthorizedHandler } from '@/services/httpClient.js'

const TOKEN_KEY = 'photorev_token'
const USER_KEY = 'photorev_user'

function getStored() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const userJson = localStorage.getItem(USER_KEY)
    const user = userJson ? JSON.parse(userJson) : null
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

/** @typedef {{ user: object | null; token: string | null; isAuthenticated: boolean; isLoading: boolean; login: Function; register: Function; logout: Function }} AuthContextValue */
/** @type {import('react').Context<AuthContextValue | null>} */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [sessionReady, setSessionReady] = useState(false)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const handleUnauthorized = useCallback(() => {
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized)
    return () => setUnauthorizedHandler(null)
  }, [handleUnauthorized])

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      const { token: storedToken, user: storedUser } = getStored()
      setToken(storedToken)
      setUser(storedUser)
      if (!storedToken) {
        if (!cancelled) {
          setSessionReady(true)
        }
        return
      }
      const r = await apiFetch('/auth/me', { token: storedToken })
      if (
        r.ok &&
        r.data &&
        typeof r.data === 'object' &&
        typeof /** @type {{ id?: unknown }} */ (r.data).id === 'string'
      ) {
        const d = /** @type {{ id: string; email?: unknown; name?: unknown }} */ (r.data)
        const nextUser = {
          id: d.id,
          email: typeof d.email === 'string' ? d.email : '',
          name: typeof d.name === 'string' ? d.name : '',
        }
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
        if (!cancelled) {
          setUser(nextUser)
        }
      }
      if (!cancelled) {
        setSessionReady(true)
      }
    }
    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const result = await apiLogin({ email, password })
    if (!result.success || !result.data) {
      return { success: false, message: result.message }
    }
    localStorage.setItem(TOKEN_KEY, result.data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(result.data.user))
    setToken(result.data.token)
    setUser(result.data.user)
    return { success: true }
  }, [])

  const register = useCallback(async ({ email, password, name }) => {
    const result = await apiRegister({ email, password, name })
    if (!result.success) {
      return { success: false, message: result.message }
    }
    const loginResult = await apiLogin({ email, password })
    if (!loginResult.success || !loginResult.data) {
      return { success: true, message: result.message }
    }
    localStorage.setItem(TOKEN_KEY, loginResult.data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(loginResult.data.user))
    setToken(loginResult.data.token)
    setUser(loginResult.data.user)
    return { success: true }
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading: !sessionReady,
      login,
      register,
      logout,
    }),
    [user, token, sessionReady, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx == null) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
