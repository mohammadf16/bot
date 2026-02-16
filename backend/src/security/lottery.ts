import { createHash, createHmac } from "node:crypto"
import type { LotteryProof, Ticket } from "../types.js"

export interface DrawInput {
  raffleId: string
  seedCommitHash: string
  serverSeed: string
  externalEntropy: string
  closedAt: string
  tickets: Ticket[]
  winnerCount: number
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function hmacHex(key: string, value: string): string {
  return createHmac("sha256", key).update(value, "utf8").digest("hex")
}

function aggregateClientSeedHash(tickets: Ticket[]): string {
  const canonical = tickets
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((t) => `${t.index}:${t.userId}:${t.clientSeed}:${t.id}`)
    .join("|")
  return sha256Hex(canonical)
}

function deterministicMasterSeed(input: Omit<DrawInput, "winnerCount"> & { aggregateHash: string }): string {
  return hmacHex(
    input.serverSeed,
    `${input.raffleId}|${input.externalEntropy}|${input.aggregateHash}|${input.closedAt}`,
  )
}

function randomIntWithRejection(masterSeed: string, counter: number, maxExclusive: number): { value: number; nextCounter: number } {
  if (maxExclusive <= 0) {
    throw new Error("maxExclusive must be > 0")
  }
  let localCounter = counter
  const TWO48 = 2 ** 48
  const limit = Math.floor(TWO48 / maxExclusive) * maxExclusive

  while (true) {
    const digest = hmacHex(masterSeed, `counter:${localCounter}`)
    localCounter += 1
    const num48 = parseInt(digest.slice(0, 12), 16)
    if (num48 < limit) {
      return { value: num48 % maxExclusive, nextCounter: localCounter }
    }
  }
}

function drawUniqueIndexes(totalTickets: number, winnerCount: number, masterSeed: string): number[] {
  const arr = Array.from({ length: totalTickets }, (_, i) => i)
  let counter = 0

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const { value, nextCounter } = randomIntWithRejection(masterSeed, counter, i + 1)
    counter = nextCounter
    const tmp = arr[i]
    arr[i] = arr[value]!
    arr[value] = tmp!
  }

  return arr.slice(0, winnerCount).sort((a, b) => a - b)
}

export function createProvablyFairProof(input: DrawInput): LotteryProof {
  if (input.tickets.length === 0) {
    throw new Error("Cannot draw with zero tickets")
  }
  if (input.winnerCount < 1 || input.winnerCount > input.tickets.length) {
    throw new Error("Invalid winnerCount")
  }
  if (sha256Hex(input.serverSeed) !== input.seedCommitHash) {
    throw new Error("Server seed does not match commit hash")
  }

  const aggregateHash = aggregateClientSeedHash(input.tickets)
  const masterSeed = deterministicMasterSeed({ ...input, aggregateHash })
  const winnerTicketIndexes = drawUniqueIndexes(input.tickets.length, input.winnerCount, masterSeed)

  return {
    version: "v1",
    raffleId: input.raffleId,
    algorithm: "commit-reveal-hmac-fisher-yates",
    seedCommitHash: input.seedCommitHash,
    revealedServerSeed: input.serverSeed,
    externalEntropy: input.externalEntropy,
    aggregateClientSeedHash: aggregateHash,
    masterSeedHash: sha256Hex(masterSeed),
    ticketCount: input.tickets.length,
    winnerCount: input.winnerCount,
    winnerTicketIndexes,
    generatedAt: new Date().toISOString(),
  }
}

export function verifyProof(proof: LotteryProof, tickets: Ticket[], closedAt: string): boolean {
  const recalculated = createProvablyFairProof({
    raffleId: proof.raffleId,
    seedCommitHash: proof.seedCommitHash,
    serverSeed: proof.revealedServerSeed,
    externalEntropy: proof.externalEntropy,
    closedAt,
    tickets,
    winnerCount: proof.winnerCount,
  })

  return (
    recalculated.masterSeedHash === proof.masterSeedHash &&
    recalculated.aggregateClientSeedHash === proof.aggregateClientSeedHash &&
    JSON.stringify(recalculated.winnerTicketIndexes) === JSON.stringify(proof.winnerTicketIndexes)
  )
}
