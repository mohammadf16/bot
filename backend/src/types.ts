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

export interface RaffleDynamicPricing {
  basePrice: number
  decayFactor: number
  minPrice: number
}

export interface RaffleRewardConfig {
  cashbackPercent: number
  cashbackToGoldPercent: number
  tomanPerGoldSot: number
  mainPrizeTitle: string
  mainPrizeValueIrr: number
}

export interface Raffle {
  id: string
  title: string
  linkedVehicleId?: string
  maxTickets: number
  ticketsSold: number
  participantsCount?: number
  status: RaffleStatus
  tiers: RaffleTier[]
  config: RaffleConfig
  dynamicPricing?: RaffleDynamicPricing
  rewardConfig?: RaffleRewardConfig
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
  slideNumber: number
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

export interface LoanConfig {
  enabled: boolean
  requiredVipLevelId: number
  minLoanIrr: number
  maxLoanIrr: number
  monthlyInterestRatePercent: number
  minInstallments: number
  maxInstallments: number
  defaultInstallments: number
}

export type LoanInstallmentStatus = "pending" | "partial" | "paid" | "overdue"

export interface LoanInstallment {
  installmentNumber: number
  dueAt: string
  amountIrr: number
  principalIrr: number
  interestIrr: number
  paidAmountIrr: number
  paidPrincipalIrr?: number
  paidAt?: string
  status: LoanInstallmentStatus
}

export interface AutoLoan {
  id: string
  userId: string
  principalIrr: number
  outstandingIrr: number
  installmentCount?: number
  monthlyInstallmentIrr?: number
  interestRateMonthlyPercent?: number
  totalRepayableIrr?: number
  repaidIrr?: number
  paidInstallmentsCount?: number
  overdueInstallmentsCount?: number
  nextInstallmentNumber?: number
  nextDueAt?: string
  lastRepaymentAt?: string
  installments?: LoanInstallment[]
  purpose?: "cash_credit" | "vehicle_purchase"
  relatedVehicleId?: string
  status: "pending" | "approved" | "active" | "repaid" | "rejected" | "defaulted"
  restrictedUsage: boolean
  approvedBy?: string
  createdAt: string
  updatedAt: string
  dueAt?: string
}

export interface OnlinePaymentGatewayConfig {
  id: string
  code: string
  provider: string
  displayName: string
  enabled: boolean
  sandbox: boolean
  priority: number
  checkoutUrl?: string
  verifyUrl?: string
  callbackUrl?: string
  merchantId?: string
  apiKey?: string
  apiSecret?: string
  publicKey?: string
  privateKey?: string
  webhookSecret?: string
  minAmountIrr?: number
  maxAmountIrr?: number
  feePercent?: number
  feeFixedIrr?: number
  description?: string
  createdAt: string
  updatedAt: string
}

export interface PaymentConfig {
  cardToCard: {
    enabled: boolean
    destinationCard: string
  }
  onlineGateways: OnlinePaymentGatewayConfig[]
  defaultOnlineGatewayId?: string
  updatedAt: string
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
  sourceType?: "chance_spend" | "showroom_purchase"
  sourceOrderId?: string
  sourceVehicleId?: string
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

export type CheckListingStatus = "pending_review" | "approved" | "rejected" | "completed"

export interface CheckListing {
  id: string
  ownerUserId: string
  ownerEmail: string
  ownerName: string
  ownerPhone?: string
  vehicleModel: string
  vehicleYear?: number
  city: string
  suggestedPriceIrr: number
  deliveryDate: string
  notes?: string
  status: CheckListingStatus
  createdAt: string
  updatedAt: string
}

export type CardToCardPaymentPurpose =
  | "wallet_deposit"
  | "showroom_order"
  | "raffle_ticket_purchase"
  | "raffle_combo_purchase"

export interface CardToCardPayment {
  id: string
  userId: string
  userEmail: string
  amount: number
  destinationCard: string
  fromCardLast4: string
  trackingCode: string
  receiptImageUrl: string
  purpose: CardToCardPaymentPurpose
  status: "pending" | "approved" | "rejected"
  metadata?: Record<string, string | number | boolean | string[] | number[]>
  createdAt: string
  updatedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewNote?: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  coverImage: string
  status: "draft" | "published" | "archived"
  featured: boolean
  views: number
  author: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SiteSettings {
  general?: {
    siteName: string
    siteTagline: string
    logoUrl: string
    faviconUrl: string
    maintenanceMode: boolean
    maintenanceMessage: string
    defaultLanguage: string
    copyrightText: string
  }
  header?: {
    sticky: boolean
    transparent: boolean
    announcementBarActive: boolean
    announcementText: string
    announcementColor: string
    announcementLink: string
    navLinks: Array<{ id: string; label: string; href: string; isExternal?: boolean }>
    ctaLabel: string
    ctaHref: string
  }
  footer?: {
    companyDescription: string
    columns: Array<{ title: string; links: Array<{ label: string; href: string }> }>
    socialLinks: Array<{ platform: string; url: string; icon: string }>
    bottomLinks: Array<{ label: string; href: string }>
    newsletter: boolean
    newsletterText: string
  }
  contact?: {
    address: string
    city: string
    postalCode: string
    phone: string
    phone2: string
    email: string
    emailSupport: string
    supportHours: string
    telegramLink: string
    instagramLink: string
    whatsappNumber: string
    linkedinUrl: string
    twitterUrl: string
    youtubeUrl: string
    mapEmbedUrl: string
    mapLat: string
    mapLng: string
  }
  about?: {
    heroTitle: string
    heroSubtitle: string
    heroImage: string
    missionTitle: string
    missionText: string
    visionTitle: string
    visionText: string
    statsUsers: string
    statsRaffles: string
    statsPrizes: string
    statsSatisfaction: string
    valuesTitle: string
    values: Array<{ title: string; description: string; color: string }>
    teamTitle: string
    team: Array<{ name: string; role: string; image: string; bio: string }>
    timelineTitle: string
    timeline: Array<{ year: string; title: string; description: string }>
    ctaTitle: string
    ctaText: string
    ctaButton: string
    ctaLink: string
  }
  home?: {
    heroTitle: string
    heroSubtitle: string
    heroCta1: string
    heroCta1Link: string
    heroCta2: string
    heroCta2Link: string
    statsUsers: string
    statsRaffles: string
    statsPrizes: string
    featureTitle: string
    featureSubtitle: string
    features: Array<{ icon: string; title: string; description: string }>
    serviceTitle: string
    serviceSubtitle: string
    ctaTitle: string
    ctaSubtitle: string
    ctaCta: string
  }
  theme?: {
    accentGold: string
    accentCyan: string
    accentGoldLight: string
    accentCyanLight: string
    fontMain: string
    fontHeading: string
    borderRadius: string
    glassOpacity: string
  }
  updatedAt?: string
  updatedBy?: string
}
