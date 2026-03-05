import { useState, useEffect, useCallback } from 'react'
import { login as apiLogin, register as apiRegister } from '@/services/authService.js'

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

export function useAuth() {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const { token: t, user: u } = getStored()
    setToken(t)
    setUser(u)
    setIsLoading(false)
  }, [])

  const isAuthenticated = Boolean(token)

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

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  }
}
