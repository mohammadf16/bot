import { z } from "zod"
import type { RouteContext } from "../route-context.js"
import { env } from "../env.js"
import { createProvablyFairProof } from "../security/lottery.js"
import { pushAudit, pushLiveEvent } from "../services/events.js"
import { finalizeSlideDraw } from "../services/slide-draw.js"
import { normalizeWheelConfig, toLegacyCompatibleWheelConfig } from "../services/wheel-config.js"
import { decryptText, encryptText, randomHex, sha256Hex } from "../utils/crypto.js"
import { id } from "../utils/id.js"
import { nowIso } from "../utils/time.js"
import type { PricingPolicy, Raffle } from "../types.js"

const tierSchema = z.object({
  order: z.number().int().min(1),
  price: z.number().int().positive(),
  discountPercent: z.number().int().min(0).max(100),
})

const raffleCreateSchema = z.object({
  title: z.string().min(3).max(120),
  maxTickets: z.number().int().positive().max(2_000_000),
  tiers: z.array(tierSchema).min(1).max(20).optional(),
  config: z
    .object({
      cashbackPercent: z.number().int().min(0).max(100),
      wheelChancePerTicket: z.number().int().min(0).max(1000),
      lotteryChancePerTicket: z.number().int().min(0).max(1000),
      freeEntryEveryN: z.number().int().min(1).max(1000),
    })
    .optional(),
})

const drawSchema = z.object({
  winnersCount: z.number().int().min(1).max(100),
  externalEntropy: z.string().min(16).max(256),
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
    const items = Array.from(store.raffles.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
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
      gameDifficulty: store.gameDifficulty,
      recentEvents: store.liveEvents.slice(0, 50),
    }
  })

  app.get("/admin/game/difficulty", { preHandler: [app.adminOnly] }, async () => {
    return { difficulty: store.gameDifficulty }
  })

  app.put("/admin/game/difficulty", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const parsed = difficultySchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    store.gameDifficulty = parsed.data.difficulty
    return { difficulty: store.gameDifficulty }
  })

  app.post("/admin/slide/single/target", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const parsed = dailySlideTargetSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    store.dailySlideTargets.set(parsed.data.targetDate, {
      winningNumber: parsed.data.winningNumber,
      createdBy: request.user.sub,
      createdAt: nowIso(),
    })
    return {
      ok: true,
      targetDate: parsed.data.targetDate,
      winningNumber: parsed.data.winningNumber,
    }
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

    const now = nowIso()
    const published = store.getCurrentPricingPolicy()
    const tiers = parsed.data.tiers ?? published?.tiers
    const config = parsed.data.config ?? published?.config
    if (!tiers || !config) {
      return reply.code(400).send({ error: "NO_PRICING_POLICY_AVAILABLE" })
    }

    const serverSeed = randomHex(32)
    const raffle: Raffle = {
      id: id("raf"),
      title: parsed.data.title,
      maxTickets: parsed.data.maxTickets,
      ticketsSold: 0,
      status: "draft",
      tiers,
      config,
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

    return reply.code(201).send({ raffle })
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
    const parsed = drawSchema.safeParse(request.body)
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
      externalEntropy: parsed.data.externalEntropy,
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
}
