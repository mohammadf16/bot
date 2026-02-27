import { z } from "zod"
import type { RouteContext } from "../route-context.js"
import { env } from "../env.js"
import { createProvablyFairProof } from "../security/lottery.js"
import { pushAudit, pushLiveEvent } from "../services/events.js"
import { pushUserNotification } from "../services/notifications.js"
import { finalizeSlideDraw } from "../services/slide-draw.js"
import { normalizeWheelConfig, toLegacyCompatibleWheelConfig } from "../services/wheel-config.js"
import { normalizePaymentConfig } from "../services/payment-config.js"
import { decryptText, encryptText, randomHex, sha256Hex } from "../utils/crypto.js"
import { id } from "../utils/id.js"
import { nowIso } from "../utils/time.js"
import type { PricingPolicy, Raffle } from "../types.js"

const tierSchema = z.object({
  order: z.number().int().min(1),
  price: z.number().int().positive(),
  discountPercent: z.number().int().min(0).max(100),
})

const raffleConfigSchema = z.object({
  cashbackPercent: z.number().int().min(0).max(100),
  wheelChancePerTicket: z.number().int().min(0).max(1000),
  lotteryChancePerTicket: z.number().int().min(0).max(1000),
  freeEntryEveryN: z.number().int().min(1).max(1000),
})

const raffleDynamicPricingSchema = z.object({
  basePrice: z.number().int().positive(),
  minPrice: z.number().int().positive(),
  decayFactor: z.number().positive(),
})

const raffleRewardConfigSchema = z.object({
  cashbackPercent: z.number().int().min(0).max(100),
  cashbackToGoldPercent: z.number().int().min(0).max(100),
  tomanPerGoldSot: z.number().int().positive(),
  mainPrizeTitle: z.string().trim().min(2).max(180),
  mainPrizeValueIrr: z.number().int().min(0).max(1_000_000_000_000),
})

const raffleCreateSchema = z.object({
  vehicleId: z.string().min(3),
  title: z.string().min(3).max(120).optional(),
  maxTickets: z.number().int().positive().max(2_000_000),
  participantsCount: z.number().int().min(0).max(10_000_000).optional(),
  tiers: z.array(tierSchema).min(1).max(20).optional(),
  config: raffleConfigSchema.optional(),
  dynamicPricing: raffleDynamicPricingSchema.optional(),
  rewardConfig: raffleRewardConfigSchema.optional(),
  basePrice: z.number().int().positive().optional(),
  minPrice: z.number().int().positive().optional(),
  decayFactor: z.number().positive().optional(),
  cashbackPercent: z.number().int().min(0).max(100).optional(),
  cashbackToGoldPercent: z.number().int().min(0).max(100).optional(),
  tomanPerGoldSot: z.number().int().positive().optional(),
  mainPrizeTitle: z.string().trim().min(2).max(180).optional(),
  mainPrizeValueIrr: z.number().int().min(0).max(1_000_000_000_000).optional(),
})

const raffleUpdateSchema = raffleCreateSchema.partial()

const drawSchema = z.object({
  winnersCount: z.number().int().min(1).max(100).default(5),
  externalEntropy: z.string().min(16).max(256).optional(),
})

const pricingSchema = z.object({
  version: z.string().min(2).max(50),
  tiers: z.array(tierSchema).min(1).max(30),
  config: z.object({
    cashbackPercent: z.number().int().min(0).max(100),
    wheelChancePerTicket: z.number().int().min(0).max(1000),
    lotteryChancePerTicket: z.number().int().min(0).max(1000),
    freeEntryEveryN: z.number().int().min(1).max(1000),
  }),
})

const rulesSchema = z.object({
  rules: z.string().min(10).max(50_000),
})

const wheelSegmentSchema = z.object({
  label: z.string().trim().min(1).max(100),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  weight: z.number().int().min(1).max(100),
})

const wheelTierSchema = z.object({
  costAsset: z.enum(["CHANCE", "IRR"]),
  costAmount: z.number().int().min(1).max(1_000_000_000),
  segments: z.array(wheelSegmentSchema).min(2).max(20),
})

const wheelSchemaV2 = z.object({
  raffleCostChances: z.number().int().min(1).max(1000),
  referralChancePerUser: z.number().int().min(0).max(1000),
  slideGameCostChances: z.number().int().min(1).max(1000),
  tiers: z.object({
    normal: wheelTierSchema,
    gold: wheelTierSchema,
    jackpot: wheelTierSchema,
  }),
})

const wheelSchemaLegacy = z.object({
  wheelCostChances: z.number().int().min(1).max(1000),
  raffleCostChances: z.number().int().min(1).max(1000),
  referralChancePerUser: z.number().int().min(0).max(1000),
  slideGameCostChances: z.number().int().min(1).max(1000),
  segments: z.array(wheelSegmentSchema).min(2).max(20),
})

const wheelSchema = z.union([wheelSchemaV2, wheelSchemaLegacy]).transform((value) => normalizeWheelConfig(value))

const adminUserUpdateSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
  walletBalance: z.number().int().min(0).max(1_000_000_000_000).optional(),
  chances: z.number().int().min(0).max(1_000_000).optional(),
  profile: z.object({
    fullName: z.string().trim().max(120).optional(),
    username: z.string().trim().min(3).max(32).optional(),
    phone: z.string().trim().max(24).optional(),
    city: z.string().trim().max(64).optional(),
    address: z.string().trim().max(255).optional(),
    bio: z.string().trim().max(500).optional(),
    avatarUrl: z.string().url().optional(),
  }).optional(),
})

const slidePrizeSchema = z.object({
  rankFrom: z.number().int().min(1).max(100000),
  rankTo: z.number().int().min(1).max(100000),
  title: z.string().trim().min(2).max(140),
  amount: z.number().int().positive().optional(),
}).refine((v) => v.rankFrom <= v.rankTo, { message: "rankFrom must be <= rankTo" })

const slideDrawCreateSchema = z.object({
  title: z.string().trim().min(3).max(140),
  scheduledAt: z.string().datetime(),
  prizes: z.array(slidePrizeSchema).min(1).max(20),
})

const slideDrawUpdateSchema = slideDrawCreateSchema.partial()

const dailySlideTargetSchema = z.object({
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  winningNumber: z.number().int().min(1).max(100),
})

const difficultySchema = z.object({
  difficulty: z.number().int().min(0).max(100),
})

const cardToCardReviewSchema = z.object({
  note: z.string().trim().max(500).optional(),
})

const paymentCardToCardUpdateSchema = z.object({
  destinationCard: z.string().trim().min(12).max(32),
  enabled: z.boolean().optional(),
})

const paymentGatewaySchema = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[a-zA-Z0-9_-]+$/),
  provider: z.string().trim().min(2).max(80),
  displayName: z.string().trim().min(2).max(120),
  enabled: z.boolean().default(true),
  sandbox: z.boolean().default(true),
  priority: z.number().int().min(0).max(1000).default(100),
  checkoutUrl: z.string().trim().url().max(2048).optional(),
  verifyUrl: z.string().trim().url().max(2048).optional(),
  callbackUrl: z.string().trim().url().max(2048).optional(),
  merchantId: z.string().trim().max(256).optional(),
  apiKey: z.string().trim().max(512).optional(),
  apiSecret: z.string().trim().max(512).optional(),
  publicKey: z.string().trim().max(2048).optional(),
  privateKey: z.string().trim().max(4096).optional(),
  webhookSecret: z.string().trim().max(512).optional(),
  minAmountIrr: z.number().int().min(0).max(1_000_000_000_000).optional(),
  maxAmountIrr: z.number().int().min(0).max(1_000_000_000_000).optional(),
  feePercent: z.number().min(0).max(100).optional(),
  feeFixedIrr: z.number().int().min(0).max(1_000_000_000_000).optional(),
  description: z.string().trim().max(500).optional(),
})

const paymentGatewayUpdateSchema = paymentGatewaySchema.partial()

const paymentDefaultGatewaySchema = z.object({
  gatewayId: z.string().trim().min(3).optional(),
})

