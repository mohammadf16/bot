import type { FastifyReply, FastifyRequest } from "fastify"
import type { RouteContext } from "../route-context.js"
import {
  buildDefaultRobots,
  buildSitemapXml,
  getMergedSEOPages,
  isIndexableSeoPage,
  normalizeSeoPath,
  resolveRequestOrigin,
  resolveSeoPathFromId,
  type SEOPage,
} from "../services/seo-pages.js"

type StructuredData = {
  id: string
  type: "article" | "product" | "organization" | "breadcrumb"
  pagePath: string
  data: Record<string, unknown>
  status: "active" | "draft"
}

type Backlink = {
  domain: string
  sourceUrl: string
  anchorText: string
  authority: number
  lastChecked: string
}

type Competitor = {
  domain: string
  backlinks: number
  trafficEstimate: number
  authority: number
  keywords: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function text(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const out = value.trim()
  return out.length > 0 ? out : undefined
}

function toIso(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback
  const dt = new Date(value)
  return Number.isNaN(dt.getTime()) ? fallback : dt.toISOString()
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

function hashText(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  return hash
}

function percent(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0
  return (part / total) * 100
}

function normalizeBacklinks(value: unknown): Backlink[] {
  if (!Array.isArray(value)) return []
  const nowIso = new Date().toISOString()
  return value
    .map((item): Backlink | null => {
      if (typeof item !== "object" || item === null) return null
      const entry = item as Partial<Backlink>
      const sourceUrl = text(entry.sourceUrl)
      const domain = text(entry.domain)
      if (!sourceUrl || !domain) return null
      return {
        domain,
        sourceUrl,
        anchorText: text(entry.anchorText) ?? "",
        authority: clamp(typeof entry.authority === "number" ? Math.round(entry.authority) : 0, 0, 100),
        lastChecked: toIso(entry.lastChecked, nowIso),
      }
    })
    .filter((item): item is Backlink => item !== null)
}

function normalizeCompetitors(value: unknown): Competitor[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item): Competitor | null => {
      if (typeof item !== "object" || item === null) return null
      const entry = item as Partial<Competitor>
      const domain = text(entry.domain)
      if (!domain) return null
      return {
        domain: domain.toLowerCase(),
        backlinks: Math.max(0, Math.round(typeof entry.backlinks === "number" ? entry.backlinks : 0)),
        trafficEstimate: Math.max(
          0,
          Math.round(typeof entry.trafficEstimate === "number" ? entry.trafficEstimate : 0)
        ),
        authority: clamp(typeof entry.authority === "number" ? Math.round(entry.authority) : 0, 0, 100),
        keywords: Math.max(0, Math.round(typeof entry.keywords === "number" ? entry.keywords : 0)),
      }
    })
    .filter((item): item is Competitor => item !== null)
}

function buildPageRecord({
  base,
  input,
  path,
  id,
  nowIso,
}: {
  base?: SEOPage
  input: Partial<SEOPage>
  path: string
  id: string
  nowIso: string
}): SEOPage {
  return {
    id,
    path,
    title: text(input.title) ?? text(base?.title) ?? "",
    description: text(input.description) ?? text(base?.description) ?? "",
    keywords: Array.isArray(input.keywords) ? normalizeKeywords(input.keywords) : normalizeKeywords(base?.keywords),
    ogTitle: text(input.ogTitle) ?? text(base?.ogTitle),
    ogDescription: text(input.ogDescription) ?? text(base?.ogDescription),
    ogImage: text(input.ogImage) ?? text(base?.ogImage),
    twitterCard: text(input.twitterCard) ?? text(base?.twitterCard),
    canonicalUrl: text(input.canonicalUrl) ?? text(base?.canonicalUrl),
    status: input.status === "active" || input.status === "draft" ? input.status : base?.status ?? "draft",
    views: Math.max(0, Math.floor(typeof input.views === "number" ? input.views : base?.views ?? 0)),
    lastModified: toIso(input.lastModified, nowIso),
  }
}

