import type { RouteContext } from "../route-context.js"

export async function registerHealthRoutes({ app }: RouteContext): Promise<void> {
  app.get("/health", async () => {
    return {
      status: "ok",
      service: "car-raffle-backend",
      now: new Date().toISOString(),
    }
  })
}
