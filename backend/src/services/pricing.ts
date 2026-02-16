import type { RaffleConfig, RaffleTier } from "../types.js"

export function calculateTicketPrices(tiers: RaffleTier[], count: number): number[] {
  if (count < 1) return []
  const sorted = tiers.slice().sort((a, b) => a.order - b.order)
  const fallback = sorted[sorted.length - 1]
  const prices: number[] = []
  for (let i = 0; i < count; i += 1) {
    const tier = sorted[i] ?? fallback
    prices.push(tier?.price ?? 0)
  }
  return prices
}

export function calculateCashback(totalPaid: number, config: RaffleConfig): number {
  return Math.floor((totalPaid * config.cashbackPercent) / 100)
}

export function calculateDynamicTicketPrices(
  count: number,
  alreadyBoughtByUser: number,
  basePrice = 1_000_000,
  decayFactor = 0.8,
  minPrice = 500_000,
): number[] {
  if (count < 1) return []
  const prices: number[] = []
  for (let i = 0; i < count; i += 1) {
    const ticketNumber = alreadyBoughtByUser + i + 1
    const raw = basePrice * decayFactor ** (ticketNumber - 1)
    prices.push(Math.max(minPrice, Math.floor(raw)))
  }
  return prices
}

export const RAFFLE_COMBO_PACKAGES = {
  silver: {
    code: "silver",
    title: "Silver",
    paidTickets: 5,
    bonusTickets: 1,
    bonusChances: 10,
    vipDays: 0,
  },
  gold: {
    code: "gold",
    title: "Gold",
    paidTickets: 10,
    bonusTickets: 3,
    bonusChances: 20,
    vipDays: 30,
  },
} as const

export type RaffleComboCode = keyof typeof RAFFLE_COMBO_PACKAGES
