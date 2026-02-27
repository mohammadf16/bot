import { z } from "zod"
import type { RouteContext } from "../route-context.js"
import { pushAudit, pushLiveEvent } from "../services/events.js"
import { createCardToCardPayment, getCardToCardDestinationCard } from "../services/card-to-card-payments.js"
import { pushUserNotification } from "../services/notifications.js"
import { id } from "../utils/id.js"
import { nowIso } from "../utils/time.js"
import { buildLoanPlan, normalizeLoanConfig } from "../services/loan-config.js"
import type { LoanInstallment } from "../types.js"

const GOLD_SELL_RATE_IRR = 3_200_000
const MICRO_TO_CHANCE_THRESHOLD_IRR = 50_000
const MICRO_TO_CHANCE_RATE_IRR = 10_000
const WITHDRAW_2FA_THRESHOLD_IRR = 100_000_000

const depositSchema = z.object({
  amount: z.number().int().positive().max(5_000_000_000),
})

const cardToCardDepositSchema = z.object({
  amount: z.number().int().positive().max(5_000_000_000),
  fromCardLast4: z.string().trim().regex(/^\d{4}$/),
  trackingCode: z.string().trim().min(4).max(64),
  receiptImageUrl: z.string().trim().url().max(2048),
})

const withdrawSchema = z.object({
  amount: z.number().int().positive().max(5_000_000_000),
  iban: z.string().min(10).max(34),
  challengeId: z.string().trim().min(3).optional(),
  twoFactorCode: z.string().trim().min(4).max(10).optional(),
})

const convertGoldSchema = z.object({
  goldSot: z.number().positive().max(1_000_000),
})

const microToChanceSchema = z.object({
  thresholdIrr: z.number().int().positive().max(5_000_000).optional(),
  irrPerChance: z.number().int().positive().max(1_000_000).optional(),
})

const loanRequestSchema = z.object({
  amount: z.number().int().positive(),
})

function idempotencyKey(req: { headers: Record<string, unknown> }): string | undefined {
  const value = req.headers["idempotency-key"]
  if (typeof value !== "string") return undefined
  return value.trim() || undefined
}

function ensureUserAssets(user: {
  goldSotBalance?: number
  vipLevelId?: number
  vipLevelName?: string
  vipCashbackPercent?: number
  loanLockedBalance?: number
}): void {
  if (user.goldSotBalance === undefined) user.goldSotBalance = 0
  if (user.vipLevelId === undefined) user.vipLevelId = 1
  if (!user.vipLevelName) user.vipLevelName = "برنزی"
  if (user.vipCashbackPercent === undefined) user.vipCashbackPercent = 20
  if (user.loanLockedBalance === undefined) user.loanLockedBalance = 0
}

function plusMonthsIso(baseIso: string, months: number): string {
  const base = new Date(baseIso)
  const next = new Date(base.getTime())
  next.setUTCMonth(next.getUTCMonth() + months)
  return next.toISOString()
}

function buildLoanInstallments(args: {
  principalIrr: number
  totalRepayableIrr: number
  installmentCount: number
  baseDateIso: string
}): LoanInstallment[] {
  const count = Math.max(1, Math.trunc(args.installmentCount))
  const principalTotal = Math.max(0, Math.trunc(args.principalIrr))
  const repayableTotal = Math.max(0, Math.trunc(args.totalRepayableIrr))
  const basePrincipalPart = Math.floor(principalTotal / count)
  const principalRemainder = principalTotal - basePrincipalPart * count
  const baseAmountPart = Math.floor(repayableTotal / count)
  const amountRemainder = repayableTotal - baseAmountPart * count
  const out: LoanInstallment[] = []
  for (let i = 0; i < count; i += 1) {
    const principalIrr = basePrincipalPart + (i < principalRemainder ? 1 : 0)
    const amountIrr = baseAmountPart + (i < amountRemainder ? 1 : 0)
    out.push({
      installmentNumber: i + 1,
      dueAt: plusMonthsIso(args.baseDateIso, i + 1),
      amountIrr,
      principalIrr,
      interestIrr: Math.max(0, amountIrr - principalIrr),
      paidAmountIrr: 0,
      paidPrincipalIrr: 0,
      status: "pending",
    })
  }
  return out
}

