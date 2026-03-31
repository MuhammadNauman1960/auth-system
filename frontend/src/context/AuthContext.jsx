import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on first render
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const stored = localStorage.getItem('user')
    if (token && stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.clear()
      }
    }
    setLoading(false)
  }, [])

  const login = (userData, tokens) => {
    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
