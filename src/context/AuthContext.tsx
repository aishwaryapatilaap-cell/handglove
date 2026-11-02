import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { api, User } from '../api'

interface AuthValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  setUser: (u: User | null) => void
}
const Ctx = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<User>('/auth/me').then(setUser).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const u = await api<User>('/auth/login', 'POST', { email, password })
    setUser(u)
    return u
  }, [])
  const logout = useCallback(async () => {
    await api('/auth/logout', 'POST').catch(() => undefined)
    setUser(null)
  }, [])

  return <Ctx.Provider value={{ user, loading, login, logout, setUser }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used inside AuthProvider')
  return v
}
