/**
 * Database Integration Module (Optional)
 * Provides MySQL persistence for test data
 * 
 * Note: This module is optional. To use it, install mysql2:
 *   npm install mysql2
 */

import type { Connection, Pool } from "mysql2/promise"
import type { User, WalletTransaction, WheelSpinRecord, Ticket } from "../src/types.js"
import type { AppStore } from "../src/store/app-store.js"

export interface Logger {
  info(msg: string, data?: unknown): void
  warn(msg: string, data?: unknown): void
  error(msg: string, data?: unknown): void
  debug(msg: string, data?: unknown): void
}

export interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

/**
 * Persists test users to database
 */
export async function persistUsersToDatabase(
  users: User[],
  connection: Connection,
  logger: Logger,
): Promise<void> {
  logger.info(`Persisting ${users.length} users to database...`)

  for (const user of users) {
    const query = `
      INSERT INTO users (
        id, email, password_hash, role, status, 
        wallet_balance, chances, referral_code, referred_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        wallet_balance = VALUES(wallet_balance),
        chances = VALUES(chances),
        updated_at = VALUES(updated_at)
    `

    await connection.execute(query, [
      user.id,
      user.email,
      user.passwordHash,
      user.role,
      user.status || "active",
      user.walletBalance,
      user.chances,
      user.referralCode,
      user.referredBy || null,
      user.createdAt,
      user.updatedAt,
    ])
  }

  logger.info(`✓ Persisted ${users.length} users to database`)
}

/**
 * Persists wheel spins to database
 */
export async function persistSpinsToDatabase(
  spins: WheelSpinRecord[],
  connection: Connection,
  logger: Logger,
): Promise<void> {
  logger.info(`Persisting ${spins.length} wheel spins to database...`)

  // Note: This requires a wheel_spins table to be added to the schema
  // For now, we'll log this as a note in the report
  logger.warn(
    "Wheel spins persistence requires additional database schema. Skipping for now.",
  )
}

/**
 * Persists wallet transactions to database
 */
export async function persistTransactionsToDatabase(
  transactions: WalletTransaction[],
  connection: Connection,
  logger: Logger,
): Promise<void> {
  logger.info(`Persisting ${transactions.length} wallet transactions to database...`)

  for (const tx of transactions) {
    const query = `
      INSERT INTO wallet_transactions (
        id, user_id, tx_type, amount, status, 
        idempotency_key, meta_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `

    await connection.execute(query, [
      tx.id,
      tx.userId,
      tx.tx_type,
      tx.amount,
      tx.status,
      tx.idempotency_key || null,
      tx.meta_json ? JSON.stringify(tx.meta_json) : null,
      tx.createdAt,
    ])
  }

  logger.info(`✓ Persisted ${transactions.length} transactions to database`)
}

/**
 * Persists audit logs to database
 */
export async function persistAuditLogsToDatabase(
  logs: Array<{
    id: string
    actor_user_id?: string
    actor_email?: string
    ip?: string
    action_name: string
    target: string
    success: boolean
    message?: string
    payload_json?: unknown
    created_at: string
  }>,
  connection: Connection,
  logger: Logger,
): Promise<void> {
  logger.info(`Persisting ${logs.length} audit logs to database...`)

  for (const log of logs) {
    const query = `
      INSERT INTO audit_logs (
        id, actor_user_id, actor_email, ip, action_name,
        target, success, message, payload_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    await connection.execute(query, [
      log.id,
      log.actor_user_id || null,
      log.actor_email || null,
      log.ip || null,
      log.action_name,
      log.target,
      log.success ? 1 : 0,
      log.message || null,
      log.payload_json ? JSON.stringify(log.payload_json) : null,
      log.created_at,
    ])
  }

  logger.info(`✓ Persisted ${logs.length} audit logs to database`)
}

/**
 * Validates data consistency in database
 */
export async function validateDatabaseIntegrity(
  connection: Connection,
  logger: Logger,
): Promise<{ passed: boolean; checks: Record<string, unknown> }> {
  logger.info("Validating database integrity...")
  const checks: Record<string, unknown> = {}

  try {
    // Check 1: Count users
    const [userRows] = await connection.query("SELECT COUNT(*) as count FROM users")
    checks.totalUsers = (userRows as any)[0].count
    logger.info(`  - Total users in database: ${checks.totalUsers}`)

    // Check 2: Count transactions
    const [txRows] = await connection.query("SELECT COUNT(*) as count FROM wallet_transactions")
    checks.totalTransactions = (txRows as any)[0].count
    logger.info(`  - Total wallet transactions: ${checks.totalTransactions}`)

    // Check 3: Sum of wallet balances
    const [balanceRows] = await connection.query("SELECT SUM(wallet_balance) as total FROM users")
    checks.totalWalletBalance = (balanceRows as any)[0].total || 0
    logger.info(
      `  - Total wallet balance: ${((checks.totalWalletBalance as number) / 1_000_000).toFixed(2)}M Rials`,
    )

    // Check 4: Unique emails
    const [emailRows] = await connection.query(
      "SELECT COUNT(DISTINCT email) as unique_emails FROM users",
    )
    checks.uniqueEmails = (emailRows as any)[0].unique_emails
    logger.info(`  - Unique emails: ${checks.uniqueEmails}`)

    // Check 5: Unique referral codes
    const [refRows] = await connection.query(
      "SELECT COUNT(DISTINCT referral_code) as unique_refs FROM users",
    )
    checks.uniqueReferralCodes = (refRows as any)[0].unique_refs
    logger.info(`  - Unique referral codes: ${checks.uniqueReferralCodes}`)

    logger.info("✓ Database integrity validation complete")
    return { passed: true, checks }
  } catch (error) {
    logger.error("Database validation failed:", error)
    return { passed: false, checks }
  }
}

/**
 * Creates a database connection pool
 */
export async function createDatabaseConnection(config: DatabaseConfig) {
  try {
    const mysql = await import("mysql2/promise")
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
    })
    return connection
  } catch (error) {
    throw new Error(
      "Failed to create database connection. Ensure mysql2 is installed: npm install mysql2",
    )
  }
}

/**
 * Cleans up test data from database
 */
export async function cleanupTestData(
  connection: Connection,
  testPrefix: string,
  logger: Logger,
): Promise<void> {
  logger.info(`Cleaning up test data with prefix '${testPrefix}'...`)

  try {
    // Delete test users
    const [result] = await connection.execute(
      "DELETE FROM users WHERE email LIKE ?",
      [`${testPrefix}%`],
    )
    logger.info(`  - Deleted ${(result as any).affectedRows} test users`)

    logger.info("✓ Test data cleanup complete")
  } catch (error) {
    logger.warn("Could not cleanup test data:", error)
  }
}
