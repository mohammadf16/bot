/**
 * Test Data Generator Module
 * Creates 100 test users with different odds/chances
 * Performs various game spins and validates database integrity
 */

import * as argon2 from "argon2"
import { id } from "../src/utils/id.js"
import { nowIso } from "../src/utils/time.js"
import { sha256Hex, randomHex } from "../src/utils/crypto.js"
import type {
  User,
  WalletTransaction,
  WheelSpinRecord,
  AuditLog,
} from "../src/types.js"
import type { AppStore } from "../src/store/app-store.js"

export interface Logger {
  info(msg: string, data?: unknown): void
  warn(msg: string, data?: unknown): void
  error(msg: string, data?: unknown): void
  debug(msg: string, data?: unknown): void
}

export interface TestConfig {
  testUserCount: number // Number of test users to create (default: 100)
  spinsPerUser: number // Number of spins per user (default: 5)
  testPrefix: string // Prefix for test data (default: "test_")
}

export interface TestReport {
  testRunId: string
  createdAt: string
  config: TestConfig
  stats: {
    usersCreated: number
    totalSpinsPerformed: number
    spinsBySegment: Record<string, number>
    walletTransactions: number
    totalWalletValue: number
    auditLogsCreated: number
  }
  validation: {
    passed: boolean
    errors: string[]
    warnings: string[]
  }
}

/**
 * Creates test users with varied chances/odds
 */
