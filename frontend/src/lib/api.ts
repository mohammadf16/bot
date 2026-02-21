"use client"

// MOCK MODE - All API calls use mock data instead of real backend
import { mockApiRequest, setMockAuthUser } from "./mock-api"

const ACCESS_TOKEN_KEY = "car_access_token"
const REFRESH_TOKEN_KEY = "car_refresh_token"

export type ApiError = {
  error?: string
  message?: string
  statusCode?: number
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? "mock_token"
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? "mock_refresh_token"
}

export function setAuthTokens(tokens: { accessToken: string; refreshToken: string }): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

export function clearAuthTokens(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  setMockAuthUser(null)
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const data = await mockApiRequest<{ accessToken: string; refreshToken: string }>(
      "/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken: getRefreshToken() }),
      },
      { auth: false },
    )
    setAuthTokens(data)
    return data.accessToken
  } catch {
    clearAuthTokens()
    return null
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = { auth: true },
): Promise<T> {
  const requireAuth = options.auth ?? true

  try {
    return await mockApiRequest<T>(path, init, { auth: requireAuth })
  } catch (error) {
    if (!requireAuth) throw error
    const newAccess = await refreshAccessToken()
    if (!newAccess) throw error
    return mockApiRequest<T>(path, init, { auth: requireAuth })
  }
}

export function randomIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `idemp-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
