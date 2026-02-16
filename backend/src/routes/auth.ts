import argon2 from "argon2"
import { z } from "zod"
import type { RouteContext } from "../route-context.js"
import { hashToken, randomHex } from "../utils/crypto.js"
import { id } from "../utils/id.js"
import { nowIso } from "../utils/time.js"
import { pushAudit, pushLiveEvent } from "../services/events.js"
import { pushUserNotification } from "../services/notifications.js"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(128),
  referralCode: z.string().trim().min(4).max(32).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(32),
})

const logoutSchema = z.object({
  refreshToken: z.string().min(32),
})

function trackLoginAttempt(
  store: RouteContext["store"],
  payload: { email?: string; userId?: string; ip?: string; success: boolean; reason: string },
): void {
  const attemptId = id("lat")
  store.loginAttempts.set(attemptId, {
    id: attemptId,
    email: payload.email,
    userId: payload.userId,
    ip: payload.ip,
    success: payload.success,
    reason: payload.reason,
    createdAt: nowIso(),
  })
}

function trackDevice(
  store: RouteContext["store"],
  payload: { userId: string; ip?: string; userAgent?: string; deviceFingerprint?: string },
): void {
  const fingerprint = payload.deviceFingerprint?.trim()
    ? payload.deviceFingerprint.trim()
    : `ua:${(payload.userAgent ?? "unknown").slice(0, 120)}`

  const existing = Array.from(store.userDevices.values()).find((d) => d.userId === payload.userId && d.deviceFingerprint === fingerprint)
  if (existing) {
    existing.lastIp = payload.ip
    existing.userAgent = payload.userAgent
    existing.lastSeenAt = nowIso()
    store.userDevices.set(existing.id, existing)
    return
  }

  const deviceId = id("dev")
  store.userDevices.set(deviceId, {
    id: deviceId,
    userId: payload.userId,
    deviceFingerprint: fingerprint,
    firstIp: payload.ip,
    lastIp: payload.ip,
    userAgent: payload.userAgent,
    firstSeenAt: nowIso(),
    lastSeenAt: nowIso(),
  })
}

