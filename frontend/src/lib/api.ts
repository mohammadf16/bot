"use client"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"
const GATEWAY_KEY = process.env.NEXT_PUBLIC_API_GATEWAY_KEY
const ACCESS_TOKEN_KEY = "car_access_token"
const REFRESH_TOKEN_KEY = "car_refresh_token"

export type ApiError = {
  error?: string
  message?: string
  statusCode?: number
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
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
}

async function rawRequest<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body !== undefined && init.body !== null) {
    headers.set("Content-Type", "application/json")
  }
  if (GATEWAY_KEY) headers.set("x-api-gateway-key", GATEWAY_KEY)
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as ApiError
    throw new Error(data.error ?? data.message ?? `HTTP_${res.status}`)
  }

  if (res.status === 204) return {} as T
  return (await res.json()) as T
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  try {
    const data = await rawRequest<{ accessToken: string; refreshToken: string }>(
      "/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      },
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
  const token = requireAuth ? getAccessToken() : undefined

  try {
    return await rawRequest<T>(path, init, token ?? undefined)
  } catch (error) {
    if (!requireAuth) throw error
    const newAccess = await refreshAccessToken()
    if (!newAccess) throw error
    return rawRequest<T>(path, init, newAccess)
  }
}

export function randomIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `idemp-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
