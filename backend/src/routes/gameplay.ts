import { z } from "zod"
import type { RouteContext } from "../route-context.js"
import { id } from "../utils/id.js"
import { nowIso } from "../utils/time.js"
import { pushAudit, pushLiveEvent } from "../services/events.js"
import { pushUserNotification } from "../services/notifications.js"
import { env } from "../env.js"
import { finalizeSlideDraw } from "../services/slide-draw.js"
import { normalizeWheelConfig, toLegacyCompatibleWheelConfig } from "../services/wheel-config.js"

const spinSchema = z.object({
  forceLabel: z.string().optional(),
  tier: z.enum(["normal", "gold", "jackpot"]).optional(),
})

const bidSchema = z.object({
  amount: z.number().int().positive(),
})

const createAuctionSchema = z.object({
  title: z.string().min(3).max(180),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  startPrice: z.number().int().positive(),
  endAt: z.string().datetime(),
})

const updateAuctionSchema = createAuctionSchema.partial().extend({
  status: z.enum(["draft", "open", "closed", "cancelled"]).optional(),
})

const slideEntrySchema = z.object({
  chancesToUse: z.number().int().min(1).max(10_000),
})

const singleSpinSchema = z.object({
  stakeType: z.enum(["chance", "irr"]).default("chance"),
})

const battleJoinSchema = z.object({
  roomId: z.string().optional(),
  entryAsset: z.enum(["CHANCE", "IRR"]).optional(),
  entryAmount: z.number().int().positive().optional(),
  maxPlayers: z.number().int().min(2).max(20).optional(),
})

function parsePersianOrLatinInt(raw: string): number {
  const normalized = raw
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
  const digits = normalized.replace(/[^\d]/g, "")
  return Number(digits || "0")
}

function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  const r = Math.random() * total
  let acc = 0
  for (const item of items) {
    acc += item.weight
    if (r <= acc) return item
  }
  return items[items.length - 1]!
}