export async function createTestUsers(
  store: AppStore,
  logger: Logger,
  config: TestConfig,
): Promise<User[]> {
  logger.info(`Creating ${config.testUserCount} test users...`)
  const users: User[] = []
  const timestamp = nowIso()

  for (let i = 0; i < config.testUserCount; i++) {
    // Vary chances distribution: some users have low, medium, high chances
    const chanceVariation = [10, 20, 50, 100, 200, 500]
    const chances = chanceVariation[i % chanceVariation.length]!

    const testUser: User = {
      id: id("usr"),
      email: `${config.testPrefix}user${i + 1}@test.local`,
      passwordHash: await argon2.hash(`test${i + 1}`, { type: argon2.argon2id }),
      role: "user",
      status: "active",
      walletBalance: Math.floor(Math.random() * 10_000_000) + 1_000_000, // 1M to 11M
      chances,
      referralCode: `TST-${randomHex(8).toUpperCase()}`,
      profile: {
        fullName: `Test User ${i + 1}`,
        username: `${config.testPrefix}user${i + 1}`,
      },
      notificationPrefs: {
        email: false,
        sms: false,
        push: false,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    store.users.set(testUser.id, testUser)
    store.usersByEmail.set(testUser.email, testUser.id)
    users.push(testUser)

    if ((i + 1) % 25 === 0) {
      logger.info(`Created ${i + 1} test users`)
    }
  }

  logger.info(`✓ Created ${users.length} test users`)
  return users
}

/**
 * Performs simulated game spins for test users
 */
export async function performTestSpins(
  store: AppStore,
  users: User[],
  logger: Logger,
  config: TestConfig,
): Promise<{ spins: WheelSpinRecord[]; report: Record<string, number> }> {
  logger.info(`Performing ${config.spinsPerUser} spins per user...`)
  const spins: WheelSpinRecord[] = []
  const spinReport: Record<string, number> = {}
  const timestamp = nowIso()
  const wheelSegments = store.wheelConfig.segments

  if (wheelSegments.length === 0) {
    throw new Error("Wheel config segments not initialized")
  }

  // Initialize spin report
  for (const seg of wheelSegments) {
    spinReport[seg.label] = 0
  }

  let spinCount = 0
  for (const user of users) {
    if (user.chances < store.wheelConfig.wheelCostChances) {
      logger.debug(`User ${user.email} has insufficient chances for spin`)
      continue
    }

    for (let s = 0; s < config.spinsPerUser; s++) {
      // Simulate weighted spin
      const totalWeight = wheelSegments.reduce((sum, seg) => sum + seg.weight, 0)
      const random = Math.random() * totalWeight
      let accumulated = 0
      let selectedSegment = wheelSegments[0]!

      for (const segment of wheelSegments) {
        accumulated += segment.weight
        if (random <= accumulated) {
          selectedSegment = segment
          break
        }
      }

      const spin: WheelSpinRecord = {
        id: id("wspin"),
        userId: user.id,
        label: selectedSegment.label,
        win: !selectedSegment.label.includes("پوچ") && Math.random() < 0.3, // 30% chance excluding "پوچ"
        amount: !selectedSegment.label.includes("پوچ") ? Math.floor(Math.random() * 50_000_000) + 1_000_000 : 0,
        chancesDelta: -store.wheelConfig.wheelCostChances,
        createdAt: timestamp,
      }

      // Deduct chances from user
      user.chances = Math.max(0, user.chances - store.wheelConfig.wheelCostChances)

      // Simulate win (add to wallet if this happens)
      if (spin.win && spin.amount) {
        user.walletBalance += spin.amount
      }

      store.wheelSpins.set(spin.id, spin)
      spins.push(spin)
      spinReport[selectedSegment.label]++
      spinCount++

      if (spinCount % 50 === 0) {
        logger.info(`Performed ${spinCount} spins`)
      }
    }
  }

  logger.info(`✓ Performed ${spins.length} total spins`)
  logger.info("Spin distribution:", spinReport)
  return { spins, report: spinReport }
}

/**
 * Creates wallet transactions for testing
 */
export function createWalletTransactions(
  store: AppStore,
  users: User[],
  logger: Logger,
): WalletTransaction[] {
  logger.info("Creating wallet transactions...")
  const transactions: WalletTransaction[] = []
  const timestamp = nowIso()

  for (const user of users) {
    // Create 1-3 transactions per user
    const txCount = Math.floor(Math.random() * 3) + 1

    for (let t = 0; t < txCount; t++) {
      const txType = ["deposit", "ticket_purchase", "cashback"][Math.floor(Math.random() * 3)] as
        | "deposit"
        | "ticket_purchase"
        | "cashback"

      const tx: WalletTransaction = {
        id: id("wtx"),
        userId: user.id,
        type: txType,
        amount: Math.floor(Math.random() * 5_000_000) + 100_000,
        status: "completed",
        idempotencyKey: randomHex(32),
        meta: {
          purpose: "test",
          testRun: true,
        },
        createdAt: timestamp,
      }

      store.walletTx.set(tx.id, tx)
      transactions.push(tx)
    }
  }

  logger.info(`✓ Created ${transactions.length} wallet transactions`)
  return transactions
}

/**
 * Creates audit logs for testing
 */
export function createAuditLogs(
  store: AppStore,
  testRunId: string,
  logger: Logger,
): void {
  logger.info("Creating audit logs...")
  const timestamp = nowIso()
  const actions = ["user_created", "spin_performed", "wallet_updated", "chances_adjusted"]

  for (let i = 0; i < 100; i++) {
    const log: AuditLog = {
      id: id("audit"),
      actorUserId: undefined,
      actorEmail: "test@system.local",
      ip: "127.0.0.1",
      action: actions[Math.floor(Math.random() * actions.length)]!,
      target: `test_run_${testRunId}`,
      success: Math.random() < 0.95, // 95% success rate
      message: "Test audit log",
      payload: {
        testRun: testRunId,
        testData: true,
      },
      createdAt: timestamp,
    }
    store.addAudit(log)
  }

  logger.info(`✓ Created audit logs`)
}

/**
 * Validates data integrity
 */
export function validateDataIntegrity(
  store: AppStore,
  testUsers: User[],
  spins: WheelSpinRecord[],
  logger: Logger,
): { passed: boolean; errors: string[]; warnings: string[] } {
  logger.info("Validating data integrity...")
  const errors: string[] = []
  const warnings: string[] = []

  // Check 1: All test users exist in store
  for (const user of testUsers) {
    if (!store.users.has(user.id)) {
      errors.push(`Test user ${user.id} not found in store`)
    }
    if (!store.usersByEmail.has(user.email)) {
      errors.push(`Test user email ${user.email} not found in email index`)
    }
  }

  // Check 2: All spins reference existing users
  for (const spin of spins) {
    if (!store.users.has(spin.userId)) {
      errors.push(`Spin ${spin.id} references non-existent user ${spin.userId}`)
    }
  }

  // Check 3: Chances are non-negative
  for (const user of testUsers) {
    if (user.chances < 0) {
      errors.push(`User ${user.email} has negative chances: ${user.chances}`)
    }
  }

  // Check 4: Wallet balance is non-negative
  for (const user of testUsers) {
    if (user.walletBalance < 0) {
      warnings.push(`User ${user.email} has negative wallet balance: ${user.walletBalance}`)
    }
  }

  // Check 5: Referral codes are unique
  const referralCodes = new Set<string>()
  for (const user of store.users.values()) {
    if (referralCodes.has(user.referralCode)) {
      errors.push(`Duplicate referral code: ${user.referralCode}`)
    }
    referralCodes.add(user.referralCode)
  }

  // Check 6: Emails are unique
  const emails = new Set<string>()
  for (const user of store.users.values()) {
    if (emails.has(user.email)) {
      errors.push(`Duplicate email: ${user.email}`)
    }
    emails.add(user.email)
  }

  const passed = errors.length === 0

  if (passed) {
    logger.info("✓ All validation checks passed")
  } else {
    logger.error(`✗ Validation failed with ${errors.length} errors`)
  }

  if (warnings.length > 0) {
    logger.warn(`⚠ ${warnings.length} warnings`)
  }

  return { passed, errors, warnings }
}

/**
 * Main test execution
 */
export async function runTestSuite(
  store: AppStore,
  logger: Logger,
  config: Partial<TestConfig> = {},
): Promise<TestReport> {
  const testRunId = randomHex(16)
  const finalConfig: TestConfig = {
    testUserCount: config.testUserCount ?? 100,
    spinsPerUser: config.spinsPerUser ?? 5,
    testPrefix: config.testPrefix ?? "test_",
  }

  logger.info(`
╔════════════════════════════════════════════════════════════════╗
║                   TEST SUITE EXECUTION START                   ║
║                  Test Run ID: ${testRunId}                 ║
╚════════════════════════════════════════════════════════════════╝
`)

  try {
    // Phase 1: Create test users
    const testUsers = await createTestUsers(store, logger, finalConfig)

    // Phase 2: Create wallet transactions
    const transactions = createWalletTransactions(store, testUsers, logger)

    // Phase 3: Perform spins
    const { spins, report: spinReport } = await performTestSpins(
      store,
      testUsers,
      logger,
      finalConfig,
    )

    // Phase 4: Create audit logs
    createAuditLogs(store, testRunId, logger)

    // Phase 5: Validate
    const validation = validateDataIntegrity(store, testUsers, spins, logger)

    // Calculate stats
    const totalWalletValue = testUsers.reduce((sum, u) => sum + u.walletBalance, 0)

    const report: TestReport = {
      testRunId,
      createdAt: nowIso(),
      config: finalConfig,
      stats: {
        usersCreated: testUsers.length,
        totalSpinsPerformed: spins.length,
        spinsBySegment: spinReport,
        walletTransactions: transactions.length,
        totalWalletValue,
        auditLogsCreated: store.auditLogs.length,
      },
      validation,
    }

    // Print report
    logger.info(`
╔════════════════════════════════════════════════════════════════╗
║                       TEST REPORT                              ║
╚════════════════════════════════════════════════════════════════╝

Test Configuration:
  - Test Users: ${finalConfig.testUserCount}
  - Spins per User: ${finalConfig.spinsPerUser}
  - Test Prefix: ${finalConfig.testPrefix}

Statistics:
  - Users Created: ${report.stats.usersCreated}
  - Total Spins: ${report.stats.totalSpinsPerformed}
  - Wallet Transactions: ${report.stats.walletTransactions}
  - Total Wallet Value: ${(report.stats.totalWalletValue / 1_000_000).toFixed(2)}M Rials
  - Audit Logs: ${report.stats.auditLogsCreated}

Spin Distribution:
${Object.entries(report.stats.spinsBySegment)
  .map(([label, count]) => `  - ${label}: ${count}`)
  .join("\n")}

Validation:
  - Status: ${validation.passed ? "✓ PASSED" : "✗ FAILED"}
  - Errors: ${validation.errors.length}
  - Warnings: ${validation.warnings.length}

${validation.errors.length > 0 ? "Errors:\n" + validation.errors.map((e) => `  ✗ ${e}`).join("\n") + "\n" : ""}
${validation.warnings.length > 0 ? "Warnings:\n" + validation.warnings.map((w) => `  ⚠ ${w}`).join("\n") : ""}

╔════════════════════════════════════════════════════════════════╗
║                    TEST EXECUTION COMPLETE                     ║
╚════════════════════════════════════════════════════════════════╝
`)

    return report
  } catch (error) {
    logger.error("Test suite execution failed:", error)
    throw error
  }
}
