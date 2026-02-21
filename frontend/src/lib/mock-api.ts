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

type ShowroomVehicle = {
  id: string
  sourceType: "lottery_winback" | "external_purchase"
  status: "available" | "reserved" | "sold" | "archived"
  vehicle: {
    title: string
    imageUrl: string
    description?: string
    model: string
    year: number
    city: string
    mileageKm: number
    isNew: boolean
    transmission: "automatic" | "manual"
    fuelType: "gasoline" | "hybrid" | "electric" | "diesel"
    participantsCount: number
    raffleParticipantsCount: number
    raffle: {
      cashbackPercent: number
      cashbackToGoldPercent: number
      tomanPerGoldSot: number
      goldSotBack: number
      mainPrizeTitle: string
      mainPrizeValueIrr: number
    }
  }
  acquisitionCostIrr?: number
  listedPriceIrr?: number
  listedPriceGoldSot?: number
  createdAt: string
}

type ShowroomOrder = {
  id: string
  vehicleId: string
  vehicleTitle: string
  buyerUserId: string
  buyerEmail: string
  paymentAsset: "IRR" | "GOLD_SOT" | "LOAN"
  paymentAmount: number
  loanMonths?: number
  loanAmountIrr?: number
  downPaymentIrr?: number
  monthlyInstallmentIrr?: number
  status: "pending" | "paid" | "cancelled" | "completed"
  createdAt: string
}

type LoanMock = {
  id: string
  principalIrr: number
  outstandingIrr: number
  installmentCount?: number
  monthlyInstallmentIrr?: number
  interestRateMonthlyPercent?: number
  totalRepayableIrr?: number
  status: "pending" | "approved" | "active" | "repaid" | "rejected" | "defaulted"
  dueAt?: string
  createdAt: string
}

type AuctionVehicleSpecs = {
  model: string
  year: number
  city: string
  mileageKm: number
  transmission: "automatic" | "manual"
  fuelType: "gasoline" | "hybrid" | "electric" | "diesel"
}

type AuctionMock = {
  id: string
  title: string
  description?: string
  imageUrl: string
  startPrice: number
  currentBid: number
  minStep: number
  status: "draft" | "open" | "closed" | "cancelled"
  endAt: string
  bidsCount: number
  vehicle: AuctionVehicleSpecs
  topBidder?: {
    userId: string
    displayName: string
    amount: number
  }
}

type RaffleRewardConfig = {
  cashbackPercent: number
  cashbackToGoldPercent: number
  tomanPerGoldSot: number
  mainPrizeTitle: string
  mainPrizeValueIrr: number
}

type RaffleState = {
  id: string
  title: string
  status: "draft" | "open" | "closed" | "drawn"
  maxTickets: number
  ticketsSold: number
  participantsCount: number
  seedCommitHash: string
  dynamicPricing: { basePrice: number; decayFactor: number; minPrice: number }
  tiers: Array<{ order: number; price: number; discountPercent: number }>
  comboPackages: Array<{
    code: "silver" | "gold"
    title: string
    paidTickets: number
    bonusTickets: number
    bonusChances: number
    vipDays: number
  }>
  rewardConfig: RaffleRewardConfig
}

