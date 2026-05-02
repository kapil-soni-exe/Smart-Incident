// Auth context — provides user state and auth methods to the entire app
import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  // Initialise from localStorage so auth persists across page refreshes
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('sirp_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  // Validate token on mount — fetch /me to ensure token is still valid
  useEffect(() => {
    const token = localStorage.getItem('sirp_token')
    if (!token) { setLoading(false); return }

    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user)
        localStorage.setItem('sirp_user', JSON.stringify(data.user))
      })
      .catch(() => {
        // Token invalid — clear stored auth data
        localStorage.removeItem('sirp_token')
        localStorage.removeItem('sirp_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('sirp_token', data.token)
    localStorage.setItem('sirp_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    localStorage.setItem('sirp_token', data.token)
    localStorage.setItem('sirp_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('sirp_token')
    localStorage.removeItem('sirp_user')
    setUser(null)
  }

  const refreshUser = async () => {
    const { data } = await api.get('/auth/me')
    setUser(data.user)
    localStorage.setItem('sirp_user', JSON.stringify(data.user))
    return data.user
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for consuming auth context
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
