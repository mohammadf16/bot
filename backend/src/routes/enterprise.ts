
import { z } from "zod"
import type { RouteContext } from "../route-context.js"
import { id } from "../utils/id.js"
import { nowIso } from "../utils/time.js"
import { pushLiveEvent } from "../services/events.js"
import { pushUserNotification } from "../services/notifications.js"

const LEGAL_DISCLAIMER_DEFAULT = "این سایت یک پلتفرم سرگرمی است و هیچ سود قطعی به کاربران وعده داده نمی شود."
const LOAN_MAX_IRR = 5_000_000
const DAILY_STREAK_REWARDS = [1, 2, 3, 4, 5, 6, 10]

type VipSnapshot = {
  id: number
  name: string
  cashbackPercent: number
}

const welcomeClaimSchema = z.object({
  action: z.enum(["register", "profile", "phone", "app", "referral_invite"]),
  invitedUserId: z.string().trim().min(3).optional(),
})

const loanRequestSchema = z.object({
  amount: z.number().int().positive().max(LOAN_MAX_IRR),
  dueDays: z.number().int().min(7).max(180).optional(),
})

const loanRepaySchema = z.object({
  amount: z.number().int().positive().max(1_000_000_000),
})

const supportCreateSchema = z.object({
  category: z.enum(["finance", "security", "account", "lottery", "other"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  subject: z.string().trim().min(3).max(150),
  body: z.string().trim().min(5).max(5000),
})
const supportReplySchema = z.object({
  body: z.string().trim().min(2).max(5000),
})
const supportStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
})

const legalSchema = z.object({
  terms: z.string().trim().min(10).max(100_000),
  disclaimer: z.string().trim().min(10).max(20_000),
})

const createAuctionSchema = z.object({
  title: z.string().trim().min(3).max(180),
  mode: z.enum(["blind", "visible"]),
  startPrice: z.number().int().positive(),
  minStep: z.number().int().positive().max(500_000_000),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
})

const liveBidSchema = z.object({ amount: z.number().int().positive() })
const showroomOrderSchema = z.object({ paymentAsset: z.enum(["IRR", "GOLD_SOT"]) })
const showroomCreateSchema = z.object({
  title: z.string().trim().min(3).max(180),
  imageUrl: z.string().trim().url(),
  sourceType: z.enum(["lottery_winback", "external_purchase"]).default("external_purchase"),
  listedPriceIrr: z.number().int().positive().optional(),
  listedPriceGoldSot: z.number().positive().optional(),
  acquisitionCostIrr: z.number().int().positive().optional(),
})
const showroomUpdateSchema = z.object({
  title: z.string().trim().min(3).max(180).optional(),
  imageUrl: z.string().trim().url().optional(),
  status: z.enum(["available", "reserved", "sold", "archived"]).optional(),
  listedPriceIrr: z.number().int().positive().optional(),
  listedPriceGoldSot: z.number().positive().optional(),
  acquisitionCostIrr: z.number().int().positive().optional(),
})
const showroomOrderUpdateSchema = z.object({
  status: z.enum(["pending", "paid", "cancelled", "completed"]),
})
const broadcastSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().max(1000).optional(),
  kind: z.enum(["info", "success", "warning"]).default("info"),
})
const quickHitSchema = z.object({ mode: z.enum(["standard"]).default("standard") })
const wheelJoinSchema = z.object({ pickCode: z.string().trim().min(2).max(40), stakeChances: z.number().int().min(1).max(50).default(1) })
const duelJoinSchema = z.object({ duelId: z.string().trim().min(3).optional() })
const duelChatSchema = z.object({ body: z.string().trim().min(1).max(500) })
const missionCompleteSchema = z.object({ code: z.enum(["spin_wheel", "buy_ticket", "invite_friend"]) })
const referralCodeSchema = z.object({ prefix: z.string().trim().min(2).max(8).optional() })

function dayKey(date = new Date()): string { return date.toISOString().slice(0, 10) }
function parseDateKey(key: string): Date { return new Date(`${key}T00:00:00.000Z`) }

function ensureUserDefaults(user: {
  status?: "active" | "suspended"
  goldSotBalance?: number
  vipLevelId?: number
  vipLevelName?: string
  vipCashbackPercent?: number
  totalTicketsBought?: number
  totalSpendIrr?: number
  activeReferrals?: number
  loanLockedBalance?: number
}): void {
  if (!user.status) user.status = "active"
  if (user.goldSotBalance === undefined) user.goldSotBalance = 0
  if (user.totalTicketsBought === undefined) user.totalTicketsBought = 0
  if (user.totalSpendIrr === undefined) user.totalSpendIrr = 0
  if (user.activeReferrals === undefined) user.activeReferrals = 0
  if (user.loanLockedBalance === undefined) user.loanLockedBalance = 0
  if (user.vipLevelId === undefined) user.vipLevelId = 1
  if (!user.vipLevelName) user.vipLevelName = "برنزی"
  if (user.vipCashbackPercent === undefined) user.vipCashbackPercent = 20
}

function recalcVip(user: {
  vipLevelId?: number
  vipLevelName?: string
  vipCashbackPercent?: number
  totalTicketsBought?: number
  totalSpendIrr?: number
  activeReferrals?: number
}): VipSnapshot {
  ensureUserDefaults(user)
  const spend = user.totalSpendIrr ?? 0
  const tickets = user.totalTicketsBought ?? 0
  const refs = user.activeReferrals ?? 0
  if (spend >= 50_000_000) {
    user.vipLevelId = 5
    user.vipLevelName = "الماس"
    user.vipCashbackPercent = 35
  } else if (refs >= 10) {
    user.vipLevelId = 4
    user.vipLevelName = "پلاتینیوم"
    user.vipCashbackPercent = 35
  } else if (tickets > 20) {
    user.vipLevelId = 3
    user.vipLevelName = "طلایی"
    user.vipCashbackPercent = 30
  } else if (tickets > 5) {
    user.vipLevelId = 2
    user.vipLevelName = "نقره ای"
    user.vipCashbackPercent = 25
  } else {
    user.vipLevelId = 1
    user.vipLevelName = "برنزی"
    user.vipCashbackPercent = 20
  }
  return { id: user.vipLevelId, name: user.vipLevelName, cashbackPercent: user.vipCashbackPercent }
}