type SlideDrawState = {
  id: string
  status: "scheduled" | "processing" | "drawn" | "cancelled"
  title: string
  scheduledAt: string
  createdAt?: string
  updatedAt?: string
  seedCommitHash?: string
  proof?: {
    algorithm: string
    seedCommitHash: string
    revealedServerSeed: string
    externalEntropy: string
    participantsHash: string
    generatedAt: string
  } | null
  participants: SlideParticipantMock[]
  prizes: SlidePrizeMock[]
  totalEntries: number
  winningLogs?: Array<{ rank: number; winningNumber: number; fullName: string; userId: string; prize: SlidePrizeMock }>
  winners?: Array<{ rank: number; fullName: string; winningNumber: number; prize: { title: string; amount?: number } }>
  targetNumber?: number
  entries?: Array<{ entryNumber: number; userId: string; userEmail: string; fullName: string; createdAt: string }>
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
let showroomVehicles = (mockData.MOCK_VEHICLES as Array<{
  id: string
  sourceType: "lottery_winback" | "external_purchase"
  status: "available" | "reserved" | "sold" | "archived"
  vehicle: Record<string, unknown>
  listedPriceIrr?: number
  listedPriceGoldSot?: number
}>).map((item, index) => {
  const seeded = [
    { model: "M440i xDrive", year: 2024, city: "تهران", mileage: 0, transmission: "automatic", fuelType: "gasoline" },
    { model: "C300", year: 2023, city: "اصفهان", mileage: 22000, transmission: "automatic", fuelType: "hybrid" },
    { model: "A4 S-line", year: 2022, city: "شیراز", mileage: 41000, transmission: "automatic", fuelType: "gasoline" },
  ][index % 3]
  return {
    id: item.id,
    sourceType: item.sourceType,
    status: item.status,
    listedPriceIrr: item.listedPriceIrr,
    listedPriceGoldSot: item.listedPriceGoldSot,
    createdAt: new Date(Date.now() - index * 86400000).toISOString(),
    vehicle: {
      title: String(item.vehicle.title ?? `خودرو ${index + 1}`),
      imageUrl: String(item.vehicle.imageUrl ?? "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200"),
      description: String(item.vehicle.description ?? "خودروی ویژه فروشگاه"),
      model: seeded.model,
      year: seeded.year,
      city: seeded.city,
      mileageKm: seeded.mileage,
      isNew: seeded.mileage <= 0,
      transmission: seeded.transmission as "automatic" | "manual",
      fuelType: seeded.fuelType as "gasoline" | "hybrid" | "electric" | "diesel",
      participantsCount: 130 + index * 35,
      raffleParticipantsCount: 240 + index * 50,
      raffle: {
        cashbackPercent: 20,
        cashbackToGoldPercent: 30,
        tomanPerGoldSot: 100000,
        goldSotBack: 250 + index * 40,
        mainPrizeTitle: "جایزه اصلی خودرو",
        mainPrizeValueIrr: (item.listedPriceIrr ?? 1_500_000_000) + 500_000_000,
      },
    },
  } satisfies ShowroomVehicle
})
let showroomOrders: ShowroomOrder[] = []
let mockLoans = JSON.parse(JSON.stringify(mockData.MOCK_LOANS)) as LoanMock[]
let liveAuctions = (
  mockData.MOCK_AUCTIONS as Array<
    Omit<AuctionMock, "endAt"> & { endAt?: string; endsAt?: string; minStep?: number; bidsCount?: number }
  >
).map((auction) => {
  const { endsAt, ...rest } = auction
  return {
    ...rest,
    endAt: String(rest.endAt ?? endsAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
    bidsCount: Math.max(rest.bidsCount ?? 0, rest.topBidder ? 1 : 0),
    minStep: rest.minStep ?? 10_000_000,
  }
})
let raffles = (mockData.MOCK_RAFFLES as Array<{
  id: string
  title: string
  status: "draft" | "open" | "closed" | "drawn"
  maxTickets: number
  ticketsSold: number
  seedCommitHash: string
  dynamicPricing: { basePrice: number; decayFactor: number; minPrice: number }
  comboPackages: Array<{
    code: "silver" | "gold"
    title: string
    paidTickets: number
    bonusTickets: number
    bonusChances: number
    vipDays: number
  }>
}>).map((item) => ({
  ...item,
  participantsCount: Math.max(1, Math.floor(item.ticketsSold / 30)),
  tiers: [
    { order: 1, price: item.dynamicPricing.basePrice, discountPercent: 0 },
    { order: 2, price: Math.floor(item.dynamicPricing.basePrice * 0.85), discountPercent: 15 },
    { order: 3, price: Math.floor(item.dynamicPricing.basePrice * 0.75), discountPercent: 25 },
  ],
  rewardConfig: {
    cashbackPercent: 20,
    cashbackToGoldPercent: 30,
    tomanPerGoldSot: 100000,
    mainPrizeTitle: "خودرو ویژه قرعه کشی",
    mainPrizeValueIrr: 8500000000,
  },
})) as RaffleState[]
let slideDrawState: SlideDrawState = {
  ...(JSON.parse(JSON.stringify(mockData.MOCK_SLIDE_DRAW.draw)) as SlideDrawState),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  seedCommitHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
  proof: null,
  entries: [],
}
let slideDrawHistory: SlideDrawState[] = []
let slideProcessingUntil = 0
let gameDifficulty = 50
let slideSingleState = {
  ...(mockData.MOCK_SLIDE_SINGLE as { date: string; hasTarget: boolean; targetNumber: number }),
}
let slideEntriesByUser: Record<string, number[]> = {}
let slideUsedNumbers = new Set<number>()

function safeNumber(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function isProUser(user: typeof authUser | null | undefined): boolean {
  return Number(user?.vipLevelId ?? 1) >= 3
}

function displayNameForUser(user: typeof authUser | null | undefined): string {
  const username = String(user?.profile?.username ?? "").trim()
  if (username.length >= 3) return username.toUpperCase()
  const email = String(user?.email ?? "USER")
  const base = email.split("@")[0] ?? "USER"
  return base.slice(0, 3).toUpperCase() + "-PRO"
}

function calcLoanPlan(principalIrr: number, months: number, monthlyRatePercent = 1.5) {
  const safeMonths = Math.max(1, Math.min(60, Math.trunc(months)))
  const rate = Math.max(0, monthlyRatePercent) / 100
  const total = Math.round(principalIrr * (1 + rate * safeMonths))
  return {
    months: safeMonths,
    interestRateMonthlyPercent: monthlyRatePercent,
    totalRepayableIrr: total,
    monthlyInstallmentIrr: Math.ceil(total / safeMonths),
  }
}

function pickHash(size = 24) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 16).toString(16)).join("")
}

