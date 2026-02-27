import type { AppStore } from "../store/app-store.js"
import { normalizeWheelConfig } from "../services/wheel-config.js"
import { DEFAULT_LOAN_CONFIG, normalizeLoanConfig } from "../services/loan-config.js"
import { normalizePaymentConfig } from "../services/payment-config.js"
import type {
  Auction,
  AuctionBid,
  AuditLog,
  CardToCardPayment,
  CheckListing,
  LiveEvent,
  NotificationItem,
  PricingPolicy,
  Raffle,
  RefreshSession,
  SlideDraw,
  Ticket,
  User,
  WalletTransaction,
  WheelConfig,
  WheelSpinRecord,
  LoanConfig,
  AutoLoan,
  PaymentConfig,
} from "../types.js"

export interface AppStateSnapshot {
  users: User[]
  usersByEmail: Array<[string, string]>
  refreshSessions: RefreshSession[]
  raffles: Raffle[]
  tickets: Ticket[]
  walletTx: WalletTransaction[]
  pricingPolicies: PricingPolicy[]
  auctions: Auction[]
  auctionBids: AuctionBid[]
  wheelSpins: WheelSpinRecord[]
  auditLogs: AuditLog[]
  liveEvents: LiveEvent[]
  idempotency: Array<[string, unknown]>
  notifications: NotificationItem[]
  slideDraws: SlideDraw[]
  lotteryMemory: Array<[string, { missStreak: number; pityMultiplier: number }]>
  dailySlideTargets: Array<[string, { winningNumber: number; createdBy: string; createdAt: string }]>
  battleRooms: Array<[string, {
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
  }]>
  showroomVehicles: Array<[string, {
    id: string
    sourceType: "lottery_winback" | "external_purchase"
    status: "available" | "reserved" | "sold" | "archived"
    vehicle: Record<string, unknown>
    acquisitionCostIrr?: number
    listedPriceIrr?: number
    listedPriceGoldSot?: number
    createdAt: string
    updatedAt: string
  }]>
  showroomOrders: Array<[string, {
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
  }]>
  cardToCardPayments: Array<[string, CardToCardPayment]>
  checkListings: Array<[string, CheckListing]>
  autoLoans: Array<[string, AutoLoan]>
  supportTickets: Array<[string, {
    id: string
    userId: string
    category: "finance" | "security" | "account" | "lottery" | "other"
    priority: "low" | "medium" | "high" | "critical"
    status: "open" | "in_progress" | "resolved" | "closed"
    subject: string
    createdAt: string
    updatedAt: string
  }]>
  supportMessages: Array<[string, {
    id: string
    ticketId: string
    senderUserId?: string
    senderRole: "user" | "admin" | "system"
    body: string
    attachments?: unknown[]
    createdAt: string
  }]>
  riskSignals: Array<[string, {
    id: string
    userId?: string
    signalType: string
    severity: "low" | "medium" | "high" | "critical"
    score: number
    details?: Record<string, unknown>
    createdAt: string
    resolvedAt?: string
  }]>
  userDevices: Array<[string, {
    id: string
    userId: string
    deviceFingerprint: string
    firstIp?: string
    lastIp?: string
    userAgent?: string
    firstSeenAt: string
    lastSeenAt: string
  }]>
  loginAttempts: Array<[string, {
    id: string
    email?: string
    userId?: string
    ip?: string
    success: boolean
    reason?: string
    createdAt: string
  }]>
  twoFactorChallenges: Array<[string, {
    id: string
    userId: string
    channel: "sms" | "email" | "totp"
    code: string
    status: "pending" | "verified" | "expired" | "failed"
    expiresAt: string
    createdAt: string
    verifiedAt?: string
  }]>
  backupJobs: Array<[string, {
    id: string
    startedAt: string
    finishedAt?: string
    status: "running" | "success" | "failed"
    storageUri?: string
    checksumSha256?: string
    errorMessage?: string
  }]>
  welcomeClaims: Array<[string, {
    registerClaimed?: boolean
    profileClaimed?: boolean
    phoneVerified?: boolean
    appInstalled?: boolean
    instantReferralClaimed?: boolean
    invitedFriendUserIds: string[]
    updatedAt: string
  }]>
  quickHitState: Array<[string, {
    totalSpins: number
    lastPlayedAt?: string
  }]>
  wheelLiveSessions: Array<[string, {
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
  }]>
  carDuels: Array<[string, {
    id: string
    status: "waiting" | "running" | "finished" | "cancelled"
    entryChances: number
    players: Array<{ userId: string; rolledNumber?: number; joinedAt: string }>
    winnerUserId?: string
    createdAt: string
    updatedAt: string
  }]>
  carDuelChats: Array<[string, {
    id: string
    duelId: string
    userId: string
    body: string
    createdAt: string
  }]>
  dailyStreaks: Array<[string, {
    userId: string
    currentStreak: number
    lastActiveDate?: string
    updatedAt: string
  }]>
  dailyMissions: Array<[string, {
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
  }]>
  userAchievements: Array<[string, {
    userId: string
    unlockedCodes: string[]
    updatedAt: string
  }]>
  userWishes: Array<[string, {
    id: string
    userId: string
    text: string
    likes: number
    createdAt: string
  }]>
  photoContestEntries: Array<[string, {
    id: string
    userId: string
    imageUrl: string
    caption?: string
    votes: number
    createdAt: string
  }]>
  referralDiscountCodes: Array<[string, {
    code: string
    ownerUserId: string
    discountPercent: number
    uses: number
    createdAt: string
  }]>
  termsText: string
  disclaimerText: string
  rulesText: string
  homeContent: {
    mobileExperienceTitle: string
    mobileExperienceDescription: string
    activeRafflesTitle: string
    activeRafflesSubtitle: string
  }
  wheelConfig: WheelConfig
  loanConfig?: LoanConfig
  paymentConfig?: PaymentConfig
  gameDifficulty: number
  seo?: {
    pages: Array<{
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
    }>
    structuredData: Array<{
      id: string
      type: "article" | "product" | "organization" | "breadcrumb"
      pagePath: string
      data: Record<string, any>
      status: "active" | "draft"
    }>
    robots?: string
    sitemapVersion?: string
    robotsUpdated?: string
    totalBacklinks?: number
    googleAnalytics?: {
      gaId: string
      trackingId: string
      enabled: boolean
      savedAt: string
    }
    googleSearchConsole?: {
      propertyId: string
      verificationCode: string
      enabled: boolean
      verifiedAt?: string
    }
    backlinks?: Array<{
      domain: string
      sourceUrl: string
      anchorText: string
      authority: number
      lastChecked: string
    }>
    competitors?: Array<{
      domain: string
      backlinks: number
      trafficEstimate: number
      authority: number
      keywords: number
    }>
  }
}

