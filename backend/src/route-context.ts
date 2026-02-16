import type { FastifyInstance } from "fastify"
import type { AppStore } from "./store/app-store.js"

export interface RouteContext {
  app: FastifyInstance
  store: AppStore
}
