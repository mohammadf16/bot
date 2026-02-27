import type { OnlinePaymentGatewayConfig, PaymentConfig } from "../types.js"
import { nowIso } from "../utils/time.js"

export const DEFAULT_CARD_TO_CARD_DESTINATION = "6037-9979-0000-1234"

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") return true
    if (normalized === "false") return false
  }
  return fallback
}

function asFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function normalizeGateway(input: Partial<OnlinePaymentGatewayConfig>, now: string): OnlinePaymentGatewayConfig {
  const code = (asString(input.code) ?? "gateway").toLowerCase().replace(/[^a-z0-9_-]/g, "-")
  const minAmount = asFiniteNumber(input.minAmountIrr)
  const maxAmount = asFiniteNumber(input.maxAmountIrr)
  const feePercent = asFiniteNumber(input.feePercent)
  const feeFixedIrr = asFiniteNumber(input.feeFixedIrr)

  return {
    id: asString(input.id) ?? `gw-${code}-${Math.random().toString(36).slice(2, 8)}`,
    code,
    provider: asString(input.provider) ?? "custom",
    displayName: asString(input.displayName) ?? code,
    enabled: asBoolean(input.enabled, true),
    sandbox: asBoolean(input.sandbox, true),
    priority: Math.max(0, Math.min(1000, Math.trunc(asFiniteNumber(input.priority) ?? 100))),
    checkoutUrl: asString(input.checkoutUrl),
    verifyUrl: asString(input.verifyUrl),
    callbackUrl: asString(input.callbackUrl),
    merchantId: asString(input.merchantId),
    apiKey: asString(input.apiKey),
    apiSecret: asString(input.apiSecret),
    publicKey: asString(input.publicKey),
    privateKey: asString(input.privateKey),
    webhookSecret: asString(input.webhookSecret),
    minAmountIrr: minAmount === undefined ? undefined : Math.max(0, Math.trunc(minAmount)),
    maxAmountIrr: maxAmount === undefined ? undefined : Math.max(0, Math.trunc(maxAmount)),
    feePercent: feePercent === undefined ? undefined : Math.max(0, Math.min(100, feePercent)),
    feeFixedIrr: feeFixedIrr === undefined ? undefined : Math.max(0, Math.trunc(feeFixedIrr)),
    description: asString(input.description),
    createdAt: asString(input.createdAt) ?? now,
    updatedAt: now,
  }
}

export function normalizePaymentConfig(
  input: Partial<PaymentConfig> | undefined,
  options?: { fallbackCardToCardDestination?: string },
): PaymentConfig {
  const now = nowIso()
  const fallbackCard = asString(options?.fallbackCardToCardDestination) ?? DEFAULT_CARD_TO_CARD_DESTINATION
  const source = input ?? {}
  const cardToCardInput: Partial<PaymentConfig["cardToCard"]> = source.cardToCard ?? {}
  const online = Array.isArray(source.onlineGateways) ? source.onlineGateways : []

  const normalizedGateways = online
    .map((item) => normalizeGateway(item, now))
    .sort((a, b) => (a.priority === b.priority ? a.displayName.localeCompare(b.displayName) : a.priority - b.priority))

  const defaultOnlineGatewayId = asString(source.defaultOnlineGatewayId)
  const hasDefault = defaultOnlineGatewayId && normalizedGateways.some((g) => g.id === defaultOnlineGatewayId)

  return {
    cardToCard: {
      enabled: asBoolean(cardToCardInput.enabled, true),
      destinationCard: asString(cardToCardInput.destinationCard) ?? fallbackCard,
    },
    onlineGateways: normalizedGateways,
    defaultOnlineGatewayId: hasDefault ? defaultOnlineGatewayId : normalizedGateways.find((g) => g.enabled)?.id,
    updatedAt: now,
  }
}

export function getCardToCardDestinationCard(config: PaymentConfig): string {
  return config.cardToCard.destinationCard
}