export function createSnapshot(store: AppStore): AppStateSnapshot {
  return {
    users: Array.from(store.users.values()),
    usersByEmail: Array.from(store.usersByEmail.entries()),
    refreshSessions: Array.from(store.refreshSessions.values()),
    raffles: Array.from(store.raffles.values()),
    tickets: Array.from(store.tickets.values()),
    walletTx: Array.from(store.walletTx.values()),
    pricingPolicies: Array.from(store.pricingPolicies.values()),
    auctions: Array.from(store.auctions.values()),
    auctionBids: Array.from(store.auctionBids.values()),
    wheelSpins: Array.from(store.wheelSpins.values()),
    auditLogs: [...store.auditLogs],
    liveEvents: [...store.liveEvents],
    idempotency: Array.from(store.idempotency.entries()),
    notifications: Array.from(store.notifications.values()),
    slideDraws: Array.from(store.slideDraws.values()),
    lotteryMemory: Array.from(store.lotteryMemory.entries()),
    dailySlideTargets: Array.from(store.dailySlideTargets.entries()),
    battleRooms: Array.from(store.battleRooms.entries()),
    showroomVehicles: Array.from(store.showroomVehicles.entries()),
    showroomOrders: Array.from(store.showroomOrders.entries()),
    cardToCardPayments: Array.from(store.cardToCardPayments.entries()),
    checkListings: Array.from(store.checkListings.entries()),
    autoLoans: Array.from(store.autoLoans.entries()),
    supportTickets: Array.from(store.supportTickets.entries()),
    supportMessages: Array.from(store.supportMessages.entries()),
    riskSignals: Array.from(store.riskSignals.entries()),
    userDevices: Array.from(store.userDevices.entries()),
    loginAttempts: Array.from(store.loginAttempts.entries()),
    twoFactorChallenges: Array.from(store.twoFactorChallenges.entries()),
    backupJobs: Array.from(store.backupJobs.entries()),
    welcomeClaims: Array.from(store.welcomeClaims.entries()),
    quickHitState: Array.from(store.quickHitState.entries()),
    wheelLiveSessions: Array.from(store.wheelLiveSessions.entries()),
    carDuels: Array.from(store.carDuels.entries()),
    carDuelChats: Array.from(store.carDuelChats.entries()),
    dailyStreaks: Array.from(store.dailyStreaks.entries()),
    dailyMissions: Array.from(store.dailyMissions.entries()),
    userAchievements: Array.from(store.userAchievements.entries()),
    userWishes: Array.from(store.userWishes.entries()),
    photoContestEntries: Array.from(store.photoContestEntries.entries()),
    referralDiscountCodes: Array.from(store.referralDiscountCodes.entries()),
    termsText: store.termsText,
    disclaimerText: store.disclaimerText,
    rulesText: store.rulesText,
    homeContent: store.homeContent,
    wheelConfig: store.wheelConfig,
    loanConfig: store.loanConfig,
    paymentConfig: store.paymentConfig,
    gameDifficulty: store.gameDifficulty,
    seo: store.seo,
  }
}

