// Mock API wrapper - replaces real API calls with mock data
"use client"

import * as mockData from "./mock-data"

type BattleRoomMock = {
  id: string
  status: "waiting" | "running" | "finished" | "cancelled"
  entryAsset: "CHANCE" | "IRR"
  entryAmount: number
  maxPlayers: number
  siteFeePercent: number
  potAmount: number
  winnerUserId?: string
  players: Array<{ userId: string; rolledNumber?: number; joinedAt: string }>
}

type SlideParticipantMock = {
  userId: string
  fullName: string
  email: string
  chances: number
}

type SlidePrizeMock = { title: string; rankFrom: number; rankTo: number; amount?: number }

type SlideDrawState = {
  id: string
  status: "scheduled" | "processing" | "drawn"
  title: string
  scheduledAt: string
  participants: SlideParticipantMock[]
  prizes: SlidePrizeMock[]
  totalEntries: number
  winningLogs?: Array<{ rank: number; winningNumber: number; fullName: string; userId: string; prize: SlidePrizeMock }>
  winners?: Array<{ rank: number; fullName: string; winningNumber: number; prize: { title: string; amount?: number } }>
  targetNumber?: number
}

export class MockApiError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number = 400) {
    super(message)
    this.statusCode = statusCode
  }
}

// Helper to simulate API delay
const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, Math.random() * ms + 100))

// Store for authentication
let authUser = mockData.MOCK_USER
let isAuthenticated = false
let battleRooms = JSON.parse(JSON.stringify(mockData.MOCK_BATTLE_ROOMS)) as BattleRoomMock[]
let slideDrawState = JSON.parse(JSON.stringify(mockData.MOCK_SLIDE_DRAW.draw)) as SlideDrawState
let slideEntriesByUser: Record<string, number[]> = {}
let slideUsedNumbers = new Set<number>()

for (const p of slideDrawState.participants ?? []) {
  const count = Math.max(0, Number(p.chances ?? 0))
  slideEntriesByUser[p.userId] = []
  for (let i = 0; i < count; i += 1) {
    let candidate = Math.floor(Math.random() * 99999) + 1
    while (slideUsedNumbers.has(candidate)) candidate = Math.floor(Math.random() * 99999) + 1
    slideEntriesByUser[p.userId].push(candidate)
    slideUsedNumbers.add(candidate)
  }
}

function getSlideEntriesCount() {
  return Object.values(slideEntriesByUser).reduce((sum, items) => sum + items.length, 0)
}

function createSlideSnapshot() {
  const participants = (slideDrawState.participants ?? []).map((p) => ({
    ...p,
    chances: slideEntriesByUser[p.userId]?.length ?? 0,
  }))
  return {
    ...slideDrawState,
    participants,
    totalEntries: getSlideEntriesCount(),
  }
}

function ensureSlideParticipant(userId: string) {
  const existing = slideDrawState.participants.find((p) => p.userId === userId)
  if (existing) return existing
  const email = String(authUser?.email ?? `${userId}@local`)
  const fullName = String(authUser?.profile?.fullName ?? email.split("@")[0] ?? "کاربر")
  const newParticipant: SlideParticipantMock = { userId, fullName, email, chances: 0 }
  slideDrawState.participants.push(newParticipant)
  return newParticipant
}

function generateSlideNumber() {
  let candidate = Math.floor(Math.random() * 99999) + 1
  while (slideUsedNumbers.has(candidate)) candidate = Math.floor(Math.random() * 99999) + 1
  slideUsedNumbers.add(candidate)
  return candidate
}

export function getMockAuthUser() {
  return authUser
}

export function setMockAuthUser(user: any | null) {
  authUser = user as any
  isAuthenticated = user !== null
}

export function getMockIsAuthenticated() {
  return isAuthenticated
}