export async function registerWalletRoutes({ app, store }: RouteContext): Promise<void> {
  app.get("/wallet", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    ensureUserAssets(user)

    return {
      balance: user.walletBalance,
      chances: user.chances,
      assets: {
        irr: user.walletBalance,
        goldSot: user.goldSotBalance,
        chance: user.chances,
      },
      vip: {
        id: user.vipLevelId,
        name: user.vipLevelName,
        cashbackPercent: user.vipCashbackPercent,
      },
      loan: {
        lockedBalance: user.loanLockedBalance,
        ...normalizeLoanConfig(store.loanConfig),
      },
      rates: {
        goldSellRateIrr: GOLD_SELL_RATE_IRR,
        microToChanceThresholdIrr: MICRO_TO_CHANCE_THRESHOLD_IRR,
        microToChanceRateIrr: MICRO_TO_CHANCE_RATE_IRR,
      },
      cardToCard: {
        destinationCard: getCardToCardDestinationCard(store),
      },
      transactions: store.getWalletTxByUser(user.id).slice(0, 100),
    }
  })

  app.get("/wallet/rates", { preHandler: [app.authenticate] }, async () => {
    return {
      goldSellRateIrr: GOLD_SELL_RATE_IRR,
      microToChanceThresholdIrr: MICRO_TO_CHANCE_THRESHOLD_IRR,
      microToChanceRateIrr: MICRO_TO_CHANCE_RATE_IRR,
      withdraw2faThresholdIrr: WITHDRAW_2FA_THRESHOLD_IRR,
    }
  })

  app.get("/wallet/card-to-card/requests", { preHandler: [app.authenticate] }, async (request) => {
    return {
      destinationCard: getCardToCardDestinationCard(store),
      items: store.getCardToCardPaymentsByUser(request.user.sub),
    }
  })

  app.post("/wallet/deposit", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = depositSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    ensureUserAssets(user)

    const key = idempotencyKey(request)
    if (key) {
      const dedupe = store.idempotency.get(`${user.id}:deposit:${key}`)
      if (dedupe) return dedupe
    }

    const tx = {
      id: id("wtx"),
      userId: user.id,
      type: "deposit" as const,
      amount: parsed.data.amount,
      status: "completed" as const,
      idempotencyKey: key,
      createdAt: nowIso(),
      meta: { source: "payment_gateway_mock" },
    }
    user.walletBalance += parsed.data.amount
    user.updatedAt = nowIso()

    store.users.set(user.id, user)
    store.walletTx.set(tx.id, tx)

    const result = {
      ok: true,
      txId: tx.id,
      balance: user.walletBalance,
    }
    if (key) store.idempotency.set(`${user.id}:deposit:${key}`, result)

    pushAudit(store, request, {
      action: "WALLET_DEPOSIT",
      target: `user:${user.id}`,
      success: true,
      payload: { amount: tx.amount, txId: tx.id },
    })
    pushLiveEvent(store, {
      type: "wallet.deposit",
      level: "success",
      message: `Wallet charged for ${user.email}`,
      data: { amount: tx.amount },
    })
    pushUserNotification(store, {
      userId: user.id,
      title: "شارژ کیف پول انجام شد",
      body: `${tx.amount.toLocaleString("fa-IR")} تومان به کیف پول اضافه شد.`,
      kind: "success",
    })

    return result
  })

  app.post("/wallet/deposit/card-to-card", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = cardToCardDepositSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    ensureUserAssets(user)

    const key = idempotencyKey(request)
    if (key) {
      const dedupe = store.idempotency.get(`${user.id}:deposit-card-to-card:${key}`)
      if (dedupe) return dedupe
    }

    const payment = createCardToCardPayment(store, {
      userId: user.id,
      userEmail: user.email,
      amount: parsed.data.amount,
      purpose: "wallet_deposit",
      fromCardLast4: parsed.data.fromCardLast4,
      trackingCode: parsed.data.trackingCode,
      receiptImageUrl: parsed.data.receiptImageUrl,
    })

    const tx = {
      id: id("wtx"),
      userId: user.id,
      type: "deposit" as const,
      amount: parsed.data.amount,
      status: "pending" as const,
      idempotencyKey: key,
      createdAt: nowIso(),
      meta: {
        source: "card_to_card",
        paymentId: payment.id,
        trackingCode: parsed.data.trackingCode,
        fromCardLast4: parsed.data.fromCardLast4,
      },
    }
    store.walletTx.set(tx.id, tx)

    const result = {
      ok: true,
      paymentId: payment.id,
      txId: tx.id,
      status: payment.status,
      destinationCard: getCardToCardDestinationCard(store),
    }
    if (key) store.idempotency.set(`${user.id}:deposit-card-to-card:${key}`, result)

    pushAudit(store, request, {
      action: "WALLET_DEPOSIT_CARD_TO_CARD_REQUEST",
      target: `payment:${payment.id}`,
      success: true,
      payload: { amount: payment.amount, userId: payment.userId },
    })
    pushUserNotification(store, {
      userId: user.id,
      title: "درخواست کارت به کارت ثبت شد",
      body: "رسید شما ثبت شد و پس از تایید ادمین، کیف پول شارژ می‌شود.",
      kind: "info",
    })

    return result
  })

  app.post("/wallet/convert/gold-to-cash", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = convertGoldSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    ensureUserAssets(user)

    if ((user.goldSotBalance ?? 0) < parsed.data.goldSot) {
      return reply.code(400).send({ error: "INSUFFICIENT_GOLD" })
    }

    const irr = Math.floor(parsed.data.goldSot * GOLD_SELL_RATE_IRR)
    user.goldSotBalance = (user.goldSotBalance ?? 0) - parsed.data.goldSot
    user.walletBalance += irr
    user.updatedAt = nowIso()
    store.users.set(user.id, user)

    const tx = {
      id: id("wtx"),
      userId: user.id,
      type: "asset_convert" as const,
      amount: irr,
      status: "completed" as const,
      createdAt: nowIso(),
      meta: {
        fromAsset: "GOLD_SOT",
        fromAmount: parsed.data.goldSot,
        toAsset: "IRR",
        rate: GOLD_SELL_RATE_IRR,
      },
    }
    store.walletTx.set(tx.id, tx)

    return {
      ok: true,
      convertedGoldSot: parsed.data.goldSot,
      receivedIrr: irr,
      assets: {
        irr: user.walletBalance,
        goldSot: user.goldSotBalance,
        chance: user.chances,
      },
    }
  })

  app.post("/wallet/convert/micro-to-chance", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = microToChanceSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })

    const threshold = parsed.data.thresholdIrr ?? MICRO_TO_CHANCE_THRESHOLD_IRR
    const irrPerChance = parsed.data.irrPerChance ?? MICRO_TO_CHANCE_RATE_IRR

    if (user.walletBalance <= 0 || user.walletBalance >= threshold) {
      return reply.code(400).send({ error: "MICRO_BALANCE_NOT_ELIGIBLE", thresholdIrr: threshold, currentIrr: user.walletBalance })
    }

    const chanceGain = Math.max(1, Math.floor(user.walletBalance / irrPerChance))
    const consumedIrr = user.walletBalance
    user.walletBalance = 0
    user.chances += chanceGain
    user.updatedAt = nowIso()
    store.users.set(user.id, user)

    const tx = {
      id: id("wtx"),
      userId: user.id,
      type: "asset_convert" as const,
      amount: -consumedIrr,
      status: "completed" as const,
      createdAt: nowIso(),
      meta: {
        fromAsset: "IRR",
        toAsset: "CHANCE",
        fromAmount: consumedIrr,
        chanceGain,
        irrPerChance,
      },
    }
    store.walletTx.set(tx.id, tx)

    return {
      ok: true,
      convertedIrr: consumedIrr,
      chanceGain,
      assets: {
        irr: user.walletBalance,
        goldSot: user.goldSotBalance ?? 0,
        chance: user.chances,
      },
    }
  })

  app.post("/wallet/loan/request", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = loanRequestSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    ensureUserAssets(user)
    const loanConfig = normalizeLoanConfig(store.loanConfig)
    store.loanConfig = loanConfig
    if (!loanConfig.enabled) return reply.code(403).send({ error: "LOAN_DISABLED" })
    if ((user.vipLevelId ?? 1) < loanConfig.requiredVipLevelId) {
      return reply.code(403).send({ error: "VIP_LEVEL_REQUIRED", requiredLevel: loanConfig.requiredVipLevelId })
    }
    if (parsed.data.amount < loanConfig.minLoanIrr || parsed.data.amount > loanConfig.maxLoanIrr) {
      return reply.code(400).send({ error: "LOAN_AMOUNT_OUT_OF_RANGE", minLoanIrr: loanConfig.minLoanIrr, maxLoanIrr: loanConfig.maxLoanIrr })
    }

    const amount = parsed.data.amount
    const now = nowIso()
    const plan = buildLoanPlan(loanConfig, amount, loanConfig.defaultInstallments)

    const loan = {
      id: id("loan"),
      userId: user.id,
      principalIrr: amount,
      outstandingIrr: plan.totalRepayableIrr,
      installmentCount: plan.installmentCount,
      monthlyInstallmentIrr: plan.monthlyInstallmentIrr,
      interestRateMonthlyPercent: plan.interestRateMonthlyPercent,
      totalRepayableIrr: plan.totalRepayableIrr,
      repaidIrr: 0,
      paidInstallmentsCount: 0,
      overdueInstallmentsCount: 0,
      nextInstallmentNumber: 1,
      nextDueAt: plusMonthsIso(now, 1),
      purpose: "cash_credit" as const,
      status: "active" as const,
      restrictedUsage: true,
      createdAt: now,
      updatedAt: now,
      dueAt: plusMonthsIso(now, plan.installmentCount),
      installments: buildLoanInstallments({
        principalIrr: amount,
        totalRepayableIrr: plan.totalRepayableIrr,
        installmentCount: plan.installmentCount,
        baseDateIso: now,
      }),
    }

    user.walletBalance += amount
    user.loanLockedBalance = (user.loanLockedBalance ?? 0) + amount
    user.updatedAt = now
    store.users.set(user.id, user)
    store.autoLoans.set(loan.id, loan)

    const tx = {
      id: id("wtx"),
      userId: user.id,
      type: "loan_credit" as const,
      amount,
      status: "completed" as const,
      createdAt: now,
      meta: { min: loanConfig.minLoanIrr, max: loanConfig.maxLoanIrr, restricted: true, loanId: loan.id },
    }
    store.walletTx.set(tx.id, tx)

    return {
      ok: true,
      amount,
      loan,
      config: loanConfig,
      loanLockedBalance: user.loanLockedBalance,
      walletBalance: user.walletBalance,
    }
  })

  app.post("/wallet/withdraw", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = withdrawSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    ensureUserAssets(user)

    const availableForWithdraw = user.walletBalance - (user.loanLockedBalance ?? 0)
    if (availableForWithdraw < parsed.data.amount) {
      return reply.code(400).send({ error: "INSUFFICIENT_WITHDRAWABLE_BALANCE", availableForWithdraw })
    }

    if (parsed.data.amount >= WITHDRAW_2FA_THRESHOLD_IRR) {
      if (!parsed.data.twoFactorCode || !parsed.data.challengeId) {
        return reply.code(400).send({ error: "TWO_FACTOR_REQUIRED" })
      }
      const challenge = store.twoFactorChallenges.get(parsed.data.challengeId)
      if (!challenge || challenge.userId !== user.id) return reply.code(400).send({ error: "INVALID_2FA_CHALLENGE" })
      if (challenge.expiresAt < nowIso()) return reply.code(400).send({ error: "TWO_FACTOR_EXPIRED" })
      if (challenge.code !== parsed.data.twoFactorCode) return reply.code(400).send({ error: "TWO_FACTOR_INVALID_CODE" })
      challenge.status = "verified"
      challenge.verifiedAt = nowIso()
      store.twoFactorChallenges.set(challenge.id, challenge)
    }

    const key = idempotencyKey(request)
    if (key) {
      const dedupe = store.idempotency.get(`${user.id}:withdraw:${key}`)
      if (dedupe) return dedupe
    }

    user.walletBalance -= parsed.data.amount
    user.updatedAt = nowIso()
    store.users.set(user.id, user)

    const tx = {
      id: id("wtx"),
      userId: user.id,
      type: "withdraw_request" as const,
      amount: parsed.data.amount,
      status: "pending" as const,
      idempotencyKey: key,
      createdAt: nowIso(),
      meta: { iban: parsed.data.iban, has2fa: Boolean(parsed.data.twoFactorCode) },
    }
    store.walletTx.set(tx.id, tx)

    const result = {
      ok: true,
      txId: tx.id,
      status: "pending",
      balance: user.walletBalance,
    }
    if (key) store.idempotency.set(`${user.id}:withdraw:${key}`, result)

    pushAudit(store, request, {
      action: "WALLET_WITHDRAW_REQUEST",
      target: `user:${user.id}`,
      success: true,
      payload: { amount: tx.amount, txId: tx.id },
    })
    pushLiveEvent(store, {
      type: "wallet.withdraw",
      level: "info",
      message: `Withdraw request by ${user.email}`,
      data: { amount: tx.amount },
    })
    pushUserNotification(store, {
      userId: user.id,
      title: "درخواست برداشت ثبت شد",
      body: `درخواست برداشت ${tx.amount.toLocaleString("fa-IR")} تومان در انتظار بررسی است.`,
      kind: "info",
    })

    return result
  })
}