function normalizeRaffleDynamicPricing(input: {
  dynamicPricing?: { basePrice: number; minPrice: number; decayFactor: number }
  basePrice?: number
  minPrice?: number
  decayFactor?: number
}): { basePrice: number; minPrice: number; decayFactor: number } | undefined {
  const dynamic = input.dynamicPricing
  const basePrice = dynamic?.basePrice ?? input.basePrice
  const minPrice = dynamic?.minPrice ?? input.minPrice
  const decayFactor = dynamic?.decayFactor ?? input.decayFactor
  if (!basePrice || !minPrice || !decayFactor) return undefined
  return { basePrice, minPrice, decayFactor }
}

function normalizeRaffleRewardConfig(input: {
  config?: { cashbackPercent: number }
  rewardConfig?: {
    cashbackPercent: number
    cashbackToGoldPercent: number
    tomanPerGoldSot: number
    mainPrizeTitle: string
    mainPrizeValueIrr: number
  }
  cashbackPercent?: number
  cashbackToGoldPercent?: number
  tomanPerGoldSot?: number
  mainPrizeTitle?: string
  mainPrizeValueIrr?: number
}): {
  cashbackPercent: number
  cashbackToGoldPercent: number
  tomanPerGoldSot: number
  mainPrizeTitle: string
  mainPrizeValueIrr: number
} | undefined {
  const reward = input.rewardConfig
  const cashbackPercent = reward?.cashbackPercent ?? input.cashbackPercent ?? input.config?.cashbackPercent
  const cashbackToGoldPercent = reward?.cashbackToGoldPercent ?? input.cashbackToGoldPercent
  const tomanPerGoldSot = reward?.tomanPerGoldSot ?? input.tomanPerGoldSot
  const mainPrizeTitle = reward?.mainPrizeTitle ?? input.mainPrizeTitle
  const mainPrizeValueIrr = reward?.mainPrizeValueIrr ?? input.mainPrizeValueIrr
  if (
    cashbackPercent === undefined ||
    cashbackToGoldPercent === undefined ||
    tomanPerGoldSot === undefined ||
    mainPrizeTitle === undefined ||
    mainPrizeValueIrr === undefined
  ) {
    return undefined
  }
  return {
    cashbackPercent,
    cashbackToGoldPercent,
    tomanPerGoldSot,
    mainPrizeTitle,
    mainPrizeValueIrr,
  }
}

function toAdminRaffleShape(store: RouteContext["store"], raffle: Raffle) {
  const participantsCount = raffle.participantsCount ?? new Set(store.getTicketsByRaffle(raffle.id).map((ticket) => ticket.userId)).size
  const dynamicPricing = raffle.dynamicPricing ?? { basePrice: 1_000_000, minPrice: 500_000, decayFactor: 0.8 }
  const rewardConfig = raffle.rewardConfig ?? {
    cashbackPercent: raffle.config.cashbackPercent,
    cashbackToGoldPercent: 30,
    tomanPerGoldSot: 100_000,
    mainPrizeTitle: "جایزه اصلی خودرو",
    mainPrizeValueIrr: 0,
  }
  let linkedVehicle: {
    id: string; title: string; imageUrl: string; model: string
    year: number; city: string; status: string; listedPriceIrr?: number
  } | undefined
  if (raffle.linkedVehicleId) {
    const v = store.showroomVehicles.get(raffle.linkedVehicleId)
    if (v) {
      const d = v.vehicle
      const imgs = Array.isArray(d["imageUrls"]) ? (d["imageUrls"] as string[]) : []
      const pi = Math.max(0, Math.min(imgs.length - 1, Number(d["primaryImageIndex"] ?? 0)))
      linkedVehicle = {
        id: v.id,
        title: String(d["title"] ?? ""),
        imageUrl: imgs[pi] ?? String(d["imageUrl"] ?? ""),
        model: String(d["model"] ?? d["title"] ?? ""),
        year: Number(d["year"] ?? 0),
        city: String(d["city"] ?? ""),
        status: v.status,
        listedPriceIrr: v.listedPriceIrr,
      }
    }
  }
  return {
    ...raffle,
    participantsCount,
    dynamicPricing,
    rewardConfig,
    linkedVehicle,
  }
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function toNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => toNumber(item))
    .filter((item) => Number.isFinite(item))
}

function ensureRaffleUserStats(user: {
  vipLevelId?: number
  vipLevelName?: string
  vipCashbackPercent?: number
  totalTicketsBought?: number
  totalSpendIrr?: number
  activeReferrals?: number
}): void {
  if (user.totalTicketsBought === undefined) user.totalTicketsBought = 0
  if (user.totalSpendIrr === undefined) user.totalSpendIrr = 0
  if (user.activeReferrals === undefined) user.activeReferrals = 0
  if (user.vipLevelId === undefined) user.vipLevelId = 1
  if (!user.vipLevelName) user.vipLevelName = "برنزی"
  if (user.vipCashbackPercent === undefined) user.vipCashbackPercent = 20
}

function recalculateVipForPayment(user: {
  vipLevelId?: number
  vipLevelName?: string
  vipCashbackPercent?: number
  totalTicketsBought?: number
  totalSpendIrr?: number
  activeReferrals?: number
}): void {
  ensureRaffleUserStats(user)
  const tickets = user.totalTicketsBought ?? 0
  const spend = user.totalSpendIrr ?? 0
  const refs = user.activeReferrals ?? 0

  if (spend >= 50_000_000) {
    user.vipLevelId = 5
    user.vipLevelName = "الماس"
    user.vipCashbackPercent = 35
    return
  }
  if (refs >= 10) {
    user.vipLevelId = 4
    user.vipLevelName = "پلاتینیوم"
    user.vipCashbackPercent = 35
    return
  }
  if (tickets > 20) {
    user.vipLevelId = 3
    user.vipLevelName = "طلایی"
    user.vipCashbackPercent = 30
    return
  }
  if (tickets > 5) {
    user.vipLevelId = 2
    user.vipLevelName = "نقره ای"
    user.vipCashbackPercent = 25
    return
  }
  user.vipLevelId = 1
  user.vipLevelName = "برنزی"
  user.vipCashbackPercent = 20
}

function getUserRefChain(store: RouteContext["store"], userId: string): string[] {
  const chain: string[] = []
  let cursor = store.users.get(userId)?.referredBy
  let guard = 0
  while (cursor && guard < 3) {
    chain.push(cursor)
    cursor = store.users.get(cursor)?.referredBy
    guard += 1
  }
  return chain
}

function applyReferralCommissions(
  store: RouteContext["store"],
  buyerUserId: string,
  purchaseAmount: number,
  raffleId: string,
): void {
  const percentages = [0.1, 0.03, 0.01]
  const ancestors = getUserRefChain(store, buyerUserId)

  ancestors.forEach((ancestorId, idx) => {
    const user = store.users.get(ancestorId)
    if (!user) return
    const amount = Math.floor(purchaseAmount * percentages[idx]!)
    if (amount <= 0) return
    user.walletBalance += amount
    user.updatedAt = nowIso()
    store.users.set(user.id, user)

    const txId = id("wtx")
    store.walletTx.set(txId, {
      id: txId,
      userId: user.id,
      type: "referral_commission",
      amount,
      status: "completed",
      createdAt: nowIso(),
      meta: {
        depth: idx + 1,
        buyerUserId,
        sourceType: "raffle_ticket_purchase",
        sourceId: raffleId,
      },
    })
  })
}

function generateUniqueTicketSlideNumbers(store: RouteContext["store"], count: number): number[] {
  const existing = new Set<number>()
  for (const t of store.tickets.values()) {
    if (t.slideNumber) existing.add(t.slideNumber)
  }
  const out: number[] = []
  while (out.length < count) {
    const n = 100_000 + Math.floor(Math.random() * 900_000)
    if (existing.has(n)) continue
    existing.add(n)
    out.push(n)
  }
  return out
}

function createTicketsForPayment(args: {
  raffleId: string
  userId: string
  startIndex: number
  prices: number[]
  slideNumbers: number[]
  clientSeed?: string
}) {
  return args.prices.map((price, i) => {
    const index = args.startIndex + i + 1
    return {
      id: id("tkt"),
      raffleId: args.raffleId,
      userId: args.userId,
      index,
      slideNumber: args.slideNumbers[i] ?? (100_000 + i),
      pricePaid: price,
      clientSeed: args.clientSeed ?? `${args.userId}-${index}-${Date.now()}`,
      createdAt: nowIso(),
    }
  })
}

