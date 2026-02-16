import type { RouteContext } from "../route-context.js"
import { z } from "zod"
import { pushAudit } from "../services/events.js"

const profileSchema = z.object({
  fullName: z.string().trim().max(120).optional(),
  username: z.string().trim().min(3).max(32).optional(),
  phone: z.string().trim().max(24).optional(),
  city: z.string().trim().max(64).optional(),
  address: z.string().trim().max(255).optional(),
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  notificationPrefs: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
  }).optional(),
})

export async function registerUserRoutes({ app, store }: RouteContext): Promise<void> {
  app.get("/rules", async () => {
    return { rules: store.rulesText }
  })

  app.get("/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status ?? "active",
      walletBalance: user.walletBalance,
      goldSotBalance: user.goldSotBalance ?? 0,
      chances: user.chances,
      vipLevelId: user.vipLevelId ?? 1,
      vipLevelName: user.vipLevelName ?? "برنزی",
      vipCashbackPercent: user.vipCashbackPercent ?? 20,
      totalTicketsBought: user.totalTicketsBought ?? 0,
      totalSpendIrr: user.totalSpendIrr ?? 0,
      activeReferrals: user.activeReferrals ?? 0,
      loanLockedBalance: user.loanLockedBalance ?? 0,
      referralCode: user.referralCode,
      profile: user.profile ?? {},
      notificationPrefs: user.notificationPrefs ?? { email: true, sms: false, push: true },
      createdAt: user.createdAt,
    }
  })

  app.get("/me/profile", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    return {
      email: user.email,
      role: user.role,
      profile: user.profile ?? {},
      notificationPrefs: user.notificationPrefs ?? { email: true, sms: false, push: true },
      createdAt: user.createdAt,
    }
  })

  app.patch("/me/profile", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = profileSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })

    user.profile = {
      ...(user.profile ?? {}),
      ...(parsed.data.fullName !== undefined ? { fullName: parsed.data.fullName } : {}),
      ...(parsed.data.username !== undefined ? { username: parsed.data.username } : {}),
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
      ...(parsed.data.city !== undefined ? { city: parsed.data.city } : {}),
      ...(parsed.data.address !== undefined ? { address: parsed.data.address } : {}),
      ...(parsed.data.bio !== undefined ? { bio: parsed.data.bio } : {}),
      ...(parsed.data.avatarUrl !== undefined ? { avatarUrl: parsed.data.avatarUrl } : {}),
    }
    if (parsed.data.notificationPrefs) {
      user.notificationPrefs = parsed.data.notificationPrefs
    }
    user.updatedAt = new Date().toISOString()
    store.users.set(user.id, user)
    pushAudit(store, request, {
      action: "USER_PROFILE_UPDATE",
      target: `user:${user.id}`,
      success: true,
      payload: {
        hasProfile: Boolean(user.profile),
        hasPrefs: Boolean(user.notificationPrefs),
      },
    })

    return {
      ok: true,
      profile: user.profile,
      notificationPrefs: user.notificationPrefs ?? { email: true, sms: false, push: true },
    }
  })

  app.get("/me/tickets", { preHandler: [app.authenticate] }, async (request) => {
    const user = store.users.get(request.user.sub)
    if (!user) return { items: [] }

    const items = Array.from(store.tickets.values())
      .filter((t) => t.userId === user.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((t) => {
        const raffle = store.raffles.get(t.raffleId)
        return {
          id: t.id,
          raffleId: t.raffleId,
          raffleTitle: raffle?.title ?? "قرعه کشی",
          index: t.index,
          pricePaid: t.pricePaid,
          raffleStatus: raffle?.status ?? "draft",
          createdAt: t.createdAt,
        }
      })

    return { items }
  })

  app.get("/me/history", { preHandler: [app.authenticate] }, async (request) => {
    const user = store.users.get(request.user.sub)
    if (!user) return { items: [] }
    return { items: store.getWalletTxByUser(user.id) }
  })

  app.get("/me/activity", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })

    const walletActivities = store.getWalletTxByUser(user.id).slice(0, 200).map((tx) => ({
      id: tx.id,
      source: "wallet" as const,
      type: tx.type,
      title: tx.type === "ticket_purchase"
        ? "خرید بلیط"
        : tx.type === "deposit"
          ? "شارژ کیف پول"
          : tx.type === "withdraw_request"
            ? "درخواست برداشت"
            : tx.type === "cashback"
              ? "کش بک"
              : "تغییر موجودی",
      amount: tx.amount,
      createdAt: tx.createdAt,
    }))

    const auditActivities = store.auditLogs
      .filter((log) => log.actorUserId === user.id || log.target.includes(user.id))
      .slice(0, 300)
      .map((log) => ({
        id: log.id,
        source: "audit" as const,
        type: log.action,
        title: log.message ?? log.action,
        createdAt: log.createdAt,
      }))

    const notificationActivities = store.getNotificationsByUser(user.id).slice(0, 200).map((n) => ({
      id: n.id,
      source: "notification" as const,
      type: n.kind,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt,
    }))

    const items = [...walletActivities, ...auditActivities, ...notificationActivities]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 150)

    return { items }
  })

  app.get("/me/referral", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })

    const level1 = Array.from(store.users.values()).filter((u) => u.referredBy === user.id)
    const level1Ids = new Set(level1.map((u) => u.id))
    const level2 = Array.from(store.users.values()).filter((u) => u.referredBy && level1Ids.has(u.referredBy))
    const level2Ids = new Set(level2.map((u) => u.id))
    const level3 = Array.from(store.users.values()).filter((u) => u.referredBy && level2Ids.has(u.referredBy))
    const referralTx = store.getWalletTxByUser(user.id).filter((tx) => tx.type === "referral_commission")
    const referralTree = [
      ...level1.map((u) => ({ userId: u.id, email: u.email, depth: 1 })),
      ...level2.map((u) => ({ userId: u.id, email: u.email, depth: 2 })),
      ...level3.map((u) => ({ userId: u.id, email: u.email, depth: 3 })),
    ]
    return {
      referralCode: user.referralCode,
      totalReferrals: referralTree.length,
      activeReferrals: referralTree.length,
      depthBreakdown: {
        level1: level1.length,
        level2: level2.length,
        level3: level3.length,
      },
      chancesFromReferrals: user.chances,
      cashbackFromReferrals: referralTx.reduce((sum, tx) => sum + Math.max(0, tx.amount), 0),
      referralTree,
    }
  })

  app.get("/me/notifications", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    const items = store.getNotificationsByUser(user.id).slice(0, 100)
    const unreadCount = items.filter((i) => !i.readAt).length
    return { items, unreadCount }
  })

  app.post("/me/notifications/:notificationId/read", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    const params = request.params as { notificationId: string }
    const item = store.notifications.get(params.notificationId)
    if (!item || item.userId !== user.id) return reply.code(404).send({ error: "NOTIFICATION_NOT_FOUND" })
    item.readAt = new Date().toISOString()
    store.notifications.set(item.id, item)
    pushAudit(store, request, {
      action: "USER_NOTIFICATION_READ",
      target: `notification:${item.id}`,
      success: true,
    })
    return { ok: true }
  })

  app.post("/me/notifications/read-all", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    const items = store.getNotificationsByUser(user.id)
    const now = new Date().toISOString()
    for (const item of items) {
      if (!item.readAt) {
        item.readAt = now
        store.notifications.set(item.id, item)
      }
    }
    pushAudit(store, request, {
      action: "USER_NOTIFICATION_READ_ALL",
      target: `user:${user.id}`,
      success: true,
      payload: { count: items.length },
    })
    return { ok: true }
  })
}
