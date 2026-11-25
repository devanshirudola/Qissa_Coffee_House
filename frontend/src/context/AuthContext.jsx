import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/api.js'

const AuthContext = createContext(null)

function savedUser() {
  try { return JSON.parse(localStorage.getItem('qissa-user') || 'null') } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(savedUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('qissa-token')) {
      setLoading(false)
      return
    }
    authService.currentUser()
      .then((current) => { setUser(current); localStorage.setItem('qissa-user', JSON.stringify(current)) })
      .catch(() => { localStorage.removeItem('qissa-token'); localStorage.removeItem('qissa-user'); setUser(null) })
      .finally(() => setLoading(false))
  }, [])

  async function saveSession(request) {
    const result = await request
    localStorage.setItem('qissa-token', result.token)
    localStorage.setItem('qissa-user', JSON.stringify(result.user))
    setUser(result.user)
    return result.user
  }

  const value = useMemo(() => ({
    user,
    loading,
    register: (details) => saveSession(authService.register(details)),
    login: (credentials) => saveSession(authService.login(credentials)),
    logout: () => { localStorage.removeItem('qissa-token'); localStorage.removeItem('qissa-user'); setUser(null) },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
