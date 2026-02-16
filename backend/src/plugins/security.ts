import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import type { FastifyInstance } from "fastify"
import { timingSafeEqual } from "node:crypto"
import { env } from "../env.js"

function safeEquals(a: string, b: string): boolean {
  const aa = Buffer.from(a)
  const bb = Buffer.from(b)
  if (aa.length !== bb.length) return false
  return timingSafeEqual(aa, bb)
}

function normalizeHost(rawHost: unknown): string {
  if (!rawHost) return ""
  const first = String(rawHost).split(",")[0]?.trim().toLowerCase() ?? ""
  return first
}

export async function registerSecurity(app: FastifyInstance): Promise<void> {
  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: false,
  })

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)
      if (env.corsOrigins.includes(origin)) return cb(null, true)
      return cb(new Error("CORS blocked"), false)
    },
    credentials: true,
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    keyGenerator: (req) => req.ip,
  })

  app.addHook("onRequest", async (request, reply) => {
    if (env.NODE_ENV !== "production") return
    if (!env.API_HARDENING_ENABLED) return

    const reqPath = request.url.split("?")[0] ?? "/"
    const host = normalizeHost(request.headers["x-forwarded-host"] ?? request.headers.host)

    if (env.API_STRICT_HOST_CHECK) {
      if (!host || !env.apiAllowedHosts.includes(host)) {
        return reply.code(403).send({
          error: "HOST_NOT_ALLOWED",
          message: "Request host is not allowed",
        })
      }
    }

    if (env.API_GATEWAY_TOKEN && env.API_GATEWAY_ENFORCE) {
      const requiresGatewayToken = env.apiProtectedPrefixes.some((prefix) => reqPath.startsWith(prefix))
      if (requiresGatewayToken) {
        const provided = String(request.headers["x-api-gateway-key"] ?? "")
        if (!provided || !safeEquals(provided, env.API_GATEWAY_TOKEN)) {
          return reply.code(403).send({
            error: "GATEWAY_TOKEN_REQUIRED",
            message: "Protected API route requires valid gateway token",
          })
        }
      }
    }
  })
}
