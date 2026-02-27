import argon2 from "argon2"
import type { FastifyBaseLogger } from "fastify"
import { env } from "./env.js"
import { id } from "./utils/id.js"
import { nowIso } from "./utils/time.js"
import { AppStore } from "./store/app-store.js"
import { encryptText, randomHex, sha256Hex } from "./utils/crypto.js"
import type { PricingPolicy, Raffle, User } from "./types.js"
import { pushUserNotification } from "./services/notifications.js"
import { createDefaultWheelConfig, normalizeWheelConfig } from "./services/wheel-config.js"
import { DEFAULT_LOAN_CONFIG, normalizeLoanConfig } from "./services/loan-config.js"
import { normalizePaymentConfig } from "./services/payment-config.js"

const DEFAULT_RULES_TEXT = `1) هر کاربر فقط یک حساب فعال می تواند داشته باشد.
2) حداقل سن شرکت در قرعه کشی 18 سال است.
3) برداشت وجه تا 5 روز کاری پس از تایید انجام می شود.
4) پرداخت ها فقط از مسیرهای رسمی پلتفرم معتبر هستند.`

const DEFAULT_HOME_CONTENT = {
  mobileExperienceTitle: "کل سایت را راحت تجربه کن",
  mobileExperienceDescription: "مسیر خرید خودرو، قرعه کشی، بازی و کیف پول از همین صفحه برای موبایل قابل دسترسی است.",
  activeRafflesTitle: "قرعه کشی های فعال",
  activeRafflesSubtitle: "بلیط پلکانی، کش بک جذاب، شانس گردونه و جوایز متنوع",
}

function hasCorruptedText(value?: string): boolean {
  if (typeof value !== "string") return false
  if (value.includes("�")) return true
  if (value.includes("ï؟½")) return true
  return /(?:[طظ][\u0600-\u06FF]){3,}/.test(value)
}

