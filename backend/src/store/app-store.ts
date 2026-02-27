import { EventEmitter } from "node:events"
import type {
  Auction,
  AuctionBid,
  AuditLog,
  BlogPost,
  CardToCardPayment,
  CheckListing,
  LiveEvent,
  NotificationItem,
  PricingPolicy,
  Raffle,
  RefreshSession,
  SlideDraw,
  SiteSettings,
  Ticket,
  User,
  WalletTransaction,
  WheelSpinRecord,
  WheelConfig,
  LoanConfig,
  AutoLoan,
  PaymentConfig,
} from "../types.js"
import { createDefaultWheelConfig } from "../services/wheel-config.js"
import { DEFAULT_LOAN_CONFIG, normalizeLoanConfig } from "../services/loan-config.js"
import { normalizePaymentConfig } from "../services/payment-config.js"

export class AppStore extends EventEmitter {
  users = new Map<string, User>()
  usersByEmail = new Map<string, string>()
  refreshSessions = new Map<string, RefreshSession>()
  raffles = new Map<string, Raffle>()
  tickets = new Map<string, Ticket>()
  walletTx = new Map<string, WalletTransaction>()
  pricingPolicies = new Map<string, PricingPolicy>()
  auctions = new Map<string, Auction>()
  auctionBids = new Map<string, AuctionBid>()
  wheelSpins = new Map<string, WheelSpinRecord>()
  auditLogs: AuditLog[] = []
  liveEvents: LiveEvent[] = []
  idempotency = new Map<string, unknown>()
  notifications = new Map<string, NotificationItem>()
  slideDraws = new Map<string, SlideDraw>()
  lotteryMemory = new Map<string, { missStreak: number; pityMultiplier: number }>()
  dailySlideTargets = new Map<string, { winningNumber: number; createdBy: string; createdAt: string }>()
  battleRooms = new Map<string, {
    id: string
    status: "waiting" | "running" | "finished" | "cancelled"
    entryAsset: "CHANCE" | "IRR"
    entryAmount: number
    maxPlayers: number
    siteFeePercent: number
    potAmount: number
    winnerUserId?: string
    createdAt: string
    startedAt?: string
    finishedAt?: string
    players: Array<{ userId: string; rolledNumber?: number; joinedAt: string }>
  }>()
  showroomVehicles = new Map<string, {
    id: string
    sourceType: "lottery_winback" | "external_purchase"
    status: "available" | "reserved" | "sold" | "archived"
    vehicle: Record<string, unknown>
    acquisitionCostIrr?: number
    listedPriceIrr?: number
    listedPriceGoldSot?: number
    createdAt: string
    updatedAt: string
  }>()
  showroomOrders = new Map<string, {
    id: string
    vehicleId: string
    buyerUserId: string
    paymentAsset: "IRR" | "GOLD_SOT" | "LOAN" | "CARD_TO_CARD"
    paymentAmount: number
    loanMonths?: number
    downPaymentIrr?: number
    loanAmountIrr?: number
    monthlyInstallmentIrr?: number
    slideDrawId?: string
    slideEntryNumbers?: number[]
    status: "pending" | "paid" | "cancelled" | "completed"
    createdAt: string
    updatedAt: string
  }>()
  cardToCardPayments = new Map<string, CardToCardPayment>()
  checkListings = new Map<string, CheckListing>()
  autoLoans = new Map<string, AutoLoan>()
  supportTickets = new Map<string, {
    id: string
    userId: string
    category: "finance" | "security" | "account" | "lottery" | "other"
    priority: "low" | "medium" | "high" | "critical"
    status: "open" | "in_progress" | "resolved" | "closed"
    subject: string
    createdAt: string
    updatedAt: string
  }>()
  supportMessages = new Map<string, {
    id: string
    ticketId: string
    senderUserId?: string
    senderRole: "user" | "admin" | "system"
    body: string
    attachments?: unknown[]
    createdAt: string
  }>()
  riskSignals = new Map<string, {
    id: string
    userId?: string
    signalType: string
    severity: "low" | "medium" | "high" | "critical"
    score: number
    details?: Record<string, unknown>
    createdAt: string
    resolvedAt?: string
  }>()
  userDevices = new Map<string, {
    id: string
    userId: string
    deviceFingerprint: string
    firstIp?: string
    lastIp?: string
    userAgent?: string
    firstSeenAt: string
    lastSeenAt: string
  }>()
  loginAttempts = new Map<string, {
    id: string
    email?: string
    userId?: string
    ip?: string
    success: boolean
    reason?: string
    createdAt: string
  }>()
  twoFactorChallenges = new Map<string, {
    id: string
    userId: string
    channel: "sms" | "email" | "totp"
    code: string
    status: "pending" | "verified" | "expired" | "failed"
    expiresAt: string
    createdAt: string
    verifiedAt?: string
  }>()
  backupJobs = new Map<string, {
    id: string
    startedAt: string
    finishedAt?: string
    status: "running" | "success" | "failed"
    storageUri?: string
    checksumSha256?: string
    errorMessage?: string
  }>()
  welcomeClaims = new Map<string, {
    registerClaimed?: boolean
    profileClaimed?: boolean
    phoneVerified?: boolean
    appInstalled?: boolean
    instantReferralClaimed?: boolean
    invitedFriendUserIds: string[]
    updatedAt: string
  }>()
  quickHitState = new Map<string, {
    totalSpins: number
    lastPlayedAt?: string
  }>()
  wheelLiveSessions = new Map<string, {
    id: string
    dateKey: string
    scheduledAt: string
    status: "scheduled" | "live" | "resolved"
    segments: Array<{ code: string; title: string; multiplier: number }>
    jackpotCode: string
    resultCode?: string
    participants: Array<{ userId: string; pickCode: string; stakeChances: number; createdAt: string }>
    createdAt: string
    updatedAt: string
  }>()
  carDuels = new Map<string, {
    id: string
    status: "waiting" | "running" | "finished" | "cancelled"
    entryChances: number
    players: Array<{ userId: string; rolledNumber?: number; joinedAt: string }>
    winnerUserId?: string
    createdAt: string
    updatedAt: string
  }>()
  carDuelChats = new Map<string, {
    id: string
    duelId: string
    userId: string
    body: string
    createdAt: string
  }>()
  dailyStreaks = new Map<string, {
    userId: string
    currentStreak: number
    lastActiveDate?: string
    updatedAt: string
  }>()
  dailyMissions = new Map<string, {
    id: string
    userId: string
    dateKey: string
    missions: Array<{
      code: "spin_wheel" | "buy_ticket" | "invite_friend"
      done: boolean
      claimed: boolean
      rewardType: "chance" | "cashback_bonus" | "gold_sot"
      rewardValue: number
    }>
    grandRewardClaimed: boolean
    createdAt: string
    updatedAt: string
  }>()
  userAchievements = new Map<string, {
    userId: string
    unlockedCodes: string[]
    updatedAt: string
  }>()
  userWishes = new Map<string, {
    id: string
    userId: string
    text: string
    likes: number
    createdAt: string
  }>()
  photoContestEntries = new Map<string, {
    id: string
    userId: string
    imageUrl: string
    caption?: string
    votes: number
    createdAt: string
  }>()
  referralDiscountCodes = new Map<string, {
    code: string
    ownerUserId: string
    discountPercent: number
    uses: number
    createdAt: string
  }>()
  blogPosts = new Map<string, BlogPost>()
  siteSettings: SiteSettings = {}
  termsText = ""
  disclaimerText = ""
  rulesText = ""
  bannersContent: Array<{ id: string; title: string; text: string; buttonText: string; buttonLink: string; active: boolean; color: string }> = [
    { id: "b1", title: "بنر بالای صفحه", text: "", buttonText: "", buttonLink: "", active: false, color: "#D4AF37" },
    { id: "b2", title: "بنر وسط صفحه", text: "", buttonText: "", buttonLink: "", active: false, color: "#00BCD4" },
    { id: "b3", title: "بنر قرعه‌کشی", text: "", buttonText: "", buttonLink: "", active: false, color: "#FF5722" },
  ]
  seoGlobalContent: { siteName: string; siteTagline: string; defaultMetaTitle: string; defaultMetaDescription: string; ogImage: string; twitterHandle: string; googleAnalyticsId: string } = {
    siteName: "", siteTagline: "", defaultMetaTitle: "", defaultMetaDescription: "", ogImage: "", twitterHandle: "", googleAnalyticsId: "",
  }
  homeContent = {
    mobileExperienceTitle: "کل سایت را راحت تجربه کن",
    mobileExperienceDescription: "مسیر خرید خودرو، قرعه کشی، بازی و کیف پول از همین صفحه برای موبایل قابل دسترسی است.",
    activeRafflesTitle: "قرعه کشی های فعال",
    activeRafflesSubtitle: "بلیط پلکانی، کش بک ۲۰٪، شانس گردونه و جوایز متنوع",
  }
  wheelConfig: WheelConfig = createDefaultWheelConfig()
  loanConfig: LoanConfig = normalizeLoanConfig(DEFAULT_LOAN_CONFIG)
  paymentConfig: PaymentConfig = normalizePaymentConfig(undefined)
  gameDifficulty = 50
  seo = {
    pages: [] as Array<{
      id: string
      path: string
      title: string
      description: string
      keywords: string[]
      ogTitle?: string
      ogDescription?: string
      ogImage?: string
      twitterCard?: string
      canonicalUrl?: string
      status: "active" | "draft"
      views?: number
      lastModified: string
    }>,
    structuredData: [] as Array<{
      id: string
      type: "article" | "product" | "organization" | "breadcrumb"
      pagePath: string
      data: Record<string, any>
      status: "active" | "draft"
    }>,
    robots: "",
    sitemapVersion: "1.0",
    robotsUpdated: new Date().toISOString(),
    totalBacklinks: 0,
    googleAnalytics: {
      gaId: "",
      trackingId: "",
      enabled: false,
      savedAt: new Date().toISOString(),
    },
    googleSearchConsole: {
      propertyId: "",
      verificationCode: "",
      enabled: false,
      verifiedAt: undefined as string | undefined,
    },
    backlinks: [] as Array<{
      domain: string
      sourceUrl: string
      anchorText: string
      authority: number
      lastChecked: string
    }>,
    competitors: [] as Array<{
      domain: string
      backlinks: number
      trafficEstimate: number
      authority: number
      keywords: number
    }>,
  }

