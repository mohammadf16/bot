import mysql from "mysql2/promise"
import type { RouteContext } from "../route-context.js"
import { env } from "../env.js"

export async function registerDatabaseStatusRoutes({ app, store }: RouteContext): Promise<void> {
  app.get("/status/database", async (_request, reply) => {
    if (!env.MYSQL_ENABLED) {
      return reply.code(200).send({
        status: "ok",
        database: {
          provider: "mysql",
          enabled: false,
          connected: false,
          message: "MYSQL_ENABLED=false",
        },
      })
    }

    let connection: mysql.Connection | null = null
    try {
      connection = await mysql.createConnection({
        host: env.MYSQL_HOST,
        port: env.MYSQL_PORT,
        user: env.MYSQL_USER,
        password: env.MYSQL_PASSWORD,
        database: env.MYSQL_DATABASE,
      })
      await connection.query("SELECT 1")
      return reply.code(200).send({
        status: "ok",
        database: {
          provider: "mysql",
          enabled: true,
          connected: true,
          host: env.MYSQL_HOST,
          port: env.MYSQL_PORT,
          database: env.MYSQL_DATABASE,
          stateTable: env.MYSQL_STATE_TABLE,
        },
      })
    } catch (error) {
      return reply.code(500).send({
        error: "DATABASE_STATUS_ERROR",
        message: (error as Error).message,
      })
    } finally {
      await connection?.end()
    }
  })

  app.get("/status/storage-stats", async () => {
    return {
      users: store.users.size,
      raffles: store.raffles.size,
      tickets: store.tickets.size,
      walletTransactions: store.walletTx.size,
      auctions: store.auctions.size,
      slideDraws: store.slideDraws.size,
      autoLoans: store.autoLoans.size,
      showroomVehicles: store.showroomVehicles.size,
      showroomOrders: store.showroomOrders.size,
      supportTickets: store.supportTickets.size,
      supportMessages: store.supportMessages.size,
      riskSignals: store.riskSignals.size,
      userDevices: store.userDevices.size,
      twoFactorChallenges: store.twoFactorChallenges.size,
      backups: store.backupJobs.size,
      notifications: store.notifications.size,
      auditLogs: store.auditLogs.length,
    }
  })
}
