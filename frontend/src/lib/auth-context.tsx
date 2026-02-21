"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { apiRequest, clearAuthTokens, setAuthTokens } from "./api"
import { setMockAuthUser } from "./mock-api"

type AuthUser = {
  id: string
  email: string
  role: "user" | "admin"
  walletBalance?: number
  goldSotBalance?: number
  chances?: number
  vipLevelId?: number
  vipLevelName?: string
  vipCashbackPercent?: number
  totalTicketsBought?: number
  totalSpendIrr?: number
  activeReferrals?: number
  loanLockedBalance?: number
  referralCode?: string
  profile?: {
    fullName?: string
    username?: string
    phone?: string
    city?: string
    address?: string
    bio?: string
    avatarUrl?: string
  }
  notificationPrefs?: {
    email: boolean
    sms: boolean
    push: boolean
  }
}

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (args: { email: string; password: string }) => Promise<AuthUser>
  register: (args: { email: string; password: string; referralCode?: string }) => Promise<void>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchMe(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/me", { method: "GET" }, { auth: true })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    try {
      const me = await fetchMe()
      setUser(me)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const me = await fetchMe()
        if (mounted) setUser(me)
      } catch {
        if (mounted) setUser(null)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const data = await apiRequest<{
      accessToken: string
      refreshToken: string
      user: AuthUser
    }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      { auth: false },
    )
    setAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
    setMockAuthUser(data.user)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async ({ email, password, referralCode }: { email: string; password: string; referralCode?: string }) => {
    await apiRequest(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ email, password, referralCode }),
      },
      { auth: false },
    )
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({}),
      })
    } catch {
      // noop
    } finally {
      clearAuthTokens()
      setMockAuthUser(null)
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshMe,
    }),
    [user, isLoading, login, register, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