  addLiveEvent(event: LiveEvent): void {
    this.liveEvents.unshift(event)
    if (this.liveEvents.length > 200) this.liveEvents.length = 200
    this.emit("live", event)
  }

  addAudit(log: AuditLog): void {
    this.auditLogs.unshift(log)
    if (this.auditLogs.length > 2000) this.auditLogs.length = 2000
  }

  getTicketsByRaffle(raffleId: string): Ticket[] {
    const out: Ticket[] = []
    for (const t of this.tickets.values()) {
      if (t.raffleId === raffleId) out.push(t)
    }
    return out.sort((a, b) => a.index - b.index)
  }

  getWalletTxByUser(userId: string): WalletTransaction[] {
    const out: WalletTransaction[] = []
    for (const tx of this.walletTx.values()) {
      if (tx.userId === userId) out.push(tx)
    }
    return out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }

  getCurrentPricingPolicy(): PricingPolicy | undefined {
    for (const policy of this.pricingPolicies.values()) {
      if (policy.status === "published") return policy
    }
    return undefined
  }

  getBidsByAuction(auctionId: string): AuctionBid[] {
    const out: AuctionBid[] = []
    for (const bid of this.auctionBids.values()) {
      if (bid.auctionId === auctionId) out.push(bid)
    }
    return out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }

  getWheelHistoryByUser(userId: string): WheelSpinRecord[] {
    const out: WheelSpinRecord[] = []
    for (const spin of this.wheelSpins.values()) {
      if (spin.userId === userId) out.push(spin)
    }
    return out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }

  getNotificationsByUser(userId: string): NotificationItem[] {
    const out: NotificationItem[] = []
    for (const n of this.notifications.values()) {
      if (n.userId === userId) out.push(n)
    }
    return out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }

  getSlideDraws(): SlideDraw[] {
    return Array.from(this.slideDraws.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }

  getCheckListingsByUser(userId: string): CheckListing[] {
    return Array.from(this.checkListings.values())
      .filter((item) => item.ownerUserId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }

  getCardToCardPaymentsByUser(userId: string): CardToCardPayment[] {
    return Array.from(this.cardToCardPayments.values())
      .filter((item) => item.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }
}
