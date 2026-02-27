import { access, readdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { FastifyRequest } from "fastify"
import { env } from "../env.js"

export type SEOPage = {
  id: string
  path: string
  title: string
  description: string
  keywords: string[]
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterCard?: string
  canonicalUrl?: string
  status: "active" | "draft"
  views?: number
  lastModified: string
}

const PAGE_FILE_PATTERN = /^page\.(tsx|ts|jsx|js)$/
const PRIVATE_PREFIXES = ["/admin", "/dashboard"]
const DISCOVERY_CACHE_TTL_MS = 30_000

let cachedDiscoveryPaths: string[] = []
let cachedDiscoveryExpiresAt = 0

function firstHeaderValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value.split(",")[0]?.trim() || null
  if (Array.isArray(value) && value.length > 0) return value[0]?.split(",")[0]?.trim() || null
  return null
}

function normalizeOptionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function normalizeKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  const out: string[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item !== "string") continue
    const keyword = item.trim().replace(/\s+/g, " ")
    if (!keyword) continue
    const key = keyword.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(keyword)
  }
  return out
}

function toIsoDate(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value.trim().length === 0) return fallback
  const dt = new Date(value)
  return Number.isNaN(dt.getTime()) ? fallback : dt.toISOString()
}

function normalizeAppSegment(segment: string): string | null {
  if (!segment || segment.startsWith("_") || segment.startsWith("@") || segment === "api") return null

  if (segment.startsWith("(")) {
    const closing = segment.indexOf(")")
    if (closing === -1) return segment
    const remaining = segment.slice(closing + 1)
    return remaining.length > 0 ? remaining : ""
  }

  return segment
}

function toHumanLabel(segment: string): string {
  const cleaned = segment
    .replace(/^\[+|\]+$/g, "")
    .replace(/[._-]+/g, " ")
    .trim()

  if (!cleaned) return "Page"

  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function createDefaultTitle(routePath: string): string {
  if (routePath === "/") return "Home"
  return routePath
    .split("/")
    .filter(Boolean)
    .map(toHumanLabel)
    .join(" - ")
}

function createDefaultDescription(routePath: string, title: string): string {
  if (routePath === "/") return "Main landing page for the car platform."
  if (isDynamicSeoPath(routePath)) {
    return `Template metadata for ${routePath}. Configure per-item SEO from dynamic page data.`
  }
  if (isPrivateSeoPath(routePath)) {
    return `Administrative metadata for ${title.toLowerCase()} section.`
  }
  return `SEO metadata for ${title.toLowerCase()} page.`
}

function createDefaultKeywords(routePath: string): string[] {
  if (routePath === "/") return ["home", "car", "platform"]

  const out = routePath
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/^\[+|\]+$/g, "").replace(/[^a-zA-Z0-9-]/g, ""))
    .map((segment) => segment.toLowerCase())
    .filter(Boolean)

  return Array.from(new Set(out)).slice(0, 6)
}

function defaultStatusForPath(routePath: string): "active" | "draft" {
  if (isPrivateSeoPath(routePath) || isDynamicSeoPath(routePath)) return "draft"
  return "active"
}

function sanitizeSeoPage(page: SEOPage, nowIso: string): SEOPage {
  const normalizedPath = normalizeSeoPath(page.path)

  return {
    id: typeof page.id === "string" && page.id.trim().length > 0 ? page.id : `manual:${normalizedPath}`,
    path: normalizedPath,
    title: typeof page.title === "string" ? page.title.trim() : "",
    description: typeof page.description === "string" ? page.description.trim() : "",
    keywords: normalizeKeywords(page.keywords),
    ogTitle: normalizeOptionalText(page.ogTitle),
    ogDescription: normalizeOptionalText(page.ogDescription),
    ogImage: normalizeOptionalText(page.ogImage),
    twitterCard: normalizeOptionalText(page.twitterCard),
    canonicalUrl: normalizeOptionalText(page.canonicalUrl),
    status: page.status === "active" || page.status === "draft" ? page.status : defaultStatusForPath(normalizedPath),
    views:
      typeof page.views === "number" && Number.isFinite(page.views) && page.views >= 0
        ? Math.floor(page.views)
        : 0,
    lastModified: toIsoDate(page.lastModified, nowIso),
  }
}

function makeAutoPage(routePath: string, nowIso: string): SEOPage {
  const title = createDefaultTitle(routePath)
  return {
    id: `auto:${routePath}`,
    path: routePath,
    title,
    description: createDefaultDescription(routePath, title),
    keywords: createDefaultKeywords(routePath),
    status: defaultStatusForPath(routePath),
    views: 0,
    lastModified: nowIso,
  }
}

function sortSeoPages(a: SEOPage, b: SEOPage): number {
  if (a.path === b.path) return a.id.localeCompare(b.id)
  if (a.path === "/") return -1
  if (b.path === "/") return 1
  return a.path.localeCompare(b.path)
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

function frontendAppPathCandidates(): string[] {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url))
  const backendRoot = path.resolve(moduleDir, "../..")

  const candidates = [
    path.resolve(process.cwd(), "frontend/src/app"),
    path.resolve(process.cwd(), "../frontend/src/app"),
    path.resolve(backendRoot, "frontend/src/app"),
    path.resolve(backendRoot, "../frontend/src/app"),
  ]

  return Array.from(new Set(candidates))
}

async function findFrontendAppDir(): Promise<string | null> {
  for (const candidate of frontendAppPathCandidates()) {
    if (await pathExists(candidate)) return candidate
  }
  return null
}