function createUniqueEntryNumbers(existing: Set<number>, count: number): number[] {
  const out: number[] = []
  while (out.length < count) {
    const n = 100_000 + Math.floor(Math.random() * 900_000)
    if (existing.has(n)) continue
    existing.add(n)
    out.push(n)
  }
  return out
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function registerGameplayRoutes({ app, store }: RouteContext): Promise<void> {
  app.get("/slide/draw/current", async () => {
    const now = nowIso()
    const dueDraw = store.getSlideDraws().find((d) => d.status === "scheduled" && d.scheduledAt <= now)
    if (dueDraw) {
      finalizeSlideDraw(store, dueDraw.id, env.SEED_ENCRYPTION_KEY, now)
    }

    const current = store.getSlideDraws().find((d) => d.status === "scheduled") ?? store.getSlideDraws().find((d) => d.status === "drawn")
    if (!current) return { draw: null }

    const participants = current.participants.length
      ? current.participants
      : Array.from(
        Array.from(current.entries ?? [])
          .reduce((map, entry) => {
            map.set(entry.userId, (map.get(entry.userId) ?? 0) + 1)
            return map
          }, new Map<string, number>())
          .entries()
      ).map(([userId, chances]) => ({ userId, chances }))

    const participantDetails = participants
      .map((p) => {
        const user = store.users.get(p.userId)
        return {
          userId: p.userId,
          email: user?.email ?? "unknown",
          fullName: user?.profile?.fullName ?? "",
          chances: p.chances,
        }
      })
      .sort((a, b) => b.chances - a.chances)

    const winnerDetails = current.winners.map((w) => {
      const user = store.users.get(w.userId)
      return {
        rank: w.rank,
        userId: w.userId,
        winningNumber: w.winningNumber,
        email: user?.email ?? "unknown",
        fullName: user?.profile?.fullName ?? "",
        chancesAtDraw: w.chancesAtDraw,
        prize: w.prize,
      }
    })

    return {
      draw: {
        id: current.id,
        title: current.title,
        status: current.status,
        scheduledAt: current.scheduledAt,
        seedCommitHash: current.seedCommitHash,
        targetNumber: current.targetNumber,
        prizes: current.prizes,
        proof: current.proof,
        totalEntries: (current.entries ?? []).length,
        participants: participantDetails,
        winningLogs: winnerDetails.map((w) => ({
          rank: w.rank,
          winningNumber: w.winningNumber,
          prize: w.prize,
          userId: w.userId,
          fullName: w.fullName,
        })),
        winners: winnerDetails,
      },
    }
  })

  app.get("/slide/draw/current/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const current = store.getSlideDraws().find((d) => d.status === "scheduled") ?? store.getSlideDraws().find((d) => d.status === "drawn")
    if (!current) return reply.code(404).send({ error: "DRAW_NOT_FOUND" })
    const myEntries = (current.entries ?? [])
      .filter((entry) => entry.userId === request.user.sub)
      .sort((a, b) => a.entryNumber - b.entryNumber)
    const user = store.users.get(request.user.sub)
    return {
      drawId: current.id,
      status: current.status,
      myEntryNumbers: myEntries.map((e) => e.entryNumber),
      myEntriesCount: myEntries.length,
      availableChances: user?.chances ?? 0,
    }
  })

  app.post("/slide/draw/:drawId/entries", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = request.params as { drawId: string }
    const parsed = slideEntrySchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const draw = store.slideDraws.get(params.drawId)
    if (!draw) return reply.code(404).send({ error: "DRAW_NOT_FOUND" })
    if (draw.status !== "scheduled") return reply.code(400).send({ error: "DRAW_NOT_OPEN" })
    if (draw.scheduledAt <= nowIso()) return reply.code(400).send({ error: "DRAW_ALREADY_STARTED" })

    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })
    if ((user.status ?? "active") !== "active") return reply.code(403).send({ error: "USER_NOT_ACTIVE" })

    const chancesToUse = parsed.data.chancesToUse
    if (user.chances < chancesToUse) return reply.code(400).send({ error: "NOT_ENOUGH_CHANCES", availableChances: user.chances })

    const existingNumbers = new Set<number>((draw.entries ?? []).map((entry) => entry.entryNumber))
    const assignedNumbers = createUniqueEntryNumbers(existingNumbers, chancesToUse)
    const createdAt = nowIso()
    const newEntries = assignedNumbers.map((entryNumber) => ({
      entryNumber,
      userId: user.id,
      createdAt,
    }))
    draw.entries = [...(draw.entries ?? []), ...newEntries]
    draw.updatedAt = createdAt
    store.slideDraws.set(draw.id, draw)

    user.chances -= chancesToUse
    user.updatedAt = createdAt
    store.users.set(user.id, user)

    return {
      drawId: draw.id,
      assignedNumbers,
      chancesUsed: chancesToUse,
      availableChances: user.chances,
      myEntriesCount: (draw.entries ?? []).filter((entry) => entry.userId === user.id).length,
    }
  })

  app.get("/wheel/config", async () => {
    store.wheelConfig = normalizeWheelConfig(store.wheelConfig)
    const totalSpins = store.wheelSpins.size
    const jackpotActive = totalSpins >= 1000 && Math.random() < 0.25
    const normalTier = store.wheelConfig.tiers.normal
    const goldTier = store.wheelConfig.tiers.gold
    const jackpotTier = store.wheelConfig.tiers.jackpot
    return {
      config: toLegacyCompatibleWheelConfig(store.wheelConfig),
      tiers: {
        normal: {
          enabled: true,
          costAsset: normalTier.costAsset,
          costAmount: normalTier.costAmount,
          segments: normalTier.segments,
        },
        gold: {
          enabled: true,
          costAsset: goldTier.costAsset,
          costAmount: goldTier.costAmount,
          vipOrPay: true,
          segments: goldTier.segments,
        },
        jackpot: {
          enabled: jackpotActive,
          costAsset: jackpotTier.costAsset,
          costAmount: jackpotTier.costAmount,
          unlockRule: "random_after_1000_global_spins",
          segments: jackpotTier.segments,
        },
      },
      totalSpins,
      jackpotActive,
    }
  })

  app.get("/wheel/history", { preHandler: [app.authenticate] }, async (request) => {
    return { items: store.getWheelHistoryByUser(request.user.sub) }
  })

  app.post("/wheel/spin", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = spinSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })

    store.wheelConfig = normalizeWheelConfig(store.wheelConfig)
    const tier = parsed.data.tier ?? "normal"
    const tierCfg = store.wheelConfig.tiers[tier]

    if (tier === "jackpot") {
      const jackpotUnlocked = store.wheelSpins.size >= 1000 && Math.random() < 0.25
      if (!jackpotUnlocked) return reply.code(400).send({ error: "JACKPOT_NOT_ACTIVE" })
    }

    if (tierCfg.costAsset === "CHANCE") {
      if (user.chances < tierCfg.costAmount) return reply.code(400).send({ error: "NOT_ENOUGH_CHANCES" })
      user.chances -= tierCfg.costAmount
    } else {
      if (user.walletBalance < tierCfg.costAmount) return reply.code(400).send({ error: "INSUFFICIENT_BALANCE" })
      user.walletBalance -= tierCfg.costAmount
    }

    const selected = parsed.data.forceLabel
      ? tierCfg.segments.find((s) => s.label === parsed.data.forceLabel) ?? tierCfg.segments[0]
      : pickWeighted(tierCfg.segments)
    const segmentIndex = Math.max(
      0,
      tierCfg.segments.findIndex(
        (s) => s.label === selected.label && s.weight === selected.weight && s.color === selected.color,
      ),
    )

    let amount = 0
    let chancesDelta = 0
    let goldDelta = 0
    const label = selected.label
    const n = parsePersianOrLatinInt(label)

    if (label.includes("پوچ")) {
      amount = 0
      chancesDelta = 0
    } else if (label.includes("شانس")) {
      chancesDelta = Math.max(1, n)
      user.chances += chancesDelta
    } else if (label.includes("سوت")) {
      goldDelta = Math.max(1, n)
      user.goldSotBalance = (user.goldSotBalance ?? 0) + goldDelta
    } else if (label.includes("خودرو")) {
      const carReward = 300_000_000
      amount = carReward
      user.walletBalance += amount
    } else {
      const million = label.includes("میلیون")
      amount = million ? n * 1_000_000 : n
      if (amount > 0) user.walletBalance += amount
    }

    user.updatedAt = nowIso()
    store.users.set(user.id, user)

    if (tierCfg.costAsset === "IRR") {
      const costTxId = id("wtx")
      store.walletTx.set(costTxId, {
        id: costTxId,
        userId: user.id,
        type: "wheel_purchase",
        amount: -tierCfg.costAmount,
        status: "completed",
        createdAt: nowIso(),
        meta: { tier },
      })
    }

    if (amount > 0 || goldDelta > 0) {
      const rewardTxId = id("wtx")
      store.walletTx.set(rewardTxId, {
        id: rewardTxId,
        userId: user.id,
        type: "admin_adjustment",
        amount,
        status: "completed",
        createdAt: nowIso(),
        meta: { source: "wheel_spin", label, tier, goldDelta },
      })
    }

    const record = {
      id: id("whl"),
      userId: user.id,
      label: `${tier}:${label}`,
      win: !label.includes("پوچ"),
      amount: amount > 0 ? amount : undefined,
      chancesDelta,
      createdAt: nowIso(),
    }
    store.wheelSpins.set(record.id, record)

    pushLiveEvent(store, {
      type: "system.info",
      level: "info",
      message: `Wheel spin for ${user.email}: ${label}`,
    })

    return {
      result: {
        ...record,
        tier,
        goldDelta,
        segmentIndex,
        selectedSegment: selected,
        segments: tierCfg.segments,
      },
      balances: {
        walletBalance: user.walletBalance,
        chances: user.chances,
        goldSotBalance: user.goldSotBalance ?? 0,
      },
    }
  })

  app.get("/slide/single/today", async () => {
    const dateKey = todayKey()
    const target = store.dailySlideTargets.get(dateKey)
    return {
      date: dateKey,
      hasTarget: Boolean(target),
      targetNumber: target?.winningNumber,
    }
  })

  app.post("/slide/single/spin", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = singleSpinSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })

    if (parsed.data.stakeType === "chance") {
      if (user.chances < 1) return reply.code(400).send({ error: "NOT_ENOUGH_CHANCES" })
      user.chances -= 1
    } else {
      if (user.walletBalance < 10_000) return reply.code(400).send({ error: "INSUFFICIENT_BALANCE" })
      user.walletBalance -= 10_000
    }

    const dateKey = todayKey()
    const target = store.dailySlideTargets.get(dateKey)
    if (!target) return reply.code(400).send({ error: "DAILY_TARGET_NOT_SET" })

    const rolledNumber = 1 + Math.floor(Math.random() * 100)
    const win = rolledNumber === target.winningNumber
    let reward = 0
    if (win) {
      reward = 5_000_000
      user.walletBalance += reward
      const txId = id("wtx")
      store.walletTx.set(txId, {
        id: txId,
        userId: user.id,
        type: "admin_adjustment",
        amount: reward,
        status: "completed",
        createdAt: nowIso(),
        meta: { source: "slide_single_daily_win", date: dateKey, number: rolledNumber },
      })
    }

    user.updatedAt = nowIso()
    store.users.set(user.id, user)

    return {
      date: dateKey,
      rolledNumber,
      targetNumber: target.winningNumber,
      win,
      reward,
      balances: {
        walletBalance: user.walletBalance,
        chances: user.chances,
      },
    }
  })

  app.get("/slide/battle/rooms", async () => {
    return {
      items: Array.from(store.battleRooms.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    }
  })

  app.post("/slide/battle/join", { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = battleJoinSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const user = store.users.get(request.user.sub)
    if (!user) return reply.code(404).send({ error: "USER_NOT_FOUND" })

    let room = parsed.data.roomId ? store.battleRooms.get(parsed.data.roomId) : undefined
    if (!room) {
      const entryAsset = parsed.data.entryAsset ?? "CHANCE"
      const entryAmount = parsed.data.entryAmount ?? (entryAsset === "CHANCE" ? 5 : 10_000)
      room = {
        id: id("room"),
        status: "waiting",
        entryAsset,
        entryAmount,
        maxPlayers: parsed.data.maxPlayers ?? 10,
        siteFeePercent: 10,
        potAmount: 0,
        createdAt: nowIso(),
        players: [],
      }
      store.battleRooms.set(room.id, room)
    }

    if (room.status !== "waiting") return reply.code(400).send({ error: "ROOM_NOT_WAITING" })
    if (room.players.some((p) => p.userId === user.id)) return reply.code(400).send({ error: "ALREADY_JOINED" })
    if (room.players.length >= room.maxPlayers) return reply.code(400).send({ error: "ROOM_FULL" })

    if (room.entryAsset === "CHANCE") {
      if (user.chances < room.entryAmount) return reply.code(400).send({ error: "NOT_ENOUGH_CHANCES" })
      user.chances -= room.entryAmount
    } else {
      if (user.walletBalance < room.entryAmount) return reply.code(400).send({ error: "INSUFFICIENT_BALANCE" })
      user.walletBalance -= room.entryAmount
      const txId = id("wtx")
      store.walletTx.set(txId, {
        id: txId,
        userId: user.id,
        type: "battle_entry",
        amount: -room.entryAmount,
        status: "completed",
        createdAt: nowIso(),
        meta: { roomId: room.id },
      })
    }

    user.updatedAt = nowIso()
    store.users.set(user.id, user)

    room.players.push({ userId: user.id, joinedAt: nowIso() })
    room.potAmount += room.entryAmount

    if (room.players.length >= room.maxPlayers) {
      room.status = "running"
      room.startedAt = nowIso()

      let winner = room.players[0]!
      for (const p of room.players) {
        p.rolledNumber = 1 + Math.floor(Math.random() * 100)
        if ((p.rolledNumber ?? 0) > (winner.rolledNumber ?? 0)) winner = p
      }

      room.winnerUserId = winner.userId
      room.status = "finished"
      room.finishedAt = nowIso()

      const payout = Math.floor(room.potAmount * (1 - room.siteFeePercent / 100))
      const winnerUser = store.users.get(winner.userId)
      if (winnerUser) {
        if (room.entryAsset === "CHANCE") winnerUser.chances += payout
        else winnerUser.walletBalance += payout
        winnerUser.updatedAt = nowIso()
        store.users.set(winnerUser.id, winnerUser)

        if (room.entryAsset === "IRR") {
          const txId = id("wtx")
          store.walletTx.set(txId, {
            id: txId,
            userId: winnerUser.id,
            type: "battle_win",
            amount: payout,
            status: "completed",
            createdAt: nowIso(),
            meta: { roomId: room.id, players: room.players.length },
          })
        }
      }
    }

    store.battleRooms.set(room.id, room)

    return {
      room,
      joined: true,
      myBalances: {
        walletBalance: user.walletBalance,
        chances: user.chances,
      },
    }
  })

  app.get("/auctions", async () => {
    const items = Array.from(store.auctions.values())
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((a) => ({
        ...a,
        bids: store.getBidsByAuction(a.id).length,
      }))
    return { items }
  })

  app.get("/auctions/:auctionId", async (request, reply) => {
    const params = request.params as { auctionId: string }
    const auction = store.auctions.get(params.auctionId)
    if (!auction) return reply.code(404).send({ error: "AUCTION_NOT_FOUND" })
    return {
      auction,
      bids: store.getBidsByAuction(auction.id),
    }
  })

  app.post("/auctions/:auctionId/bids", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = request.params as { auctionId: string }
    const parsed = bidSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })

    const auction = store.auctions.get(params.auctionId)
    if (!auction) return reply.code(404).send({ error: "AUCTION_NOT_FOUND" })
    if (auction.status !== "open") return reply.code(400).send({ error: "AUCTION_NOT_OPEN" })
    if (auction.endAt <= nowIso()) return reply.code(400).send({ error: "AUCTION_ENDED" })
    if (parsed.data.amount <= auction.currentBid) return reply.code(400).send({ error: "BID_TOO_LOW", minimum: auction.currentBid + 1 })

    const bid = {
      id: id("bid"),
      auctionId: auction.id,
      userId: request.user.sub,
      amount: parsed.data.amount,
      createdAt: nowIso(),
    }
    store.auctionBids.set(bid.id, bid)

    auction.currentBid = parsed.data.amount
    auction.updatedAt = nowIso()
    store.auctions.set(auction.id, auction)

    pushLiveEvent(store, {
      type: "system.info",
      level: "success",
      message: `New bid on auction ${auction.title}`,
      data: { auctionId: auction.id, amount: bid.amount },
    })

    return {
      bid,
      auction,
    }
  })

  app.get("/admin/auctions", { preHandler: [app.adminOnly] }, async () => {
    const items = Array.from(store.auctions.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    return { items }
  })

  app.post("/admin/auctions", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const parsed = createAuctionSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const now = nowIso()
    const auction = {
      id: id("auc"),
      title: parsed.data.title,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl,
      startPrice: parsed.data.startPrice,
      currentBid: parsed.data.startPrice,
      status: "draft" as const,
      endAt: parsed.data.endAt,
      createdBy: request.user.sub,
      createdAt: now,
      updatedAt: now,
    }
    store.auctions.set(auction.id, auction)
    return reply.code(201).send({ auction })
  })

  app.put("/admin/auctions/:auctionId", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { auctionId: string }
    const parsed = updateAuctionSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_INPUT", details: parsed.error.flatten() })
    const auction = store.auctions.get(params.auctionId)
    if (!auction) return reply.code(404).send({ error: "AUCTION_NOT_FOUND" })
    Object.assign(auction, parsed.data, { updatedAt: nowIso() })
    store.auctions.set(auction.id, auction)
    return { auction }
  })

  app.post("/admin/auctions/:auctionId/open", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { auctionId: string }
    const auction = store.auctions.get(params.auctionId)
    if (!auction) return reply.code(404).send({ error: "AUCTION_NOT_FOUND" })
    auction.status = "open"
    auction.updatedAt = nowIso()
    store.auctions.set(auction.id, auction)
    return { auction }
  })

  app.post("/admin/auctions/:auctionId/close", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { auctionId: string }
    const auction = store.auctions.get(params.auctionId)
    if (!auction) return reply.code(404).send({ error: "AUCTION_NOT_FOUND" })
    const topBid = store.getBidsByAuction(auction.id)[0]
    auction.status = "closed"
    auction.winnerUserId = topBid?.userId
    auction.updatedAt = nowIso()
    store.auctions.set(auction.id, auction)
    return { auction, topBid }
  })

  app.delete("/admin/auctions/:auctionId", { preHandler: [app.adminOnly] }, async (request, reply) => {
    const params = request.params as { auctionId: string }
    const auction = store.auctions.get(params.auctionId)
    if (!auction) return reply.code(404).send({ error: "AUCTION_NOT_FOUND" })
    store.auctions.delete(params.auctionId)
    return reply.code(204).send()
  })
}
