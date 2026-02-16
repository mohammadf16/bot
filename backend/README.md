# Car Raffle Backend (Secure, Real-time, Provably Fair)

بک‌اند مستقل برای پلتفرم فروش خودرو + قرعه‌کشی + گیمیفیکیشن مالی.

## Stack
- Node.js 20+
- Fastify
- JWT + Refresh Session
- Argon2id (password hashing)
- WebSocket live feed
- Commit-Reveal lottery algorithm (قابل راستی‌آزمایی)

## Run
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

API base:
`http://localhost:4000/api/v1`

WS:
`ws://localhost:4000/api/v1/live`

## Key Security Controls
- `helmet` + CORS whitelist
- Global rate limit
- Input validation with `zod`
- Role-based access (`user` / `admin`)
- Refresh token rotation + revocation
- Idempotency-Key support for financial/critical endpoints
- Audit log for admin-sensitive actions

## Provably Fair Draw (v1)
1. هنگام ساخت قرعه‌کشی، `serverSeed` ساخته می‌شود و فقط `seedCommitHash` منتشر می‌شود.
2. پس از بسته شدن فروش، ادمین `externalEntropy` وارد می‌کند (مثلا drand/NIST).
3. الگوریتم deterministic از `serverSeed + externalEntropy + aggregateClientSeedHash` خروجی می‌گیرد.
4. winners با Fisher-Yates deterministic انتخاب می‌شوند.
5. `proof` منتشر می‌شود و endpoint verification آن را باز-محاسبه می‌کند.

## Important Endpoints
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /me`
- `GET /wallet`
- `POST /wallet/deposit`
- `POST /wallet/withdraw`
- `GET /raffles`
- `POST /raffles/:raffleId/buy`
- `GET /raffles/:raffleId/proof`
- `POST /admin/raffles`
- `POST /admin/raffles/:raffleId/open`
- `POST /admin/raffles/:raffleId/close`
- `POST /admin/raffles/:raffleId/draw`
- `GET /admin/live/metrics`
- `GET /admin/audit`
- `POST /admin/pricing/policies`
- `POST /admin/pricing/publish/:policyId`

## cPanel Deployment (Node.js App)
1. در cPanel > Setup Node.js App:
   - Node version: `20.x`
   - Application root: `backend`
   - Startup file: `dist/index.js`
2. Build command:
   - `npm install && npm run build`
3. Add env vars from `.env.example` with مقادیر قوی واقعی.
4. Restart app.
5. Nginx/Apache reverse proxy را روی `/api/v1` به اپ نود وصل کنید.

## Production Hardening (Next Step)
- Store data in MySQL/PostgreSQL (shared-host DB is not enough for scale-sensitive finance)
- Redis for session/idempotency/rate-limit state
- KMS/HSM for seed encryption key
- WAF + SIEM integration
- Separate worker for draw finalization and payment reconciliation
