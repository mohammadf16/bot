import Fastify from "fastify"
import { env } from "./env.js"
import { bootstrapStore } from "./bootstrap.js"
import { registerAuth } from "./plugins/auth.js"
import { registerSecurity } from "./plugins/security.js"
import { registerLiveHub } from "./live-hub.js"
import { registerHealthRoutes } from "./routes/health.js"
import { registerAuthRoutes } from "./routes/auth.js"
import { registerUserRoutes } from "./routes/user.js"
import { registerWalletRoutes } from "./routes/wallet.js"
import { registerRaffleRoutes } from "./routes/raffles.js"
import { registerAdminRoutes } from "./routes/admin.js"
import { registerGameplayRoutes } from "./routes/gameplay.js"
import { registerDatabaseStatusRoutes } from "./routes/database-status.js"
import { registerEnterpriseRoutes } from "./routes/enterprise.js"
import { registerSEORoutes } from "./routes/seo.js"
import { registerSettingsRoutes } from "./routes/settings.js"
import { registerBlogRoutes } from "./routes/blog.js"
import { AppStore } from "./store/app-store.js"
import { registerStorePersistence } from "./persistence/state-persistence.js"
import { id } from "./utils/id.js"
import {
  buildDefaultRobots,
  buildSitemapXml,
  getMergedSEOPages,
  resolveRequestOrigin,
} from "./services/seo-pages.js"

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
    },
    trustProxy: true,
    // Upload requests are sent as JSON + base64 and can exceed Fastify's default 1MB limit.
    bodyLimit: Math.max(16 * 1024 * 1024, env.UPLOAD_IMAGE_MAX_BYTES * 2),
    genReqId: () => id("req"),
  })

  const store = new AppStore()
  let persistence: Awaited<ReturnType<typeof registerStorePersistence>> = null

  await registerSecurity(app)
  await registerAuth(app)
  await registerLiveHub(app, store)
  persistence = await registerStorePersistence(app, store)
  await bootstrapStore(store, app.log)
  await persistence?.flush()

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "Unhandled error")
    const isProd = env.NODE_ENV === "production"
    const err = error instanceof Error ? error : new Error("Unknown error")
    const statusCode = typeof (error as { statusCode?: unknown }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : 500
    const errorCode = statusCode === 413 ? "PAYLOAD_TOO_LARGE" : "INTERNAL_SERVER_ERROR"
    reply.code(statusCode).send({
      error: errorCode,
      message: isProd ? "Unexpected server error" : err.message,
    })
  })

  app.register(async (v1) => {
    const ctx = { app: v1, store }
    await registerHealthRoutes(ctx)
    await registerDatabaseStatusRoutes(ctx)
    await registerAuthRoutes(ctx)
    await registerUserRoutes(ctx)
    await registerWalletRoutes(ctx)
    await registerRaffleRoutes(ctx)
    await registerGameplayRoutes(ctx)
    await registerAdminRoutes(ctx)
    await registerEnterpriseRoutes(ctx)
    await registerSEORoutes(ctx)
    await registerSettingsRoutes(ctx)
    await registerBlogRoutes(ctx)
  }, { prefix: "/api/v1" })

  // Public SEO Routes
  app.get("/sitemap.xml", async (request, reply) => {
    try {
      const { pages } = await getMergedSEOPages(store.seo.pages)
      const sitemapContent = buildSitemapXml(pages, resolveRequestOrigin(request))
      reply.type("application/xml").send(sitemapContent)
    } catch {
      reply.code(500).send({ error: "Failed to serve sitemap" })
    }
  })

  app.get("/robots.txt", async (request, reply) => {
    try {
      const robotsContent = store.seo.robots.trim() || buildDefaultRobots(resolveRequestOrigin(request))
      reply.type("text/plain").send(robotsContent)
    } catch {
      reply.code(500).send({ error: "Failed to serve robots.txt" })
    }
  })

  return app
}
