import { env } from "./env.js"
import { buildServer } from "./server.js"

const app = await buildServer()

try {
  await app.listen({
    port: env.PORT,
    host: env.HOST,
  })
  app.log.info(`Backend listening on http://${env.HOST}:${env.PORT}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