// Main mock API handler
export async function mockApiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = { auth: true },
): Promise<T> {
  await delay()

  const method = init.method || "GET"
  const bodyData = init.body ? JSON.parse(init.body as string) : null
  const requireAuth = options.auth ?? true

  // Check authentication for protected routes
  if (requireAuth && !isAuthenticated) {
    throw new MockApiError("Unauthorized", 401)
  }

  // Auth endpoints
  if (path === "/auth/login") {
    const email = String(bodyData?.email ?? "").trim().toLowerCase()
    const password = String(bodyData?.password ?? "")
    const adminCreds = mockData.MOCK_TEST_CREDENTIALS.admin
    const userCreds = mockData.MOCK_TEST_CREDENTIALS.user

    if (email === adminCreds.email.toLowerCase() && password === adminCreds.password) {
      isAuthenticated = true
      authUser = mockData.MOCK_ADMIN_USER as any
    } else if (email === userCreds.email.toLowerCase() && password === userCreds.password) {
      isAuthenticated = true
      authUser = mockData.MOCK_USER as any
    } else {
      throw new MockApiError("ایمیل یا رمز عبور اشتباه است", 401)
    }

    return {
      accessToken: "mock_access_token_" + Date.now(),
      refreshToken: "mock_refresh_token_" + Date.now(),
      user: authUser,
    } as T
  }

  if (path === "/auth/register") {
    isAuthenticated = true
    authUser = {
      ...mockData.MOCK_USER,
      email: String(bodyData?.email ?? mockData.MOCK_USER.email).toLowerCase(),
    } as any
    return { success: true } as T
  }

  if (path === "/auth/refresh") {
    return {
      accessToken: "mock_access_token_" + Date.now(),
      refreshToken: "mock_refresh_token_" + Date.now(),
    } as T
  }

  if (path === "/auth/logout") {
    isAuthenticated = false
    authUser = null as any
    return { success: true } as T
  }

  // User endpoints
  if (path === "/me") {
    return authUser as T
  }

  if (path === "/me/profile" && method === "GET") {
    return mockData.MOCK_PROFILE as T
  }

  if (path === "/me/profile" && method === "POST") {
    const updated = { ...mockData.MOCK_PROFILE, ...bodyData }
    return updated as T
  }

  if (path === "/me/tickets") {
    return { items: mockData.MOCK_TICKETS } as T
  }

  if (path === "/me/referral") {
    return mockData.MOCK_REFERRAL_DATA as T
  }

  if (path === "/me/history") {
    return { items: mockData.MOCK_WALLET_DATA.history } as T
  }

  if (path === "/me/activity") {
    return {
      items: [
        {
          id: "activity-1",
          source: "wallet" as const,
          type: "deposit",
          title: "واریز",
          body: "واریز 1,000,000 تومان",
          amount: 1000000,
          createdAt: new Date().toISOString(),
        },
      ],
    } as T
  }

  if (path === "/me/notifications" && method === "GET") {
    return {
      items: mockData.MOCK_NOTIFICATIONS,
      unreadCount: mockData.MOCK_NOTIFICATIONS.filter((n) => !n.read).length,
    } as T
  }

  if (path.startsWith("/me/notifications/") && path.endsWith("/read")) {
    return { success: true } as T
  }

  if (path === "/me/notifications/read-all") {
    return { success: true } as T
  }

  // Wallet endpoints
  if (path === "/wallet" && method === "GET") {
    return {
      walletBalance: authUser.walletBalance,
      goldSotBalance: authUser.goldSotBalance,
      loanLockedBalance: authUser.loanLockedBalance,
      microBalance: 10000,
    } as T
  }

  if (path === "/wallet/deposit") {
    return { ok: true } as T
  }

  if (path === "/wallet/withdraw") {
    return { ok: true } as T
  }

  if (path === "/wallet/convert/gold-to-cash") {
    return { ok: true } as T
  }

  if (path === "/wallet/convert/micro-to-chance") {
    return { ok: true } as T
  }

  if (path === "/wallet/loan/request") {
    return { ok: true, loanId: "loan-" + Date.now() } as T
  }

  // Security endpoints
  if (path === "/security/2fa/challenge") {
    return {
      challengeId: "challenge-" + Date.now(),
      debugCode: "000000",
    } as T
  }

  // Raffles endpoints
  if (path === "/raffles" && method === "GET") {
    return { items: mockData.MOCK_RAFFLES } as T
  }

  if (path.startsWith("/raffles/") && path.endsWith("/buy") && method === "POST") {
    return {
      totalPaid: 50000 * bodyData.count,
      ticketPrices: Array(bodyData.count).fill(50000),
      cashback: 2500,
    } as T
  }

  if (path.startsWith("/raffles/") && path.endsWith("/buy-combo") && method === "POST") {
    return {
      totalPaid: bodyData.code === "silver" ? 2500000 : 5000000,
      ticketPrices: [],
      cashback: 125000,
    } as T
  }

  // Showroom endpoints
  if (path === "/showroom/vehicles" && method === "GET") {
    return { items: mockData.MOCK_VEHICLES } as T
  }

  if (path.startsWith("/showroom/vehicles/") && path.endsWith("/orders") && method === "POST") {
    return { orderId: "order-" + Date.now() } as T
  }

  // Wheel endpoints
  if (path === "/wheel/config" && method === "GET") {
    return mockData.MOCK_WHEEL_CONFIG as T
  }

  if (path === "/wheel/history" && method === "GET") {
    return { items: mockData.MOCK_WHEEL_HISTORY } as T
  }

  if (path === "/wheel/spin" && method === "POST") {
    const randomResult = mockData.MOCK_WHEEL_HISTORY[Math.floor(Math.random() * mockData.MOCK_WHEEL_HISTORY.length)]
    return {
      result: {
        ...randomResult,
        id: "spin-" + Date.now(),
        createdAt: new Date().toISOString(),
      },
    } as T
  }

  // Slide endpoints
  if (path === "/slide/draw/current" && method === "GET") {
    return { draw: createSlideSnapshot() } as T
  }

  if (path === "/slide/draw/current/me") {
    const userId = authUser?.id
    const snapshot = createSlideSnapshot()
    const myNumbers = (userId ? slideEntriesByUser[userId] : []) ?? []
    return {
      drawId: snapshot.id,
      status: snapshot.status,
      myEntryNumbers: [...myNumbers].sort((a, b) => a - b),
      myEntriesCount: myNumbers.length,
      availableChances: Math.max(0, authUser?.chances ?? 0),
    } as T
  }

  if (path.startsWith("/slide/draw/") && path.endsWith("/entries") && method === "POST") {
    const drawIdFromPath = path.split("/")[3]
    const chancesToUse = Number(bodyData?.chancesToUse ?? 1)
    const userId = authUser?.id
    if (!userId) throw new MockApiError("Unauthorized", 401)
    if (drawIdFromPath !== slideDrawState.id) throw new MockApiError("قرعه پیدا نشد", 404)
    if (slideDrawState.status !== "scheduled") throw new MockApiError("قرعه کشی باز نیست", 400)
    if (!Number.isInteger(chancesToUse) || chancesToUse < 1) throw new MockApiError("تعداد شانس نامعتبر است", 400)
    if ((authUser?.chances ?? 0) < chancesToUse) throw new MockApiError("موجودی شانس کافی نیست", 400)

    const assignedNumbers = Array.from({ length: chancesToUse }, () => generateSlideNumber())
    slideEntriesByUser[userId] = [...(slideEntriesByUser[userId] ?? []), ...assignedNumbers]
    ensureSlideParticipant(userId)
    if (authUser) authUser.chances = Math.max(0, (authUser.chances ?? 0) - chancesToUse)

    return {
      assignedNumbers,
      chancesUsed: chancesToUse,
      availableChances: Math.max(0, authUser?.chances ?? 0),
      myEntriesCount: (slideEntriesByUser[userId] ?? []).length,
    } as T
  }

  // Slide Single endpoint
  if (path === "/slide/single/today" && method === "GET") {
    return mockData.MOCK_SLIDE_SINGLE as T
  }

  if (path === "/slide/single/spin" && method === "POST") {
    return {
      position: Math.floor(Math.random() * 50),
      reward: Math.floor(Math.random() * 5000000),
    } as T
  }

  // Slide Battle endpoints
  if (path === "/slide/battle/rooms" && method === "GET") {
    return { items: battleRooms } as T
  }

  if (path === "/slide/battle/join" && method === "POST") {
    const roomId = bodyData?.roomId as string | undefined
    const entryAsset = bodyData?.entryAsset as "CHANCE" | "IRR" | undefined
    const userId = authUser?.id ?? "guest-user"

    let room = roomId
      ? battleRooms.find((r) => r.id === roomId)
      : battleRooms.find((r) => r.status === "waiting" && (!entryAsset || r.entryAsset === entryAsset))

    if (!room && entryAsset) {
      room = {
        id: `room-${Date.now()}`,
        status: "waiting",
        entryAsset,
        entryAmount: entryAsset === "CHANCE" ? 5 : 10000,
        maxPlayers: 10,
        siteFeePercent: 5,
        potAmount: 0,
        players: [],
      } as BattleRoomMock
      battleRooms.unshift(room)
    }

    if (!room) throw new MockApiError("اتاقی برای ورود پیدا نشد", 404)
    if (room.status === "finished" || room.status === "cancelled") throw new MockApiError("این اتاق بسته شده است", 400)
    if ((room.players?.length ?? 0) >= room.maxPlayers) throw new MockApiError("اتاق تکمیل شده است", 400)

    const alreadyInRoom = (room.players ?? []).some((p) => p.userId === userId)
    if (!alreadyInRoom) {
      room.players = [
        ...(room.players ?? []),
        { userId, rolledNumber: Math.floor(Math.random() * 100) + 1, joinedAt: new Date().toISOString() },
      ]
      room.potAmount = (room.potAmount ?? 0) + room.entryAmount
      if (room.players.length >= room.maxPlayers) room.status = "running"
    }

    return { roomId: room.id, room } as T
  }

  // Loans endpoints
  if (path === "/loans/me") {
    return { items: mockData.MOCK_LOANS } as T
  }

  if (path === "/loans/request" && method === "POST") {
    return { loanId: "loan-" + Date.now() } as T
  }

  if (path.startsWith("/loans/") && path.endsWith("/repay")) {
    return { success: true } as T
  }

  // Engagement endpoints
  if (path === "/engagement/dashboard") {
    return mockData.MOCK_ENGAGEMENT_DASHBOARD as T
  }

  if (path === "/engagement/missions/today") {
    return { items: mockData.MOCK_MISSIONS } as T
  }

  if (path === "/engagement/achievements") {
    return {
      unlockedNow: ["achievement-1"],
      unlocked: ["achievement-1", "achievement-2", "achievement-3"],
    } as T
  }

  if (path === "/engagement/events/weekly" && method === "GET") {
    return {
      items: [
        {
          day: "شنبه",
          title: "رویداد هفتگی",
          prize: "1,000,000 تومان",
          hook: "حداقل یک بلیط خریدید",
        },
      ],
    } as T
  }

  if (path === "/engagement/shock-prizes" && method === "GET") {
    return {
      items: [
        {
          code: "prize-1",
          title: "جایزه صادقانه",
          description: "برای هر 10 بلیط خریدی، یک شانس",
        },
      ],
    } as T
  }

  if (path === "/engagement/welcome/claim" && method === "POST") {
    return { claimed: true } as T
  }

  if (path === "/engagement/quick-hit/play" && method === "POST") {
    return {
      outcome: ["win", "win", "lose"],
      guaranteed: false,
      reward: { type: "toman", value: 500000 },
    } as T
  }

  if (path === "/engagement/streak/checkin" && method === "POST") {
    return { streakDays: 8, reward: 100 } as T
  }

  if (path === "/engagement/missions/complete" && method === "POST") {
    return { success: true, reward: 100 } as T
  }

  // Support endpoints
  if (path === "/support/tickets" && method === "GET") {
    return { items: mockData.MOCK_SUPPORT_TICKETS } as T
  }

  if (path === "/support/tickets" && method === "POST") {
    return { ticketId: "ticket-" + Date.now() } as T
  }

  if (path.startsWith("/support/tickets/") && path.endsWith("/messages") && method === "GET") {
    return {
      items: [
        {
          id: "msg-1",
          author: "support",
          message: "سلام! چطور می‌تونم کمکتون کنم؟",
          createdAt: new Date().toISOString(),
        },
      ],
    } as T
  }

  if (path.startsWith("/support/tickets/") && path.endsWith("/messages") && method === "POST") {
    return { messageId: "msg-" + Date.now() } as T
  }

  // Rules endpoint
  if (path === "/rules" && method === "GET") {
    return mockData.MOCK_LEGAL as T
  }

  // Legal endpoint
  if (path === "/legal" && method === "GET") {
    return mockData.MOCK_LEGAL as T
  }

  // Auctions endpoints
  if (path === "/auctions/live" && method === "GET") {
    return { items: mockData.MOCK_AUCTIONS } as T
  }

  if (path.startsWith("/auctions/live/") && path.endsWith("/bid")) {
    return { auctionId: bodyData.auctionId, bid: bodyData.bidAmount } as T
  }

  // Cars endpoint (alias for showroom)
  if (path === "/cars" && method === "GET") {
    return { items: mockData.MOCK_VEHICLES } as T
  }

  // Admin endpoints
  if (path === "/admin/wheel/config" && method === "GET") {
    return { config: mockData.MOCK_WHEEL_CONFIG.config } as T
  }

  if (path === "/admin/wheel/config" && method === "POST") {
    return { success: true } as T
  }

  if (path === "/admin/users") {
    return { items: mockData.MOCK_ADMIN_USERS } as T
  }

  if (path.startsWith("/admin/users/")) {
    const userId = path.split("/").pop()
    return {
      ...mockData.MOCK_ADMIN_USERS[0],
      id: userId,
    } as T
  }

  if (path === "/admin/support/tickets") {
    return {
      items: mockData.MOCK_SUPPORT_TICKETS.map((t) => ({
        ...t,
        id: `admin-${t.id}`,
      })),
    } as T
  }

  if (path.startsWith("/admin/support/tickets/") && path.endsWith("/messages")) {
    return {
      items: [],
      ticket: mockData.MOCK_SUPPORT_TICKETS[0],
    } as T
  }

  if (path.startsWith("/admin/support/tickets/") && path.endsWith("/status") && method === "POST") {
    return { success: true } as T
  }

  if (path === "/admin/slide/draws") {
    return { items: mockData.MOCK_ADMIN_DRAWS } as T
  }

  if (path.startsWith("/admin/slide/draws/") && path.endsWith("/log")) {
    return {
      draw: mockData.MOCK_ADMIN_DRAWS[0],
      winningNumbers: [7, 23, 45],
      prizeDistribution: [{ matches: 5, count: 1, prizePerWinner: 50000000 }],
    } as T
  }

  // Database status endpoint
  if (path === "/health/db" || path === "/status") {
    return {
      status: "ok" as const,
      timestamp: new Date().toISOString(),
      database: "mock",
    } as T
  }

  // Fallback for any unhandled endpoints
  console.warn(`Unhandled mock API endpoint: ${method} ${path}`)
  return { success: true } as T
}
