import type { WheelConfig, WheelSegment, WheelTierConfig } from "../types.js"

const FALLBACK_SEGMENTS: WheelSegment[] = [
  { label: "پوچ", color: "#9ca3af", weight: 45 },
  { label: "شانس 1", color: "#34d399", weight: 20 },
  { label: "50000", color: "#60a5fa", weight: 15 },
  { label: "100000", color: "#2563eb", weight: 10 },
  { label: "1 سوت", color: "#fcd34d", weight: 10 },
]

function sanitizeSegments(input: unknown): WheelSegment[] {
  if (!Array.isArray(input) || input.length === 0) return [...FALLBACK_SEGMENTS]
  const parsed = input
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const seg = item as Partial<WheelSegment>
      return {
        label: String(seg.label ?? "").trim() || "پوچ",
        color: String(seg.color ?? "#9ca3af").trim() || "#9ca3af",
        weight: Number.isFinite(seg.weight) ? Math.max(1, Math.trunc(seg.weight as number)) : 1,
      }
    })
    .slice(0, 20)
  return parsed.length ? parsed : [...FALLBACK_SEGMENTS]
}

function normalizeTier(
  input: unknown,
  fallback: { costAsset: "CHANCE" | "IRR"; costAmount: number; segments: WheelSegment[] },
): WheelTierConfig {
  const tier = (input ?? {}) as Partial<WheelTierConfig>
  const costAsset = tier.costAsset === "IRR" ? "IRR" : "CHANCE"
  const costAmount = Number.isFinite(tier.costAmount) ? Math.max(1, Math.trunc(tier.costAmount as number)) : fallback.costAmount
  const segments = sanitizeSegments(tier.segments ?? fallback.segments)
  return { costAsset, costAmount, segments }
}

export function createDefaultWheelConfig(): WheelConfig {
  const normalSegments: WheelSegment[] = [
    { label: "50 میلیون", color: "#FCA5A5", weight: 20 },
    { label: "5 میلیون", color: "#93C5FD", weight: 15 },
    { label: "شانس اضافه", color: "#86EFAC", weight: 25 },
    { label: "100 میلیون", color: "#FDE68A", weight: 15 },
    { label: "طلای آب شده", color: "#F9A8D4", weight: 10 },
    { label: "پوچ", color: "#D1D5DB", weight: 15 },
  ]
  return {
    raffleCostChances: 5,
    referralChancePerUser: 1,
    slideGameCostChances: 5,
    tiers: {
      normal: { costAsset: "CHANCE", costAmount: 2, segments: normalSegments },
      gold: { costAsset: "CHANCE", costAmount: 2, segments: normalSegments },
      jackpot: { costAsset: "IRR", costAmount: 500_000, segments: normalSegments },
    },
  }
}

export function normalizeWheelConfig(raw: unknown): WheelConfig {
  const fallback = createDefaultWheelConfig()
  const data = (raw ?? {}) as any

  const sharedSegments = sanitizeSegments(data.segments ?? fallback.tiers.normal.segments)
  const tiersRaw = data.tiers ?? {}

  return {
    raffleCostChances: Number.isFinite(data.raffleCostChances) ? Math.max(1, Math.trunc(data.raffleCostChances)) : fallback.raffleCostChances,
    referralChancePerUser: Number.isFinite(data.referralChancePerUser) ? Math.max(0, Math.trunc(data.referralChancePerUser)) : fallback.referralChancePerUser,
    slideGameCostChances: Number.isFinite(data.slideGameCostChances) ? Math.max(1, Math.trunc(data.slideGameCostChances)) : fallback.slideGameCostChances,
    tiers: {
      normal: normalizeTier(tiersRaw.normal, {
        costAsset: "CHANCE",
        costAmount: Number.isFinite(data.wheelCostChances) ? Math.max(1, Math.trunc(data.wheelCostChances)) : fallback.tiers.normal.costAmount,
        segments: sharedSegments,
      }),
      gold: normalizeTier(tiersRaw.gold, {
        costAsset: "CHANCE",
        costAmount: 2,
        segments: sharedSegments,
      }),
      jackpot: normalizeTier(tiersRaw.jackpot, {
        costAsset: "IRR",
        costAmount: 500_000,
        segments: sharedSegments,
      }),
    },
  }
}

export function toLegacyCompatibleWheelConfig(config: WheelConfig): WheelConfig & {
  wheelCostChances: number
  segments: WheelSegment[]
} {
  return {
    ...config,
    wheelCostChances: config.tiers.normal.costAmount,
    segments: config.tiers.normal.segments,
  }
}
