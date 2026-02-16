import "dotenv/config"
import { z } from "zod"

const nodeEnv = process.env.NODE_ENV ?? "development"
const isProd = nodeEnv === "production"

const trueSet = new Set(["1", "true", "yes", "on"])
const falseSet = new Set(["0", "false", "no", "off"])

function boolEnv(defaultValue: boolean) {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return defaultValue
    if (typeof value === "boolean") return value
    const raw = String(value).trim().toLowerCase()
    if (trueSet.has(raw)) return true
    if (falseSet.has(raw)) return false
    return value
  }, z.boolean())
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  JWT_ACCESS_SECRET: isProd ? z.string().min(24) : z.string().min(24).default("dev_access_secret_change_me_123456"),
  JWT_REFRESH_SECRET: isProd ? z.string().min(24) : z.string().min(24).default("dev_refresh_secret_change_me_123456"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  SEED_ENCRYPTION_KEY: isProd ? z.string().min(32) : z.string().min(32).default("dev_seed_encryption_key_change_me_123456"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  API_HARDENING_ENABLED: boolEnv(isProd),
  API_STRICT_HOST_CHECK: boolEnv(isProd),
  API_ALLOWED_HOSTS: z.string().default("localhost:4000,127.0.0.1:4000"),
  API_GATEWAY_TOKEN: z.string().min(24).optional(),
  API_GATEWAY_ENFORCE: boolEnv(isProd),
  API_PROTECTED_PREFIXES: z.string().default("/api/v1/admin,/api/v1/wallet,/api/v1/raffles,/api/v1/slide,/api/v1/auctions,/api/v1/me"),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(12).optional(),
  MYSQL_ENABLED: boolEnv(false),
  MYSQL_HOST: z.string().default("127.0.0.1"),
  MYSQL_PORT: z.coerce.number().int().positive().default(3306),
  MYSQL_USER: z.string().default("root"),
  MYSQL_PASSWORD: z.string().default(""),
  MYSQL_DATABASE: z.string().default("car_platform"),
  MYSQL_STATE_TABLE: z.string().default("app_state_snapshots"),
  MYSQL_SSL_REQUIRED: boolEnv(false),
  MYSQL_STRICT: boolEnv(isProd),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("Invalid backend environment configuration:")
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(",").map((v) => v.trim()),
  apiAllowedHosts: parsed.data.API_ALLOWED_HOSTS.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean),
  apiProtectedPrefixes: parsed.data.API_PROTECTED_PREFIXES.split(",").map((v) => v.trim()).filter(Boolean),
}