function getOrInitWelcome(store: RouteContext["store"], userId: string) {
  const existing = store.welcomeClaims.get(userId)
  if (existing) return existing
  const next: {
    registerClaimed?: boolean
    profileClaimed?: boolean
    phoneVerified?: boolean
    appInstalled?: boolean
    instantReferralClaimed?: boolean
    invitedFriendUserIds: string[]
    updatedAt: string
  } = { invitedFriendUserIds: [], updatedAt: nowIso() }
  store.welcomeClaims.set(userId, next)
  return next
}

function getOrInitMission(store: RouteContext["store"], userId: string) {
  const date = dayKey()
  const found = Array.from(store.dailyMissions.values()).find((m) => m.userId === userId && m.dateKey === date)
  if (found) return found
  const mission = {
    id: id("msn"), userId, dateKey: date,
    missions: [
      { code: "spin_wheel" as const, done: false, claimed: false, rewardType: "chance" as const, rewardValue: 1 },
      { code: "buy_ticket" as const, done: false, claimed: false, rewardType: "cashback_bonus" as const, rewardValue: 5 },
      { code: "invite_friend" as const, done: false, claimed: false, rewardType: "chance" as const, rewardValue: 3 },
    ],
    grandRewardClaimed: false,
    createdAt: nowIso(), updatedAt: nowIso(),
  }
  store.dailyMissions.set(mission.id, mission)
  return mission
}

function findUserByReferralCode(store: RouteContext["store"], code: string): string | undefined {
  const normalized = code.trim().toUpperCase()
  for (const user of store.users.values()) {
    if ((user.referralCode ?? "").toUpperCase() === normalized) return user.id
  }
  return undefined
}

