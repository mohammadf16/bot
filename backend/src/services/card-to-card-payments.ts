import type { AppStore } from "../store/app-store.js"
import type { CardToCardPayment, CardToCardPaymentPurpose } from "../types.js"
import { id } from "../utils/id.js"
import { nowIso } from "../utils/time.js"
import { getCardToCardDestinationCard as getDestinationCardFromConfig, normalizePaymentConfig } from "./payment-config.js"

export function getCardToCardDestinationCard(store: AppStore): string {
  store.paymentConfig = normalizePaymentConfig(store.paymentConfig)
  return getDestinationCardFromConfig(store.paymentConfig)
}

export function createCardToCardPayment(
  store: AppStore,
  args: {
    userId: string
    userEmail: string
    amount: number
    purpose: CardToCardPaymentPurpose
    fromCardLast4: string
    trackingCode: string
    receiptImageUrl: string
    metadata?: CardToCardPayment["metadata"]
  },
): CardToCardPayment {
  const now = nowIso()
  const payment: CardToCardPayment = {
    id: id("ctp"),
    userId: args.userId,
    userEmail: args.userEmail,
    amount: Math.max(0, Math.trunc(args.amount)),
    destinationCard: getCardToCardDestinationCard(store),
    fromCardLast4: args.fromCardLast4,
    trackingCode: args.trackingCode,
    receiptImageUrl: args.receiptImageUrl,
    purpose: args.purpose,
    status: "pending",
    metadata: args.metadata,
    createdAt: now,
    updatedAt: now,
  }
  store.cardToCardPayments.set(payment.id, payment)
  return payment
}