function createUniqueSlideEntryNumbers(existing: Set<number>, count: number): number[] {
  const out: number[] = []
  while (out.length < count) {
    const n = 100_000 + Math.floor(Math.random() * 900_000)
    if (existing.has(n)) continue
    existing.add(n)
    out.push(n)
  }
  return out
}

function attachShowroomOrderToActiveSlideDraw(
  store: RouteContext["store"],
  args: { orderId: string; vehicleId: string; userId: string; ticketCount?: number; at?: string },
): { drawId?: string; entryNumbers: number[] } {
  const draw = store.getSlideDraws().find((item) => item.status === "scheduled")
  if (!draw) return { entryNumbers: [] }
  const now = args.at ?? nowIso()
  const count = Math.max(1, Math.trunc(args.ticketCount ?? 1))
  const existingNumbers = new Set<number>((draw.entries ?? []).map((entry) => entry.entryNumber))
  const assignedNumbers = createUniqueSlideEntryNumbers(existingNumbers, count)
  const newEntries = assignedNumbers.map((entryNumber) => ({
    entryNumber,
    userId: args.userId,
    createdAt: now,
    sourceType: "showroom_purchase" as const,
    sourceOrderId: args.orderId,
    sourceVehicleId: args.vehicleId,
  }))
  draw.entries = [...(draw.entries ?? []), ...newEntries]
  draw.updatedAt = now
  store.slideDraws.set(draw.id, draw)
  return { drawId: draw.id, entryNumbers: assignedNumbers }
}