export async function bootstrapStore(store: AppStore, logger: FastifyBaseLogger): Promise<void> {
  const timestamp = nowIso()
  const allowSeedData = env.BOOTSTRAP_SEED_DATA

  if (!store.rulesText && allowSeedData) {
    store.rulesText = DEFAULT_RULES_TEXT
  } else if (hasCorruptedText(store.rulesText)) {
    store.rulesText = DEFAULT_RULES_TEXT
  }

  const homeContent = store.homeContent ?? DEFAULT_HOME_CONTENT
  const shouldFixHomeContent =
    hasCorruptedText(homeContent.mobileExperienceTitle) ||
    hasCorruptedText(homeContent.mobileExperienceDescription) ||
    hasCorruptedText(homeContent.activeRafflesTitle) ||
    hasCorruptedText(homeContent.activeRafflesSubtitle)

  if (shouldFixHomeContent) {
    store.homeContent = { ...DEFAULT_HOME_CONTENT }
  }

  store.wheelConfig = normalizeWheelConfig(store.wheelConfig)
  if (!store.wheelConfig.tiers.normal.segments.length) {
    store.wheelConfig = createDefaultWheelConfig()
  }
  store.loanConfig = normalizeLoanConfig(store.loanConfig ?? DEFAULT_LOAN_CONFIG)
  store.paymentConfig = normalizePaymentConfig(store.paymentConfig, {
    fallbackCardToCardDestination: env.CARD_TO_CARD_DESTINATION_CARD,
  })

  let pricing = store.getCurrentPricingPolicy()
  if (!pricing && allowSeedData) {
    const policy: PricingPolicy = {
      id: id("policy"),
      version: "v1-published",
      status: "published",
      tiers: [
        { order: 1, price: 1_000_000, discountPercent: 0 },
        { order: 2, price: 800_000, discountPercent: 20 },
        { order: 3, price: 640_000, discountPercent: 36 },
        { order: 4, price: 512_000, discountPercent: 48 },
      ],
      config: {
        cashbackPercent: 20,
        wheelChancePerTicket: 1,
        lotteryChancePerTicket: 1,
        freeEntryEveryN: 5,
      },
      createdBy: "system",
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    store.pricingPolicies.set(policy.id, policy)
    pricing = policy
  }

  if (env.BOOTSTRAP_ADMIN_EMAIL && env.BOOTSTRAP_ADMIN_PASSWORD) {
    const email = env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
    if (!store.usersByEmail.has(email)) {
      const admin: User = {
        id: id("usr"),
        email,
        passwordHash: await argon2.hash(env.BOOTSTRAP_ADMIN_PASSWORD, { type: argon2.argon2id }),
        role: "admin",
        status: "active",
        walletBalance: 0,
        chances: 0,
        referralCode: `ADM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        profile: {
          fullName: "مدیر سیستم",
        },
        notificationPrefs: {
          email: true,
          sms: false,
          push: true,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      store.users.set(admin.id, admin)
      store.usersByEmail.set(admin.email, admin.id)
      logger.info({ email: admin.email }, "Bootstrap admin user created")
      pushUserNotification(store, {
        userId: admin.id,
        title: "حساب مدیر اولیه ساخته شد",
        body: "برای امنیت، لطفا رمز عبور پیش فرض را تغییر دهید.",
        kind: "success",
      })
    }
  }

  for (const user of store.users.values()) {
    if (user.role !== "admin") continue
    const fullName = user.profile?.fullName
    if (!hasCorruptedText(fullName)) continue
    user.profile = { ...(user.profile ?? {}), fullName: "مدیر سیستم" }
    user.updatedAt = nowIso()
    store.users.set(user.id, user)
  }
  for (const notification of store.notifications.values()) {
    let changed = false
    if (hasCorruptedText(notification.title)) {
      notification.title = "اعلان سیستم"
      changed = true
    }
    if (hasCorruptedText(notification.body)) {
      notification.body = "پیام سیستمی ثبت شده است."
      changed = true
    }
    if (changed) {
      store.notifications.set(notification.id, notification)
    }
  }

  if (allowSeedData && store.raffles.size === 0 && pricing) {
    const serverSeed = randomHex(32)
    const raffle: Raffle = {
      id: id("raf"),
      title: "قرعه کشی ویژه BMW X7",
      maxTickets: 1000,
      ticketsSold: 0,
      status: "open",
      tiers: pricing.tiers,
      config: pricing.config,
      seedCommitHash: sha256Hex(serverSeed),
      encryptedServerSeed: encryptText(serverSeed, env.SEED_ENCRYPTION_KEY),
      createdBy: "system",
      openedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    store.raffles.set(raffle.id, raffle)
  }
  for (const raffle of store.raffles.values()) {
    if (!hasCorruptedText(raffle.title)) continue
    raffle.title = "قرعه کشی ویژه خودرو"
    raffle.updatedAt = nowIso()
    store.raffles.set(raffle.id, raffle)
  }

  if (allowSeedData && store.auctions.size === 0) {
    const auction1 = {
      id: id("auc"),
      title: "BMW X4 2022",
      description: "کارکرد پایین و سرویس کامل نمایندگی",
      imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200",
      startPrice: 4_500_000_000,
      currentBid: 4_850_000_000,
      status: "open" as const,
      endAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
      createdBy: "system",
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const auction2 = {
      id: id("auc"),
      title: "Mercedes C200 2021",
      description: "شرایط فنی عالی با سوابق نگهداری کامل",
      imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200",
      startPrice: 5_100_000_000,
      currentBid: 5_400_000_000,
      status: "open" as const,
      endAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
      createdBy: "system",
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    store.auctions.set(auction1.id, auction1)
    store.auctions.set(auction2.id, auction2)
  }
  for (const auction of store.auctions.values()) {
    let changed = false
    if (hasCorruptedText(auction.title)) {
      auction.title = "مزایده خودرو"
      changed = true
    }
    if (hasCorruptedText(auction.description)) {
      auction.description = "اطلاعات مزایده این خودرو توسط ادمین تکمیل شده است."
      changed = true
    }
    if (changed) {
      auction.updatedAt = nowIso()
      store.auctions.set(auction.id, auction)
    }
  }

  logger.info("Bootstrap complete")
}