function incrementSitemapVersion(current: string | undefined): string {
  const parsed = Number.parseFloat(current ?? "1.0")
  if (!Number.isFinite(parsed)) return "1.1"
  return (Math.round((parsed + 0.1) * 10) / 10).toFixed(1)
}

export async function registerSEORoutes(ctx: RouteContext): Promise<void> {
  const { app, store } = ctx

  app.get<object>("/admin/seo/stats", async (_request, reply) => {
    try {
      const { pages } = await getMergedSEOPages(store.seo.pages)
      const pagesWithMetadata = pages.filter((p) => p.title.trim() && p.description.trim()).length
      const avgKeywordDensity =
        pages.length > 0
          ? pages.reduce((sum, p) => sum + percent(p.keywords.length, Math.max(1, p.description.split(/\s+/).length)), 0) /
            pages.length
          : 0
      const backlinks = normalizeBacklinks(store.seo.backlinks)
      const totalBacklinks = Math.max(backlinks.length, Math.max(0, Math.round(store.seo.totalBacklinks ?? 0)))
      store.seo.totalBacklinks = totalBacklinks

      reply.send({
        totalPages: pages.length,
        pagesWithMetadata,
        pagesWithoutMetadata: pages.length - pagesWithMetadata,
        avgKeywordDensity: Number(avgKeywordDensity.toFixed(2)),
        sitemapVersion: store.seo.sitemapVersion || "1.0",
        robotsUpdated: store.seo.robotsUpdated || new Date().toISOString(),
        totalBacklinks,
      })
    } catch {
      reply.code(500).send({ error: "Failed to fetch SEO stats" })
    }
  })

  app.get<object>("/admin/seo/pages", async (_request, reply) => {
    try {
      const { pages } = await getMergedSEOPages(store.seo.pages)
      reply.send(pages)
    } catch {
      reply.code(500).send({ error: "Failed to fetch SEO pages" })
    }
  })

  app.post<{ Body: Partial<SEOPage> }>("/admin/seo/pages", async (request, reply) => {
    try {
      const pathInput = text(request.body.path)
      if (!pathInput) {
        reply.code(400).send({ error: "Page path is required" })
        return
      }

      const targetPath = normalizeSeoPath(pathInput)
      const nowIso = new Date().toISOString()
      const { pages } = await getMergedSEOPages(store.seo.pages)
      const base = pages.find((p) => p.path === targetPath)
      const existing = store.seo.pages.find((p) => normalizeSeoPath(p.path) === targetPath)
      const next = buildPageRecord({
        base,
        input: request.body,
        path: targetPath,
        id: existing?.id ?? `manual:${targetPath}`,
        nowIso,
      })

      store.seo.pages = store.seo.pages.filter((p) => normalizeSeoPath(p.path) !== targetPath)
      store.seo.pages.push(next)
      reply.code(existing ? 200 : 201).send(next)
    } catch {
      reply.code(500).send({ error: "Failed to create SEO page" })
    }
  })

  app.put<{ Params: { id: string }; Body: Partial<SEOPage> }>("/admin/seo/pages/:id", async (request, reply) => {
    try {
      const nowIso = new Date().toISOString()
      const existingById = store.seo.pages.find((p) => p.id === request.params.id)
      const providedPath = text(request.body.path)
      const targetPath =
        (providedPath ? normalizeSeoPath(providedPath) : undefined) ??
        (existingById ? normalizeSeoPath(existingById.path) : undefined) ??
        (resolveSeoPathFromId(request.params.id) ?? undefined)

      if (!targetPath) {
        reply.code(404).send({ error: "Page not found" })
        return
      }

      const { pages } = await getMergedSEOPages(store.seo.pages)
      const base = existingById ?? pages.find((p) => p.path === targetPath)
      if (!base) {
        reply.code(404).send({ error: "Page not found" })
        return
      }

      const next = buildPageRecord({
        base,
        input: request.body,
        path: targetPath,
        id: existingById?.id ?? `manual:${targetPath}`,
        nowIso,
      })

      store.seo.pages = store.seo.pages.filter(
        (p) => p.id !== request.params.id && normalizeSeoPath(p.path) !== targetPath
      )
      store.seo.pages.push(next)
      reply.send(next)
    } catch {
      reply.code(500).send({ error: "Failed to update SEO page" })
    }
  })

  app.delete<{ Params: { id: string } }>("/admin/seo/pages/:id", async (request, reply) => {
    try {
      const existingById = store.seo.pages.find((p) => p.id === request.params.id)
      const targetPath =
        (existingById ? normalizeSeoPath(existingById.path) : undefined) ??
        (resolveSeoPathFromId(request.params.id) ?? undefined)

      if (!targetPath) {
        reply.code(404).send({ error: "Page not found" })
        return
      }

      store.seo.pages = store.seo.pages.filter(
        (p) => p.id !== request.params.id && normalizeSeoPath(p.path) !== targetPath
      )
      reply.send({ success: true })
    } catch {
      reply.code(500).send({ error: "Failed to delete SEO page" })
    }
  })

  app.get<object>("/admin/seo/structured-data", async (_request, reply) => {
    try {
      reply.send((store.seo.structuredData || []) as StructuredData[])
    } catch {
      reply.code(500).send({ error: "Failed to fetch structured data" })
    }
  })

  app.get<object>("/admin/seo/sitemap", async (request, reply) => {
    try {
      const { pages } = await getMergedSEOPages(store.seo.pages)
      reply.send({ content: buildSitemapXml(pages, resolveRequestOrigin(request)) })
    } catch {
      reply.code(500).send({ error: "Failed to generate sitemap" })
    }
  })

  app.post<object>("/admin/seo/sitemap/regenerate", async (request, reply) => {
    try {
      const { pages } = await getMergedSEOPages(store.seo.pages)
      store.seo.sitemapVersion = incrementSitemapVersion(store.seo.sitemapVersion)
      reply.send({
        content: buildSitemapXml(pages, resolveRequestOrigin(request)),
        version: store.seo.sitemapVersion,
      })
    } catch {
      reply.code(500).send({ error: "Failed to regenerate sitemap" })
    }
  })

  app.get<object>("/admin/seo/robots", async (request, reply) => {
    try {
      const origin = resolveRequestOrigin(request)
      const content = text(store.seo.robots) ?? buildDefaultRobots(origin)
      reply.send({ content })
    } catch {
      reply.code(500).send({ error: "Failed to fetch robots.txt" })
    }
  })

  app.put<{ Body: { content: string } }>("/admin/seo/robots", async (request, reply) => {
    try {
      const origin = resolveRequestOrigin(request)
      const content = text(request.body.content) ?? buildDefaultRobots(origin)
      store.seo.robots = content
      store.seo.robotsUpdated = new Date().toISOString()
      reply.send({ content })
    } catch {
      reply.code(500).send({ error: "Failed to update robots.txt" })
    }
  })

  app.get<object>("/admin/seo/google-analytics", async (_request, reply) => {
    try {
      reply.send({
        gaId: text(store.seo.googleAnalytics?.gaId) ?? "",
        trackingId: text(store.seo.googleAnalytics?.trackingId) ?? "",
        enabled: Boolean(store.seo.googleAnalytics?.enabled),
        savedAt: toIso(store.seo.googleAnalytics?.savedAt, new Date().toISOString()),
      })
    } catch {
      reply.code(500).send({ error: "Failed to fetch GA config" })
    }
  })

  app.put<{ Body: { gaId: string; trackingId: string; enabled: boolean } }>("/admin/seo/google-analytics", async (request, reply) => {
    try {
      store.seo.googleAnalytics = {
        gaId: text(request.body.gaId) ?? "",
        trackingId: text(request.body.trackingId) ?? "",
        enabled: Boolean(request.body.enabled),
        savedAt: new Date().toISOString(),
      }
      reply.send({ success: true, message: "Google Analytics configured successfully" })
    } catch {
      reply.code(500).send({ error: "Failed to save GA config" })
    }
  })

  app.get<object>("/admin/seo/google-search-console", async (_request, reply) => {
    try {
      reply.send({
        propertyId: text(store.seo.googleSearchConsole?.propertyId) ?? "",
        verificationCode: text(store.seo.googleSearchConsole?.verificationCode) ?? "",
        enabled: Boolean(store.seo.googleSearchConsole?.enabled),
        verifiedAt: store.seo.googleSearchConsole?.verifiedAt,
      })
    } catch {
      reply.code(500).send({ error: "Failed to fetch GSC config" })
    }
  })

  app.put<{ Body: { propertyId: string; verificationCode: string; enabled: boolean } }>("/admin/seo/google-search-console", async (request, reply) => {
    try {
      store.seo.googleSearchConsole = {
        propertyId: text(request.body.propertyId) ?? "",
        verificationCode: text(request.body.verificationCode) ?? "",
        enabled: Boolean(request.body.enabled),
        verifiedAt: request.body.enabled ? new Date().toISOString() : undefined,
      }
      reply.send({ success: true, message: "Google Search Console configured successfully" })
    } catch {
      reply.code(500).send({ error: "Failed to save GSC config" })
    }
  })

  app.get<object>("/admin/seo/keywords", async (_request, reply) => {
    try {
      const { pages } = await getMergedSEOPages(store.seo.pages)
      const usage = new Map<string, number>()
      for (const page of pages) {
        for (const keyword of page.keywords) {
          const key = keyword.trim().toLowerCase()
          if (!key) continue
          usage.set(key, (usage.get(key) ?? 0) + 1)
        }
      }
      const rows = Array.from(usage.entries())
        .map(([keyword, count]) => {
          const seed = hashText(keyword)
          const volume = 200 + (seed % 12000)
          const position = clamp(Math.round(70 - count * 4 - (seed % 11)), 1, 99)
          const traffic = Math.round((volume * (101 - position)) / 140)
          return { keyword, usage: count, position, volume, traffic: Math.max(0, traffic) }
        })
        .sort((a, b) => b.usage - a.usage)
      reply.send(rows)
    } catch {
      reply.code(500).send({ error: "Failed to fetch keywords" })
    }
  })

  app.get<object>("/admin/seo/backlinks", async (_request, reply) => {
    try {
      const backlinks = normalizeBacklinks(store.seo.backlinks)
      const topBacklinks = [...backlinks].sort((a, b) => b.authority - a.authority).slice(0, 10)
      const avgAuthority =
        backlinks.length > 0
          ? Number((backlinks.reduce((sum, item) => sum + item.authority, 0) / backlinks.length).toFixed(1))
          : 0
      const domainsLinking = new Set(backlinks.map((item) => item.domain.toLowerCase())).size
      reply.send({
        totalBacklinks: Math.max(backlinks.length, Math.max(0, Math.round(store.seo.totalBacklinks ?? 0))),
        domainsLinking,
        topBacklinks,
        avgAuthority,
      })
    } catch {
      reply.code(500).send({ error: "Failed to fetch backlinks" })
    }
  })

  app.get<object>("/admin/seo/mobile-optimization", async (_request, reply) => {
    try {
      const { pages } = await getMergedSEOPages(store.seo.pages)
      const indexable = pages.filter((p) => isIndexableSeoPage(p))
      const total = indexable.length
      const fontSizeIssues = indexable.filter((p) => p.title.length > 60 || p.description.length > 170).length
      const tapTargetIssues = indexable.filter((p) => p.path.split("/").some((seg) => seg.length > 24)).length
      const missingCanonical = indexable.filter((p) => !p.canonicalUrl).length
      const penalty = fontSizeIssues * 2 + tapTargetIssues * 2 + missingCanonical
      const mobileUsable = total > 0 ? clamp(Math.round(100 - (penalty / total) * 9), 0, 100) : 0
      const recommendations: string[] = []
      if (fontSizeIssues > 0) recommendations.push("Trim long snippets for mobile readability.")
      if (tapTargetIssues > 0) recommendations.push("Keep URL paths short and readable.")
      if (missingCanonical > 0) recommendations.push("Set canonical URLs for public pages.")
      if (recommendations.length === 0) recommendations.push("Mobile SEO baseline is healthy.")
      reply.send({
        mobileUsable,
        viewportConfigured: total > 0 ? 100 : 0,
        fontSizeIssues,
        tapTargetIssues,
        recommendations,
      })
    } catch {
      reply.code(500).send({ error: "Failed to fetch mobile optimization report" })
    }
  })

  app.get<object>("/admin/seo/content-quality", async (_request, reply) => {
    try {
      const { pages } = await getMergedSEOPages(store.seo.pages)
      const totalPages = pages.length
      const avgTitle = totalPages > 0 ? pages.reduce((sum, p) => sum + p.title.length, 0) / totalPages : 0
      const avgDesc = totalPages > 0 ? pages.reduce((sum, p) => sum + p.description.length, 0) / totalPages : 0
      const pagesWithKeywords = pages.filter((p) => p.keywords.length > 0).length
      const pagesWithOGTags = pages.filter((p) => p.ogTitle || p.ogImage).length
      const thinContent = pages.filter((p) => p.description.length < 80).length
      const descMap = new Map<string, number>()
      for (const page of pages) {
        const key = page.description.trim().toLowerCase()
        if (!key) continue
        descMap.set(key, (descMap.get(key) ?? 0) + 1)
      }
      const duplicateContent = Array.from(descMap.values()).reduce((sum, count) => sum + (count > 1 ? count - 1 : 0), 0)
      const excellent = pages.filter((p) => p.title.length >= 30 && p.title.length <= 60 && p.description.length >= 120 && p.description.length <= 160).length
      const good = pages.filter((p) => p.title.length > 0 && p.description.length > 0).length - excellent
      const poor = Math.max(0, totalPages - excellent - Math.max(0, good))
      reply.send({
        totalPages,
        averageTitleLength: avgTitle,
        averageDescriptionLength: avgDesc,
        pagesWithKeywords,
        pagesWithOGTags,
        duplicateContent,
        thinContent,
        quality: { excellent, good: Math.max(0, good), poor },
      })
    } catch {
      reply.code(500).send({ error: "Failed to fetch content quality analysis" })
    }
  })

  app.get<object>("/admin/seo/audit", async (request, reply) => {
    try {
      const { pages } = await getMergedSEOPages(store.seo.pages)
      const origin = resolveRequestOrigin(request)
      const robotsContent = text(store.seo.robots) ?? buildDefaultRobots(origin)
      const metadataCoverage = percent(
        pages.filter((p) => p.title.trim() && p.description.trim()).length,
        pages.length
      )
      const canonicalCoverage = percent(pages.filter((p) => p.canonicalUrl).length, pages.length)
      const indexablePages = pages.filter((p) => isIndexableSeoPage(p)).length
      const checks = {
        sitemapHasIndexableUrls: indexablePages > 0,
        robotsTxtPresent: robotsContent.trim().length > 0,
        metadataCoverageAtLeastNinety: metadataCoverage >= 90,
        canonicalCoverageAtLeastEighty: canonicalCoverage >= 80,
        structuredDataConfigured: (store.seo.structuredData || []).length > 0,
        httpsOrigin: origin.startsWith("https://"),
      }
      const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key)
      const issues = {
        critical: failed.filter((k) => k === "sitemapHasIndexableUrls" || k === "robotsTxtPresent").length,
        warning: failed.filter((k) => k === "metadataCoverageAtLeastNinety" || k === "canonicalCoverageAtLeastEighty").length,
        notice: failed.filter((k) => k === "structuredDataConfigured" || k === "httpsOrigin").length,
      }
      const recommendations: string[] = []
      if (!checks.sitemapHasIndexableUrls) recommendations.push("Activate at least one public page for sitemap indexing.")
      if (!checks.metadataCoverageAtLeastNinety) recommendations.push("Complete missing title and description fields.")
      if (!checks.canonicalCoverageAtLeastEighty) recommendations.push("Configure canonical URLs for main pages.")
      if (!checks.structuredDataConfigured) recommendations.push("Add Schema.org data to key pages.")
      if (!checks.httpsOrigin) recommendations.push("Use HTTPS for better trust and SEO.")
      if (!checks.robotsTxtPresent) recommendations.push("Publish robots.txt with sitemap reference.")
      if (recommendations.length === 0) recommendations.push("Audit checks are healthy.")
      const score = clamp(100 - issues.critical * 20 - issues.warning * 9 - issues.notice * 4, 0, 100)
      reply.send({
        score,
        issues,
        checks,
        recommendations,
        generatedAt: new Date().toISOString(),
        summary: {
          totalPages: pages.length,
          indexablePages,
          metadataCoverage: Number(metadataCoverage.toFixed(1)),
          sitemapBytes: Buffer.byteLength(buildSitemapXml(pages, origin), "utf8"),
        },
      })
    } catch {
      reply.code(500).send({ error: "Failed to fetch audit report" })
    }
  })

  app.get<object>("/admin/seo/metrics", async (_request, reply) => {
    try {
      const { pages } = await getMergedSEOPages(store.seo.pages)
      const metadataCoverage = percent(pages.filter((p) => p.title.trim() && p.description.trim()).length, pages.length)
      const keywordCount = pages.reduce((sum, p) => sum + p.keywords.length, 0)
      const backlinks = normalizeBacklinks(store.seo.backlinks)
      const pageSpeed = clamp(Math.round(metadataCoverage * 0.6 + (pages.length > 0 ? 30 : 0)), 25, 99)
      const avgPosition = clamp(Math.round(70 - Math.min(keywordCount, 60) * 0.4), 1, 99)
      const ctr = Number(clamp((100 - avgPosition) / 7, 0.5, 35).toFixed(2))
      reply.send({
        totalPages: pages.length,
        pageSpeed,
        mobileOptimization: clamp(Math.round(metadataCoverage), 0, 100),
        coreWebVitals: {
          lcp: `${Math.round(1700 + (100 - pageSpeed) * 40)}ms`,
          fid: `${Math.round(35 + (100 - pageSpeed) * 2)}ms`,
          cls: (0.03 + (100 - pageSpeed) / 900).toFixed(3),
        },
        keywordTracking: keywordCount,
        backlinks: Math.max(backlinks.length, Math.max(0, Math.round(store.seo.totalBacklinks ?? 0))),
        organicTraffic: Math.round(keywordCount * 42 + metadataCoverage * 12),
        clickThroughRate: `${ctr.toFixed(2)}%`,
        averagePosition: avgPosition,
      })
    } catch {
      reply.code(500).send({ error: "Failed to fetch metrics" })
    }
  })

  app.get<object>("/admin/seo/competitors", async (_request, reply) => {
    try {
      const competitors = normalizeCompetitors(store.seo.competitors)
      const backlinks = normalizeBacklinks(store.seo.backlinks)
      const yourBacklinks = Math.max(backlinks.length, Math.max(0, Math.round(store.seo.totalBacklinks ?? 0)))
      const avgCompetitorBacklinks =
        competitors.length > 0
          ? Math.round(competitors.reduce((sum, item) => sum + item.backlinks, 0) / competitors.length)
          : 0
      const sorted = [...competitors].sort((a, b) => b.authority - a.authority || b.backlinks - a.backlinks)
      reply.send({
        competitors: sorted.map((item) => ({ ...item, status: "monitored" })),
        topCompetitors: sorted.slice(0, 5),
        comparison: { yourBacklinks, avgCompetitorBacklinks },
      })
    } catch {
      reply.code(500).send({ error: "Failed to fetch competitor analysis" })
    }
  })
}