export async function registerAdminRoutes({ app, store }: RouteContext): Promise<void> {
  app.get("/admin/dashboard/summary", { preHandler: [app.adminOnly] }, async () => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthlySales = Array.from(store.walletTx.values())
      .filter((tx) => tx.type === "ticket_purchase" && tx.status === "completed" && tx.createdAt >= monthStart)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
    const activeUsers = Array.from(store.users.values()).filter((u) => (u.status ?? "active") === "active").length
    const pendingWithdrawals = Array.from(store.walletTx.values()).filter((t) => t.type === "withdraw_request" && t.status === "pending").length
    return {
      monthlySales,
      activeUsers,
      soldTickets: store.tickets.size,
      pendingWithdrawals,
    }
  })

  app.get("/admin/users", { preHandler: [app.adminOnly] }, async () => {
    const items = Array.from(store.users.values()).map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status ?? "active",
      walletBalance: u.walletBalance,
      chances: u.chances,
      referralCode: u.referralCode,
      profile: u.profile ?? {},
      createdAt: u.createdAt,
    }))
    return { items }
  })

  app.get("/admin/users/:userId", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { userId: string }
    const user = store.users.get(params.userId)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status ?? "active",
        walletBalance: user.walletBalance,
        chances: user.chances,
        referralCode: user.referralCode,
        profile: user.profile ?? {},
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }
  })

  app.put("/admin/users/:userId", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { userId: string }
    const parsed = adminUserUpdateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const user = store.users.get(params.userId)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })

    if (parsed.data.role !== undefined) user.role = parsed.data.role
    if (parsed.data.status !== undefined) user.status = parsed.data.status
    if (parsed.data.walletBalance !== undefined) user.walletBalance = parsed.data.walletBalance
    if (parsed.data.chances !== undefined) user.chances = parsed.data.chances
    if (parsed.data.profile) {
      user.profile = {
        ...(user.profile ?? {}),
        ...parsed.data.profile,
      }
    }
    user.updatedAt = nowIso()
    store.users.set(user.id, user)

    pushAudit(store, request, {
      action: "ADMIN_USER_UPDATE",
      target: `user:${user.id}`,
      success: true,
      payload: {
        role: user.role,
        status: user.status ?? "active",
        walletBalance: user.walletBalance,
        chances: user.chances,
      },
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status ?? "active",
        walletBalance: user.walletBalance,
        chances: user.chances,
        referralCode: user.referralCode,
        profile: user.profile ?? {},
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }
  })

  app.get("/admin/finance/withdrawals", { preHandler: [app.adminOnly] }, async () => {
    const items = Array.from(store.walletTx.values())
      .filter((tx) => tx.type === "withdraw_request")
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((tx) => {
        const user = store.users.get(tx.userId)
        return {
          id: tx.id,
          userId: tx.userId,
          userEmail: user?.email ?? "unknown",
          amount: tx.amount,
          status: tx.status,
          createdAt: tx.createdAt,
        }
      })
    return { items }
  })

  app.post("/admin/finance/withdrawals/:txId/approve", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { txId: string }
    const tx = store.walletTx.get(params.txId)
    if (!tx || tx.type !== "withdraw_request") return reply.code(404).send({ error: "WITHDRAWAL_NOT_FOUND" })
    tx.status = "completed"
    store.walletTx.set(tx.id, tx)
    return { tx }
  })

  app.post("/admin/finance/withdrawals/:txId/reject", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { txId: string }
    const tx = store.walletTx.get(params.txId)
    if (!tx || tx.type !== "withdraw_request") return reply.code(404).send({ error: "WITHDRAWAL_NOT_FOUND" })
    tx.status = "rejected"
    const user = store.users.get(tx.userId)
    if (user) {
      user.walletBalance += Math.abs(tx.amount)
      user.updatedAt = nowIso()
      store.users.set(user.id, user)
    }
    store.walletTx.set(tx.id, tx)
    return { tx }
  })

  app.get("/admin/finance/payment-settings", { preHandler: [app.adminOnly] }, async () => {
    store.paymentConfig = normalizePaymentConfig(store.paymentConfig, {
      fallbackCardToCardDestination: env.CARD_TO_CARD_DESTINATION_CARD,
    })
    return { paymentConfig: store.paymentConfig }
  })

  app.put("/admin/finance/payment-settings/card-to-card", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const parsed = paymentCardToCardUpdateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const current = normalizePaymentConfig(store.paymentConfig, {
      fallbackCardToCardDestination: env.CARD_TO_CARD_DESTINATION_CARD,
    })
    store.paymentConfig = normalizePaymentConfig(
      {
        ...current,
        cardToCard: {
          enabled: parsed.data.enabled ?? current.cardToCard.enabled,
          destinationCard: parsed.data.destinationCard,
        },
      },
      { fallbackCardToCardDestination: env.CARD_TO_CARD_DESTINATION_CARD },
    )
    return { paymentConfig: store.paymentConfig }
  })

  app.post("/admin/finance/payment-settings/gateways", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const parsed = paymentGatewaySchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const current = normalizePaymentConfig(store.paymentConfig, {
      fallbackCardToCardDestination: env.CARD_TO_CARD_DESTINATION_CARD,
    })
    const draft = normalizePaymentConfig(
      {
        ...current,
        onlineGateways: [
          ...current.onlineGateways,
          {
            id: id("gw"),
            ...parsed.data,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          },
        ],
      },
      { fallbackCardToCardDestination: env.CARD_TO_CARD_DESTINATION_CARD },
    )
    store.paymentConfig = draft
    return reply.code(201).send({ paymentConfig: store.paymentConfig })
  })

  app.put("/admin/finance/payment-settings/gateways/:gatewayId", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { gatewayId: string }
    const parsed = paymentGatewayUpdateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const current = normalizePaymentConfig(store.paymentConfig, {
      fallbackCardToCardDestination: env.CARD_TO_CARD_DESTINATION_CARD,
    })
    const target = current.onlineGateways.find((item) => item.id === params.gatewayId)
    if (!target) return reply.code(404).send({ error: "GATEWAY_NOT_FOUND" })
    const updatedGateways = current.onlineGateways.map((item) =>
      item.id === params.gatewayId
        ? {
          ...item,
          ...parsed.data,
          updatedAt: nowIso(),
        }
        : item,
    )
    store.paymentConfig = normalizePaymentConfig(
      {
        ...current,
        onlineGateways: updatedGateways,
      },
      { fallbackCardToCardDestination: env.CARD_TO_CARD_DESTINATION_CARD },
    )
    return { paymentConfig: store.paymentConfig }
  })

  app.delete("/admin/finance/payment-settings/gateways/:gatewayId", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { gatewayId: string }
    const current = normalizePaymentConfig(store.paymentConfig, {
      fallbackCardToCardDestination: env.CARD_TO_CARD_DESTINATION_CARD,
    })
    if (!current.onlineGateways.some((item) => item.id === params.gatewayId)) {
      return reply.code(404).send({ error: "GATEWAY_NOT_FOUND" })
    }
    store.paymentConfig = normalizePaymentConfig(
      {
        ...current,
        onlineGateways: current.onlineGateways.filter((item) => item.id !== params.gatewayId),
        defaultOnlineGatewayId: current.defaultOnlineGatewayId === params.gatewayId ? undefined : current.defaultOnlineGatewayId,
      },
      { fallbackCardToCardDestination: env.CARD_TO_CARD_DESTINATION_CARD },
    )
    return { paymentConfig: store.paymentConfig }
  })

  app.put("/admin/finance/payment-settings/default-gateway", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const parsed = paymentDefaultGatewaySchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const current = normalizePaymentConfig(store.paymentConfig, {
      fallbackCardToCardDestination: env.CARD_TO_CARD_DESTINATION_CARD,
    })
    if (parsed.data.gatewayId && !current.onlineGateways.some((item) => item.id === parsed.data.gatewayId)) {
      return reply.code(404).send({ error: "GATEWAY_NOT_FOUND" })
    }
    store.paymentConfig = normalizePaymentConfig(
      {
        ...current,
        defaultOnlineGatewayId: parsed.data.gatewayId,
      },
      { fallbackCardToCardDestination: env.CARD_TO_CARD_DESTINATION_CARD },
    )
    return { paymentConfig: store.paymentConfig }
  })

  app.get("/admin/finance/card-to-card-payments", { preHandler: [app.adminOnly] }, async () => {
    const items = Array.from(store.cardToCardPayments.values())
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((payment) => ({
        ...payment,
        userEmail: store.users.get(payment.userId)?.email ?? payment.userEmail,
      }))
    const paymentConfig = normalizePaymentConfig(store.paymentConfig, {
      fallbackCardToCardDestination: env.CARD_TO_CARD_DESTINATION_CARD,
    })
    store.paymentConfig = paymentConfig
    return {
      destinationCard: paymentConfig.cardToCard.destinationCard,
      items,
    }
  })

  app.post("/admin/finance/card-to-card-payments/:paymentId/approve", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { paymentId: string }
    const parsed = cardToCardReviewSchema.safeParse(request.body ?? {})
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const payment = store.cardToCardPayments.get(params.paymentId)
    if (!payment) return reply.code(404).send({ error: "PAYMENT_NOT_FOUND" })
    if (payment.status !== "pending") return reply.code(400).send({ error: "PAYMENT_ALREADY_REVIEWED" })

    const user = store.users.get(payment.userId)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })

    const now = nowIso()

    if (payment.purpose === "wallet_deposit") {
      user.walletBalance += payment.amount
      user.updatedAt = now
      store.users.set(user.id, user)

      const tx = Array.from(store.walletTx.values()).find((item) => {
        if (item.userId !== user.id || item.type !== "deposit" || item.status !== "pending") return false
        return item.meta?.["paymentId"] === payment.id
      })

      if (tx) {
        tx.status = "completed"
        store.walletTx.set(tx.id, tx)
      } else {
        const txId = id("wtx")
        store.walletTx.set(txId, {
          id: txId,
          userId: user.id,
          type: "deposit",
          amount: payment.amount,
          status: "completed",
          createdAt: now,
          meta: { source: "card_to_card", paymentId: payment.id },
        })
      }
    } else if (payment.purpose === "showroom_order") {
      const orderId = toStringValue(payment.metadata?.["orderId"])
      if (!orderId) return reply.code(400).send({ error: "ORDER_ID_MISSING" })
      const order = store.showroomOrders.get(orderId)
      if (!order) return reply.code(404).send({ error: "ORDER_NOT_FOUND" })
      if (order.status !== "pending") return reply.code(400).send({ error: "ORDER_NOT_PENDING" })
      const vehicle = store.showroomVehicles.get(order.vehicleId)
      if (!vehicle) return reply.code(404).send({ error: "VEHICLE_NOT_FOUND" })
      order.status = "paid"
      order.updatedAt = now
      const slideTickets = attachShowroomOrderToActiveSlideDraw(store, {
        orderId: order.id,
        vehicleId: order.vehicleId,
        userId: order.buyerUserId,
        ticketCount: 1,
        at: now,
      })
      order.slideDrawId = slideTickets.drawId
      order.slideEntryNumbers = slideTickets.entryNumbers
      store.showroomOrders.set(order.id, order)
      vehicle.status = "sold"
      vehicle.updatedAt = now
      store.showroomVehicles.set(vehicle.id, vehicle)
    } else if (payment.purpose === "raffle_ticket_purchase") {
      const raffleId = toStringValue(payment.metadata?.["raffleId"])
      const ticketCount = Math.max(1, Math.trunc(toNumber(payment.metadata?.["ticketCount"])))
      const ticketPrices = toNumberArray(payment.metadata?.["ticketPrices"]).map((value) => Math.max(0, Math.trunc(value)))
      const totalPaid = Math.max(0, Math.trunc(toNumber(payment.metadata?.["totalPaid"])))
      const cashback = Math.max(0, Math.trunc(toNumber(payment.metadata?.["cashback"])))
      const wheelChanceGain = Math.max(0, Math.trunc(toNumber(payment.metadata?.["wheelChanceGain"])))
      const clientSeed = toStringValue(payment.metadata?.["clientSeed"]) || undefined

      const raffle = store.raffles.get(raffleId)
      if (!raffle) return reply.code(404).send({ error: "RAFFLE_NOT_FOUND" })
      if (raffle.status !== "open") return reply.code(400).send({ error: "RAFFLE_NOT_OPEN" })
      if (ticketPrices.length !== ticketCount) return reply.code(400).send({ error: "INVALID_TICKET_PRICES" })
      if (raffle.ticketsSold + ticketCount > raffle.maxTickets) return reply.code(400).send({ error: "NOT_ENOUGH_TICKETS_LEFT" })

      const tickets = createTicketsForPayment({
        raffleId: raffle.id,
        userId: user.id,
        startIndex: raffle.ticketsSold,
        prices: ticketPrices,
        slideNumbers: generateUniqueTicketSlideNumbers(store, ticketCount),
        clientSeed,
      })
      for (const ticket of tickets) store.tickets.set(ticket.id, ticket)
      raffle.ticketsSold += ticketCount
      raffle.participantsCount = new Set(store.getTicketsByRaffle(raffle.id).map((ticket) => ticket.userId)).size
      raffle.updatedAt = now
      store.raffles.set(raffle.id, raffle)

      ensureRaffleUserStats(user)
      user.walletBalance += cashback
      user.chances += wheelChanceGain
      user.totalTicketsBought = (user.totalTicketsBought ?? 0) + ticketCount
      user.totalSpendIrr = (user.totalSpendIrr ?? 0) + totalPaid
      recalculateVipForPayment(user)
      user.updatedAt = now
      store.users.set(user.id, user)

      applyReferralCommissions(store, user.id, totalPaid, raffle.id)

      const purchaseTxId = id("wtx")
      store.walletTx.set(purchaseTxId, {
        id: purchaseTxId,
        userId: user.id,
        type: "ticket_purchase",
        amount: 0,
        status: "completed",
        createdAt: now,
        meta: {
          raffleId: raffle.id,
          ticketCount,
          paymentId: payment.id,
          paymentSource: "card_to_card",
          paidAmount: totalPaid,
        },
      })
      if (cashback > 0) {
        const cashbackTxId = id("wtx")
        store.walletTx.set(cashbackTxId, {
          id: cashbackTxId,
          userId: user.id,
          type: "cashback",
          amount: cashback,
          status: "completed",
          createdAt: now,
          meta: { raffleId: raffle.id, paymentId: payment.id },
        })
      }
    } else if (payment.purpose === "raffle_combo_purchase") {
      const raffleId = toStringValue(payment.metadata?.["raffleId"])
      const packageCode = toStringValue(payment.metadata?.["packageCode"])
      const paidTickets = Math.max(0, Math.trunc(toNumber(payment.metadata?.["paidTickets"])))
      const bonusTickets = Math.max(0, Math.trunc(toNumber(payment.metadata?.["bonusTickets"])))
      const totalTickets = Math.max(1, Math.trunc(toNumber(payment.metadata?.["totalTickets"])))
      const ticketPrices = toNumberArray(payment.metadata?.["ticketPrices"]).map((value) => Math.max(0, Math.trunc(value)))
      const totalPaid = Math.max(0, Math.trunc(toNumber(payment.metadata?.["totalPaid"])))
      const cashback = Math.max(0, Math.trunc(toNumber(payment.metadata?.["cashback"])))
      const bonusChances = Math.max(0, Math.trunc(toNumber(payment.metadata?.["bonusChances"])))
      const wheelChanceGain = Math.max(0, Math.trunc(toNumber(payment.metadata?.["wheelChanceGain"])))
      const vipDays = Math.max(0, Math.trunc(toNumber(payment.metadata?.["vipDays"])))
      const clientSeed = toStringValue(payment.metadata?.["clientSeed"]) || undefined

      const raffle = store.raffles.get(raffleId)
      if (!raffle) return reply.code(404).send({ error: "RAFFLE_NOT_FOUND" })
      if (raffle.status !== "open") return reply.code(400).send({ error: "RAFFLE_NOT_OPEN" })
      if (ticketPrices.length !== totalTickets) return reply.code(400).send({ error: "INVALID_TICKET_PRICES" })
      if (raffle.ticketsSold + totalTickets > raffle.maxTickets) return reply.code(400).send({ error: "NOT_ENOUGH_TICKETS_LEFT" })

      const tickets = createTicketsForPayment({
        raffleId: raffle.id,
        userId: user.id,
        startIndex: raffle.ticketsSold,
        prices: ticketPrices,
        slideNumbers: generateUniqueTicketSlideNumbers(store, totalTickets),
        clientSeed,
      })
      for (const ticket of tickets) store.tickets.set(ticket.id, ticket)

      raffle.ticketsSold += totalTickets
      raffle.participantsCount = new Set(store.getTicketsByRaffle(raffle.id).map((ticket) => ticket.userId)).size
      raffle.updatedAt = now
      store.raffles.set(raffle.id, raffle)

      ensureRaffleUserStats(user)
      user.walletBalance += cashback
      user.chances += bonusChances + wheelChanceGain
      user.totalTicketsBought = (user.totalTicketsBought ?? 0) + totalTickets
      user.totalSpendIrr = (user.totalSpendIrr ?? 0) + totalPaid
      if (vipDays > 0) {
        const base = user.vipUntil ? new Date(user.vipUntil).getTime() : Date.now()
        user.vipUntil = new Date(Math.max(base, Date.now()) + vipDays * 24 * 60 * 60 * 1000).toISOString()
        if ((user.vipLevelId ?? 1) < 3) {
          user.vipLevelId = 3
          user.vipLevelName = "طلایی"
          user.vipCashbackPercent = 30
        }
      }
      recalculateVipForPayment(user)
      user.updatedAt = now
      store.users.set(user.id, user)

      applyReferralCommissions(store, user.id, totalPaid, raffle.id)

      const purchaseTxId = id("wtx")
      store.walletTx.set(purchaseTxId, {
        id: purchaseTxId,
        userId: user.id,
        type: "ticket_purchase",
        amount: 0,
        status: "completed",
        createdAt: now,
        meta: {
          raffleId: raffle.id,
          package: packageCode,
          paidTickets,
          bonusTickets,
          paymentId: payment.id,
          paymentSource: "card_to_card",
          paidAmount: totalPaid,
        },
      })
      if (cashback > 0) {
        const cashbackTxId = id("wtx")
        store.walletTx.set(cashbackTxId, {
          id: cashbackTxId,
          userId: user.id,
          type: "cashback",
          amount: cashback,
          status: "completed",
          createdAt: now,
          meta: { raffleId: raffle.id, paymentId: payment.id, package: packageCode },
        })
      }
    }

    payment.status = "approved"
    payment.reviewedBy = request.user.sub
    payment.reviewedAt = now
    payment.reviewNote = parsed.data.note
    payment.updatedAt = now
    store.cardToCardPayments.set(payment.id, payment)

    pushUserNotification(store, {
      userId: user.id,
      title: "پرداخت کارت به کارت تایید شد",
      body: "درخواست شما توسط ادمین تایید و اعمال شد.",
      kind: "success",
    })
    return { payment }
  })

  app.post("/admin/finance/card-to-card-payments/:paymentId/reject", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { paymentId: string }
    const parsed = cardToCardReviewSchema.safeParse(request.body ?? {})
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const payment = store.cardToCardPayments.get(params.paymentId)
    if (!payment) return reply.code(404).send({ error: "PAYMENT_NOT_FOUND" })
    if (payment.status !== "pending") return reply.code(400).send({ error: "PAYMENT_ALREADY_REVIEWED" })

    if (payment.purpose === "wallet_deposit") {
      const tx = Array.from(store.walletTx.values()).find((item) => {
        if (item.userId !== payment.userId || item.type !== "deposit" || item.status !== "pending") return false
        return item.meta?.["paymentId"] === payment.id
      })
      if (tx) {
        tx.status = "rejected"
        store.walletTx.set(tx.id, tx)
      }
    } else if (payment.purpose === "showroom_order") {
      const orderId = toStringValue(payment.metadata?.["orderId"])
      const order = orderId ? store.showroomOrders.get(orderId) : undefined
      if (order && order.status === "pending") {
        order.status = "cancelled"
        order.updatedAt = nowIso()
        store.showroomOrders.set(order.id, order)
        const vehicle = store.showroomVehicles.get(order.vehicleId)
        if (vehicle && vehicle.status === "reserved") {
          vehicle.status = "available"
          vehicle.updatedAt = nowIso()
          store.showroomVehicles.set(vehicle.id, vehicle)
        }
      }
    }

    payment.status = "rejected"
    payment.reviewedBy = request.user.sub
    payment.reviewedAt = nowIso()
    payment.reviewNote = parsed.data.note
    payment.updatedAt = nowIso()
    store.cardToCardPayments.set(payment.id, payment)

    pushUserNotification(store, {
      userId: payment.userId,
      title: "پرداخت کارت به کارت رد شد",
      body: parsed.data.note || "درخواست شما توسط ادمین رد شد. لطفا با پشتیبانی تماس بگیرید.",
      kind: "warning",
    })
    return { payment }
  })

  app.get("/admin/content/rules", { preHandler: [app.adminOnly] }, async () => {
    return { rules: store.rulesText }
  })

  app.put("/admin/content/rules", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const parsed = rulesSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    store.rulesText = parsed.data.rules
    return { rules: store.rulesText }
  })

  app.get("/admin/wheel/config", { preHandler: [app.adminOnly] }, async () => {
    store.wheelConfig = normalizeWheelConfig(store.wheelConfig)
    return { config: toLegacyCompatibleWheelConfig(store.wheelConfig) }
  })

  app.put("/admin/wheel/config", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const parsed = wheelSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const totals = {
      normal: parsed.data.tiers.normal.segments.reduce((sum, s) => sum + s.weight, 0),
      gold: parsed.data.tiers.gold.segments.reduce((sum, s) => sum + s.weight, 0),
      jackpot: parsed.data.tiers.jackpot.segments.reduce((sum, s) => sum + s.weight, 0),
    }
    if (totals.normal !== 100 || totals.gold !== 100 || totals.jackpot !== 100) {
      return reply.code(400).send({
        error: "INVALID_WHEEL_WEIGHTS",
        message: "Each tier segments weight total must be exactly 100",
        totals,
      })
    }
    store.wheelConfig = parsed.data
    return { config: toLegacyCompatibleWheelConfig(store.wheelConfig) }
  })

  app.get("/admin/raffles", { preHandler: [app.adminOnly] }, async () => {
    const items = Array.from(store.raffles.values())
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((item) => toAdminRaffleShape(store, item))
    return { items }
  })

  app.get("/admin/live/metrics", { preHandler: [app.adminOnly] }, async () => {
    const openRaffles = Array.from(store.raffles.values()).filter((r) => r.status === "open").length
    const closedRaffles = Array.from(store.raffles.values()).filter((r) => r.status === "closed").length
    const pendingWithdrawals = Array.from(store.walletTx.values()).filter((t) => t.type === "withdraw_request" && t.status === "pending").length
    const upcomingSlideDraw = store.getSlideDraws().find((d) => d.status === "scheduled")
    const latestSlideDraw = store.getSlideDraws().find((d) => d.status === "drawn")
    const topWinners = Array.from(store.tickets.values()).reduce((map, t) => {
      map.set(t.userId, (map.get(t.userId) ?? 0) + 1)
      return map
    }, new Map<string, number>())
    const suspicious = Array.from(topWinners.entries())
      .filter(([, count]) => count >= 20)
      .map(([userId, count]) => ({ userId, score: count }))
    return {
      users: store.users.size,
      tickets: store.tickets.size,
      openRaffles,
      closedRaffles,
      pendingWithdrawals,
      slide: {
        upcoming: upcomingSlideDraw
          ? { id: upcomingSlideDraw.id, title: upcomingSlideDraw.title, scheduledAt: upcomingSlideDraw.scheduledAt }
          : null,
        latest: latestSlideDraw
          ? {
            id: latestSlideDraw.id,
            title: latestSlideDraw.title,
            scheduledAt: latestSlideDraw.scheduledAt,
            targetNumber: latestSlideDraw.targetNumber,
            winners: latestSlideDraw.winners.length,
          }
          : null,
      },
      risk: {
        suspiciousUsers: suspicious.slice(0, 20),
      },
      slideSingleMode: "fully_random",
      recentEvents: store.liveEvents.slice(0, 50),
    }
  })

  app.get("/admin/game/difficulty", { preHandler: [app.adminOnly] }, async () => {
    return {
      mode: "fully_random",
      editable: false,
      message: "MANUAL_CONTROL_DISABLED",
    }
  })

  app.put("/admin/game/difficulty", { preHandler: [app.adminOnly] }, async (_request, reply) => {
    return reply.code(403).send({
      error: "MANUAL_CONTROL_DISABLED",
      message: "Slide game is fully random and cannot be configured manually.",
    })
  })

  app.post("/admin/slide/single/target", { preHandler: [app.adminOnly] }, async (_request, reply) => {
    return reply.code(403).send({
      error: "MANUAL_CONTROL_DISABLED",
      message: "Daily winning number is generated randomly by the game engine.",
    })
  })

  app.get("/admin/slide/draws", { preHandler: [app.adminOnly] }, async () => {
    return {
      items: store.getSlideDraws(),
    }
  })

  app.get("/admin/slide/preview", { preHandler: [app.adminOnly] }, async () => {
    const participants = Array.from(store.users.values())
      .filter((u) => (u.status ?? "active") === "active" && u.chances > 0)
      .map((u) => ({
        userId: u.id,
        email: u.email,
        fullName: u.profile?.fullName ?? "",
        chances: u.chances,
      }))
      .sort((a, b) => b.chances - a.chances)
    return {
      totalParticipants: participants.length,
      totalChances: participants.reduce((sum, p) => sum + p.chances, 0),
      topParticipants: participants.slice(0, 20),
    }
  })

  app.post("/admin/slide/draws", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const parsed = slideDrawCreateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const scheduledAt = parsed.data.scheduledAt
    if (scheduledAt <= nowIso()) return reply.code(400).send({ error: "INVALID_SCHEDULE_TIME" })
    if (store.getSlideDraws().some((d) => d.status === "scheduled")) {
      return reply.code(400).send({ error: "SCHEDULED_DRAW_EXISTS" })
    }
    const expandedRanks = parsed.data.prizes.flatMap((p) => {
      const out: number[] = []
      for (let r = p.rankFrom; r <= p.rankTo; r += 1) out.push(r)
      return out
    })
    if (new Set(expandedRanks).size !== expandedRanks.length) {
      return reply.code(400).send({ error: "OVERLAPPING_PRIZE_RANGES" })
    }

    const serverSeed = randomHex(32)
    const draw = {
      id: id("sld"),
      title: parsed.data.title,
      scheduledAt,
      status: "scheduled" as const,
      seedCommitHash: sha256Hex(serverSeed),
      encryptedServerSeed: encryptText(serverSeed, env.SEED_ENCRYPTION_KEY),
      prizes: [...parsed.data.prizes].sort((a, b) => a.rankFrom - b.rankFrom),
      entries: [],
      participants: [],
      winners: [],
      createdBy: request.user.sub,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    store.slideDraws.set(draw.id, draw)
    pushAudit(store, request, {
      action: "SLIDE_DRAW_CREATE",
      target: `slide-draw:${draw.id}`,
      success: true,
      payload: { scheduledAt: draw.scheduledAt, prizes: draw.prizes.length },
    })
    pushLiveEvent(store, {
      type: "system.info",
      level: "info",
      message: `قرعه‌کشی اسلاید "${draw.title}" زمان‌بندی شد`,
      data: { drawId: draw.id, scheduledAt: draw.scheduledAt },
    })
    return reply.code(201).send({ draw })
  })

  app.put("/admin/slide/draws/:drawId", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { drawId: string }
    const parsed = slideDrawUpdateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const draw = store.slideDraws.get(params.drawId)
    if (!draw) return reply.code(404).send({ error: "DRAW_NOT_FOUND" })
    if (draw.status !== "scheduled") return reply.code(400).send({ error: "DRAW_NOT_EDITABLE" })

    if (parsed.data.scheduledAt && parsed.data.scheduledAt <= nowIso()) {
      return reply.code(400).send({ error: "INVALID_SCHEDULE_TIME" })
    }
    if (parsed.data.prizes) {
      const expandedRanks = parsed.data.prizes.flatMap((p) => {
        const out: number[] = []
        for (let r = p.rankFrom; r <= p.rankTo; r += 1) out.push(r)
        return out
      })
      if (new Set(expandedRanks).size !== expandedRanks.length) {
        return reply.code(400).send({ error: "OVERLAPPING_PRIZE_RANGES" })
      }
      draw.prizes = [...parsed.data.prizes].sort((a, b) => a.rankFrom - b.rankFrom)
    }
    if (parsed.data.title !== undefined) draw.title = parsed.data.title
    if (parsed.data.scheduledAt !== undefined) draw.scheduledAt = parsed.data.scheduledAt
    draw.updatedAt = nowIso()
    store.slideDraws.set(draw.id, draw)

    pushAudit(store, request, {
      action: "SLIDE_DRAW_UPDATE",
      target: `slide-draw:${draw.id}`,
      success: true,
      payload: {
        title: draw.title,
        scheduledAt: draw.scheduledAt,
        prizes: draw.prizes.length,
      },
    })
    return { draw }
  })

  app.delete("/admin/slide/draws/:drawId", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { drawId: string }
    const draw = store.slideDraws.get(params.drawId)
    if (!draw) return reply.code(404).send({ error: "DRAW_NOT_FOUND" })
    if (draw.status !== "scheduled") return reply.code(400).send({ error: "DRAW_NOT_DELETABLE" })

    const refundByUser = new Map<string, number>()
    for (const entry of draw.entries ?? []) {
      refundByUser.set(entry.userId, (refundByUser.get(entry.userId) ?? 0) + 1)
    }

    let refundedChances = 0
    for (const [userId, count] of refundByUser.entries()) {
      const user = store.users.get(userId)
      if (!user) continue
      user.chances += count
      user.updatedAt = nowIso()
      refundedChances += count
      store.users.set(user.id, user)
    }

    store.slideDraws.delete(draw.id)

    pushAudit(store, request, {
      action: "SLIDE_DRAW_DELETE",
      target: `slide-draw:${draw.id}`,
      success: true,
      payload: {
        refundedUsers: refundByUser.size,
        refundedChances,
      },
    })
    pushLiveEvent(store, {
      type: "system.info",
      level: "warning",
      message: `قرعه اسلاید "${draw.title}" حذف شد`,
      data: { drawId: draw.id, refundedUsers: refundByUser.size, refundedChances },
    })

    return {
      deleted: true,
      drawId: draw.id,
      refundedUsers: refundByUser.size,
      refundedChances,
    }
  })

  app.get("/admin/slide/draws/:drawId/log", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { drawId: string }
    const draw = store.slideDraws.get(params.drawId)
    if (!draw) return reply.code(404).send({ error: "DRAW_NOT_FOUND" })

    const entries = (draw.entries ?? [])
      .slice()
      .sort((a, b) => a.entryNumber - b.entryNumber)
      .map((entry) => {
        const user = store.users.get(entry.userId)
        return {
          entryNumber: entry.entryNumber,
          userId: entry.userId,
          userEmail: user?.email ?? "unknown",
          fullName: user?.profile?.fullName ?? "",
          createdAt: entry.createdAt,
        }
      })

    const winners = draw.winners
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .map((winner) => {
        const user = store.users.get(winner.userId)
        return {
          rank: winner.rank,
          winningNumber: winner.winningNumber,
          userId: winner.userId,
          userEmail: user?.email ?? "unknown",
          fullName: user?.profile?.fullName ?? "",
          chancesAtDraw: winner.chancesAtDraw,
          prize: winner.prize,
        }
      })

    const participants = draw.participants
      .slice()
      .sort((a, b) => b.chances - a.chances)
      .map((participant) => {
        const user = store.users.get(participant.userId)
        return {
          userId: participant.userId,
          userEmail: user?.email ?? "unknown",
          fullName: user?.profile?.fullName ?? "",
          chances: participant.chances,
        }
      })

    return {
      draw: {
        id: draw.id,
        title: draw.title,
        status: draw.status,
        scheduledAt: draw.scheduledAt,
        createdAt: draw.createdAt,
        updatedAt: draw.updatedAt,
        createdBy: draw.createdBy,
        seedCommitHash: draw.seedCommitHash,
        targetNumber: draw.targetNumber,
        prizes: draw.prizes,
        proof: draw.proof ?? null,
      },
      summary: {
        totalEntries: entries.length,
        totalParticipants: participants.length,
        totalWinners: winners.length,
      },
      participants,
      entries,
      winners,
    }
  })

  app.post("/admin/slide/draws/:drawId/run", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { drawId: string }
    const result = finalizeSlideDraw(store, params.drawId, env.SEED_ENCRYPTION_KEY, nowIso())
    if (!result.ok) {
      return reply.code(400).send({ error: result.reason })
    }
    const draw = store.slideDraws.get(params.drawId)!
    pushAudit(store, request, {
      action: "SLIDE_DRAW_RUN",
      target: `slide-draw:${draw.id}`,
      success: true,
      payload: { winners: draw.winners.length, targetNumber: draw.targetNumber },
    })
    pushLiveEvent(store, {
      type: "system.info",
      level: "success",
      message: `قرعه‌کشی اسلاید "${draw.title}" برگزار شد`,
      data: { drawId: draw.id, targetNumber: draw.targetNumber, winners: draw.winners.length },
    })
    return { draw }
  })

  app.get("/admin/audit", { preHandler: [app.adminOnly] }, async (request) => {
    const q = request.query as { limit?: string }
    const limit = Number(q.limit ?? 100)
    return { items: store.auditLogs.slice(0, Number.isFinite(limit) ? Math.max(1, Math.min(1000, limit)) : 100) }
  })

  app.get("/admin/pricing/current", { preHandler: [app.adminOnly] }, async () => {
    const current = store.getCurrentPricingPolicy()
    return { current }
  })

  app.post("/admin/pricing/policies", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const parsed = pricingSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const now = nowIso()
    const policy: PricingPolicy = {
      id: id("policy"),
      version: parsed.data.version,
      status: "draft",
      tiers: parsed.data.tiers,
      config: parsed.data.config,
      createdBy: request.user.sub,
      createdAt: now,
      updatedAt: now,
    }
    store.pricingPolicies.set(policy.id, policy)

    pushAudit(store, request, {
      action: "PRICING_CREATE_DRAFT",
      target: `policy:${policy.id}`,
      success: true,
      payload: { version: policy.version },
    })
    return reply.code(201).send({ policy })
  })

  app.post("/admin/pricing/publish/:policyId", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { policyId: string }
    const policy = store.pricingPolicies.get(params.policyId)
    if (!policy) return reply.code(404).send({ error: "POLICY_NOT_FOUND" })

    for (const item of store.pricingPolicies.values()) {
      if (item.status === "published") {
        item.status = "draft"
        item.updatedAt = nowIso()
        store.pricingPolicies.set(item.id, item)
      }
    }
    policy.status = "published"
    policy.updatedAt = nowIso()
    store.pricingPolicies.set(policy.id, policy)

    pushAudit(store, request, {
      action: "PRICING_PUBLISH",
      target: `policy:${policy.id}`,
      success: true,
      payload: { version: policy.version },
    })
    return { policy }
  })

  app.post("/admin/raffles", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const parsed = raffleCreateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    // Require a real vehicle from the showroom
    const linkedVehicle = store.showroomVehicles.get(parsed.data.vehicleId)
    if (!linkedVehicle) return reply.code(404).send({ error: "VEHICLE_NOT_FOUND", message: "خودروی انتخاب‌شده در نمایشگاه وجود ندارد" })
    const vd = linkedVehicle.vehicle
    const vTitle = String(vd["title"] ?? "خودرو")
    const vRaffle = (vd["raffle"] ?? {}) as Record<string, unknown>
    // Auto-populate fields from vehicle if not provided
    const enriched = {
      ...parsed.data,
      title: parsed.data.title ?? `قرعه‌کشی ${vTitle}`,
      mainPrizeTitle: parsed.data.mainPrizeTitle ?? vTitle,
      mainPrizeValueIrr: parsed.data.mainPrizeValueIrr ?? (linkedVehicle.listedPriceIrr ?? 0),
      cashbackPercent: parsed.data.cashbackPercent ?? Number(vRaffle["cashbackPercent"] ?? 20),
      cashbackToGoldPercent: parsed.data.cashbackToGoldPercent ?? Number(vRaffle["cashbackToGoldPercent"] ?? 30),
      tomanPerGoldSot: parsed.data.tomanPerGoldSot ?? Number(vRaffle["tomanPerGoldSot"] ?? 100_000),
    }

    const now = nowIso()
    const published = store.getCurrentPricingPolicy()
    const dynamicPricing = normalizeRaffleDynamicPricing(enriched)
    const rewardConfig = normalizeRaffleRewardConfig(enriched)

    const tiersFromBasePrice = dynamicPricing
      ? [
        { order: 1, price: dynamicPricing.basePrice, discountPercent: 0 },
        { order: 2, price: Math.max(1, Math.floor(dynamicPricing.basePrice * 0.85)), discountPercent: 15 },
        { order: 3, price: Math.max(1, Math.floor(dynamicPricing.basePrice * 0.75)), discountPercent: 25 },
        { order: 4, price: Math.max(1, Math.floor(dynamicPricing.basePrice * 0.65)), discountPercent: 35 },
      ]
      : undefined
    const tiers = enriched.tiers ?? published?.tiers ?? tiersFromBasePrice
    const config =
      enriched.config ??
      published?.config ?? {
        cashbackPercent: rewardConfig?.cashbackPercent ?? enriched.cashbackPercent ?? 20,
        wheelChancePerTicket: 1,
        lotteryChancePerTicket: 1,
        freeEntryEveryN: 5,
      }
    if (!tiers || !config) {
      return reply.code(400).send({ error: "NO_PRICING_POLICY_AVAILABLE" })
    }

    const serverSeed = randomHex(32)
    const raffle: Raffle = {
      id: id("raf"),
      title: enriched.title,
      linkedVehicleId: parsed.data.vehicleId,
      maxTickets: enriched.maxTickets,
      ticketsSold: 0,
      participantsCount: enriched.participantsCount ?? 0,
      status: "draft",
      tiers,
      config,
      dynamicPricing,
      rewardConfig,
      seedCommitHash: sha256Hex(serverSeed),
      encryptedServerSeed: encryptText(serverSeed, env.SEED_ENCRYPTION_KEY),
      createdBy: request.user.sub,
      createdAt: now,
      updatedAt: now,
    }
    store.raffles.set(raffle.id, raffle)

    pushAudit(store, request, {
      action: "RAFFLE_CREATE",
      target: `raffle:${raffle.id}`,
      success: true,
      payload: { title: raffle.title, maxTickets: raffle.maxTickets },
    })

    return reply.code(201).send({ raffle: toAdminRaffleShape(store, raffle) })
  })

  app.put("/admin/raffles/:raffleId", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { raffleId: string }
    const parsed = raffleUpdateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const raffle = store.raffles.get(params.raffleId)
    if (!raffle) return reply.code(404).send({ error: "RAFFLE_NOT_FOUND" })
    if (parsed.data.vehicleId !== undefined) {
      const lv = store.showroomVehicles.get(parsed.data.vehicleId)
      if (!lv) return reply.code(404).send({ error: "VEHICLE_NOT_FOUND" })
      raffle.linkedVehicleId = parsed.data.vehicleId
    }
    if (parsed.data.title !== undefined) raffle.title = parsed.data.title
    if (parsed.data.maxTickets !== undefined) {
      if (parsed.data.maxTickets < raffle.ticketsSold) return reply.code(400).send({ error: "MAX_TICKETS_LT_SOLD" })
      raffle.maxTickets = parsed.data.maxTickets
    }
    if (parsed.data.participantsCount !== undefined) raffle.participantsCount = parsed.data.participantsCount
    if (parsed.data.tiers !== undefined) raffle.tiers = parsed.data.tiers
    if (parsed.data.config !== undefined) raffle.config = parsed.data.config

    const nextDynamicPricing = normalizeRaffleDynamicPricing(parsed.data)
    if (nextDynamicPricing) raffle.dynamicPricing = nextDynamicPricing
    const nextRewardConfig = normalizeRaffleRewardConfig(parsed.data)
    if (nextRewardConfig) {
      raffle.rewardConfig = nextRewardConfig
      raffle.config.cashbackPercent = nextRewardConfig.cashbackPercent
    }

    // Legacy-compatible shortcuts from admin panel
    if (parsed.data.cashbackPercent !== undefined && !nextRewardConfig) {
      raffle.config.cashbackPercent = parsed.data.cashbackPercent
    }

    raffle.updatedAt = nowIso()
    store.raffles.set(raffle.id, raffle)
    return { raffle: toAdminRaffleShape(store, raffle) }
  })

  app.post("/admin/raffles/:raffleId/open", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { raffleId: string }
    const raffle = store.raffles.get(params.raffleId)
    if (!raffle) return reply.code(404).send({ error: "RAFFLE_NOT_FOUND" })
    if (raffle.status !== "draft") return reply.code(400).send({ error: "RAFFLE_NOT_DRAFT" })

    raffle.status = "open"
    raffle.openedAt = nowIso()
    raffle.updatedAt = nowIso()
    store.raffles.set(raffle.id, raffle)

    pushAudit(store, request, {
      action: "RAFFLE_OPEN",
      target: `raffle:${raffle.id}`,
      success: true,
    })
    pushLiveEvent(store, {
      type: "raffle.open",
      level: "info",
      message: `قرعه کشی ${raffle.title} باز شد`,
      data: { raffleId: raffle.id },
    })

    return { raffle }
  })

  app.post("/admin/raffles/:raffleId/close", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { raffleId: string }
    const raffle = store.raffles.get(params.raffleId)
    if (!raffle) return reply.code(404).send({ error: "RAFFLE_NOT_FOUND" })
    if (raffle.status !== "open") return reply.code(400).send({ error: "RAFFLE_NOT_OPEN" })

    raffle.status = "closed"
    raffle.closedAt = nowIso()
    raffle.updatedAt = nowIso()
    store.raffles.set(raffle.id, raffle)

    pushAudit(store, request, {
      action: "RAFFLE_CLOSE",
      target: `raffle:${raffle.id}`,
      success: true,
      payload: { sold: raffle.ticketsSold },
    })
    pushLiveEvent(store, {
      type: "raffle.close",
      level: "info",
      message: `قرعه کشی ${raffle.title} بسته شد`,
      data: { raffleId: raffle.id, sold: raffle.ticketsSold },
    })

    return { raffle }
  })

  app.post("/admin/raffles/:raffleId/draw", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { raffleId: string }
    const parsed = drawSchema.safeParse(request.body ?? {})
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const raffle = store.raffles.get(params.raffleId)
    if (!raffle) return reply.code(404).send({ error: "RAFFLE_NOT_FOUND" })
    if (raffle.status !== "closed") return reply.code(400).send({ error: "RAFFLE_NOT_CLOSED" })
    if (!raffle.closedAt) return reply.code(400).send({ error: "RAFFLE_CLOSE_TIME_MISSING" })

    const tickets = store.getTicketsByRaffle(raffle.id)
    if (tickets.length === 0) return reply.code(400).send({ error: "NO_TICKETS" })
    if (parsed.data.winnersCount > tickets.length) {
      return reply.code(400).send({ error: "WINNER_COUNT_GT_TICKETS" })
    }

    const serverSeed = decryptText(raffle.encryptedServerSeed, env.SEED_ENCRYPTION_KEY)
    const proof = createProvablyFairProof({
      raffleId: raffle.id,
      seedCommitHash: raffle.seedCommitHash,
      serverSeed,
      externalEntropy: parsed.data.externalEntropy ?? randomHex(24),
      closedAt: raffle.closedAt,
      tickets,
      winnerCount: parsed.data.winnersCount,
    })

    raffle.status = "drawn"
    raffle.proof = proof
    raffle.drawnAt = nowIso()
    raffle.updatedAt = nowIso()
    store.raffles.set(raffle.id, raffle)

    const winners = proof.winnerTicketIndexes.map((winnerPos) => tickets[winnerPos]!).filter(Boolean)
    const winnerUserIds = new Set(winners.map((w) => w.userId))
    const participants = new Set(tickets.map((t) => t.userId))
    for (const userId of participants) {
      const key = `${userId}:${raffle.id}`
      const current = store.lotteryMemory.get(key) ?? { missStreak: 0, pityMultiplier: 1 }
      if (winnerUserIds.has(userId)) {
        store.lotteryMemory.set(key, { missStreak: 0, pityMultiplier: 1 })
      } else {
        const nextStreak = current.missStreak + 1
        const multiplier = Math.min(1.5, 1 + nextStreak * 0.01)
        store.lotteryMemory.set(key, { missStreak: nextStreak, pityMultiplier: multiplier })
      }
    }

    pushAudit(store, request, {
      action: "RAFFLE_DRAW",
      target: `raffle:${raffle.id}`,
      success: true,
      payload: { winnersCount: winners.length },
    })
    pushLiveEvent(store, {
      type: "raffle.draw",
      level: "success",
      message: `قرعه کشی ${raffle.title} انجام شد`,
      data: {
        raffleId: raffle.id,
        winners: winners.map((w) => ({ ticketId: w.id, userId: w.userId, index: w.index })),
      },
    })

    return {
      raffleId: raffle.id,
      status: raffle.status,
      proof,
      winners: winners.map((w) => ({
        ticketId: w.id,
        ticketIndex: w.index,
        userId: w.userId,
      })),
    }
  })

  app.delete("/admin/raffles/:raffleId", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { raffleId: string }
    const raffle = store.raffles.get(params.raffleId)
    if (!raffle) return reply.code(404).send({ error: "RAFFLE_NOT_FOUND" })
    if (raffle.status === "open") {
      return reply.code(400).send({ error: "CANNOT_DELETE_OPEN_RAFFLE", message: "قرعه‌کشی باز را نمی‌توان حذف کرد. ابتدا آن را ببندید." })
    }
    if (raffle.ticketsSold > 0) {
      return reply.code(400).send({ error: "CANNOT_DELETE_RAFFLE_WITH_TICKETS", message: "قرعه‌کشی که بلیط دارد قابل حذف نیست." })
    }
    store.raffles.delete(raffle.id)
    pushAudit(store, request, {
      action: "RAFFLE_DELETE",
      target: `raffle:${raffle.id}`,
      success: true,
      payload: { title: raffle.title },
    })
    return { deleted: true, raffleId: raffle.id }
  })
}
