import { decryptText, hmacSha256Hex, randomHex, sha256Hex } from "../utils/crypto.js"
import type { AppStore } from "../store/app-store.js"
import type { SlideDrawEntry, SlideDrawParticipant, SlideDrawWinner } from "../types.js"
import { pushUserNotification } from "./notifications.js"
import { pushSystemAudit } from "./events.js"

function buildParticipantsFromEntries(entries: SlideDrawEntry[]): SlideDrawParticipant[] {
  const counter = new Map<string, number>()
  for (const entry of entries) {
    counter.set(entry.userId, (counter.get(entry.userId) ?? 0) + 1)
  }
  return Array.from(counter.entries())
    .map(([userId, chances]) => ({ userId, chances }))
    .sort((a, b) => (a.userId < b.userId ? -1 : 1))
}

function pickEntriesUnique(
  entries: SlideDrawEntry[],
  count: number,
  seed: string,
): SlideDrawEntry[] {
  const pool = entries.map((entry) => ({ ...entry }))
  const winners: SlideDrawEntry[] = []
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const hash = hmacSha256Hex(seed, `pick:${i}`)
    const selectedIndex = Number.parseInt(hash.slice(0, 12), 16) % pool.length
    const selected = pool[selectedIndex]!
    winners.push(selected)
    pool.splice(selectedIndex, 1)
  }
  return winners
}

export function finalizeSlideDraw(
  store: AppStore,
  drawId: string,
  seedEncryptionKey: string,
  nowIso: string,
): { ok: true } | { ok: false; reason: string } {
  const draw = store.slideDraws.get(drawId)
  if (!draw) return { ok: false, reason: "DRAW_NOT_FOUND" }
  if (draw.status !== "scheduled") return { ok: false, reason: "DRAW_NOT_SCHEDULED" }
  if (draw.scheduledAt > nowIso) return { ok: false, reason: "DRAW_NOT_REACHED" }

  const entries = (draw.entries ?? []).slice().sort((a, b) => a.entryNumber - b.entryNumber)
  if (entries.length === 0) return { ok: false, reason: "NO_PARTICIPANTS" }
  const participants = buildParticipantsFromEntries(entries)

  const participantsHash = sha256Hex(JSON.stringify(entries))
  const serverSeed = decryptText(draw.encryptedServerSeed, seedEncryptionKey)
  const externalEntropy = `${nowIso}:${randomHex(16)}`
  const masterSeed = hmacSha256Hex(serverSeed, `${externalEntropy}:${participantsHash}`)
  const prizeSlots = draw.prizes
    .slice()
    .sort((a, b) => a.rankFrom - b.rankFrom)
    .flatMap((prize) => {
      const out: Array<{ rank: number; prize: typeof prize }> = []
      for (let rank = prize.rankFrom; rank <= prize.rankTo; rank += 1) {
        out.push({ rank, prize })
      }
      return out
    })
  const participantByUser = new Map(participants.map((p) => [p.userId, p]))
  const ranked = pickEntriesUnique(entries, prizeSlots.length, masterSeed)
  const winners: SlideDrawWinner[] = ranked.map((winner, idx) => ({
    rank: prizeSlots[idx]!.rank,
    userId: winner.userId,
    winningNumber: winner.entryNumber,
    chancesAtDraw: participantByUser.get(winner.userId)?.chances ?? 1,
    prize: prizeSlots[idx]!.prize,
  }))
    .sort((a, b) => a.rank - b.rank)

  const entryNumberSet = new Set(entries.map((e) => e.entryNumber))
  const hasOutOfPoolWinner = winners.some((winner) => !entryNumberSet.has(winner.winningNumber))
  if (hasOutOfPoolWinner) return { ok: false, reason: "WINNER_NUMBER_OUT_OF_POOL" }

  const targetNumber = winners.find((w) => w.rank === 1)?.winningNumber ?? winners[0]?.winningNumber

  draw.participants = participants
  draw.winners = winners
  draw.targetNumber = targetNumber
  draw.status = "drawn"
  draw.updatedAt = nowIso
  draw.proof = {
    algorithm: "hmac-weighted-v1",
    seedCommitHash: draw.seedCommitHash,
    revealedServerSeed: serverSeed,
    externalEntropy,
    participantsHash,
    generatedAt: nowIso,
  }
  store.slideDraws.set(draw.id, draw)

  for (const winner of winners) {
    pushUserNotification(store, {
      userId: winner.userId,
      title: `تبریک! رتبه ${winner.rank} قرعه اسلاید`,
      body: `شماره برنده شما ${winner.winningNumber} ثبت شد. جایزه: ${winner.prize.title}`,
      kind: winner.rank === 1 ? "success" : "info",
    })
  }

  pushSystemAudit(store, {
    action: "SLIDE_DRAW_FINALIZED",
    target: `slide-draw:${draw.id}`,
    success: true,
    payload: {
      totalEntries: entries.length,
      totalParticipants: participants.length,
      winners: winners.length,
      firstPrizeNumber: targetNumber,
    },
  })

  return { ok: true }
}