async function collectFrontendRoutes(appDir: string): Promise<string[]> {
  const routes = new Set<string>()

  const walk = async (currentDir: string, segments: string[]): Promise<void> => {
    const entries = await readdir(currentDir, { withFileTypes: true })
    const hasPageFile = entries.some((entry) => entry.isFile() && PAGE_FILE_PATTERN.test(entry.name))

    if (hasPageFile) {
      const routePath = segments.length > 0 ? `/${segments.join("/")}` : "/"
      routes.add(normalizeSeoPath(routePath))
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const normalizedSegment = normalizeAppSegment(entry.name)
      if (normalizedSegment === null) continue

      const nextSegments =
        normalizedSegment.length === 0 ? segments : [...segments, normalizedSegment]

      await walk(path.join(currentDir, entry.name), nextSegments)
    }
  }

  await walk(appDir, [])
  return Array.from(routes).sort((a, b) => {
    if (a === "/") return -1
    if (b === "/") return 1
    return a.localeCompare(b)
  })
}

async function discoverFrontendRoutes(): Promise<string[]> {
  const now = Date.now()
  if (cachedDiscoveryExpiresAt > now) return cachedDiscoveryPaths

  const appDir = await findFrontendAppDir()
  if (!appDir) {
    cachedDiscoveryPaths = []
    cachedDiscoveryExpiresAt = now + DISCOVERY_CACHE_TTL_MS
    return cachedDiscoveryPaths
  }

  const discovered = await collectFrontendRoutes(appDir)
  cachedDiscoveryPaths = discovered
  cachedDiscoveryExpiresAt = now + DISCOVERY_CACHE_TTL_MS
  return discovered
}

export function normalizeSeoPath(rawPath: string): string {
  const trimmed = rawPath.trim()
  if (!trimmed || trimmed === "/") return "/"

  const withoutQuery = trimmed.replace(/[?#].*$/, "")
  const withLeadingSlash = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`
  const normalized = withLeadingSlash.replace(/\/{2,}/g, "/").replace(/\/+$/, "")
  return normalized || "/"
}

export function isPrivateSeoPath(routePath: string): boolean {
  const normalized = normalizeSeoPath(routePath)
  return PRIVATE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  )
}

export function isDynamicSeoPath(routePath: string): boolean {
  return routePath.includes("[") || routePath.includes("]") || routePath.includes(":")
}

export function isIndexableSeoPage(page: SEOPage): boolean {
  return page.status === "active" && !isPrivateSeoPath(page.path) && !isDynamicSeoPath(page.path)
}

export async function getMergedSEOPages(
  storedPages: SEOPage[] = []
): Promise<{ pages: SEOPage[]; discoveredPaths: Set<string> }> {
  const nowIso = new Date().toISOString()
  const discovered = await discoverFrontendRoutes()
  const discoveredPaths = new Set(discovered)

  const byPath = new Map<string, SEOPage>()
  for (const rawPage of storedPages) {
    const page = sanitizeSeoPage(rawPage, nowIso)
    byPath.set(page.path, page)
  }

  for (const discoveredPath of discoveredPaths) {
    if (byPath.has(discoveredPath)) continue
    byPath.set(discoveredPath, makeAutoPage(discoveredPath, nowIso))
  }

  return {
    pages: Array.from(byPath.values()).sort(sortSeoPages),
    discoveredPaths,
  }
}

export function resolveSeoPathFromId(id: string): string | null {
  if (typeof id !== "string" || id.trim().length === 0) return null

  const match = /^(?:auto|manual):(.+)$/.exec(id)
  if (!match) return null

  return normalizeSeoPath(match[1])
}

export function resolveRequestOrigin(request: FastifyRequest): string {
  const forwardedProto = firstHeaderValue(request.headers["x-forwarded-proto"])
  const forwardedHost = firstHeaderValue(request.headers["x-forwarded-host"])
  const host = forwardedHost ?? firstHeaderValue(request.headers.host)

  const protocol = forwardedProto ?? request.protocol ?? "http"
  if (host) return `${protocol}://${host}`.replace(/\/+$/, "")

  const requestOrigin = firstHeaderValue(request.headers.origin)
  if (requestOrigin) {
    try {
      return new URL(requestOrigin).origin
    } catch {
      // Fall through to configured origins.
    }
  }

  const fallbackOrigin = env.corsOrigins.find((origin) => /^https?:\/\//i.test(origin))
  if (fallbackOrigin) return fallbackOrigin.replace(/\/+$/, "")

  return "https://example.com"
}

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;")
}

function isAbsoluteUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function sitemapPriorityForPath(routePath: string): string {
  if (routePath === "/") return "1.0"
  const depth = routePath.split("/").filter(Boolean).length
  if (depth === 1) return "0.8"
  if (depth === 2) return "0.6"
  return "0.5"
}

export function buildSitemapXml(pages: SEOPage[], origin: string): string {
  const normalizedOrigin = origin.replace(/\/+$/, "")

  const items = pages
    .filter((page) => isIndexableSeoPage(page))
    .map((page) => {
      const loc = page.canonicalUrl && isAbsoluteUrl(page.canonicalUrl)
        ? page.canonicalUrl
        : `${normalizedOrigin}${page.path}`

      const lastmod = toIsoDate(page.lastModified, new Date().toISOString()).split("T")[0]
      const priority = sitemapPriorityForPath(page.path)
      const changefreq = page.path === "/" ? "daily" : "weekly"

      return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    })
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`
}

export function buildDefaultRobots(origin: string): string {
  const normalizedOrigin = origin.replace(/\/+$/, "")
  return `User-agent: *
Allow: /

Sitemap: ${normalizedOrigin}/sitemap.xml`
}
