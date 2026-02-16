export type UserRole = "user" | "admin"

export interface User {
  id: string
  email: string
  passwordHash: string
  role: UserRole
  status?: "active" | "suspended"
  walletBalance: number
  goldSotBalance?: number
  chances: number
  vipLevelId?: number
  vipLevelName?: string
  vipCashbackPercent?: number
  vipUntil?: string
  totalTicketsBought?: number
  totalSpendIrr?: number
  activeReferrals?: number
  loanLockedBalance?: number
  referralCode: string
  referredBy?: string
  profile?: UserProfile
  notificationPrefs?: NotificationPrefs
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  fullName?: string
  username?: string
  phone?: string
  city?: string
  address?: string
  bio?: string
  avatarUrl?: string
}

export interface NotificationPrefs {
  email: boolean
  sms: boolean
  push: boolean
}

export interface RefreshSession {
  id: string
  userId: string
  tokenHash: string
  expiresAt: string
  revokedAt?: string
  createdAt: string
}

export type RaffleStatus = "draft" | "open" | "closed" | "drawn"

export interface RaffleTier {
  order: number
  price: number
  discountPercent: number
}

export interface RaffleConfig {
  cashbackPercent: number
  wheelChancePerTicket: number
  lotteryChancePerTicket: number
  freeEntryEveryN: number
}

export interface Raffle {
  id: string
  title: string
  maxTickets: number
  ticketsSold: number
  status: RaffleStatus
  tiers: RaffleTier[]
  config: RaffleConfig
  seedCommitHash: string
  encryptedServerSeed: string
  createdBy: string
  openedAt?: string
  closedAt?: string
  drawnAt?: string
  proof?: LotteryProof
  createdAt: string
  updatedAt: string
}

export interface Ticket {
  id: string
  raffleId: string
  userId: string
  index: number
  pricePaid: number
  clientSeed: string
  createdAt: string
}

export type WalletTransactionType =
  | "deposit"
  | "withdraw_request"
  | "ticket_purchase"
  | "cashback"
  | "admin_adjustment"
  | "asset_convert"
  | "referral_commission"
  | "loan_credit"
  | "loan_repay"
  | "battle_entry"
  | "battle_win"
  | "wheel_purchase"

export interface WalletTransaction {
  id: string
  userId: string
  type: WalletTransactionType
  amount: number
  status: "pending" | "completed" | "rejected"
  idempotencyKey?: string
  meta?: Record<string, string | number | boolean>
  createdAt: string
}

export interface AuditLog {
  id: string
  actorUserId?: string
  actorEmail?: string
  ip?: string
  action: string
  target: string
  success: boolean
  message?: string
  payload?: Record<string, unknown>
  createdAt: string
}

export interface PricingPolicy {
  id: string
  version: string
  status: "draft" | "published"
  tiers: RaffleTier[]
  config: RaffleConfig
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface LotteryProof {
  version: "v1"
  raffleId: string
  algorithm: "commit-reveal-hmac-fisher-yates"
  seedCommitHash: string
  revealedServerSeed: string
  externalEntropy: string
  aggregateClientSeedHash: string
  masterSeedHash: string
  ticketCount: number
  winnerCount: number
  winnerTicketIndexes: number[]
  generatedAt: string
}

export interface LiveEvent {
  id: string
  type:
    | "auth.login"
    | "wallet.deposit"
    | "wallet.withdraw"
    | "raffle.buy"
    | "raffle.open"
    | "raffle.close"
    | "raffle.draw"
    | "support.ticket"
    | "support.reply"
    | "showroom.vehicle"
    | "showroom.order"
    | "security.alert"
    | "system.info"
  level: "info" | "warning" | "success"
  message: string
  data?: Record<string, unknown>
  createdAt: string
}

export interface WheelSegment {
  label: string
  color: string
  weight: number
}

export interface WheelTierConfig {
  costAsset: "CHANCE" | "IRR"
  costAmount: number
  segments: WheelSegment[]
}

export interface WheelConfig {
  raffleCostChances: number
  referralChancePerUser: number
  slideGameCostChances: number
  tiers: {
    normal: WheelTierConfig
    gold: WheelTierConfig
    jackpot: WheelTierConfig
  }
}

export interface WheelSpinRecord {
  id: string
  userId: string
  label: string
  win: boolean
  amount?: number
  chancesDelta: number
  createdAt: string
}

export interface NotificationItem {
  id: string
  userId: string
  title: string
  body?: string
  kind: "info" | "success" | "warning"
  readAt?: string
  createdAt: string
}

export type AuctionStatus = "draft" | "open" | "closed" | "cancelled"

export interface Auction {
  id: string
  title: string
  description?: string
  imageUrl?: string
  startPrice: number
  currentBid: number
  status: AuctionStatus
  endAt: string
  createdBy: string
  winnerUserId?: string
  createdAt: string
  updatedAt: string
}

export interface AuctionBid {
  id: string
  auctionId: string
  userId: string
  amount: number
  createdAt: string
}

export type SlideDrawStatus = "scheduled" | "drawn" | "cancelled"

export interface SlideDrawPrize {
  rankFrom: number
  rankTo: number
  title: string
  amount?: number
}

export interface SlideDrawParticipant {
  userId: string
  chances: number
}

export interface SlideDrawEntry {
  entryNumber: number
  userId: string
  createdAt: string
}

export interface SlideDrawWinner {
  rank: number
  userId: string
  winningNumber: number
  chancesAtDraw: number
  prize: SlideDrawPrize
}

export interface SlideDrawProof {
  algorithm: "hmac-weighted-v1"
  seedCommitHash: string
  revealedServerSeed: string
  externalEntropy: string
  participantsHash: string
  generatedAt: string
}

export interface SlideDraw {
  id: string
  title: string
  scheduledAt: string
  status: SlideDrawStatus
  seedCommitHash: string
  encryptedServerSeed: string
  prizes: SlideDrawPrize[]
  entries: SlideDrawEntry[]
  participants: SlideDrawParticipant[]
  winners: SlideDrawWinner[]
  proof?: SlideDrawProof
  targetNumber?: number
  createdBy: string
  createdAt: string
  updatedAt: string
}