export function applySnapshot(store: AppStore, snapshot: AppStateSnapshot): void {
  store.users = new Map(snapshot.users.map((item) => [item.id, item]))
  store.usersByEmail = new Map(snapshot.usersByEmail)
  store.refreshSessions = new Map(snapshot.refreshSessions.map((item) => [item.id, item]))
  store.raffles = new Map(snapshot.raffles.map((item) => [item.id, item]))
  store.tickets = new Map(snapshot.tickets.map((item) => [item.id, item]))
  store.walletTx = new Map(snapshot.walletTx.map((item) => [item.id, item]))
  store.pricingPolicies = new Map(snapshot.pricingPolicies.map((item) => [item.id, item]))
  store.auctions = new Map(snapshot.auctions.map((item) => [item.id, item]))
  store.auctionBids = new Map(snapshot.auctionBids.map((item) => [item.id, item]))
  store.wheelSpins = new Map(snapshot.wheelSpins.map((item) => [item.id, item]))
  store.auditLogs = [...snapshot.auditLogs]
  store.liveEvents = [...snapshot.liveEvents]
  store.idempotency = new Map(snapshot.idempotency)
  store.notifications = new Map(snapshot.notifications.map((item) => [item.id, item]))
  store.slideDraws = new Map(snapshot.slideDraws.map((item) => [item.id, item]))
  store.lotteryMemory = new Map(snapshot.lotteryMemory ?? [])
  store.dailySlideTargets = new Map(snapshot.dailySlideTargets ?? [])
  store.battleRooms = new Map(snapshot.battleRooms ?? [])
  store.showroomVehicles = new Map(snapshot.showroomVehicles ?? [])
  store.showroomOrders = new Map(snapshot.showroomOrders ?? [])
  store.cardToCardPayments = new Map(snapshot.cardToCardPayments ?? [])
  store.checkListings = new Map(snapshot.checkListings ?? [])
  store.autoLoans = new Map(snapshot.autoLoans ?? [])
  store.supportTickets = new Map(snapshot.supportTickets ?? [])
  store.supportMessages = new Map(snapshot.supportMessages ?? [])
  store.riskSignals = new Map(snapshot.riskSignals ?? [])
  store.userDevices = new Map(snapshot.userDevices ?? [])
  store.loginAttempts = new Map(snapshot.loginAttempts ?? [])
  store.twoFactorChallenges = new Map(snapshot.twoFactorChallenges ?? [])
  store.backupJobs = new Map(snapshot.backupJobs ?? [])
  store.welcomeClaims = new Map(snapshot.welcomeClaims ?? [])
  store.quickHitState = new Map(snapshot.quickHitState ?? [])
  store.wheelLiveSessions = new Map(snapshot.wheelLiveSessions ?? [])
  store.carDuels = new Map(snapshot.carDuels ?? [])
  store.carDuelChats = new Map(snapshot.carDuelChats ?? [])
  store.dailyStreaks = new Map(snapshot.dailyStreaks ?? [])
  store.dailyMissions = new Map(snapshot.dailyMissions ?? [])
  store.userAchievements = new Map(snapshot.userAchievements ?? [])
  store.userWishes = new Map(snapshot.userWishes ?? [])
  store.photoContestEntries = new Map(snapshot.photoContestEntries ?? [])
  store.referralDiscountCodes = new Map(snapshot.referralDiscountCodes ?? [])
  store.termsText = snapshot.termsText ?? ""
  store.disclaimerText = snapshot.disclaimerText ?? ""
  store.rulesText = snapshot.rulesText
  store.homeContent = {
    mobileExperienceTitle: snapshot.homeContent?.mobileExperienceTitle ?? store.homeContent.mobileExperienceTitle,
    mobileExperienceDescription: snapshot.homeContent?.mobileExperienceDescription ?? store.homeContent.mobileExperienceDescription,
    activeRafflesTitle: snapshot.homeContent?.activeRafflesTitle ?? store.homeContent.activeRafflesTitle,
    activeRafflesSubtitle: snapshot.homeContent?.activeRafflesSubtitle ?? store.homeContent.activeRafflesSubtitle,
  }
  store.wheelConfig = normalizeWheelConfig(snapshot.wheelConfig)
  store.loanConfig = normalizeLoanConfig(snapshot.loanConfig ?? DEFAULT_LOAN_CONFIG)
  store.paymentConfig = normalizePaymentConfig(snapshot.paymentConfig ?? store.paymentConfig)
  store.gameDifficulty = snapshot.gameDifficulty ?? 50
  store.seo = {
    pages: snapshot.seo?.pages ?? [],
    structuredData: snapshot.seo?.structuredData ?? [],
    robots: snapshot.seo?.robots ?? "",
    sitemapVersion: snapshot.seo?.sitemapVersion ?? "1.0",
    robotsUpdated: snapshot.seo?.robotsUpdated ?? new Date().toISOString(),
    totalBacklinks: snapshot.seo?.totalBacklinks ?? 0,
    googleAnalytics: {
      gaId: snapshot.seo?.googleAnalytics?.gaId ?? "",
      trackingId: snapshot.seo?.googleAnalytics?.trackingId ?? "",
      enabled: snapshot.seo?.googleAnalytics?.enabled ?? false,
      savedAt: snapshot.seo?.googleAnalytics?.savedAt ?? new Date().toISOString(),
    },
    googleSearchConsole: {
      propertyId: snapshot.seo?.googleSearchConsole?.propertyId ?? "",
      verificationCode: snapshot.seo?.googleSearchConsole?.verificationCode ?? "",
      enabled: snapshot.seo?.googleSearchConsole?.enabled ?? false,
      verifiedAt: snapshot.seo?.googleSearchConsole?.verifiedAt,
    },
    backlinks: snapshot.seo?.backlinks ?? [],
    competitors: snapshot.seo?.competitors ?? [],
  }
}
