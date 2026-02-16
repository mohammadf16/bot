import "@fastify/jwt"
import "fastify"

declare module "fastify" {
  interface FastifyInstance {
    authenticate: import("fastify").preHandlerHookHandler
    adminOnly: import("fastify").preHandlerHookHandler
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string
      role: "user" | "admin"
      email: string
    }
    user: {
      sub: string
      role: "user" | "admin"
      email: string
      iat?: number
      exp?: number
    }
  }
}
