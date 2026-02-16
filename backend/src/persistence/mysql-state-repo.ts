import mysql from "mysql2/promise"
import type { FastifyBaseLogger } from "fastify"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { env } from "../env.js"
import type { AppStateSnapshot } from "./state-snapshot.js"
import { sha256Hex } from "../utils/crypto.js"

export class MysqlStateRepo {
  private readonly tableName: string
  private pool: mysql.Pool | null = null

  constructor(tableName: string) {
    this.tableName = tableName
  }

  async init(logger: FastifyBaseLogger): Promise<void> {
    const bootstrapConnection = await mysql.createConnection({
      host: env.MYSQL_HOST,
      port: env.MYSQL_PORT,
      user: env.MYSQL_USER,
      password: env.MYSQL_PASSWORD,
      multipleStatements: true,
    })
    await bootstrapConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.MYSQL_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    await bootstrapConnection.end()

    this.pool = mysql.createPool({
      host: env.MYSQL_HOST,
      port: env.MYSQL_PORT,
      user: env.MYSQL_USER,
      password: env.MYSQL_PASSWORD,
      database: env.MYSQL_DATABASE,
      ...(env.MYSQL_SSL_REQUIRED ? { ssl: { rejectUnauthorized: true } } : {}),
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
      multipleStatements: true,
    })
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS \`${this.tableName}\` (
        id TINYINT PRIMARY KEY,
        state_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    await this.ensureRelationalTables()
    logger.info({ table: this.tableName }, "MySQL state persistence initialized")
  }

  async load(): Promise<AppStateSnapshot | null> {
    if (!this.pool) throw new Error("MySQL pool is not initialized")
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      `SELECT state_json FROM \`${this.tableName}\` WHERE id = 1 LIMIT 1`
    )
    if (rows.length === 0) return null
    const raw = rows[0]?.state_json
    if (typeof raw !== "string" || raw.length === 0) return null
    return JSON.parse(raw) as AppStateSnapshot
  }

  async save(snapshot: AppStateSnapshot): Promise<void> {
    if (!this.pool) throw new Error("MySQL pool is not initialized")
    const payload = JSON.stringify(snapshot)
    await this.pool.query(
      `INSERT INTO \`${this.tableName}\` (id, state_json) VALUES (1, ?) ON DUPLICATE KEY UPDATE state_json = VALUES(state_json)`,
      [payload]
    )
    await this.syncRelationalTables(snapshot)
  }

  async close(): Promise<void> {
    if (!this.pool) return
    await this.pool.end()
    this.pool = null
  }

  private async ensureRelationalTables(): Promise<void> {
    if (!this.pool) throw new Error("MySQL pool is not initialized")
    const thisDir = path.dirname(fileURLToPath(import.meta.url))
    const schemaPath = path.resolve(thisDir, "../../sql/schema.mysql.sql")
    const schemaSql = await readFile(schemaPath, "utf8")
    await this.pool.query(schemaSql)
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NULL,
        kind ENUM('info','success','warning') NOT NULL,
        read_at DATETIME(3) NULL,
        created_at DATETIME(3) NOT NULL,
        INDEX idx_notifications_user_created (user_id, created_at),
        CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS live_events (
        id VARCHAR(64) PRIMARY KEY,
        event_type VARCHAR(64) NOT NULL,
        level ENUM('info','warning','success') NOT NULL,
        message TEXT NOT NULL,
        data_json JSON NULL,
        created_at DATETIME(3) NOT NULL,
        INDEX idx_live_events_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS wheel_spins (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        label VARCHAR(255) NOT NULL,
        win TINYINT(1) NOT NULL,
        amount BIGINT NULL,
        chances_delta INT NOT NULL,
        created_at DATETIME(3) NOT NULL,
        INDEX idx_wheel_spins_user_created (user_id, created_at),
        CONSTRAINT fk_wheel_spins_user FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS slide_draws (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        status ENUM('scheduled','drawn','cancelled') NOT NULL,
        scheduled_at DATETIME(3) NOT NULL,
        seed_commit_hash VARCHAR(128) NOT NULL,
        encrypted_server_seed TEXT NOT NULL,
        target_number INT NULL,
        prizes_json JSON NOT NULL,
        proof_json JSON NULL,
        created_by VARCHAR(64) NOT NULL,
        created_at DATETIME(3) NOT NULL,
        updated_at DATETIME(3) NOT NULL,
        INDEX idx_slide_draws_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS slide_draw_entries (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        draw_id VARCHAR(64) NOT NULL,
        entry_number INT NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        created_at DATETIME(3) NOT NULL,
        UNIQUE KEY uq_draw_entry_number (draw_id, entry_number),
        INDEX idx_slide_entries_draw (draw_id),
        INDEX idx_slide_entries_user (user_id),
        CONSTRAINT fk_slide_entries_draw FOREIGN KEY (draw_id) REFERENCES slide_draws(id),
        CONSTRAINT fk_slide_entries_user FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS slide_draw_winners (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        draw_id VARCHAR(64) NOT NULL,
        rank_no INT NOT NULL,
        winning_number INT NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        chances_at_draw INT NOT NULL,
        prize_json JSON NOT NULL,
        UNIQUE KEY uq_draw_rank (draw_id, rank_no),
        INDEX idx_slide_winners_draw (draw_id),
        CONSTRAINT fk_slide_winners_draw FOREIGN KEY (draw_id) REFERENCES slide_draws(id),
        CONSTRAINT fk_slide_winners_user FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
  }

  private toDate(value?: string): Date | null {
    if (!value) return null
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return d
  }

  private async syncRelationalTables(snapshot: AppStateSnapshot): Promise<void> {
    if (!this.pool) throw new Error("MySQL pool is not initialized")
    const conn = await this.pool.getConnection()
    try {
      await conn.beginTransaction()

      await conn.query("DELETE FROM support_messages")
      await conn.query("DELETE FROM support_tickets")
      await conn.query("DELETE FROM showroom_orders")
      await conn.query("DELETE FROM showroom_vehicles")
      await conn.query("DELETE FROM auto_loans")
      await conn.query("DELETE FROM user_devices")
      await conn.query("DELETE FROM user_2fa_challenges")
      await conn.query("DELETE FROM login_attempts")
      await conn.query("DELETE FROM risk_signals")
      await conn.query("DELETE FROM backup_jobs")
      await conn.query("DELETE FROM slide_battle_room_players")
      await conn.query("DELETE FROM slide_battle_rooms")
      await conn.query("DELETE FROM slide_single_attempts")
      await conn.query("DELETE FROM slide_single_daily_target")
      await conn.query("DELETE FROM slide_draw_winners")
      await conn.query("DELETE FROM slide_draw_entries")
      await conn.query("DELETE FROM slide_draws")
      await conn.query("DELETE FROM wheel_spins_v2")
      await conn.query("DELETE FROM wheel_spins")
      await conn.query("DELETE FROM live_events")
      await conn.query("DELETE FROM notifications")
      await conn.query("DELETE FROM tickets")
      await conn.query("DELETE FROM wallet_transactions")
      await conn.query("DELETE FROM refresh_sessions")
      await conn.query("DELETE FROM raffles")
      await conn.query("DELETE FROM pricing_policies")
      await conn.query("DELETE FROM audit_logs")
      await conn.query("DELETE FROM users")

      for (const user of snapshot.users) {
        await conn.query(
          `INSERT INTO users (
            id, email, password_hash, role, status, wallet_balance, gold_sot_balance, chances, vip_level_id, vip_level_name,
            vip_cashback_percent, vip_until, total_tickets_bought, total_spend_irr, active_referrals, loan_locked_balance,
            profile_json, notification_prefs_json, referral_code, referred_by, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            user.email,
            user.passwordHash,
            user.role,
            user.status ?? "active",
            user.walletBalance,
            user.goldSotBalance ?? 0,
            user.chances,
            user.vipLevelId ?? null,
            user.vipLevelName ?? null,
            user.vipCashbackPercent ?? null,
            this.toDate(user.vipUntil),
            user.totalTicketsBought ?? 0,
            user.totalSpendIrr ?? 0,
            user.activeReferrals ?? 0,
            user.loanLockedBalance ?? 0,
            user.profile ? JSON.stringify(user.profile) : null,
            user.notificationPrefs ? JSON.stringify(user.notificationPrefs) : null,
            user.referralCode,
            user.referredBy ?? null,
            this.toDate(user.createdAt),
            this.toDate(user.updatedAt),
          ]
        )
      }

      for (const session of snapshot.refreshSessions) {
        await conn.query(
          `INSERT INTO refresh_sessions (id, user_id, token_hash, expires_at, revoked_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            session.id,
            session.userId,
            session.tokenHash,
            this.toDate(session.expiresAt),
            this.toDate(session.revokedAt),
            this.toDate(session.createdAt),
          ]
        )
      }

      for (const policy of snapshot.pricingPolicies) {
        await conn.query(
          `INSERT INTO pricing_policies (id, version, status, tiers_json, config_json, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            policy.id,
            policy.version,
            policy.status,
            JSON.stringify(policy.tiers),
            JSON.stringify(policy.config),
            policy.createdBy,
            this.toDate(policy.createdAt),
            this.toDate(policy.updatedAt),
          ]
        )
      }

      for (const raffle of snapshot.raffles) {
        await conn.query(
          `INSERT INTO raffles (id, title, max_tickets, tickets_sold, status, tiers_json, config_json, seed_commit_hash, encrypted_server_seed, proof_json, created_by, opened_at, closed_at, drawn_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            raffle.id,
            raffle.title,
            raffle.maxTickets,
            raffle.ticketsSold,
            raffle.status,
            JSON.stringify(raffle.tiers),
            JSON.stringify(raffle.config),
            raffle.seedCommitHash,
            raffle.encryptedServerSeed,
            raffle.proof ? JSON.stringify(raffle.proof) : null,
            raffle.createdBy,
            this.toDate(raffle.openedAt),
            this.toDate(raffle.closedAt),
            this.toDate(raffle.drawnAt),
            this.toDate(raffle.createdAt),
            this.toDate(raffle.updatedAt),
          ]
        )
      }

      for (const ticket of snapshot.tickets) {
        await conn.query(
          `INSERT INTO tickets (id, raffle_id, user_id, ticket_index, price_paid, client_seed, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            ticket.id,
            ticket.raffleId,
            ticket.userId,
            ticket.index,
            ticket.pricePaid,
            ticket.clientSeed,
            this.toDate(ticket.createdAt),
          ]
        )
      }

      for (const tx of snapshot.walletTx) {
        await conn.query(
          `INSERT INTO wallet_transactions (id, user_id, tx_type, amount, status, idempotency_key, meta_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tx.id,
            tx.userId,
            tx.type,
            tx.amount,
            tx.status,
            tx.idempotencyKey ?? null,
            tx.meta ? JSON.stringify(tx.meta) : null,
            this.toDate(tx.createdAt),
          ]
        )
      }

      for (const log of snapshot.auditLogs) {
        await conn.query(
          `INSERT INTO audit_logs (id, actor_user_id, actor_email, ip, action_name, target, success, message, payload_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            log.id,
            log.actorUserId ?? null,
            log.actorEmail ?? null,
            log.ip ?? null,
            log.action,
            log.target,
            log.success ? 1 : 0,
            log.message ?? null,
            log.payload ? JSON.stringify(log.payload) : null,
            this.toDate(log.createdAt),
          ]
        )
      }

      for (const n of snapshot.notifications) {
        await conn.query(
          `INSERT INTO notifications (id, user_id, title, body, kind, read_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            n.id,
            n.userId,
            n.title,
            n.body ?? null,
            n.kind,
            this.toDate(n.readAt),
            this.toDate(n.createdAt),
          ]
        )
      }

      for (const evt of snapshot.liveEvents) {
        await conn.query(
          `INSERT INTO live_events (id, event_type, level, message, data_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            evt.id,
            evt.type,
            evt.level,
            evt.message,
            evt.data ? JSON.stringify(evt.data) : null,
            this.toDate(evt.createdAt),
          ]
        )
      }

      for (const spin of snapshot.wheelSpins) {
        await conn.query(
          `INSERT INTO wheel_spins (id, user_id, label, win, amount, chances_delta, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            spin.id,
            spin.userId,
            spin.label,
            spin.win ? 1 : 0,
            spin.amount ?? null,
            spin.chancesDelta,
            this.toDate(spin.createdAt),
          ]
        )
      }

      for (const draw of snapshot.slideDraws) {
        await conn.query(
          `INSERT INTO slide_draws (id, title, status, scheduled_at, seed_commit_hash, encrypted_server_seed, target_number, prizes_json, proof_json, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            draw.id,
            draw.title,
            draw.status,
            this.toDate(draw.scheduledAt),
            draw.seedCommitHash,
            draw.encryptedServerSeed,
            draw.targetNumber ?? null,
            JSON.stringify(draw.prizes),
            draw.proof ? JSON.stringify(draw.proof) : null,
            draw.createdBy,
            this.toDate(draw.createdAt),
            this.toDate(draw.updatedAt),
          ]
        )
        for (const entry of draw.entries ?? []) {
          await conn.query(
            `INSERT INTO slide_draw_entries (draw_id, entry_number, user_id, created_at)
             VALUES (?, ?, ?, ?)`,
            [
              draw.id,
              entry.entryNumber,
              entry.userId,
              this.toDate(entry.createdAt),
            ]
          )
        }
        for (const winner of draw.winners ?? []) {
          await conn.query(
            `INSERT INTO slide_draw_winners (draw_id, rank_no, winning_number, user_id, chances_at_draw, prize_json)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              draw.id,
              winner.rank,
              winner.winningNumber,
              winner.userId,
              winner.chancesAtDraw,
              JSON.stringify(winner.prize),
            ]
          )
        }
      }

      for (const [, vehicle] of snapshot.showroomVehicles ?? []) {
        await conn.query(
          `INSERT INTO showroom_vehicles (id, source_type, status, vehicle_json, acquisition_cost_irr, listed_price_irr, listed_price_gold_sot, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            vehicle.id,
            vehicle.sourceType,
            vehicle.status,
            JSON.stringify(vehicle.vehicle ?? {}),
            vehicle.acquisitionCostIrr ?? null,
            vehicle.listedPriceIrr ?? null,
            vehicle.listedPriceGoldSot ?? null,
            this.toDate(vehicle.createdAt),
            this.toDate(vehicle.updatedAt),
          ]
        )
      }

      for (const [, order] of snapshot.showroomOrders ?? []) {
        await conn.query(
          `INSERT INTO showroom_orders (id, vehicle_id, buyer_user_id, payment_asset, payment_amount, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            order.id,
            order.vehicleId,
            order.buyerUserId,
            order.paymentAsset,
            order.paymentAmount,
            order.status,
            this.toDate(order.createdAt),
            this.toDate(order.updatedAt),
          ]
        )
      }

      for (const [, loan] of snapshot.autoLoans ?? []) {
        await conn.query(
          `INSERT INTO auto_loans (id, user_id, principal_irr, outstanding_irr, status, restricted_usage, approved_by, created_at, updated_at, due_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            loan.id,
            loan.userId,
            loan.principalIrr,
            loan.outstandingIrr,
            loan.status,
            loan.restrictedUsage ? 1 : 0,
            loan.approvedBy ?? null,
            this.toDate(loan.createdAt),
            this.toDate(loan.updatedAt),
            this.toDate(loan.dueAt),
          ]
        )
      }

      for (const [, ticket] of snapshot.supportTickets ?? []) {
        await conn.query(
          `INSERT INTO support_tickets (id, user_id, category, priority, status, subject, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ticket.id,
            ticket.userId,
            ticket.category,
            ticket.priority,
            ticket.status,
            ticket.subject,
            this.toDate(ticket.createdAt),
            this.toDate(ticket.updatedAt),
          ]
        )
      }

      for (const [, message] of snapshot.supportMessages ?? []) {
        await conn.query(
          `INSERT INTO support_messages (ticket_id, sender_user_id, sender_role, body, attachments_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            message.ticketId,
            message.senderUserId ?? null,
            message.senderRole,
            message.body,
            message.attachments ? JSON.stringify(message.attachments) : null,
            this.toDate(message.createdAt),
          ]
        )
      }

      for (const [, signal] of snapshot.riskSignals ?? []) {
        await conn.query(
          `INSERT INTO risk_signals (user_id, signal_type, severity, score, details_json, created_at, resolved_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            signal.userId ?? null,
            signal.signalType,
            signal.severity,
            signal.score,
            signal.details ? JSON.stringify(signal.details) : null,
            this.toDate(signal.createdAt),
            this.toDate(signal.resolvedAt),
          ]
        )
      }

      for (const [, device] of snapshot.userDevices ?? []) {
        await conn.query(
          `INSERT INTO user_devices (id, user_id, device_fingerprint, first_ip, last_ip, user_agent, first_seen_at, last_seen_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            device.id,
            device.userId,
            device.deviceFingerprint,
            device.firstIp ?? null,
            device.lastIp ?? null,
            device.userAgent ?? null,
            this.toDate(device.firstSeenAt),
            this.toDate(device.lastSeenAt),
          ]
        )
      }

      for (const [, attempt] of snapshot.loginAttempts ?? []) {
        await conn.query(
          `INSERT INTO login_attempts (email, user_id, ip, success, reason, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            attempt.email ?? null,
            attempt.userId ?? null,
            attempt.ip ?? null,
            attempt.success ? 1 : 0,
            attempt.reason ?? null,
            this.toDate(attempt.createdAt),
          ]
        )
      }

      for (const [, challenge] of snapshot.twoFactorChallenges ?? []) {
        await conn.query(
          `INSERT INTO user_2fa_challenges (id, user_id, channel, code_hash, status, expires_at, created_at, verified_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            challenge.id,
            challenge.userId,
            challenge.channel,
            sha256Hex(challenge.code),
            challenge.status,
            this.toDate(challenge.expiresAt),
            this.toDate(challenge.createdAt),
            this.toDate(challenge.verifiedAt),
          ]
        )
      }

      for (const [, job] of snapshot.backupJobs ?? []) {
        await conn.query(
          `INSERT INTO backup_jobs (id, started_at, finished_at, status, storage_uri, checksum_sha256, error_message)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            job.id,
            this.toDate(job.startedAt),
            this.toDate(job.finishedAt),
            job.status,
            job.storageUri ?? null,
            job.checksumSha256 ?? null,
            job.errorMessage ?? null,
          ]
        )
      }

      for (const [, room] of snapshot.battleRooms ?? []) {
        await conn.query(
          `INSERT INTO slide_battle_rooms (id, status, entry_asset, entry_amount, max_players, site_fee_percent, winner_user_id, pot_amount, created_at, started_at, finished_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            room.id,
            room.status,
            room.entryAsset,
            room.entryAmount,
            room.maxPlayers,
            room.siteFeePercent,
            room.winnerUserId ?? null,
            room.potAmount,
            this.toDate(room.createdAt),
            this.toDate(room.startedAt),
            this.toDate(room.finishedAt),
          ]
        )
        for (const player of room.players ?? []) {
          await conn.query(
            `INSERT INTO slide_battle_room_players (room_id, user_id, rolled_number, is_winner, joined_at)
             VALUES (?, ?, ?, ?, ?)`,
            [
              room.id,
              player.userId,
              player.rolledNumber ?? null,
              room.winnerUserId === player.userId ? 1 : 0,
              this.toDate(player.joinedAt),
            ]
          )
        }
      }

      await conn.commit()
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }
}