function unlockAchievementIfNeeded(ctx: RouteContext, userId: string): string[] {
  const { store } = ctx
  const user = store.users.get(userId)
  if (!user) return []
  ensureUserDefaults(user)
  const state = store.userAchievements.get(userId) ?? { userId, unlockedCodes: [] as string[], updatedAt: nowIso() }
  const out: string[] = []
  const has = (c: string) => state.unlockedCodes.includes(c)
  const add = (c: string) => { state.unlockedCodes.push(c); out.push(c) }
  const tickets = user.totalTicketsBought ?? 0
  const refs = user.activeReferrals ?? 0
  const wonCars = Array.from(store.walletTx.values()).filter((tx) => tx.userId === userId && tx.meta?.["label"] === "خودرو").length
  if (tickets >= 1 && !has("rookie_silver")) { add("rookie_silver"); user.chances += 2 }
  if (tickets >= 10 && !has("pro_silver")) add("pro_silver")
  if (tickets >= 50 && !has("pro_gold")) add("pro_gold")
  if (tickets >= 100 && !has("immortal_diamond")) add("immortal_diamond")
  if (refs >= 50 && !has("ref_king")) add("ref_king")
  if (wonCars >= 2 && !has("car_hunter")) add("car_hunter")
  if (out.length > 0) {
    state.updatedAt = nowIso()
    store.userAchievements.set(userId, state)
    recalcVip(user)
    user.updatedAt = nowIso()
    store.users.set(user.id, user)
  }
  return out
}
export async function registerEnterpriseRoutes(ctx: RouteContext): Promise<void> {
  const { app, store } = ctx

  app.get("/legal", async () => ({
    terms: store.termsText || "",
    disclaimer: store.disclaimerText || LEGAL_DISCLAIMER_DEFAULT,
    rules: store.rulesText || "",
  }))

  app.get("/admin/content/legal", { preHandler: [app.adminOnly] }, async () => ({
    terms: store.termsText || "",
    disclaimer: store.disclaimerText || LEGAL_DISCLAIMER_DEFAULT,
  }))

  app.put("/admin/content/legal", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const parsed = legalSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    store.termsText = parsed.data.terms
    store.disclaimerText = parsed.data.disclaimer
    return { terms: store.termsText, disclaimer: store.disclaimerText }
  })

  app.get("/loans/me", { preHandler: [app.authenticate] }, async (request) => {
    const items = Array.from(store.autoLoans.values()).filter((l) => l.userId === request.user.sub).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    return { items }
  })

  app.post("/loans/request", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = loanRequestSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    ensureUserDefaults(user)
    const vip = recalcVip(user)
    if (vip.id < 3) return reply.code(403).send({ error: "VIP_LEVEL_REQUIRED", requiredLevel: 3 })
    const now = nowIso()
    const loan = {
      id: id("loan"),
      userId: user.id,
      principalIrr: parsed.data.amount,
      outstandingIrr: parsed.data.amount,
      status: "pending" as const,
      restrictedUsage: true,
      createdAt: now,
      updatedAt: now,
      dueAt: new Date(Date.now() + (parsed.data.dueDays ?? 60) * 24 * 60 * 60 * 1000).toISOString(),
    }
    store.autoLoans.set(loan.id, loan)
    return { loan }
  })

  app.post("/loans/:loanId/repay", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = request.params as { loanId: string }
    const parsed = loanRepaySchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const loan = store.autoLoans.get(params.loanId)
    if (!loan || loan.userId !== request.user.sub) return reply.code(404).send({ error: "LOAN_NOT_FOUND" })
    if (!(["active", "approved"] as string[]).includes(loan.status)) return reply.code(400).send({ error: "LOAN_NOT_REPAYABLE" })
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    ensureUserDefaults(user)

    const repayAmount = Math.min(parsed.data.amount, loan.outstandingIrr)
    const withdrawable = user.walletBalance - (user.loanLockedBalance ?? 0)
    if (withdrawable < repayAmount) return reply.code(400).send({ error: "INSUFFICIENT_WITHDRAWABLE_BALANCE", withdrawable })

    user.walletBalance -= repayAmount
    user.loanLockedBalance = Math.max(0, (user.loanLockedBalance ?? 0) - repayAmount)
    user.updatedAt = nowIso()
    store.users.set(user.id, user)

    loan.outstandingIrr -= repayAmount
    loan.status = loan.outstandingIrr <= 0 ? "repaid" : "active"
    loan.updatedAt = nowIso()
    store.autoLoans.set(loan.id, loan)

    const txId = id("wtx")
    store.walletTx.set(txId, { id: txId, userId: user.id, type: "loan_repay", amount: -repayAmount, status: "completed", createdAt: nowIso(), meta: { loanId: loan.id } })

    return { loan, repaid: repayAmount, balances: { walletBalance: user.walletBalance, loanLockedBalance: user.loanLockedBalance } }
  })

  app.get("/admin/loans", { preHandler: [app.adminOnly] }, async () => ({ items: Array.from(store.autoLoans.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) }))

  app.post("/admin/loans/:loanId/approve", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { loanId: string }
    const loan = store.autoLoans.get(params.loanId)
    if (!loan) return reply.code(404).send({ error: "LOAN_NOT_FOUND" })
    if (loan.status !== "pending") return reply.code(400).send({ error: "LOAN_NOT_PENDING" })
    const user = store.users.get(loan.userId)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    ensureUserDefaults(user)
    loan.status = "active"
    loan.approvedBy = request.user.sub
    loan.updatedAt = nowIso()
    store.autoLoans.set(loan.id, loan)
    user.walletBalance += loan.principalIrr
    user.loanLockedBalance = (user.loanLockedBalance ?? 0) + loan.principalIrr
    user.updatedAt = nowIso()
    store.users.set(user.id, user)
    const txId = id("wtx")
    store.walletTx.set(txId, { id: txId, userId: user.id, type: "loan_credit", amount: loan.principalIrr, status: "completed", createdAt: nowIso(), meta: { loanId: loan.id, approvedBy: request.user.sub } })
    return { loan }
  })

  app.post("/admin/loans/:loanId/reject", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { loanId: string }
    const loan = store.autoLoans.get(params.loanId)
    if (!loan) return reply.code(404).send({ error: "LOAN_NOT_FOUND" })
    if (loan.status !== "pending") return reply.code(400).send({ error: "LOAN_NOT_PENDING" })
    loan.status = "rejected"
    loan.approvedBy = request.user.sub
    loan.updatedAt = nowIso()
    store.autoLoans.set(loan.id, loan)
    return { loan }
  })

  app.get("/support/tickets", { preHandler: [app.authenticate] }, async (request) => {
    const items = Array.from(store.supportTickets.values()).filter((t) => t.userId === request.user.sub).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    return { items }
  })

  app.get("/support/tickets/:ticketId/messages", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = request.params as { ticketId: string }
    const ticket = store.supportTickets.get(params.ticketId)
    if (!ticket || ticket.userId !== request.user.sub) return reply.code(404).send({ error: "TICKET_NOT_FOUND" })
    const items = Array.from(store.supportMessages.values())
      .filter((m) => m.ticketId === ticket.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    return { ticket, items }
  })

  app.post("/support/tickets", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = supportCreateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const ticket = { id: id("stk"), userId: request.user.sub, category: parsed.data.category, priority: parsed.data.priority, status: "open" as const, subject: parsed.data.subject, createdAt: nowIso(), updatedAt: nowIso() }
    store.supportTickets.set(ticket.id, ticket)
    const msg = { id: id("msg"), ticketId: ticket.id, senderUserId: request.user.sub, senderRole: "user" as const, body: parsed.data.body, createdAt: nowIso() }
    store.supportMessages.set(msg.id, msg)
    pushLiveEvent(store, {
      type: "support.ticket",
      level: "info",
      message: `تیکت جدید ثبت شد: ${ticket.subject}`,
      data: { ticketId: ticket.id, userId: ticket.userId, category: ticket.category, priority: ticket.priority },
    })
    return reply.code(201).send({ ticket })
  })

  app.post("/support/tickets/:ticketId/messages", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = request.params as { ticketId: string }
    const parsed = supportReplySchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const ticket = store.supportTickets.get(params.ticketId)
    if (!ticket || ticket.userId !== request.user.sub) return reply.code(404).send({ error: "TICKET_NOT_FOUND" })
    if (ticket.status === "closed") return reply.code(400).send({ error: "TICKET_CLOSED" })
    const msg = { id: id("msg"), ticketId: ticket.id, senderUserId: request.user.sub, senderRole: "user" as const, body: parsed.data.body, createdAt: nowIso() }
    store.supportMessages.set(msg.id, msg)
    if (ticket.status === "resolved") ticket.status = "in_progress"
    ticket.updatedAt = nowIso()
    store.supportTickets.set(ticket.id, ticket)
    pushLiveEvent(store, {
      type: "support.reply",
      level: "info",
      message: `پاسخ جدید کاربر روی تیکت ${ticket.subject}`,
      data: { ticketId: ticket.id, userId: ticket.userId, senderRole: "user" },
    })
    return { ticket, message: msg }
  })

  app.get("/admin/support/tickets", { preHandler: [app.adminOnly] }, async (request) => {
    const q = request.query as { status?: string }
    const status = typeof q.status === "string" ? q.status : undefined
    const items = Array.from(store.supportTickets.values())
      .filter((t) => (status ? t.status === status : true))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((t) => {
        const user = store.users.get(t.userId)
        return {
          ...t,
          userEmail: user?.email ?? "unknown",
          fullName: user?.profile?.fullName ?? "",
          messagesCount: Array.from(store.supportMessages.values()).filter((m) => m.ticketId === t.id).length,
        }
      })
    return { items }
  })

  app.get("/admin/support/tickets/:ticketId/messages", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { ticketId: string }
    const ticket = store.supportTickets.get(params.ticketId)
    if (!ticket) return reply.code(404).send({ error: "TICKET_NOT_FOUND" })
    const items = Array.from(store.supportMessages.values())
      .filter((m) => m.ticketId === ticket.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
      .map((m) => {
        const user = m.senderUserId ? store.users.get(m.senderUserId) : undefined
        return { ...m, senderEmail: user?.email ?? null, senderName: user?.profile?.fullName ?? null }
      })
    return { ticket, items }
  })

  app.post("/admin/support/tickets/:ticketId/messages", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { ticketId: string }
    const parsed = supportReplySchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const ticket = store.supportTickets.get(params.ticketId)
    if (!ticket) return reply.code(404).send({ error: "TICKET_NOT_FOUND" })
    const msg = { id: id("msg"), ticketId: ticket.id, senderUserId: request.user.sub, senderRole: "admin" as const, body: parsed.data.body, createdAt: nowIso() }
    store.supportMessages.set(msg.id, msg)
    ticket.status = ticket.status === "open" ? "in_progress" : ticket.status
    ticket.updatedAt = nowIso()
    store.supportTickets.set(ticket.id, ticket)
    const user = store.users.get(ticket.userId)
    if (user) {
      pushUserNotification(store, {
        userId: user.id,
        title: "پاسخ جدید پشتیبانی",
        body: `پاسخ جدید برای تیکت «${ticket.subject}» ثبت شد.`,
        kind: "info",
      })
    }
    pushLiveEvent(store, {
      type: "support.reply",
      level: "success",
      message: `ادمین به تیکت ${ticket.subject} پاسخ داد`,
      data: { ticketId: ticket.id, userId: ticket.userId, senderRole: "admin" },
    })
    return { ticket, message: msg }
  })

  app.post("/admin/support/tickets/:ticketId/status", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { ticketId: string }
    const parsed = supportStatusSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const ticket = store.supportTickets.get(params.ticketId)
    if (!ticket) return reply.code(404).send({ error: "TICKET_NOT_FOUND" })
    ticket.status = parsed.data.status
    ticket.updatedAt = nowIso()
    store.supportTickets.set(ticket.id, ticket)
    pushLiveEvent(store, {
      type: "support.ticket",
      level: "warning",
      message: `وضعیت تیکت ${ticket.subject} به ${ticket.status} تغییر کرد`,
      data: { ticketId: ticket.id, userId: ticket.userId, status: ticket.status },
    })
    return { ticket }
  })

  app.get("/showroom/vehicles", async () => ({ items: Array.from(store.showroomVehicles.values()).filter((v) => v.status === "available").sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) }))

  app.get("/admin/showroom/vehicles", { preHandler: [app.adminOnly] }, async () => ({
    items: Array.from(store.showroomVehicles.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  }))

  app.post("/admin/showroom/vehicles", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const parsed = showroomCreateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    if (!parsed.data.listedPriceIrr && !parsed.data.listedPriceGoldSot) return reply.code(400).send({ error: "PRICE_REQUIRED" })
    const vehicle = {
      id: id("veh"),
      sourceType: parsed.data.sourceType,
      status: "available" as const,
      vehicle: {
        title: parsed.data.title,
        imageUrl: parsed.data.imageUrl,
      },
      acquisitionCostIrr: parsed.data.acquisitionCostIrr,
      listedPriceIrr: parsed.data.listedPriceIrr,
      listedPriceGoldSot: parsed.data.listedPriceGoldSot,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    store.showroomVehicles.set(vehicle.id, vehicle)
    pushLiveEvent(store, {
      type: "showroom.vehicle",
      level: "info",
      message: `خودروی جدید به نمایشگاه اضافه شد`,
      data: { vehicleId: vehicle.id, title: vehicle.vehicle.title, status: vehicle.status },
    })
    return reply.code(201).send({ vehicle })
  })

  app.put("/admin/showroom/vehicles/:vehicleId", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { vehicleId: string }
    const parsed = showroomUpdateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const vehicle = store.showroomVehicles.get(params.vehicleId)
    if (!vehicle) return reply.code(404).send({ error: "VEHICLE_NOT_FOUND" })
    if (parsed.data.title !== undefined) vehicle.vehicle = { ...vehicle.vehicle, title: parsed.data.title }
    if (parsed.data.imageUrl !== undefined) vehicle.vehicle = { ...vehicle.vehicle, imageUrl: parsed.data.imageUrl }
    if (parsed.data.status !== undefined) vehicle.status = parsed.data.status
    if (parsed.data.listedPriceIrr !== undefined) vehicle.listedPriceIrr = parsed.data.listedPriceIrr
    if (parsed.data.listedPriceGoldSot !== undefined) vehicle.listedPriceGoldSot = parsed.data.listedPriceGoldSot
    if (parsed.data.acquisitionCostIrr !== undefined) vehicle.acquisitionCostIrr = parsed.data.acquisitionCostIrr
    vehicle.updatedAt = nowIso()
    store.showroomVehicles.set(vehicle.id, vehicle)
    pushLiveEvent(store, {
      type: "showroom.vehicle",
      level: "warning",
      message: `وضعیت/قیمت خودرو به‌روزرسانی شد`,
      data: { vehicleId: vehicle.id, title: vehicle.vehicle.title, status: vehicle.status },
    })
    return { vehicle }
  })

  app.get("/admin/showroom/orders", { preHandler: [app.adminOnly] }, async () => ({
    items: Array.from(store.showroomOrders.values())
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((o) => {
        const buyer = store.users.get(o.buyerUserId)
        const vehicle = store.showroomVehicles.get(o.vehicleId)
        return { ...o, buyerEmail: buyer?.email ?? "unknown", vehicleTitle: String(vehicle?.vehicle?.["title"] ?? o.vehicleId) }
      }),
  }))

  app.post("/admin/showroom/orders/:orderId/status", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { orderId: string }
    const parsed = showroomOrderUpdateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const order = store.showroomOrders.get(params.orderId)
    if (!order) return reply.code(404).send({ error: "ORDER_NOT_FOUND" })
    order.status = parsed.data.status
    order.updatedAt = nowIso()
    store.showroomOrders.set(order.id, order)
    pushLiveEvent(store, {
      type: "showroom.order",
      level: "info",
      message: `وضعیت سفارش خودرو تغییر کرد`,
      data: { orderId: order.id, vehicleId: order.vehicleId, buyerUserId: order.buyerUserId, status: order.status },
    })
    return { order }
  })

  app.post("/showroom/vehicles/:vehicleId/orders", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = request.params as { vehicleId: string }
    const parsed = showroomOrderSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const vehicle = store.showroomVehicles.get(params.vehicleId)
    if (!vehicle || vehicle.status !== "available") return reply.code(404).send({ error: "VEHICLE_NOT_AVAILABLE" })
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    ensureUserDefaults(user)
    const amount = parsed.data.paymentAsset === "IRR" ? vehicle.listedPriceIrr : vehicle.listedPriceGoldSot
    if (!amount || amount <= 0) return reply.code(400).send({ error: "PRICE_NOT_AVAILABLE" })

    if (parsed.data.paymentAsset === "IRR") {
      if (user.walletBalance < amount) return reply.code(400).send({ error: "INSUFFICIENT_BALANCE" })
      user.walletBalance -= amount
    } else {
      if ((user.goldSotBalance ?? 0) < amount) return reply.code(400).send({ error: "INSUFFICIENT_GOLD" })
      user.goldSotBalance = (user.goldSotBalance ?? 0) - amount
    }

    user.updatedAt = nowIso()
    store.users.set(user.id, user)
    vehicle.status = "sold"
    vehicle.updatedAt = nowIso()
    store.showroomVehicles.set(vehicle.id, vehicle)
    const order = { id: id("ord"), vehicleId: vehicle.id, buyerUserId: user.id, paymentAsset: parsed.data.paymentAsset, paymentAmount: amount, status: "paid" as const, createdAt: nowIso(), updatedAt: nowIso() }
    store.showroomOrders.set(order.id, order)
    pushLiveEvent(store, {
      type: "showroom.order",
      level: "success",
      message: `سفارش جدید خودرو ثبت شد`,
      data: { orderId: order.id, vehicleId: order.vehicleId, buyerUserId: order.buyerUserId, status: order.status },
    })
    return { order, balances: { walletBalance: user.walletBalance, goldSotBalance: user.goldSotBalance ?? 0 } }
  })

  app.get("/auctions/live", async () => {
    const now = nowIso()
    const items = Array.from(store.auctions.values()).filter((a) => a.status === "open" || a.endAt > now).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map((a) => {
      const bids = store.getBidsByAuction(a.id)
      const blind = (a.description ?? "").includes("[BLIND]")
      return { ...a, bidsCount: bids.length, bestBid: blind ? undefined : bids[0]?.amount ?? a.currentBid }
    })
    return { items }
  })
  app.post("/auctions/live/:auctionId/bid", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = request.params as { auctionId: string }
    const parsed = liveBidSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const auction = store.auctions.get(params.auctionId)
    if (!auction) return reply.code(404).send({ error: "AUCTION_NOT_FOUND" })
    if (auction.status !== "open") return reply.code(400).send({ error: "AUCTION_NOT_OPEN" })
    if (auction.endAt <= nowIso()) return reply.code(400).send({ error: "AUCTION_ENDED" })
    const minStep = Number(auction.description?.match(/MIN_STEP:(\d+)/)?.[1] ?? "1")
    const minRequired = auction.currentBid + minStep
    if (parsed.data.amount < minRequired) return reply.code(400).send({ error: "BID_TOO_LOW", minimum: minRequired })
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    if (user.walletBalance < parsed.data.amount) return reply.code(400).send({ error: "INSUFFICIENT_BALANCE" })

    const bid = { id: id("bid"), auctionId: auction.id, userId: user.id, amount: parsed.data.amount, createdAt: nowIso() }
    store.auctionBids.set(bid.id, bid)
    auction.currentBid = parsed.data.amount
    auction.updatedAt = nowIso()
    store.auctions.set(auction.id, auction)
    return { ok: true, bid }
  })

  app.post("/admin/auctions/live", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const parsed = createAuctionSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    if (parsed.data.endsAt <= parsed.data.startsAt) return reply.code(400).send({ error: "INVALID_TIME_RANGE" })
    const modeTag = parsed.data.mode === "blind" ? "[BLIND]" : "[VISIBLE]"
    const auction = {
      id: id("auc"),
      title: parsed.data.title,
      description: `${modeTag} MIN_STEP:${parsed.data.minStep}`,
      startPrice: parsed.data.startPrice,
      currentBid: parsed.data.startPrice,
      status: "open" as const,
      endAt: parsed.data.endsAt,
      createdBy: request.user.sub,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    store.auctions.set(auction.id, auction)
    return reply.code(201).send({ auction })
  })

  app.post("/admin/auctions/live/:auctionId/close", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { auctionId: string }
    const auction = store.auctions.get(params.auctionId)
    if (!auction) return reply.code(404).send({ error: "AUCTION_NOT_FOUND" })
    auction.status = "closed"
    const topBid = store.getBidsByAuction(auction.id)[0]
    auction.winnerUserId = topBid?.userId
    auction.updatedAt = nowIso()
    store.auctions.set(auction.id, auction)
    return { auction, topBid }
  })

  app.get("/admin/system/backups", { preHandler: [app.adminOnly] }, async () => ({
    items: Array.from(store.backupJobs.values()).sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1)),
  }))

  app.post("/admin/system/backups/run", { preHandler: [app.adminOnly] }, async () => {
    const job = {
      id: id("bkp"),
      startedAt: nowIso(),
      finishedAt: nowIso(),
      status: "success" as const,
      storageUri: `s3://car-backups/${new Date().toISOString().slice(0, 10)}/${id("snapshot")}.json`,
      checksumSha256: id("sha").replace("sha_", ""),
    }
    store.backupJobs.set(job.id, job)
    return { job }
  })

  app.get("/admin/risk/signals", { preHandler: [app.adminOnly] }, async () => ({
    items: Array.from(store.riskSignals.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  }))

  app.post("/admin/risk/scan", { preHandler: [app.adminOnly] }, async () => {
    let created = 0
    const ipCount = new Map<string, number>()
    for (const attempt of store.loginAttempts.values()) {
      if (attempt.ip) ipCount.set(attempt.ip, (ipCount.get(attempt.ip) ?? 0) + 1)
    }
    for (const [ip, count] of ipCount.entries()) {
      if (count < 5) continue
      const signal = {
        id: id("rsk"),
        signalType: "REPEATED_IP",
        severity: count > 20 ? "high" as const : "medium" as const,
        score: Math.min(100, count * 3),
        details: { ip, attempts: count },
        createdAt: nowIso(),
      }
      store.riskSignals.set(signal.id, signal)
      created += 1
    }
    return { ok: true, created }
  })

  app.post("/admin/notifications/broadcast", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const parsed = broadcastSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    let count = 0
    for (const user of store.users.values()) {
      pushUserNotification(store, { userId: user.id, title: parsed.data.title, body: parsed.data.body, kind: parsed.data.kind })
      count += 1
    }
    pushLiveEvent(store, {
      type: "system.info",
      level: parsed.data.kind === "warning" ? "warning" : "info",
      message: parsed.data.title,
      data: { broadcastUsers: count },
    })
    return { sent: count }
  })

  app.get("/engagement/welcome/status", { preHandler: [app.authenticate] }, async (request) => {
    const user = store.users.get(request.user.sub)
    const state = getOrInitWelcome(store, request.user.sub)
    return { user, state }
  })

  app.post("/engagement/welcome/claim", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = welcomeClaimSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    ensureUserDefaults(user)
    const state = getOrInitWelcome(store, user.id)

    const apply = (key: "registerClaimed" | "profileClaimed" | "phoneVerified" | "appInstalled" | "instantReferralClaimed") => {
      if (state[key]) return false
      state[key] = true
      state.updatedAt = nowIso()
      return true
    }

    let reward: Record<string, number> = {}
    if (parsed.data.action === "register") {
      if (!apply("registerClaimed")) return reply.code(400).send({ error: "ALREADY_CLAIMED" })
      user.chances += 5
      reward = { chances: 5, firstBuyCashbackPercent: 20 }
    } else if (parsed.data.action === "profile") {
      if (!apply("profileClaimed")) return reply.code(400).send({ error: "ALREADY_CLAIMED" })
      user.chances += 2
      user.goldSotBalance = (user.goldSotBalance ?? 0) + 50
      reward = { chances: 2, goldSot: 50 }
    } else if (parsed.data.action === "phone") {
      if (!apply("phoneVerified")) return reply.code(400).send({ error: "ALREADY_CLAIMED" })
      user.chances += 1
      reward = { chances: 1 }
    } else if (parsed.data.action === "app") {
      if (!apply("appInstalled")) return reply.code(400).send({ error: "ALREADY_CLAIMED" })
      user.chances += 3
      user.walletBalance += 100_000
      reward = { chances: 3, bonusIrr: 100_000 }
    } else {
      if (!parsed.data.invitedUserId) return reply.code(400).send({ error: "INVITED_USER_REQUIRED" })
      if (!apply("instantReferralClaimed")) return reply.code(400).send({ error: "ALREADY_CLAIMED" })
      state.invitedFriendUserIds.push(parsed.data.invitedUserId)
      user.chances += 5
      reward = { chances: 5, firstPurchaseSharePercent: 20 }
    }

    user.updatedAt = nowIso()
    store.users.set(user.id, user)
    store.welcomeClaims.set(user.id, state)
    return { ok: true, reward, balances: { walletBalance: user.walletBalance, chances: user.chances, goldSotBalance: user.goldSotBalance ?? 0 } }
  })

  app.post("/engagement/quick-hit/play", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = quickHitSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    if (user.chances < 1) return reply.code(400).send({ error: "NOT_ENOUGH_CHANCES" })
    user.chances -= 1

    const st = store.quickHitState.get(user.id) ?? { totalSpins: 0 }
    st.totalSpins += 1
    st.lastPlayedAt = nowIso()
    store.quickHitState.set(user.id, st)

    const reels = ["🍒", "💎", "🚗"] as const
    const guaranteed = st.totalSpins % 10 === 0
    const roll = () => reels[Math.floor(Math.random() * reels.length)]
    let outcome = [roll(), roll(), roll()] as string[]
    if (guaranteed) outcome = ["🍒", "🍒", "🍒"]

    let reward: { type: "gold" | "ticket" | "none"; value: number } = { type: "none", value: 0 }
    if (outcome.every((x) => x === "🍒")) {
      user.goldSotBalance = (user.goldSotBalance ?? 0) + 50
      reward = { type: "gold", value: 50 }
    } else if (outcome.every((x) => x === "💎")) {
      user.goldSotBalance = (user.goldSotBalance ?? 0) + 100
      reward = { type: "gold", value: 100 }
    } else if (outcome.every((x) => x === "🚗")) {
      user.walletBalance += 1_000_000
      reward = { type: "ticket", value: 1 }
    }

    user.updatedAt = nowIso()
    store.users.set(user.id, user)
    return { outcome, guaranteed, reward, balances: { chances: user.chances, goldSotBalance: user.goldSotBalance ?? 0, walletBalance: user.walletBalance } }
  })

  app.get("/engagement/events/weekly", async () => ({
    items: [
      { day: "شنبه", title: "شانس طلایی", prize: "100 سوت طلا برای 100 نفر", hook: "خرید حداقل 1 بلیط" },
      { day: "یکشنبه", title: "بدون توقف", prize: "50% تخفیف بلیط", hook: "افزایش فروش روز کم بازدید" },
      { day: "دوشنبه", title: "دوئل شبانه", prize: "1,000,000 تومان", hook: "اسلاید گروهی" },
      { day: "سه شنبه", title: "روز زیرمجموعه", prize: "2x پاداش", hook: "رشد کاربر" },
      { day: "چهارشنبه", title: "چهارشنبه شانس", prize: "گردونه ویژه", hook: "هیجان قبل از آخر هفته" },
      { day: "پنجشنبه", title: "شب ماشین", prize: "قرعه کشی خودرو", hook: "اوج فروش" },
      { day: "جمعه", title: "جکپات آخر هفته", prize: "تجمیع شانس هفته", hook: "یک برنده" },
    ],
  }))

  app.get("/engagement/events/seasonal", async () => ({
    items: [
      { season: "بهار", event: "نوروز شانس", prize: "سفر ترکیه برای 2 نفر" },
      { season: "تابستان", event: "سفر دبی", prize: "بلیط + هتل 5 ستاره" },
      { season: "پاییز", event: "شب یلدا", prize: "iPhone 15" },
      { season: "زمستان", event: "جشنواره برفی", prize: "کمک هزینه جهیزیه/عقد" },
    ],
  }))
  app.post("/engagement/streak/checkin", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    if (user.chances < 1) return reply.code(400).send({ error: "NOT_ENOUGH_CHANCES" })

    const today = dayKey()
    const streak = store.dailyStreaks.get(user.id) ?? { userId: user.id, currentStreak: 0, updatedAt: nowIso() }
    const last = streak.lastActiveDate
    if (last === today) return reply.code(400).send({ error: "ALREADY_CHECKED_IN" })

    if (!last) {
      streak.currentStreak = 1
    } else {
      const diff = Math.round((parseDateKey(today).getTime() - parseDateKey(last).getTime()) / (24 * 60 * 60 * 1000))
      streak.currentStreak = diff === 1 ? streak.currentStreak + 1 : 1
    }

    user.chances -= 1
    const idx = Math.min(DAILY_STREAK_REWARDS.length - 1, streak.currentStreak - 1)
    const reward = DAILY_STREAK_REWARDS[idx] ?? 1
    user.chances += reward
    user.updatedAt = nowIso()
    store.users.set(user.id, user)

    streak.lastActiveDate = today
    streak.updatedAt = nowIso()
    store.dailyStreaks.set(user.id, streak)

    return { streak: streak.currentStreak, rewardChance: reward, chances: user.chances }
  })

  app.get("/engagement/missions/today", { preHandler: [app.authenticate] }, async (request) => ({ mission: getOrInitMission(store, request.user.sub) }))

  app.post("/engagement/missions/complete", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = missionCompleteSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    ensureUserDefaults(user)

    const mission = getOrInitMission(store, user.id)
    const item = mission.missions.find((m) => m.code === parsed.data.code)
    if (!item) return reply.code(404).send({ error: "MISSION_NOT_FOUND" })

    if (!item.done) {
      item.done = true
      if (item.rewardType === "chance") user.chances += item.rewardValue
      if (item.rewardType === "gold_sot") user.goldSotBalance = (user.goldSotBalance ?? 0) + item.rewardValue
      item.claimed = true
    }

    if (!mission.grandRewardClaimed && mission.missions.every((m) => m.done)) {
      mission.grandRewardClaimed = true
      user.goldSotBalance = (user.goldSotBalance ?? 0) + 100
    }

    mission.updatedAt = nowIso()
    store.dailyMissions.set(mission.id, mission)
    user.updatedAt = nowIso()
    store.users.set(user.id, user)

    return { mission, balances: { chances: user.chances, goldSotBalance: user.goldSotBalance ?? 0 } }
  })

  app.get("/engagement/achievements", { preHandler: [app.authenticate] }, async (request) => {
    const unlockedNow = unlockAchievementIfNeeded(ctx, request.user.sub)
    const state = store.userAchievements.get(request.user.sub) ?? { userId: request.user.sub, unlockedCodes: [], updatedAt: nowIso() }
    return { unlockedNow, unlocked: state.unlockedCodes }
  })

  app.get("/engagement/dashboard", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    ensureUserDefaults(user)
    const won = Array.from(store.walletTx.values()).filter((tx) => tx.userId === user.id && tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0)
    const currentVip = recalcVip(user)
    let nextVipAt = 5
    if (currentVip.id === 2) nextVipAt = 20
    if (currentVip.id >= 3) nextVipAt = 50

    return {
      totalWonIrr: won,
      activeReferrals: user.activeReferrals ?? 0,
      chancesToNextVip: Math.max(0, nextVipAt - (user.totalTicketsBought ?? 0)),
      predictedNextChanceAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      vip: currentVip,
    }
  })

  app.get("/engagement/shock-prizes", async () => ({
    items: [
      { code: "mystery_car", title: "ماشین ناشناس", description: "یک خودروی خارجی لوکس یا شاسی بلند جذاب" },
      { code: "gold_forever", title: "طلای همیشه", description: "برنده ماهانه به اندازه وزن خود طلا" },
      { code: "dream_trip", title: "رویایی", description: "هر ماه سفر حج/کربلا/مشهد" },
    ],
  }))

  app.get("/engagement/vip", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    const vip = recalcVip(user)
    return {
      level: vip,
      perks: {
        support: vip.id >= 3 ? "واتساپ مستقیم" : "استاندارد",
        wheel: vip.id >= 3,
        ticketDiscountPercent: vip.id >= 3 ? 40 : 0,
        birthdayGift: vip.id >= 4,
      },
    }
  })

  app.get("/engagement/referral/code", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    const found = Array.from(store.referralDiscountCodes.values()).find((c) => c.ownerUserId === user.id)
    return { code: found ?? null }
  })

  app.post("/engagement/referral/code", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = referralCodeSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    const prefix = (parsed.data.prefix ?? user.email.split("@")[0] ?? "USR").replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase()
    let code = `${prefix}${Math.floor(100 + Math.random() * 900)}`
    while (store.referralDiscountCodes.has(code)) code = `${prefix}${Math.floor(100 + Math.random() * 900)}`
    const data = { code, ownerUserId: user.id, discountPercent: 20, uses: 0, createdAt: nowIso() }
    store.referralDiscountCodes.set(code, data)
    return { code: data }
  })

  app.post("/engagement/referral/apply-code", { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = request.body as { code?: unknown }
    const code = typeof body.code === "string" ? body.code : ""
    const ownerId = findUserByReferralCode(store, code)
    if (!ownerId) return reply.code(404).send({ error: "CODE_NOT_FOUND" })
    const user = store.users.get(request.user.sub)
    const owner = store.users.get(ownerId)
    if (!user || !owner) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    if (user.id === owner.id) return reply.code(400).send({ error: "CANNOT_SELF_REFER" })
    user.referredBy = owner.id
    owner.activeReferrals = (owner.activeReferrals ?? 0) + 1
    owner.updatedAt = nowIso()
    user.updatedAt = nowIso()
    recalcVip(owner)
    store.users.set(owner.id, owner)
    store.users.set(user.id, user)
    return { ok: true }
  })

  app.get("/engagement/marketing/live-metrics", async () => {
    const openRaffle = Array.from(store.raffles.values()).find((r) => r.status === "open")
    return {
      onlineUsers: Math.max(12, store.users.size * 3),
      recentWinners: store.liveEvents.filter((e) => e.type === "raffle.draw" || e.type === "system.info").slice(0, 10),
      remainingTickets: openRaffle ? Math.max(0, openRaffle.maxTickets - openRaffle.ticketsSold) : 0,
      flashSale: { at: "15:00-16:00", discountPercent: 20 },
      nightDiscount: { at: "00:00-06:00", discountPercent: 30, minAmount: 500_000 },
    }
  })
  app.get("/engagement/duels/open", async () => ({
    items: Array.from(store.carDuels.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  }))

  app.post("/engagement/duels/join", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = duelJoinSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    if (user.chances < 2) return reply.code(400).send({ error: "NOT_ENOUGH_CHANCES" })

    let duel = parsed.data.duelId ? store.carDuels.get(parsed.data.duelId) : undefined
    if (!duel) {
      duel = { id: id("duel"), status: "waiting", entryChances: 2, players: [], createdAt: nowIso(), updatedAt: nowIso() }
      store.carDuels.set(duel.id, duel)
    }

    if (duel.status !== "waiting") return reply.code(400).send({ error: "DUEL_NOT_WAITING" })
    if (duel.players.some((p) => p.userId === user.id)) return reply.code(400).send({ error: "ALREADY_JOINED" })

    user.chances -= duel.entryChances
    user.updatedAt = nowIso()
    store.users.set(user.id, user)
    duel.players.push({ userId: user.id, joinedAt: nowIso() })
    duel.updatedAt = nowIso()

    if (duel.players.length >= 2) {
      duel.status = "running"
      for (const p of duel.players) p.rolledNumber = 1 + Math.floor(Math.random() * 100)
      const winner = duel.players.slice().sort((a, b) => (b.rolledNumber ?? 0) - (a.rolledNumber ?? 0))[0]
      duel.winnerUserId = winner?.userId
      duel.status = "finished"
      const winnerUser = winner ? store.users.get(winner.userId) : undefined
      if (winnerUser) {
        winnerUser.chances += duel.entryChances * 2
        winnerUser.updatedAt = nowIso()
        store.users.set(winnerUser.id, winnerUser)
      }
    }

    store.carDuels.set(duel.id, duel)
    return { duel }
  })

  app.get("/engagement/duels/:duelId/chat", { preHandler: [app.authenticate] }, async (request) => {
    const params = request.params as { duelId: string }
    const items = Array.from(store.carDuelChats.values()).filter((c) => c.duelId === params.duelId).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    return { items }
  })

  app.post("/engagement/duels/:duelId/chat", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = request.params as { duelId: string }
    const parsed = duelChatSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const duel = store.carDuels.get(params.duelId)
    if (!duel) return reply.code(404).send({ error: "DUEL_NOT_FOUND" })
    if (!duel.players.some((p) => p.userId === request.user.sub)) return reply.code(403).send({ error: "NOT_A_PLAYER" })
    const chat = { id: id("dch"), duelId: duel.id, userId: request.user.sub, body: parsed.data.body, createdAt: nowIso() }
    store.carDuelChats.set(chat.id, chat)
    return { chat }
  })

  app.get("/engagement/live-wheel/session", async () => {
    const key = dayKey()
    let session = Array.from(store.wheelLiveSessions.values()).find((s) => s.dateKey === key)
    if (!session) {
      session = {
        id: id("lws"),
        dateKey: key,
        scheduledAt: `${key}T18:30:00.000Z`,
        status: "scheduled" as const,
        segments: [
          { code: "cash_2x", title: "2x", multiplier: 2 },
          { code: "cash_5x", title: "5x", multiplier: 5 },
          { code: "jackpot", title: "جکپات", multiplier: 10 },
          { code: "gold", title: "طلا", multiplier: 3 },
        ],
        jackpotCode: "jackpot",
        participants: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      store.wheelLiveSessions.set(session.id, session)
    }

    if (session.status !== "resolved" && session.scheduledAt <= nowIso()) {
      session.status = "resolved"
      session.resultCode = session.segments[Math.floor(Math.random() * session.segments.length)]?.code
      session.updatedAt = nowIso()
      store.wheelLiveSessions.set(session.id, session)
      if (session.resultCode) {
        for (const p of session.participants) {
          const user = store.users.get(p.userId)
          if (!user) continue
          if (session.resultCode === session.jackpotCode || session.resultCode === p.pickCode) user.chances += p.stakeChances * 2
          user.updatedAt = nowIso()
          store.users.set(user.id, user)
        }
      }
    }

    return { session }
  })

  app.post("/engagement/live-wheel/join", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = wheelJoinSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    if (user.chances < parsed.data.stakeChances) return reply.code(400).send({ error: "NOT_ENOUGH_CHANCES" })

    const key = dayKey()
    const session = Array.from(store.wheelLiveSessions.values()).find((s) => s.dateKey === key)
    if (!session) return reply.code(404).send({ error: "SESSION_NOT_FOUND" })
    if (session.status !== "scheduled") return reply.code(400).send({ error: "SESSION_NOT_OPEN" })

    user.chances -= parsed.data.stakeChances
    user.updatedAt = nowIso()
    store.users.set(user.id, user)
    session.participants.push({ userId: user.id, pickCode: parsed.data.pickCode, stakeChances: parsed.data.stakeChances, createdAt: nowIso() })
    session.updatedAt = nowIso()
    store.wheelLiveSessions.set(session.id, session)
    return { sessionId: session.id, joined: true, chances: user.chances }
  })

  app.post("/engagement/wishes", { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = request.body as { text?: unknown }
    const text = typeof body.text === "string" ? body.text.trim() : ""
    if (text.length < 3 || text.length > 500) return reply.code(400).send({ error: "INVALID_TEXT" })
    const wish = { id: id("wsh"), userId: request.user.sub, text, likes: 0, createdAt: nowIso() }
    store.userWishes.set(wish.id, wish)
    return { wish }
  })

  app.get("/engagement/wishes", async () => ({ items: Array.from(store.userWishes.values()).sort((a, b) => b.likes - a.likes).slice(0, 100) }))

  app.post("/engagement/wishes/:wishId/like", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = request.params as { wishId: string }
    const wish = store.userWishes.get(params.wishId)
    if (!wish) return reply.code(404).send({ error: "WISH_NOT_FOUND" })
    wish.likes += 1
    store.userWishes.set(wish.id, wish)
    return { likes: wish.likes }
  })

  app.post("/engagement/photo-contest", { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = request.body as { imageUrl?: unknown; caption?: unknown }
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : ""
    const caption = typeof body.caption === "string" ? body.caption.trim() : undefined
    if (!/^https?:\/\//.test(imageUrl)) return reply.code(400).send({ error: "INVALID_IMAGE_URL" })
    const entry = { id: id("pic"), userId: request.user.sub, imageUrl, caption, votes: 0, createdAt: nowIso() }
    store.photoContestEntries.set(entry.id, entry)
    return { entry }
  })

  app.get("/engagement/photo-contest", async () => ({ items: Array.from(store.photoContestEntries.values()).sort((a, b) => b.votes - a.votes).slice(0, 100) }))

  app.post("/engagement/photo-contest/:entryId/vote", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = request.params as { entryId: string }
    const entry = store.photoContestEntries.get(params.entryId)
    if (!entry) return reply.code(404).send({ error: "ENTRY_NOT_FOUND" })
    entry.votes += 1
    store.photoContestEntries.set(entry.id, entry)
    return { votes: entry.votes }
  })

  pushLiveEvent(store, { type: "system.info", level: "info", message: "Enterprise routes loaded" })
}
