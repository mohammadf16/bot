import test from "node:test"
import assert from "node:assert/strict"

test("api flow: register -> login -> deposit -> buy ticket -> admin metrics", async () => {
  process.env.NODE_ENV = "test"
  process.env.JWT_ACCESS_SECRET = "test_access_secret_test_access_secret_12345"
  process.env.JWT_REFRESH_SECRET = "test_refresh_secret_test_refresh_secret_12345"
  process.env.SEED_ENCRYPTION_KEY = "test_seed_encryption_key_test_seed_encryption_key_12345"
  process.env.BOOTSTRAP_ADMIN_EMAIL = "admin@test.local"
  process.env.BOOTSTRAP_ADMIN_PASSWORD = "StrongAdminPass_12345"
  process.env.MYSQL_ENABLED = "false"

  const { buildServer } = await import("../src/server.js")
  const app = await buildServer()

  const userEmail = "user1@test.local"
  const userPass = "StrongUserPass_12345"

  const regRes = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: { email: userEmail, password: userPass },
  })
  assert.equal(regRes.statusCode, 201)

  const userLoginRes = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email: userEmail, password: userPass },
  })
  assert.equal(userLoginRes.statusCode, 200)
  const userLogin = userLoginRes.json() as { accessToken: string }
  assert.ok(userLogin.accessToken)

  const depositRes = await app.inject({
    method: "POST",
    url: "/api/v1/wallet/deposit",
    headers: {
      authorization: `Bearer ${userLogin.accessToken}`,
      "idempotency-key": "dep-1",
    },
    payload: { amount: 5_000_000 },
  })
  assert.equal(depositRes.statusCode, 200)

  const listRafflesRes = await app.inject({
    method: "GET",
    url: "/api/v1/raffles",
  })
  assert.equal(listRafflesRes.statusCode, 200)
  const raffles = (listRafflesRes.json() as { items: Array<{ id: string }> }).items
  assert.ok(raffles.length > 0)
  const raffleId = raffles[0]!.id

  const buyRes = await app.inject({
    method: "POST",
    url: `/api/v1/raffles/${raffleId}/buy`,
    headers: {
      authorization: `Bearer ${userLogin.accessToken}`,
      "idempotency-key": "buy-1",
    },
    payload: { count: 2 },
  })
  assert.equal(buyRes.statusCode, 200)

  const adminLoginRes = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email: "admin@test.local", password: "StrongAdminPass_12345" },
  })
  assert.equal(adminLoginRes.statusCode, 200)
  const adminLogin = adminLoginRes.json() as { accessToken: string }

  const metricsRes = await app.inject({
    method: "GET",
    url: "/api/v1/admin/live/metrics",
    headers: {
      authorization: `Bearer ${adminLogin.accessToken}`,
    },
  })
  assert.equal(metricsRes.statusCode, 200)
  const metrics = metricsRes.json() as { tickets: number; users: number }
  assert.ok(metrics.users >= 2)
  assert.ok(metrics.tickets >= 1)

  const wheelConfigRes = await app.inject({
    method: "GET",
    url: "/api/v1/wheel/config",
  })
  assert.equal(wheelConfigRes.statusCode, 200)

  const wheelSpinRes = await app.inject({
    method: "POST",
    url: "/api/v1/wheel/spin",
    headers: {
      authorization: `Bearer ${userLogin.accessToken}`,
    },
    payload: {},
  })
  assert.equal(wheelSpinRes.statusCode, 200)

  const auctionsRes = await app.inject({
    method: "GET",
    url: "/api/v1/auctions",
  })
  assert.equal(auctionsRes.statusCode, 200)
  const auctions = (auctionsRes.json() as { items: Array<{ id: string; currentBid: number }> }).items
  assert.ok(auctions.length > 0)

  const bidRes = await app.inject({
    method: "POST",
    url: `/api/v1/auctions/${auctions[0]!.id}/bids`,
    headers: {
      authorization: `Bearer ${userLogin.accessToken}`,
    },
    payload: { amount: auctions[0]!.currentBid + 10_000_000 },
  })
  assert.equal(bidRes.statusCode, 200)

  await app.close()
})
