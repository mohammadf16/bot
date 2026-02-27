"use client"

const ACCESS_TOKEN_KEY = "car_access_token"
const REFRESH_TOKEN_KEY = "car_refresh_token"
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/+$/, "")

function normalizeWsUrl(input: string): string {
  try {
    const parsed = new URL(input)
    const protocol = parsed.protocol === "https:" ? "wss:" : parsed.protocol === "http:" ? "ws:" : parsed.protocol
    const hostname = parsed.hostname === "localhost" ? "127.0.0.1" : parsed.hostname
    const normalizedPath = parsed.pathname.replace(/\/+$/, "") === "/api/v1/live" ? "/live" : parsed.pathname
    const host = parsed.port ? `${hostname}:${parsed.port}` : hostname
    return `${protocol}//${host}${normalizedPath}${parsed.search}`.replace(/\/+$/, "")
  } catch {
    return input.replace(/\/+$/, "")
  }
}

function deriveLiveWsUrl(): string {
  try {
    const parsed = new URL(API_BASE_URL)
    const protocol = parsed.protocol === "https:" ? "wss:" : "ws:"
    const hostname = parsed.hostname === "localhost" ? "127.0.0.1" : parsed.hostname
    const host = parsed.port ? `${hostname}:${parsed.port}` : hostname
    return normalizeWsUrl(`${protocol}//${host}/live`)
  } catch {
    return "ws://127.0.0.1:4000/live"
  }
}

export const LIVE_WS_URL = normalizeWsUrl(process.env.NEXT_PUBLIC_WS_URL ?? deriveLiveWsUrl())

export type ApiError = {
  error?: string
  message?: string
  statusCode?: number
  details?: unknown
}

function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
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

async function parseResponse<T>(response: Response): Promise<T> {
  const raw = await response.text()
  const payload = raw.length > 0 ? JSON.parse(raw) : undefined

  if (!response.ok) {
    let validationMessage: string | undefined
    if (payload && typeof payload === "object") {
      const details = (payload as ApiError).details
      if (details && typeof details === "object") {
        const fieldErrors = (details as { fieldErrors?: Record<string, string[]> }).fieldErrors
        if (fieldErrors && typeof fieldErrors === "object") {
          const first = Object.entries(fieldErrors).find(([, messages]) => Array.isArray(messages) && messages.length > 0)
          if (first) validationMessage = `${first[0]}: ${first[1][0]}`
        }
        if (!validationMessage) {
          const formErrors = (details as { formErrors?: string[] }).formErrors
          if (Array.isArray(formErrors) && formErrors.length > 0) validationMessage = formErrors[0]
        }
      }
    }
    const errorMessage =
      (payload as ApiError | undefined)?.message ??
      validationMessage ??
      (payload as ApiError | undefined)?.error ??
      `Request failed with status ${response.status}`
    const error = new Error(errorMessage) as Error & { statusCode?: number }
    error.statusCode = response.status
    throw error
  }

  return payload as T
}

async function performRequest<T>(
  path: string,
  init: RequestInit = {},
  requireAuth = true,
): Promise<T> {
  const headers = new Headers(init.headers ?? {})
  const body = init.body
  const isJsonBody = typeof body === "string" && !headers.has("Content-Type")
  if (isJsonBody) headers.set("Content-Type", "application/json")
  headers.set("Accept", "application/json")

  if (requireAuth) {
    const accessToken = getAccessToken()
    if (!accessToken) {
      const error = new Error("AUTH_REQUIRED") as Error & { statusCode?: number }
      error.statusCode = 401
      throw error
    }
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
  })

  return parseResponse<T>(response)
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    clearAuthTokens()
    return null
  }
  try {
    const data = await performRequest<{ accessToken: string; refreshToken: string }>(
      "/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      },
      false,
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
    return await performRequest<T>(path, init, requireAuth)
  } catch (error) {
    if (!requireAuth) throw error
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : undefined
    if (statusCode !== 401) throw error
    const newAccess = await refreshAccessToken()
    if (!newAccess) throw error
    return performRequest<T>(path, init, requireAuth)
  }
}

export function randomIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `idemp-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
