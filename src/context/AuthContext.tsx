/**
 * AuthContext — global authentication state.
 *
 * Provides:
 *   user        — the authenticated User object, or null
 *   isLoading   — true while we verify the stored token on first load
 *   login()     — store tokens + user, update state
 *   logout()    — clear storage + state
 *
 * On mount: if an access token is found in localStorage, we call
 * GET /api/auth/me/ to verify it is still valid and hydrate the user
 * object. If the token is expired the api client will attempt a
 * refresh automatically. If that also fails the user is logged out.
 */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authApi, tokens } from '../lib/api'
import type { User } from '../lib/api'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login:  (user: User, access: string, refresh: string) => void
  logout: () => void
}



const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<User | null>(null)
  const [isLoading, setLoading] = useState(true)

  // ── Hydrate on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    const stored = tokens.getUser()
    const access = tokens.getAccess()

    if (!access) {
      setLoading(false)
      return
    }

    // Optimistically set user from cache, then verify with /me
    if (stored) setUser(stored)

    authApi.me()
      .then(freshUser => {
        setUser(freshUser)
        tokens.setUser(freshUser)
      })
      .catch(() => {
        // Token invalid / expired even after refresh attempt → log out
        tokens.clearAll()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = (user: User, access: string, refresh: string) => {
    tokens.setTokens(access, refresh)
    tokens.setUser(user)
    setUser(user)
  }

  const logout = () => {
    tokens.clearAll()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