for (const p of slideDrawState.participants ?? []) {
  const count = Math.max(0, safeNumber(p.chances, 0))
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

function hydrateSlideParticipants() {
  slideDrawState.participants = slideDrawState.participants.map((participant) => ({
    ...participant,
    chances: slideEntriesByUser[participant.userId]?.length ?? 0,
  }))
  slideDrawState.totalEntries = getSlideEntriesCount()
}

function flattenSlideEntries() {
  return Object.entries(slideEntriesByUser).flatMap(([userId, numbers]) => {
    const participant = slideDrawState.participants.find((item) => item.userId === userId)
    return numbers.map((entryNumber) => ({
      entryNumber,
      userId,
      userEmail: participant?.email ?? `${userId}@local`,
      fullName: participant?.fullName ?? userId,
      createdAt: new Date().toISOString(),
    }))
  })
}

function finalizeSlideDraw() {
  hydrateSlideParticipants()
  const entries = flattenSlideEntries()
  const prizes = (slideDrawState.prizes ?? [])
    .flatMap((prize) =>
      Array.from({ length: Math.max(0, prize.rankTo - prize.rankFrom + 1) }, (_, i) => ({
        rank: prize.rankFrom + i,
        prize,
      })),
    )
    .sort((a, b) => a.rank - b.rank)
  const pool = [...entries]
  const winningLogs: Array<{ rank: number; winningNumber: number; fullName: string; userId: string; prize: SlidePrizeMock }> = []
  const winners: Array<{ rank: number; fullName: string; winningNumber: number; prize: { title: string; amount?: number } }> = []

  for (const slot of prizes) {
    if (!pool.length) break
    const idx = Math.floor(Math.random() * pool.length)
    const win = pool.splice(idx, 1)[0]
    winningLogs.push({ rank: slot.rank, winningNumber: win.entryNumber, fullName: win.fullName, userId: win.userId, prize: slot.prize })
    winners.push({ rank: slot.rank, fullName: win.fullName, winningNumber: win.entryNumber, prize: { title: slot.prize.title, amount: slot.prize.amount } })
  }

  slideDrawState.status = "drawn"
  slideDrawState.winningLogs = winningLogs
  slideDrawState.winners = winners
  slideDrawState.entries = entries
  slideDrawState.targetNumber =
    winningLogs[0]?.winningNumber ??
    entries[Math.floor(Math.random() * Math.max(1, entries.length))]?.entryNumber ??
    Math.floor(Math.random() * 99999) + 1
  slideDrawState.updatedAt = new Date().toISOString()
  slideDrawState.proof = {
    algorithm: "SHA-512 + entropy",
    seedCommitHash: String(slideDrawState.seedCommitHash ?? ""),
    revealedServerSeed: pickHash(64),
    externalEntropy: `${Date.now()}-${pickHash(16)}`,
    participantsHash: pickHash(64),
    generatedAt: new Date().toISOString(),
  }
  slideDrawHistory = [JSON.parse(JSON.stringify(slideDrawState)) as SlideDrawState, ...slideDrawHistory.filter((d) => d.id !== slideDrawState.id)]
}

function advanceSlideLifecycle(force = false) {
  const now = Date.now()
  const drawTime = new Date(slideDrawState.scheduledAt).getTime()
  if (slideDrawState.status === "scheduled" && (force || now >= drawTime)) {
    slideDrawState.status = "processing"
    slideDrawState.updatedAt = new Date().toISOString()
    slideProcessingUntil = now + (force ? 1000 : 7000)
    if (!slideDrawState.targetNumber) slideDrawState.targetNumber = Math.floor(Math.random() * 99999) + 1
  }
  if (slideDrawState.status === "processing" && (force || now >= slideProcessingUntil)) {
    finalizeSlideDraw()
  }
}

function createSlideSnapshot() {
  advanceSlideLifecycle()
  hydrateSlideParticipants()
  return {
    ...slideDrawState,
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
    const tx = [
      ...mockData.MOCK_WALLET_DATA.history.map((item) => ({
        id: item.id,
        type: item.type,
        amount: item.amount,
        status: item.status,
        createdAt: item.timestamp,
      })),
      ...showroomOrders.slice(0, 20).map((order) => ({
        id: `showroom-${order.id}`,
        type: order.paymentAsset === "LOAN" ? "loan_credit" : "ticket_purchase",
        amount: -Math.max(0, order.downPaymentIrr ?? order.paymentAmount),
        status: order.status,
        createdAt: order.createdAt,
      })),
      ...mockLoans.slice(0, 20).map((loan) => ({
        id: `loan-${loan.id}`,
        type: "loan_credit",
        amount: loan.principalIrr,
        status: loan.status,
        createdAt: loan.createdAt,
      })),
    ]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 100)

    return {
      balance: authUser.walletBalance,
      chances: authUser.chances,
      assets: {
        irr: authUser.walletBalance,
        goldSot: authUser.goldSotBalance ?? 0,
        chance: authUser.chances ?? 0,
      },
      vip: {
        id: authUser.vipLevelId ?? 1,
        name: authUser.vipLevelName ?? "برنزی",
        cashbackPercent: authUser.vipCashbackPercent ?? 20,
      },
      loan: {
        lockedBalance: authUser.loanLockedBalance ?? 0,
      },
      rates: {
        goldSellRateIrr: 3_200_000,
        microToChanceThresholdIrr: 50_000,
        microToChanceRateIrr: 10_000,
      },
      transactions: tx,
    } as T
  }

  if (path === "/wallet/deposit") {
    const amount = Math.max(0, safeNumber(bodyData?.amount, 0))
    if (amount <= 0) throw new MockApiError("مبلغ واریز معتبر نیست", 400)
    if (authUser) authUser.walletBalance = Math.max(0, (authUser.walletBalance ?? 0) + amount)
    return { ok: true, amount, status: "completed" } as T
  }

  if (path === "/wallet/deposit/card-to-card" && method === "POST") {
    const amount = Math.max(0, safeNumber(bodyData?.amount, 0))
    const trackingCode = String(bodyData?.trackingCode ?? "").trim()
    const fromCardLast4 = String(bodyData?.fromCardLast4 ?? "").trim()
    if (amount <= 0 || trackingCode.length < 4 || fromCardLast4.length !== 4) {
      throw new MockApiError("اطلاعات کارت به کارت کامل نیست", 400)
    }
    return {
      ok: true,
      requestId: `ccd-${Date.now()}`,
      status: "active",
      amount,
      trackingCode,
    } as T
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
    const amount = Math.max(0, safeNumber(bodyData?.amount, 0))
    if (amount <= 0) throw new MockApiError("مبلغ وام معتبر نیست", 400)
    if (!isProUser(authUser)) throw new MockApiError("این بخش فقط برای کاربران پرو فعال است", 403)
    if (authUser) {
      authUser.walletBalance = Math.max(0, (authUser.walletBalance ?? 0) + amount)
      authUser.loanLockedBalance = Math.max(0, (authUser.loanLockedBalance ?? 0) + amount)
    }
    const loan: LoanMock = {
      id: "loan-" + Date.now(),
      principalIrr: amount,
      outstandingIrr: amount,
      status: "active",
      createdAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    }
    mockLoans = [loan, ...mockLoans]
    return { ok: true, loanId: loan.id } as T
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
    return { items: raffles } as T
  }

  if (path.startsWith("/raffles/") && path.endsWith("/buy") && method === "POST") {
    const raffleId = path.split("/")[2]
    const raffle = raffles.find((item) => item.id === raffleId)
    if (!raffle) throw new MockApiError("قرعه کشی پیدا نشد", 404)
    if (raffle.status !== "open") throw new MockApiError("این قرعه کشی فعال نیست", 400)
    const count = Math.max(1, safeNumber(bodyData?.count, 1))
    if (raffle.ticketsSold + count > raffle.maxTickets) throw new MockApiError("ظرفیت قرعه تکمیل شده است", 400)

    const ticketPrices = Array.from({ length: count }, (_, idx) => {
      const dynamic = raffle.dynamicPricing.basePrice * Math.pow(raffle.dynamicPricing.decayFactor, raffle.ticketsSold + idx)
      return Math.max(raffle.dynamicPricing.minPrice, Math.floor(dynamic))
    })
    const totalPaid = ticketPrices.reduce((sum, price) => sum + price, 0)
    const cashback = Math.floor((totalPaid * raffle.rewardConfig.cashbackPercent) / 100)
    const remaining = Math.max(0, totalPaid - cashback)
    const goldPart = Math.floor((remaining * raffle.rewardConfig.cashbackToGoldPercent) / 100)
    const goldSot = Math.floor(goldPart / Math.max(10000, raffle.rewardConfig.tomanPerGoldSot))
    raffle.ticketsSold += count
    raffle.participantsCount += 1
    if (authUser) {
      authUser.walletBalance = Math.max(0, authUser.walletBalance - totalPaid + cashback)
      authUser.goldSotBalance = Math.max(0, authUser.goldSotBalance + goldSot)
      authUser.chances = Math.max(0, authUser.chances + count)
    }

    return {
      totalPaid,
      ticketPrices,
      cashback,
      goldSot,
      rewardConfig: raffle.rewardConfig,
    } as T
  }

  if (path.startsWith("/raffles/") && path.endsWith("/buy-combo") && method === "POST") {
    const raffleId = path.split("/")[2]
    const raffle = raffles.find((item) => item.id === raffleId)
    if (!raffle) throw new MockApiError("قرعه کشی پیدا نشد", 404)
    if (raffle.status !== "open") throw new MockApiError("این قرعه کشی فعال نیست", 400)
    const code = bodyData?.code === "gold" ? "gold" : "silver"
    const pack = raffle.comboPackages.find((item) => item.code === code)
    if (!pack) throw new MockApiError("پکیج نامعتبر است", 400)
    if (raffle.ticketsSold + pack.paidTickets > raffle.maxTickets) throw new MockApiError("ظرفیت کافی نیست", 400)

    const ticketPrices = Array.from({ length: pack.paidTickets }, (_, idx) => {
      const dynamic = raffle.dynamicPricing.basePrice * Math.pow(raffle.dynamicPricing.decayFactor, raffle.ticketsSold + idx)
      return Math.max(raffle.dynamicPricing.minPrice, Math.floor(dynamic))
    })
    const totalPaid = ticketPrices.reduce((sum, price) => sum + price, 0)
    const cashback = Math.floor((totalPaid * raffle.rewardConfig.cashbackPercent) / 100)
    const remaining = Math.max(0, totalPaid - cashback)
    const goldPart = Math.floor((remaining * raffle.rewardConfig.cashbackToGoldPercent) / 100)
    const goldSot = Math.floor(goldPart / Math.max(10000, raffle.rewardConfig.tomanPerGoldSot))
    raffle.ticketsSold += pack.paidTickets
    raffle.participantsCount += 1
    if (authUser) {
      authUser.walletBalance = Math.max(0, authUser.walletBalance - totalPaid + cashback)
      authUser.goldSotBalance = Math.max(0, authUser.goldSotBalance + goldSot)
      authUser.chances = Math.max(0, authUser.chances + pack.paidTickets + pack.bonusChances)
    }

    return {
      totalPaid,
      ticketPrices,
      cashback,
      goldSot,
      rewardConfig: raffle.rewardConfig,
      combo: pack,
    } as T
  }

  // Showroom endpoints
  if (path === "/showroom/vehicles" && method === "GET") {
    return { items: showroomVehicles.filter((vehicle) => vehicle.status === "available") } as T
  }

  if (path.startsWith("/showroom/vehicles/") && method === "GET" && !path.endsWith("/orders")) {
    const vehicleId = path.split("/")[3]
    const vehicle = showroomVehicles.find((item) => item.id === vehicleId)
    if (!vehicle) throw new MockApiError("خودرو پیدا نشد", 404)
    return { item: vehicle } as T
  }

  if (path.startsWith("/showroom/vehicles/") && path.endsWith("/orders") && method === "POST") {
    const vehicleId = path.split("/")[3]
    const vehicle = showroomVehicles.find((item) => item.id === vehicleId)
    if (!vehicle) throw new MockApiError("خودرو پیدا نشد", 404)
    if (vehicle.status !== "available") throw new MockApiError("این خودرو فعلا قابل سفارش نیست", 400)
    const requestedAsset = String(bodyData?.paymentAsset ?? "IRR")
    const paymentAsset = requestedAsset === "GOLD_SOT" ? "GOLD_SOT" : requestedAsset === "LOAN" ? "LOAN" : "IRR"
    const cashPrice = vehicle.listedPriceIrr ?? 0
    const paymentAmount = paymentAsset === "GOLD_SOT" ? (vehicle.listedPriceGoldSot ?? 0) : cashPrice
    if (paymentAsset === "IRR" && (authUser?.walletBalance ?? 0) < cashPrice) throw new MockApiError("موجودی تومان کافی نیست", 400)
    if (paymentAsset === "GOLD_SOT" && (authUser?.goldSotBalance ?? 0) < (vehicle.listedPriceGoldSot ?? 0)) throw new MockApiError("موجودی سوت کافی نیست", 400)
    let loanMonths: number | undefined
    let downPaymentIrr: number | undefined
    let loanAmountIrr: number | undefined
    let monthlyInstallmentIrr: number | undefined
    if (paymentAsset === "LOAN") {
      if (!isProUser(authUser)) throw new MockApiError("خرید وامی فقط برای کاربران پرو فعال است", 403)
      loanMonths = Math.max(6, Math.min(60, safeNumber(bodyData?.loanMonths, 12)))
      downPaymentIrr = Math.max(0, safeNumber(bodyData?.downPaymentIrr, Math.round(cashPrice * 0.2)))
      const minDownPayment = Math.round(cashPrice * 0.2)
      if (downPaymentIrr < minDownPayment) throw new MockApiError(`حداقل پیش پرداخت ${minDownPayment.toLocaleString("fa-IR")} تومان است`, 400)
      if ((authUser?.walletBalance ?? 0) < downPaymentIrr) throw new MockApiError("موجودی تومان برای پیش پرداخت کافی نیست", 400)
      loanAmountIrr = Math.max(0, cashPrice - downPaymentIrr)
      if (loanAmountIrr > 0) {
        const plan = calcLoanPlan(loanAmountIrr, loanMonths)
        monthlyInstallmentIrr = plan.monthlyInstallmentIrr
        const loan: LoanMock = {
          id: `loan-${Date.now()}`,
          principalIrr: loanAmountIrr,
          outstandingIrr: plan.totalRepayableIrr,
          installmentCount: plan.months,
          monthlyInstallmentIrr: plan.monthlyInstallmentIrr,
          interestRateMonthlyPercent: plan.interestRateMonthlyPercent,
          totalRepayableIrr: plan.totalRepayableIrr,
          status: "active",
          createdAt: new Date().toISOString(),
          dueAt: new Date(Date.now() + plan.months * 30 * 24 * 60 * 60 * 1000).toISOString(),
        }
        mockLoans = [loan, ...mockLoans]
      }
    }
    if (authUser && paymentAsset === "IRR") authUser.walletBalance = Math.max(0, (authUser.walletBalance ?? 0) - cashPrice)
    if (authUser && paymentAsset === "GOLD_SOT") authUser.goldSotBalance = Math.max(0, (authUser.goldSotBalance ?? 0) - (vehicle.listedPriceGoldSot ?? 0))
    if (authUser && paymentAsset === "LOAN" && downPaymentIrr) authUser.walletBalance = Math.max(0, (authUser.walletBalance ?? 0) - downPaymentIrr)
    const order = {
      id: `order-${Date.now()}`,
      vehicleId: vehicle.id,
      vehicleTitle: vehicle.vehicle.title,
      buyerUserId: String(authUser?.id ?? "guest"),
      buyerEmail: String(authUser?.email ?? "guest@local"),
      paymentAsset,
      paymentAmount,
      loanMonths,
      loanAmountIrr,
      downPaymentIrr,
      monthlyInstallmentIrr,
      status: "paid",
      createdAt: new Date().toISOString(),
    } satisfies ShowroomOrder
    showroomOrders = [order, ...showroomOrders]
    vehicle.status = "sold"
    vehicle.vehicle.participantsCount += 1
    vehicle.vehicle.raffleParticipantsCount += 1
    vehicle.vehicle.raffle.goldSotBack += 1
    return { orderId: order.id, order } as T
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
    advanceSlideLifecycle()
    const drawIdFromPath = path.split("/")[3]
    const chancesToUse = safeNumber(bodyData?.chancesToUse, 1)
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
    hydrateSlideParticipants()

    return {
      assignedNumbers,
      chancesUsed: chancesToUse,
      availableChances: Math.max(0, authUser?.chances ?? 0),
      myEntriesCount: (slideEntriesByUser[userId] ?? []).length,
    } as T
  }

  // Slide Single endpoint
  if (path === "/slide/single/today" && method === "GET") {
    return slideSingleState as T
  }

  if (path === "/slide/single/spin" && method === "POST") {
    return {
      position: Math.floor(Math.random() * (100 - Math.max(0, gameDifficulty / 2))),
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
    return { items: mockLoans } as T
  }

  if (path === "/loans/request" && method === "POST") {
    if (!isProUser(authUser)) throw new MockApiError("درخواست وام فقط برای کاربران پرو فعال است", 403)
    const amount = Math.max(0, safeNumber(bodyData?.amount, 0))
    const dueDays = Math.max(30, safeNumber(bodyData?.dueDays, 360))
    const months = Math.max(1, Math.round(dueDays / 30))
    if (amount <= 0) throw new MockApiError("مبلغ وام معتبر نیست", 400)
    const plan = calcLoanPlan(amount, months)
    const loan: LoanMock = {
      id: "loan-" + Date.now(),
      principalIrr: amount,
      outstandingIrr: plan.totalRepayableIrr,
      installmentCount: plan.months,
      monthlyInstallmentIrr: plan.monthlyInstallmentIrr,
      interestRateMonthlyPercent: plan.interestRateMonthlyPercent,
      totalRepayableIrr: plan.totalRepayableIrr,
      status: "pending",
      createdAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + plan.months * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
    mockLoans = [loan, ...mockLoans]
    return { loan } as T
  }

  if (path.startsWith("/loans/") && path.endsWith("/repay")) {
    const loanId = path.split("/")[2]
    const amount = Math.max(0, safeNumber(bodyData?.amount, 0))
    const loan = mockLoans.find((item) => item.id === loanId)
    if (!loan) throw new MockApiError("وام پیدا نشد", 404)
    if (amount <= 0) throw new MockApiError("مبلغ بازپرداخت معتبر نیست", 400)
    if ((authUser?.walletBalance ?? 0) < amount) throw new MockApiError("موجودی تومان کافی نیست", 400)
    const repay = Math.min(amount, loan.outstandingIrr)
    loan.outstandingIrr = Math.max(0, loan.outstandingIrr - repay)
    loan.status = loan.outstandingIrr <= 0 ? "repaid" : "active"
    if (authUser) authUser.walletBalance = Math.max(0, (authUser.walletBalance ?? 0) - repay)
    return { loan, repaid: repay } as T
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
    const items = liveAuctions
      .map((auction) => ({
        ...auction,
        bidsCount: auction.bidsCount ?? 0,
        bestBid: auction.topBidder?.amount ?? auction.currentBid,
      }))
      .sort((a, b) => (a.endAt < b.endAt ? 1 : -1))
    return { items } as T
  }

  if (path.startsWith("/auctions/live/") && path.endsWith("/bid") && method === "POST") {
    if (!isProUser(authUser)) throw new MockApiError("شرکت در مزایده فقط برای کاربران پرو فعال است", 403)
    const auctionId = path.split("/")[3]
    const auction = liveAuctions.find((item) => item.id === auctionId)
    if (!auction) throw new MockApiError("مزایده پیدا نشد", 404)
    if (auction.status !== "open") throw new MockApiError("مزایده بسته است", 400)
    const amount = Math.max(0, safeNumber(bodyData?.amount, 0))
    const minStep = 10_000_000
    const minimum = (auction.topBidder?.amount ?? auction.currentBid) + minStep
    if (amount < minimum) throw new MockApiError(`حداقل پیشنهاد ${minimum.toLocaleString("fa-IR")} تومان است`, 400)
    if (amount % minStep !== 0) throw new MockApiError("مبلغ پیشنهاد باید مضرب ۱۰,۰۰۰,۰۰۰ تومان باشد", 400)
    if ((authUser?.walletBalance ?? 0) < amount) throw new MockApiError("موجودی تومان کافی نیست", 400)
    auction.currentBid = amount
    auction.bidsCount = (auction.bidsCount ?? 0) + 1
    auction.topBidder = {
      userId: String(authUser?.id ?? "user"),
      displayName: displayNameForUser(authUser),
      amount,
    }
    return { ok: true, bid: { auctionId, amount, topBidder: auction.topBidder } } as T
  }

  // Cars endpoint (alias for showroom)
  if (path === "/cars" && method === "GET") {
    return { items: showroomVehicles } as T
  }

  // Admin endpoints
  if (path === "/admin/auctions/live" && method === "POST") {
    const auction: AuctionMock = {
      id: `auction-${Date.now()}`,
      title: String(bodyData?.title ?? "مزایده خودرو"),
      description: String(bodyData?.description ?? ""),
      imageUrl: String(
        bodyData?.imageUrl ??
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000",
      ),
      startPrice: Math.max(10_000_000, safeNumber(bodyData?.startPrice, 100_000_000)),
      currentBid: Math.max(10_000_000, safeNumber(bodyData?.startPrice, 100_000_000)),
      minStep: 10_000_000,
      status: "open",
      endAt: String(bodyData?.endsAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
      bidsCount: 0,
      vehicle: {
        model: String(bodyData?.model ?? "Model"),
        year: Math.max(1990, safeNumber(bodyData?.year, new Date().getFullYear())),
        city: String(bodyData?.city ?? "تهران"),
        mileageKm: Math.max(0, safeNumber(bodyData?.mileageKm, 0)),
        transmission: bodyData?.transmission === "manual" ? "manual" : "automatic",
        fuelType:
          bodyData?.fuelType === "hybrid" || bodyData?.fuelType === "electric" || bodyData?.fuelType === "diesel"
            ? bodyData?.fuelType
            : "gasoline",
      },
    }
    liveAuctions = [auction, ...liveAuctions]
    return { auction } as T
  }

  if (path.startsWith("/admin/auctions/live/") && path.endsWith("/close") && method === "POST") {
    const auctionId = path.split("/")[4]
    const auction = liveAuctions.find((item) => item.id === auctionId)
    if (!auction) throw new MockApiError("مزایده پیدا نشد", 404)
    auction.status = "closed"
    return { auction, topBid: auction.topBidder ?? null } as T
  }

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

  if (path === "/admin/showroom/vehicles" && method === "GET") {
    return { items: showroomVehicles } as T
  }

  if (path === "/admin/showroom/vehicles" && method === "POST") {
    const title = String(bodyData?.title ?? "خودرو جدید")
    const imageUrl = String(bodyData?.imageUrl ?? "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200")
    const model = String(bodyData?.model ?? "مدل نامشخص")
    const year = Math.max(1990, safeNumber(bodyData?.year, new Date().getFullYear()))
    const mileageKm = Math.max(0, safeNumber(bodyData?.mileageKm, 0))
    const participantsCount = Math.max(0, safeNumber(bodyData?.participantsCount, 0))
    const raffleParticipantsCount = Math.max(0, safeNumber(bodyData?.raffleParticipantsCount, participantsCount))
    const vehicle = {
      id: `vehicle-${Date.now()}`,
      sourceType: bodyData?.sourceType === "lottery_winback" ? "lottery_winback" : "external_purchase",
      status: "available",
      acquisitionCostIrr: safeNumber(bodyData?.acquisitionCostIrr, 0) || undefined,
      listedPriceIrr: safeNumber(bodyData?.listedPriceIrr, 0) || undefined,
      listedPriceGoldSot: safeNumber(bodyData?.listedPriceGoldSot, 0) || undefined,
      createdAt: new Date().toISOString(),
      vehicle: {
        title,
        imageUrl,
        description: String(bodyData?.description ?? ""),
        model,
        year,
        city: String(bodyData?.city ?? "تهران"),
        mileageKm,
        isNew: Boolean(bodyData?.isNew ?? mileageKm <= 0),
        transmission: bodyData?.transmission === "manual" ? "manual" : "automatic",
        fuelType:
          bodyData?.fuelType === "hybrid" || bodyData?.fuelType === "electric" || bodyData?.fuelType === "diesel"
            ? bodyData.fuelType
            : "gasoline",
        participantsCount,
        raffleParticipantsCount,
        raffle: {
          cashbackPercent: Math.max(0, Math.min(100, safeNumber(bodyData?.cashbackPercent, 20))),
          cashbackToGoldPercent: Math.max(0, Math.min(100, safeNumber(bodyData?.cashbackToGoldPercent, 30))),
          tomanPerGoldSot: Math.max(10000, safeNumber(bodyData?.tomanPerGoldSot, 100000)),
          goldSotBack: Math.max(0, safeNumber(bodyData?.goldSotBack, 0)),
          mainPrizeTitle: String(bodyData?.mainPrizeTitle ?? "جایزه اصلی خودرو"),
          mainPrizeValueIrr: Math.max(0, safeNumber(bodyData?.mainPrizeValueIrr, 0)),
        },
      },
    } satisfies ShowroomVehicle
    showroomVehicles = [vehicle, ...showroomVehicles]
    return { item: vehicle } as T
  }

  if (path.startsWith("/admin/showroom/vehicles/") && method === "PUT") {
    const vehicleId = path.split("/")[4]
    const vehicle = showroomVehicles.find((item) => item.id === vehicleId)
    if (!vehicle) throw new MockApiError("خودرو پیدا نشد", 404)
    if (bodyData?.status) vehicle.status = bodyData.status as ShowroomVehicle["status"]
    return { item: vehicle } as T
  }

  if (path === "/admin/showroom/orders" && method === "GET") {
    return { items: showroomOrders } as T
  }

  if (path.startsWith("/admin/showroom/orders/") && path.endsWith("/status") && method === "POST") {
    const orderId = path.split("/")[4]
    const order = showroomOrders.find((item) => item.id === orderId)
    if (!order) throw new MockApiError("سفارش پیدا نشد", 404)
    const status = bodyData?.status as ShowroomOrder["status"] | undefined
    if (status !== "pending" && status !== "paid" && status !== "completed" && status !== "cancelled") {
      throw new MockApiError("وضعیت نامعتبر است", 400)
    }
    order.status = status
    if (status === "completed") {
      const vehicle = showroomVehicles.find((item) => item.id === order.vehicleId)
      if (vehicle) vehicle.status = "sold"
    }
    return { item: order } as T
  }

  if (path === "/admin/raffles" && method === "GET") {
    return { items: raffles } as T
  }

  if (path === "/admin/raffles" && method === "POST") {
    const basePrice = Math.max(1000, safeNumber(bodyData?.basePrice, 50000))
    const cashbackPercent = Math.max(0, Math.min(100, safeNumber(bodyData?.cashbackPercent, 20)))
    const cashbackToGoldPercent = Math.max(0, Math.min(100, safeNumber(bodyData?.cashbackToGoldPercent, 30)))
    const raffle = {
      id: `raffle-${Date.now()}`,
      title: String(bodyData?.title ?? "قرعه کشی جدید"),
      status: "draft",
      maxTickets: Math.max(1, safeNumber(bodyData?.maxTickets, 1000)),
      ticketsSold: 0,
      participantsCount: Math.max(0, safeNumber(bodyData?.participantsCount, 0)),
      seedCommitHash: `0x${pickHash(24)}`,
      dynamicPricing: {
        basePrice,
        decayFactor: Number(bodyData?.decayFactor ?? 0.98),
        minPrice: Math.max(1000, safeNumber(bodyData?.minPrice, Math.floor(basePrice * 0.6))),
      },
      tiers: [
        { order: 1, price: basePrice, discountPercent: 0 },
        { order: 2, price: Math.floor(basePrice * 0.85), discountPercent: 15 },
        { order: 3, price: Math.floor(basePrice * 0.75), discountPercent: 25 },
      ],
      comboPackages: [
        { code: "silver", title: "بسته نقره‌ای", paidTickets: 50, bonusTickets: 10, bonusChances: 5, vipDays: 7 },
        { code: "gold", title: "بسته طلایی", paidTickets: 100, bonusTickets: 30, bonusChances: 15, vipDays: 30 },
      ],
      rewardConfig: {
        cashbackPercent,
        cashbackToGoldPercent,
        tomanPerGoldSot: Math.max(10000, safeNumber(bodyData?.tomanPerGoldSot, 100000)),
        mainPrizeTitle: String(bodyData?.mainPrizeTitle ?? "جایزه اصلی خودرو"),
        mainPrizeValueIrr: Math.max(0, safeNumber(bodyData?.mainPrizeValueIrr, 0)),
      },
    } satisfies RaffleState
    raffles = [raffle, ...raffles]
    return { item: raffle } as T
  }

  if (path.startsWith("/admin/raffles/") && method === "PUT") {
    const raffleId = path.split("/")[3]
    const raffle = raffles.find((item) => item.id === raffleId)
    if (!raffle) throw new MockApiError("قرعه کشی پیدا نشد", 404)
    raffle.title = String(bodyData?.title ?? raffle.title)
    raffle.maxTickets = Math.max(1, safeNumber(bodyData?.maxTickets, raffle.maxTickets))
    raffle.participantsCount = Math.max(0, safeNumber(bodyData?.participantsCount, raffle.participantsCount))
    raffle.dynamicPricing.basePrice = Math.max(1000, safeNumber(bodyData?.basePrice, raffle.dynamicPricing.basePrice))
    raffle.dynamicPricing.minPrice = Math.max(1000, safeNumber(bodyData?.minPrice, raffle.dynamicPricing.minPrice))
    raffle.dynamicPricing.decayFactor = Number(bodyData?.decayFactor ?? raffle.dynamicPricing.decayFactor)
    raffle.rewardConfig.cashbackPercent = Math.max(0, Math.min(100, safeNumber(bodyData?.cashbackPercent, raffle.rewardConfig.cashbackPercent)))
    raffle.rewardConfig.cashbackToGoldPercent = Math.max(0, Math.min(100, safeNumber(bodyData?.cashbackToGoldPercent, raffle.rewardConfig.cashbackToGoldPercent)))
    raffle.rewardConfig.tomanPerGoldSot = Math.max(10000, safeNumber(bodyData?.tomanPerGoldSot, raffle.rewardConfig.tomanPerGoldSot))
    raffle.rewardConfig.mainPrizeTitle = String(bodyData?.mainPrizeTitle ?? raffle.rewardConfig.mainPrizeTitle)
    raffle.rewardConfig.mainPrizeValueIrr = Math.max(0, safeNumber(bodyData?.mainPrizeValueIrr, raffle.rewardConfig.mainPrizeValueIrr))
    return { item: raffle } as T
  }

  if (path.startsWith("/admin/raffles/") && path.endsWith("/open") && method === "POST") {
    const raffle = raffles.find((item) => item.id === path.split("/")[3])
    if (!raffle) throw new MockApiError("قرعه کشی پیدا نشد", 404)
    raffle.status = "open"
    return { item: raffle } as T
  }

  if (path.startsWith("/admin/raffles/") && path.endsWith("/close") && method === "POST") {
    const raffle = raffles.find((item) => item.id === path.split("/")[3])
    if (!raffle) throw new MockApiError("قرعه کشی پیدا نشد", 404)
    raffle.status = "closed"
    return { item: raffle } as T
  }

  if (path.startsWith("/admin/raffles/") && path.endsWith("/draw") && method === "POST") {
    const raffle = raffles.find((item) => item.id === path.split("/")[3])
    if (!raffle) throw new MockApiError("قرعه کشی پیدا نشد", 404)
    raffle.status = "drawn"
    return { success: true, winnerNumber: Math.floor(Math.random() * 99999) + 1, rewardConfig: raffle.rewardConfig } as T
  }

  if (path === "/admin/game/difficulty" && method === "GET") {
    return { difficulty: gameDifficulty } as T
  }

  if (path === "/admin/game/difficulty" && method === "PUT") {
    gameDifficulty = Math.max(0, Math.min(100, safeNumber(bodyData?.difficulty, gameDifficulty)))
    return { success: true, difficulty: gameDifficulty } as T
  }

  if (path === "/admin/slide/single/target" && method === "POST") {
    slideSingleState = {
      date: String(bodyData?.targetDate ?? slideSingleState.date),
      hasTarget: true,
      targetNumber: Math.max(1, Math.min(100, safeNumber(bodyData?.winningNumber, slideSingleState.targetNumber))),
    }
    return { success: true, ...slideSingleState } as T
  }

  if (path === "/admin/slide/preview" && method === "GET") {
    hydrateSlideParticipants()
    const topParticipants = [...slideDrawState.participants]
      .sort((a, b) => b.chances - a.chances)
      .slice(0, 10)
      .map((participant) => ({
        userId: participant.userId,
        email: participant.email,
        fullName: participant.fullName,
        chances: participant.chances,
      }))
    return {
      totalParticipants: slideDrawState.participants.length,
      totalChances: getSlideEntriesCount(),
      topParticipants,
    } as T
  }

  if (path === "/admin/slide/draws" && method === "GET") {
    advanceSlideLifecycle()
    return { items: [slideDrawState, ...slideDrawHistory.filter((draw) => draw.id !== slideDrawState.id)] } as T
  }

  if (path === "/admin/slide/draws" && method === "POST") {
    if (slideDrawState.status === "scheduled" || slideDrawState.status === "processing") {
      throw new MockApiError("ابتدا قرعه فعال فعلی را نهایی یا حذف کنید", 400)
    }
    slideDrawState = {
      id: `draw-${Date.now()}`,
      status: "scheduled",
      title: String(bodyData?.title ?? "قرعه کشی اسلاید"),
      scheduledAt: String(bodyData?.scheduledAt ?? new Date(Date.now() + 60 * 60 * 1000).toISOString()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      seedCommitHash: `0x${pickHash(24)}`,
      proof: null,
      participants: slideDrawState.participants.map((participant) => ({ ...participant, chances: 0 })),
      prizes: Array.isArray(bodyData?.prizes) ? (bodyData.prizes as SlidePrizeMock[]) : slideDrawState.prizes,
      totalEntries: 0,
      winningLogs: [],
      winners: [],
      targetNumber: undefined,
      entries: [],
    }
    slideEntriesByUser = {}
    slideUsedNumbers = new Set<number>()
    slideProcessingUntil = 0
    return { item: slideDrawState } as T
  }

  if (path.startsWith("/admin/slide/draws/") && method === "PUT") {
    const drawId = path.split("/")[4]
    if (drawId !== slideDrawState.id) throw new MockApiError("قرعه پیدا نشد", 404)
    slideDrawState.title = String(bodyData?.title ?? slideDrawState.title)
    slideDrawState.scheduledAt = String(bodyData?.scheduledAt ?? slideDrawState.scheduledAt)
    if (Array.isArray(bodyData?.prizes)) {
      slideDrawState.prizes = bodyData.prizes as SlidePrizeMock[]
    }
    slideDrawState.updatedAt = new Date().toISOString()
    return { item: slideDrawState } as T
  }

  if (path.startsWith("/admin/slide/draws/") && method === "DELETE") {
    const drawId = path.split("/")[4]
    if (drawId !== slideDrawState.id) throw new MockApiError("قرعه پیدا نشد", 404)
    const refundedUsers = Object.keys(slideEntriesByUser).length
    const refundedChances = getSlideEntriesCount()
    slideEntriesByUser = {}
    slideUsedNumbers = new Set<number>()
    slideDrawState = {
      ...slideDrawState,
      id: `draw-${Date.now()}`,
      status: "cancelled",
      title: "قرعه فعال ندارد",
      participants: [],
      prizes: [],
      winningLogs: [],
      winners: [],
      totalEntries: 0,
      entries: [],
      targetNumber: undefined,
      updatedAt: new Date().toISOString(),
    }
    return { refundedUsers, refundedChances } as T
  }

  if (path.startsWith("/admin/slide/draws/") && path.endsWith("/run") && method === "POST") {
    const drawId = path.split("/")[4]
    if (drawId !== slideDrawState.id) throw new MockApiError("قرعه پیدا نشد", 404)
    advanceSlideLifecycle(true)
    return { success: true } as T
  }

  if (path.startsWith("/admin/slide/draws/") && path.endsWith("/log")) {
    const drawId = path.split("/")[4]
    const draw = drawId === slideDrawState.id ? slideDrawState : slideDrawHistory.find((item) => item.id === drawId)
    if (!draw) throw new MockApiError("لاگ پیدا نشد", 404)
    const participants = draw.participants.map((participant) => ({
      userId: participant.userId,
      userEmail: participant.email,
      fullName: participant.fullName,
      chances: participant.chances,
    }))
    const winners = (draw.winningLogs ?? []).map((winner) => {
      const participant = draw.participants.find((item) => item.userId === winner.userId)
      return {
        rank: winner.rank,
        winningNumber: winner.winningNumber,
        userId: winner.userId,
        userEmail: participant?.email ?? `${winner.userId}@local`,
        fullName: participant?.fullName ?? winner.fullName,
        chancesAtDraw: participant?.chances ?? 0,
        prize: winner.prize,
      }
    })
    return {
      draw: {
        id: draw.id,
        title: draw.title,
        status: draw.status,
        scheduledAt: draw.scheduledAt,
        createdAt: draw.createdAt ?? draw.scheduledAt,
        updatedAt: draw.updatedAt ?? draw.scheduledAt,
        createdBy: "admin-1",
        seedCommitHash: draw.seedCommitHash ?? `0x${pickHash(24)}`,
        targetNumber: draw.targetNumber,
        prizes: draw.prizes,
        proof: draw.proof ?? null,
      },
      summary: {
        totalEntries: draw.totalEntries,
        totalParticipants: participants.length,
        totalWinners: winners.length,
      },
      participants,
      entries: draw.entries ?? [],
      winners,
    } as T
  }

  if (path === "/admin/dashboard/summary") {
    return {
      monthlySales: showroomOrders.reduce((sum, order) => sum + (order.status !== "cancelled" ? order.paymentAmount : 0), 0),
      activeUsers: 450,
      soldTickets: raffles.reduce((sum, raffle) => sum + raffle.ticketsSold, 0),
      pendingWithdrawals: 7,
    } as T
  }

  if (path === "/admin/live/metrics") {
    return {
      openRaffles: raffles.filter((raffle) => raffle.status === "open").length,
      closedRaffles: raffles.filter((raffle) => raffle.status === "closed").length,
      gameDifficulty,
      slide: {
        upcoming:
          slideDrawState.status === "scheduled" || slideDrawState.status === "processing"
            ? { id: slideDrawState.id, title: slideDrawState.title, scheduledAt: slideDrawState.scheduledAt }
            : null,
      },
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