export async function registerAuthRoutes({ app, store }: RouteContext): Promise<void> {
  app.post("/auth/register", {
    config: { rateLimit: { max: 15, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const email = parsed.data.email.toLowerCase()
    if (store.usersByEmail.has(email)) return reply.code(409).send({ error: "EMAIL_EXISTS" })

    const referredBy = parsed.data.referralCode
      ? Array.from(store.users.values()).find((u) => u.referralCode === parsed.data.referralCode)?.id
      : undefined

    const timestamp = nowIso()
    const user = {
      id: id("usr"),
      email,
      passwordHash: await argon2.hash(parsed.data.password, { type: argon2.argon2id }),
      role: "user" as const,
      status: "active" as const,
      walletBalance: 0,
      goldSotBalance: 0,
      chances: referredBy ? 1 : 0,
      vipLevelId: 1,
      vipLevelName: "برنزی",
      vipCashbackPercent: 20,
      totalTicketsBought: 0,
      totalSpendIrr: 0,
      activeReferrals: 0,
      loanLockedBalance: 0,
      referralCode: `REF-${randomHex(4).toUpperCase()}`,
      referredBy,
      profile: { fullName: "" },
      notificationPrefs: { email: true, sms: false, push: true },
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    store.users.set(user.id, user)
    store.usersByEmail.set(email, user.id)
    if (referredBy) {
      const parent = store.users.get(referredBy)
      if (parent) {
        parent.activeReferrals = (parent.activeReferrals ?? 0) + 1
        parent.updatedAt = nowIso()
        store.users.set(parent.id, parent)
      }
    }

    trackLoginAttempt(store, {
      email: user.email,
      userId: user.id,
      ip: request.ip,
      success: true,
      reason: "REGISTER",
    })

    pushAudit(store, request, {
      action: "AUTH_REGISTER",
      target: `user:${user.id}`,
      success: true,
      payload: { email: user.email, referredBy: Boolean(referredBy) },
    })
    pushUserNotification(store, {
      userId: user.id,
      title: "ثبت نام با موفقیت انجام شد",
      body: "حساب کاربری شما فعال شد.",
      kind: "success",
    })

    return reply.code(201).send({
      user: { id: user.id, email: user.email, role: user.role, referralCode: user.referralCode },
    })
  })

  app.post("/auth/login", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const email = parsed.data.email.toLowerCase()
    const userId = store.usersByEmail.get(email)
    if (!userId) {
      trackLoginAttempt(store, { email, ip: request.ip, success: false, reason: "USER_NOT_FOUND" })
      pushAudit(store, request, {
        action: "AUTH_LOGIN",
        target: `email:${email}`,
        success: false,
        message: "User not found",
      })
      return reply.code(401).send({ error: "INVALID_CREDENTIALS" })
    }

    const user = store.users.get(userId)!
    if (user.status === "suspended") {
      trackLoginAttempt(store, { email, userId: user.id, ip: request.ip, success: false, reason: "ACCOUNT_SUSPENDED" })
      pushAudit(store, request, {
        action: "AUTH_LOGIN",
        target: `user:${user.id}`,
        success: false,
        message: "Suspended account",
      })
      return reply.code(403).send({ error: "ACCOUNT_SUSPENDED" })
    }

    const valid = await argon2.verify(user.passwordHash, parsed.data.password)
    if (!valid) {
      trackLoginAttempt(store, { email, userId: user.id, ip: request.ip, success: false, reason: "INVALID_PASSWORD" })
      pushAudit(store, request, {
        action: "AUTH_LOGIN",
        target: `user:${user.id}`,
        success: false,
        message: "Invalid password",
      })
      pushLiveEvent(store, {
        type: "security.alert",
        level: "warning",
        message: `Login failed for ${user.email}`,
      })
      return reply.code(401).send({ error: "INVALID_CREDENTIALS" })
    }

    const accessToken = await reply.jwtSign({ sub: user.id, role: user.role, email: user.email })

    const refreshToken = randomHex(48)
    const session = {
      id: id("ses"),
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      createdAt: nowIso(),
    }
    store.refreshSessions.set(session.id, session)

    trackLoginAttempt(store, { email, userId: user.id, ip: request.ip, success: true, reason: "LOGIN_SUCCESS" })
    trackDevice(store, {
      userId: user.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"]?.toString(),
      deviceFingerprint: request.headers["x-device-fingerprint"]?.toString(),
    })

    pushAudit(store, request, { action: "AUTH_LOGIN", target: `user:${user.id}`, success: true })
    pushUserNotification(store, {
      userId: user.id,
      title: "ورود موفق",
      body: "ورود جدید به حساب شما ثبت شد.",
      kind: "info",
    })
    pushLiveEvent(store, {
      type: "auth.login",
      level: "success",
      message: `Successful login ${user.email}`,
      data: { userId: user.id },
    })

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    }
  })

  app.post("/auth/refresh", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const tokenHash = hashToken(parsed.data.refreshToken)
    const session = Array.from(store.refreshSessions.values()).find(
      (s) => s.tokenHash === tokenHash && !s.revokedAt && s.expiresAt > nowIso(),
    )
    if (!session) return reply.code(401).send({ error: "INVALID_REFRESH_TOKEN" })

    const user = store.users.get(session.userId)
    if (!user) return reply.code(401).send({ error: "INVALID_REFRESH_TOKEN" })

    const accessToken = await reply.jwtSign({ sub: user.id, role: user.role, email: user.email })

    const newRefreshToken = randomHex(48)
    session.revokedAt = nowIso()
    store.refreshSessions.set(session.id, session)

    const newSession = {
      id: id("ses"),
      userId: user.id,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      createdAt: nowIso(),
    }
    store.refreshSessions.set(newSession.id, newSession)

    return { accessToken, refreshToken: newRefreshToken }
  })

  app.post("/auth/logout", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = logoutSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const tokenHash = hashToken(parsed.data.refreshToken)
    const session = Array.from(store.refreshSessions.values()).find(
      (s) => s.tokenHash === tokenHash && s.userId === request.user.sub && !s.revokedAt,
    )
    if (session) {
      session.revokedAt = nowIso()
      store.refreshSessions.set(session.id, session)
    }
    return reply.code(204).send()
  })
}
