import jwt from "@fastify/jwt"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { env } from "../env.js"

async function authenticate(this: FastifyInstance, request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    reply.code(401).send({ error: "AUTH_REQUIRED" })
  }
}

async function adminOnly(this: FastifyInstance, request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    reply.code(401).send({ error: "AUTH_REQUIRED" })
    return
  }
  if (request.user.role !== "admin") {
    reply.code(403).send({ error: "ADMIN_ONLY" })
  }
}

export async function registerAuth(app: FastifyInstance): Promise<void> {
  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: {
      expiresIn: env.JWT_ACCESS_TTL,
    },
  })

  app.decorate("authenticate", authenticate)
  app.decorate("adminOnly", adminOnly)
}
