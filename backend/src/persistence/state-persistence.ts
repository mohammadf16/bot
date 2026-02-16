import type { FastifyInstance } from "fastify"
import type { AppStore } from "../store/app-store.js"
import { env } from "../env.js"
import { MysqlStateRepo } from "./mysql-state-repo.js"
import { applySnapshot, createSnapshot } from "./state-snapshot.js"

export interface StorePersistence {
  flush: () => Promise<void>
}

export async function registerStorePersistence(
  app: FastifyInstance,
  store: AppStore
): Promise<StorePersistence | null> {
  if (!env.MYSQL_ENABLED) {
    app.log.warn("MySQL persistence is disabled (MYSQL_ENABLED=false)")
    return null
  }

  const repo = new MysqlStateRepo(env.MYSQL_STATE_TABLE)
  try {
    await repo.init(app.log)
  } catch (error) {
    if (env.MYSQL_STRICT) throw error
    app.log.error({ err: error }, "MySQL init failed, fallback to in-memory mode")
    return null
  }

  const snapshot = await repo.load()
  if (snapshot) {
    applySnapshot(store, snapshot)
    app.log.info("State restored from MySQL snapshot")
  } else {
    app.log.info("No MySQL snapshot found, bootstrapping fresh state")
  }

  let saveInProgress = false
  let pendingSave = false

  const flush = async () => {
    if (saveInProgress) {
      pendingSave = true
      return
    }
    saveInProgress = true
    try {
      await repo.save(createSnapshot(store))
    } finally {
      saveInProgress = false
      if (pendingSave) {
        pendingSave = false
        await flush()
      }
    }
  }

  app.addHook("onResponse", async (request) => {
    if (request.url.startsWith("/api/v1/health")) return
    try {
      await flush()
    } catch (error) {
      app.log.error({ err: error }, "Failed to persist state to MySQL")
      throw error
    }
  })

  app.addHook("onClose", async () => {
    await flush()
    await repo.close()
  })

  return { flush }
}
