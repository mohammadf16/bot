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

export async function bootstrapStore(store: AppStore, logger: FastifyBaseLogger): Promise<void> {
  const timestamp = nowIso()

  if (!store.rulesText) {
    store.rulesText = `1) �� ����� ��� � ���� ����� ����.
2) �� ���� 20 ���� �� Ș ����.
3) ������ ��� �� 5 ��� �ј� ���� �� ���.
4) �ѐ��� ���� ���� �� ��������� ���� ����� ��.`
  }

  store.wheelConfig = normalizeWheelConfig(store.wheelConfig)
  if (!store.wheelConfig.tiers.normal.segments.length) {
    store.wheelConfig = createDefaultWheelConfig()
  }

  let pricing = store.getCurrentPricingPolicy()
  if (!pricing) {
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
          fullName: "���� �����",
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
        title: "���� ����� ����� ��",
        body: "��� ������ ����� ������� ���.",
        kind: "success",
      })
    }
  }

  if (store.raffles.size === 0) {
    const serverSeed = randomHex(32)
    const raffle: Raffle = {
      id: id("raf"),
      title: "���� ��� ��ʐ� BMW X7",
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

  if (store.auctions.size === 0) {
    const auction1 = {
      id: id("auc"),
      title: "BMW X4 2022",
      description: "������ ��� ������ �� ��ј��",
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
      description: "������ ���� �� ����� ����� ���",
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

  logger.info("Bootstrap complete")
}
