/**
 * Test Runner Script
 * Executes the complete testing suite for the car lottery backend
 * Saves all test data persistently to JSON file for admin panel
 * 
 * Usage:
 *   npx tsx tests/test-runner.ts [--users 100] [--spins 5] [--export report.json]
 */

import * as fs from "node:fs"
import { AppStore } from "../src/store/app-store.js"
import { bootstrapStore } from "../src/bootstrap.js"
import { runTestSuite } from "./test-data-generator.js"
import { saveTestDatabase, exportStoreToDatabase, getTestDatabaseInfo } from "./persistent-db.js"
import type { TestConfig, Logger } from "./test-data-generator.js"

// Simple logger for CLI (no external dependencies)
const logger: Logger = {
  info: (msg: string, data?: unknown) => console.log(`ℹ ${msg}`, data ? JSON.stringify(data) : ""),
  warn: (msg: string, data?: unknown) => console.warn(`⚠ ${msg}`, data ? JSON.stringify(data) : ""),
  error: (msg: string, data?: unknown) => console.error(`✗ ${msg}`, data ? JSON.stringify(data) : ""),
  debug: (msg: string, data?: unknown) => console.log(`◯ ${msg}`, data ? JSON.stringify(data) : ""),
}

// Parse command line arguments
const args = process.argv.slice(2)
const config: Partial<TestConfig> = {
  testUserCount: parseInt(extractArg(args, "--users") || "100"),
  spinsPerUser: parseInt(extractArg(args, "--spins") || "5"),
  testPrefix: extractArg(args, "--prefix") || "test_",
}

const exportFile = extractArg(args, "--export")
const timestamp = new Date().toISOString().replace(/[:.Z]/g, "").slice(0, -4) // 20260214-103000
const defaultExportPath = `test-results-${timestamp}.json`

function extractArg(args: string[], flag: string): string | null {
  const index = args.indexOf(flag)
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1]!
  }
  return null
}

async function main() {
  logger.info(`
╔════════════════════════════════════════════════════════════════╗
║              Car Lottery Backend - Test Runner                 ║
║                   Version 1.0.0                                ║
╚════════════════════════════════════════════════════════════════╝

Configuration:
  - Test Users: ${config.testUserCount}
  - Spins per User: ${config.spinsPerUser}
  - Test Prefix: ${config.testPrefix}
  - Export Results: ${exportFile || defaultExportPath}
`)

  try {
    // Initialize store with bootstrap
    const store = new AppStore()
    logger.info("Initializing application store...")
    
    // Create a minimal FastifyBaseLogger-compatible wrapper
    const bootstrapLogger = {
      ...logger,
      child: () => logger,
      silent: false,
      trace: logger.debug,
      level: "info" as const,
      fatal: logger.error,
    }
    
    await bootstrapStore(store, bootstrapLogger)

    // Run test suite
    logger.info("Starting test execution...")
    const report = await runTestSuite(store, logger, config)

    // Export results if requested
    const finalExportPath = exportFile || defaultExportPath
    const exportContent = {
      metadata: {
        executedAt: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
      },
      testReport: report,
      storeSnapshot: {
        usersCount: store.users.size,
        wheelSpinsCount: store.wheelSpins.size,
        walletTransactionsCount: store.walletTx.size,
        auditLogsCount: store.auditLogs.length,
        rafflesCount: store.raffles.size,
      },
    }

    fs.writeFileSync(finalExportPath, JSON.stringify(exportContent, null, 2))
    logger.info(`✓ Test results exported to: ${finalExportPath}`)

    // Save test data persistently to JSON file for database
    logger.info("Saving test data persistently...")
    const persistentUsers = Array.from(store.users.values())
    const persistentTransactions = Array.from(store.walletTx.values())
    const persistentSpins = Array.from(store.wheelSpins.values())
    
    const persistentDb = exportStoreToDatabase(
      persistentUsers,
      persistentTransactions,
      persistentSpins,
      store.auditLogs,
    )
    
    try {
      saveTestDatabase(persistentDb)
      logger.info(`✓ Test data persisted to database (${persistentUsers.length} users)`)
      
      const dbInfo = getTestDatabaseInfo()
      if (dbInfo) {
        logger.info(`  📊 Database Info:`)
        logger.info(`     - Location: ${dbInfo.path}`)
        logger.info(`     - Size: ${dbInfo.size}`)
        logger.info(`     - Users: ${dbInfo.users}`)
        logger.info(`     - Transactions: ${dbInfo.transactions}`)
        logger.info(`     - Spins: ${dbInfo.spins}`)
      }
    } catch (error) {
      logger.error("Failed to save persistent database:", error)
    }

    // Print summary
    if (report.validation.passed) {
      logger.info("✓ All tests passed successfully!")
      process.exit(0)
    } else {
      logger.error(
        `✗ Tests failed with ${report.validation.errors.length} error(s)`,
      )
      process.exit(1)
    }
  } catch (error) {
    logger.error("Fatal error during test execution:", error)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error)
  process.exit(1)
})
