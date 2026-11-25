import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { adminAuthService } from '../services/adminApi.js'

const AdminAuthContext = createContext(null)

function savedAdmin() {
  try {
    return JSON.parse(localStorage.getItem('qissa-admin-user') || 'null')
  } catch {
    return null
  }
}

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(savedAdmin)
  const [token, setToken] = useState(() => localStorage.getItem('qissa-admin-token') || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('qissa-admin-token')
    if (!savedToken) {
      setLoading(false)
      return
    }

    adminAuthService.me()
      .then((currentAdmin) => {
        setAdmin(currentAdmin)
        localStorage.setItem('qissa-admin-user', JSON.stringify(currentAdmin))
      })
      .catch(() => {
        localStorage.removeItem('qissa-admin-token')
        localStorage.removeItem('qissa-admin-user')
        setAdmin(null)
        setToken(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  async function login(credentials) {
    const result = await adminAuthService.login(credentials)
    localStorage.setItem('qissa-admin-token', result.token)
    localStorage.setItem('qissa-admin-user', JSON.stringify(result.user))
    setToken(result.token)
    setAdmin(result.user)
    return result.user
  }

  function logout() {
    localStorage.removeItem('qissa-admin-token')
    localStorage.removeItem('qissa-admin-user')
    setToken(null)
    setAdmin(null)
  }

  const value = useMemo(() => ({
    admin,
    token,
    loading,
    isAuthenticated: Boolean(token && admin?.role === 'admin'),
    login,
    logout,
  }), [admin, token, loading])

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider')
  }
  return context
}
