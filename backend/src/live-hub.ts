import websocket from "@fastify/websocket"
import type { FastifyInstance } from "fastify"
import type { AppStore } from "./store/app-store.js"
import type { LiveEvent } from "./types.js"

export async function registerLiveHub(app: FastifyInstance, store: AppStore): Promise<void> {
  await app.register(websocket)

  await app.register(async function liveRoutes(fastify) {
    fastify.get(
      "/live",
      { websocket: true },
      async (connection) => {
        const viewer = await resolveViewer(app, connection)

        const sendJson = (payload: unknown) => {
          connection.socket.send(JSON.stringify(payload))
        }

        sendJson({
          type: "snapshot",
          payload: {
            connectedAt: new Date().toISOString(),
            recentEvents: store.liveEvents.filter((event) => canReceiveEvent(event, viewer)).slice(0, 20),
            metrics: buildLiveMetrics(store, viewer),
          },
        })

        const onLive = (event: LiveEvent) => {
          if (!canReceiveEvent(event, viewer)) return
          sendJson({ type: "event", payload: event })
        }
        store.on("live", onLive)

        const interval = setInterval(() => {
          sendJson({ type: "metrics", payload: buildLiveMetrics(store, viewer) })
        }, 5000)

        connection.socket.on("close", () => {
          clearInterval(interval)
          store.off("live", onLive)
        })
      },
    )
  })
}

type Viewer = {
  role: "public" | "user" | "admin"
  sub?: string
}

async function resolveViewer(app: FastifyInstance, connection: { request?: { query?: Record<string, unknown>; headers?: Record<string, unknown> } }): Promise<Viewer> {
  const tokenFromQuery = typeof connection.request?.query?.["token"] === "string"
    ? String(connection.request?.query?.["token"])
    : ""
  const authHeader = typeof connection.request?.headers?.["authorization"] === "string"
    ? String(connection.request?.headers?.["authorization"])
    : ""
  const tokenFromHeader = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : ""
  const token = tokenFromQuery || tokenFromHeader
  if (!token) return { role: "public" }
  try {
    const payload = await app.jwt.verify<{
      sub: string
      role: "user" | "admin"
      email: string
    }>(token)
    return { role: payload.role, sub: payload.sub }
  } catch {
    return { role: "public" }
  }
}

function canReceiveEvent(event: LiveEvent, viewer: Viewer): boolean {
  if (viewer.role === "admin") return true
  const eventData = (event.data ?? {}) as Record<string, unknown>
  const userScopedId = typeof eventData["userId"] === "string" ? eventData["userId"] : undefined
  const buyerScopedId = typeof eventData["buyerUserId"] === "string" ? eventData["buyerUserId"] : undefined
  if (viewer.role === "user") {
    if (userScopedId && viewer.sub && userScopedId === viewer.sub) return true
    if (buyerScopedId && viewer.sub && buyerScopedId === viewer.sub) return true
  }
  return event.type === "raffle.open" || event.type === "raffle.close" || event.type === "raffle.draw" || event.type === "system.info"
}

function buildLiveMetrics(store: AppStore, viewer: Viewer): Record<string, number> {
  const openRaffles = Array.from(store.raffles.values()).filter((r) => r.status === "open").length
  const base = {
    openRaffles,
    totalTickets: store.tickets.size,
  }
  if (viewer.role !== "admin") return base
  const pendingWithdrawals = Array.from(store.walletTx.values()).filter((t) => t.type === "withdraw_request" && t.status === "pending").length
  return {
    ...base,
    pendingWithdrawals,
    totalUsers: store.users.size,
  }
}
