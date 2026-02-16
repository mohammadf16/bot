import type { FastifyRequest } from "fastify"
import type { AppStore } from "../store/app-store.js"
import type { LiveEvent } from "../types.js"
import { id } from "../utils/id.js"
import { nowIso } from "../utils/time.js"

export function pushLiveEvent(store: AppStore, event: Omit<LiveEvent, "id" | "createdAt">): void {
  store.addLiveEvent({
    id: id("evt"),
    createdAt: nowIso(),
    ...event,
  })
}

export function pushAudit(
  store: AppStore,
  request: FastifyRequest,
  args: {
    action: string
    target: string
    success: boolean
    message?: string
    payload?: Record<string, unknown>
  },
): void {
  store.addAudit({
    id: id("aud"),
    actorUserId: request.user?.sub,
    actorEmail: request.user?.email,
    ip: request.ip,
    action: args.action,
    target: args.target,
    success: args.success,
    message: args.message,
    payload: args.payload,
    createdAt: nowIso(),
  })
}

export function pushSystemAudit(
  store: AppStore,
  args: {
    action: string
    target: string
    success: boolean
    message?: string
    payload?: Record<string, unknown>
  },
): void {
  store.addAudit({
    id: id("aud"),
    actorUserId: "system",
    actorEmail: "system@local",
    ip: "127.0.0.1",
    action: args.action,
    target: args.target,
    success: args.success,
    message: args.message,
    payload: args.payload,
    createdAt: nowIso(),
  })
}
