import { z } from "zod"
import type { RouteContext } from "../route-context.js"
import {
  calculateCashback,
  calculateDynamicTicketPrices,
  RAFFLE_COMBO_PACKAGES,
  type RaffleComboCode,
} from "../services/pricing.js"
import { pushAudit, pushLiveEvent } from "../services/events.js"
import { id } from "../utils/id.js"
import { nowIso } from "../utils/time.js"
import { verifyProof } from "../security/lottery.js"
import { pushUserNotification } from "../services/notifications.js"

const buySchema = z.object({
  count: z.number().int().min(1).max(20),
  clientSeed: z.string().min(8).max(128).optional(),
})

const buyComboSchema = z.object({
  code: z.enum(["silver", "gold"]),
  clientSeed: z.string().min(8).max(128).optional(),
})

function ensureUserStats(user: {
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

function recalculateVip(user: {
  vipLevelId?: number
  vipLevelName?: string
  vipCashbackPercent?: number
  totalTicketsBought?: number
  totalSpendIrr?: number
  activeReferrals?: number
}): void {
  ensureUserStats(user)
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
  ctx: RouteContext,
  buyerUserId: string,
  purchaseAmount: number,
  raffleId: string,
): void {
  const { store } = ctx
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

function createTickets(args: {
  raffleId: string
  userId: string
  startIndex: number
  prices: number[]
  clientSeed?: string
}): Array<{
  id: string
  raffleId: string
  userId: string
  index: number
  pricePaid: number
  clientSeed: string
  createdAt: string
}> {
  return args.prices.map((price, i) => {
    const index = args.startIndex + i + 1
    return {
      id: id("tkt"),
      raffleId: args.raffleId,
      userId: args.userId,
      index,
      pricePaid: price,
      clientSeed: args.clientSeed ?? `${args.userId}-${index}-${Date.now()}`,
      createdAt: nowIso(),
    }
  })
}

function getPurchasedCountByUser(store: RouteContext["store"], raffleId: string, userId: string): number {
  let count = 0
  for (const t of store.tickets.values()) {
    if (t.raffleId === raffleId && t.userId === userId) count += 1
  }
  return count
}

export async function registerRaffleRoutes(ctx: RouteContext): Promise<void> {
  const { app, store } = ctx

  app.get("/raffles", async () => {
    return {
      items: Array.from(store.raffles.values())
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map((r) => ({
          id: r.id,
          title: r.title,
          status: r.status,
          maxTickets: r.maxTickets,
          ticketsSold: r.ticketsSold,
          seedCommitHash: r.seedCommitHash,
          openedAt: r.openedAt,
          closedAt: r.closedAt,
          drawnAt: r.drawnAt,
          dynamicPricing: {
            basePrice: 1_000_000,
            decayFactor: 0.8,
            minPrice: 500_000,
          },
          comboPackages: Object.values(RAFFLE_COMBO_PACKAGES),
        })),
    }
  })

  app.get("/raffles/:raffleId", async (request, reply) => {
    const params = request.params as { raffleId: string }
    const raffle = store.raffles.get(params.raffleId)
    if (!raffle) return reply.code(404).send({ error: "RAFFLE_NOT_FOUND" })

    return {
      id: raffle.id,
      title: raffle.title,
      status: raffle.status,
      maxTickets: raffle.maxTickets,
      ticketsSold: raffle.ticketsSold,
      seedCommitHash: raffle.seedCommitHash,
      tiers: raffle.tiers,
      config: raffle.config,
      dynamicPricing: {
        basePrice: 1_000_000,
        decayFactor: 0.8,
        minPrice: 500_000,
      },
      comboPackages: Object.values(RAFFLE_COMBO_PACKAGES),
      openedAt: raffle.openedAt,
      closedAt: raffle.closedAt,
      drawnAt: raffle.drawnAt,
      hasProof: Boolean(raffle.proof),
    }
  })

  app.post("/raffles/:raffleId/buy", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = request.params as { raffleId: string }
    const parsed = buySchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const raffle = store.raffles.get(params.raffleId)
    if (!raffle) return reply.code(404).send({ error: "RAFFLE_NOT_FOUND" })
    if (raffle.status !== "open") return reply.code(400).send({ error: "RAFFLE_NOT_OPEN" })

    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    ensureUserStats(user)

    const idem = request.headers["idempotency-key"]
    const idempotencyKey = typeof idem === "string" ? idem.trim() : undefined
    if (idempotencyKey) {
      const duplicate = store.idempotency.get(`${user.id}:raffle-buy:${idempotencyKey}`)
      if (duplicate) return duplicate
    }

    const count = parsed.data.count
    if (raffle.ticketsSold + count > raffle.maxTickets) {
      return reply.code(400).send({ error: "NOT_ENOUGH_TICKETS_LEFT" })
    }

    const alreadyBought = getPurchasedCountByUser(store, raffle.id, user.id)
    const prices = calculateDynamicTicketPrices(count, alreadyBought)
    const totalPaid = prices.reduce((a, b) => a + b, 0)
    if (user.walletBalance < totalPaid) {
      return reply.code(400).send({ error: "INSUFFICIENT_BALANCE", required: totalPaid, current: user.walletBalance })
    }

    const baseIndex = raffle.ticketsSold
    const tickets = createTickets({
      raffleId: raffle.id,
      userId: user.id,
      startIndex: baseIndex,
      prices,
      clientSeed: parsed.data.clientSeed,
    })

    for (const t of tickets) store.tickets.set(t.id, t)

    recalculateVip(user)
    const effectiveCashbackPercent = Math.max(raffle.config.cashbackPercent, user.vipCashbackPercent ?? 20)
    const cashback = calculateCashback(totalPaid, { ...raffle.config, cashbackPercent: effectiveCashbackPercent })

    raffle.ticketsSold += count
    raffle.updatedAt = nowIso()
    store.raffles.set(raffle.id, raffle)

    user.walletBalance -= totalPaid
    user.walletBalance += cashback
    user.chances += count * raffle.config.wheelChancePerTicket
    user.totalTicketsBought = (user.totalTicketsBought ?? 0) + count
    user.totalSpendIrr = (user.totalSpendIrr ?? 0) + totalPaid
    user.updatedAt = nowIso()
    recalculateVip(user)
    store.users.set(user.id, user)

    applyReferralCommissions(ctx, user.id, totalPaid, raffle.id)

    const purchaseTx = {
      id: id("wtx"),
      userId: user.id,
      type: "ticket_purchase" as const,
      amount: -totalPaid,
      status: "completed" as const,
      createdAt: nowIso(),
      idempotencyKey,
      meta: { raffleId: raffle.id, ticketCount: count, pricing: "dynamic_0_8" },
    }
    const cashbackTx = {
      id: id("wtx"),
      userId: user.id,
      type: "cashback" as const,
      amount: cashback,
      status: "completed" as const,
      createdAt: nowIso(),
      meta: { raffleId: raffle.id, cashbackPercent: effectiveCashbackPercent },
    }
    store.walletTx.set(purchaseTx.id, purchaseTx)
    store.walletTx.set(cashbackTx.id, cashbackTx)

    const pityState = store.lotteryMemory.get(`${user.id}:${raffle.id}`) ?? { missStreak: 0, pityMultiplier: 1 }

    const response = {
      ok: true,
      raffleId: raffle.id,
      ticketIds: tickets.map((t) => t.id),
      ticketsBought: count,
      totalPaid,
      ticketPrices: prices,
      cashback,
      balanceAfter: user.walletBalance,
      chancesAfter: user.chances,
      pity: pityState,
      vip: {
        levelId: user.vipLevelId,
        levelName: user.vipLevelName,
        cashbackPercent: user.vipCashbackPercent,
      },
    }
    if (idempotencyKey) store.idempotency.set(`${user.id}:raffle-buy:${idempotencyKey}`, response)

    pushAudit(store, request, {
      action: "RAFFLE_BUY_TICKET",
      target: `raffle:${raffle.id}`,
      success: true,
      payload: { ticketCount: count, totalPaid, cashback },
    })
    pushLiveEvent(store, {
      type: "raffle.buy",
      level: "success",
      message: `Ticket purchase: ${count} in ${raffle.title}`,
      data: { raffleId: raffle.id, count },
    })
    pushUserNotification(store, {
      userId: user.id,
      title: "خرید بلیط انجام شد",
      body: `${count.toLocaleString("fa-IR")} بلیط خریداری شد و ${cashback.toLocaleString("fa-IR")} تومان کش بک دریافت کردید.`,
      kind: "success",
    })

    return response
  })

  app.post("/raffles/:raffleId/buy-combo", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = request.params as { raffleId: string }
    const parsed = buyComboSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const raffle = store.raffles.get(params.raffleId)
    if (!raffle) return reply.code(404).send({ error: "RAFFLE_NOT_FOUND" })
    if (raffle.status !== "open") return reply.code(400).send({ error: "RAFFLE_NOT_OPEN" })

    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    ensureUserStats(user)

    const combo = RAFFLE_COMBO_PACKAGES[parsed.data.code as RaffleComboCode]
    const paidCount = combo.paidTickets
    const giftCount = combo.bonusTickets
    const totalCount = paidCount + giftCount

    if (raffle.ticketsSold + totalCount > raffle.maxTickets) {
      return reply.code(400).send({ error: "NOT_ENOUGH_TICKETS_LEFT" })
    }

    const alreadyBought = getPurchasedCountByUser(store, raffle.id, user.id)
    const paidPrices = calculateDynamicTicketPrices(paidCount, alreadyBought)
    const giftPrices = Array.from({ length: giftCount }, () => 0)
    const prices = [...paidPrices, ...giftPrices]
    const totalPaid = paidPrices.reduce((a, b) => a + b, 0)

    if (user.walletBalance < totalPaid) {
      return reply.code(400).send({ error: "INSUFFICIENT_BALANCE", required: totalPaid, current: user.walletBalance })
    }

    const baseIndex = raffle.ticketsSold
    const tickets = createTickets({
      raffleId: raffle.id,
      userId: user.id,
      startIndex: baseIndex,
      prices,
      clientSeed: parsed.data.clientSeed,
    })
    for (const t of tickets) store.tickets.set(t.id, t)

    raffle.ticketsSold += totalCount
    raffle.updatedAt = nowIso()
    store.raffles.set(raffle.id, raffle)

    recalculateVip(user)
    const effectiveCashbackPercent = Math.max(raffle.config.cashbackPercent, user.vipCashbackPercent ?? 20)
    const cashback = calculateCashback(totalPaid, { ...raffle.config, cashbackPercent: effectiveCashbackPercent })

    user.walletBalance -= totalPaid
    user.walletBalance += cashback
    user.chances += combo.bonusChances + totalCount * raffle.config.wheelChancePerTicket
    user.totalTicketsBought = (user.totalTicketsBought ?? 0) + totalCount
    user.totalSpendIrr = (user.totalSpendIrr ?? 0) + totalPaid
    if (combo.vipDays > 0) {
      const base = user.vipUntil ? new Date(user.vipUntil).getTime() : Date.now()
      user.vipUntil = new Date(Math.max(base, Date.now()) + combo.vipDays * 24 * 60 * 60 * 1000).toISOString()
      if ((user.vipLevelId ?? 1) < 3) {
        user.vipLevelId = 3
        user.vipLevelName = "طلایی"
        user.vipCashbackPercent = 30
      }
    }
    user.updatedAt = nowIso()
    recalculateVip(user)
    store.users.set(user.id, user)

    applyReferralCommissions(ctx, user.id, totalPaid, raffle.id)

    const purchaseTxId = id("wtx")
    store.walletTx.set(purchaseTxId, {
      id: purchaseTxId,
      userId: user.id,
      type: "ticket_purchase",
      amount: -totalPaid,
      status: "completed",
      createdAt: nowIso(),
      meta: { raffleId: raffle.id, package: combo.code, paidTickets: paidCount, bonusTickets: giftCount },
    })
    const cashbackTxId = id("wtx")
    store.walletTx.set(cashbackTxId, {
      id: cashbackTxId,
      userId: user.id,
      type: "cashback",
      amount: cashback,
      status: "completed",
      createdAt: nowIso(),
      meta: { raffleId: raffle.id, cashbackPercent: effectiveCashbackPercent, package: combo.code },
    })

    return {
      ok: true,
      package: combo,
      raffleId: raffle.id,
      ticketIds: tickets.map((t) => t.id),
      paidTickets: paidCount,
      bonusTickets: giftCount,
      totalTickets: totalCount,
      totalPaid,
      cashback,
      bonusChances: combo.bonusChances,
      balances: {
        walletBalance: user.walletBalance,
        chances: user.chances,
      },
      vip: {
        levelId: user.vipLevelId,
        levelName: user.vipLevelName,
        until: user.vipUntil,
      },
    }
  })

  app.get("/raffles/:raffleId/proof", async (request, reply) => {
    const params = request.params as { raffleId: string }
    const raffle = store.raffles.get(params.raffleId)
    if (!raffle) return reply.code(404).send({ error: "RAFFLE_NOT_FOUND" })
    if (!raffle.proof || !raffle.closedAt) return reply.code(404).send({ error: "PROOF_NOT_AVAILABLE" })

    const tickets = store.getTicketsByRaffle(raffle.id)
    const valid = verifyProof(raffle.proof, tickets, raffle.closedAt)

    return {
      proof: raffle.proof,
      verification: { valid },
      winners: raffle.proof.winnerTicketIndexes.map((winPos) => {
        const ticket = tickets[winPos]
        return {
          ticketId: ticket?.id,
          ticketIndex: ticket?.index,
          userId: ticket?.userId,
        }
      }),
    }
  })
}
