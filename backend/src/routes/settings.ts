import { z } from "zod"
import type { RouteContext } from "../route-context.js"
import { nowIso } from "../utils/time.js"
import type { SiteSettings } from "../types.js"

export async function registerSettingsRoutes({ app, store }: RouteContext) {
  // Get all settings
  app.get("/admin/settings", { preHandler: [app.adminOnly] }, async () => {
    return store.siteSettings
  })

  // Get general settings
  app.get("/admin/settings/general", { preHandler: [app.adminOnly] }, async () => {
    return store.siteSettings.general || {}
  })

  // Update general settings
  app.put<{ Body: any }>("/admin/settings/general", { preHandler: [app.adminOnly] }, async (request) => {
    const user = request.user
    store.siteSettings.general = request.body as any
    store.siteSettings.updatedAt = nowIso()
    store.siteSettings.updatedBy = user.sub
    return { success: true }
  })

  // Get header settings
  app.get("/admin/settings/header", { preHandler: [app.adminOnly] }, async () => {
    return store.siteSettings.header || {}
  })

  // Update header settings
  app.put<{ Body: any }>("/admin/settings/header", { preHandler: [app.adminOnly] }, async (request) => {
    const user = request.user
    store.siteSettings.header = request.body as any
    store.siteSettings.updatedAt = nowIso()
    store.siteSettings.updatedBy = user.sub
    return { success: true }
  })

  // Get footer settings
  app.get("/admin/settings/footer", { preHandler: [app.adminOnly] }, async () => {
    return store.siteSettings.footer || {}
  })

  // Update footer settings
  app.put<{ Body: any }>("/admin/settings/footer", { preHandler: [app.adminOnly] }, async (request) => {
    const user = request.user
    store.siteSettings.footer = request.body as any
    store.siteSettings.updatedAt = nowIso()
    store.siteSettings.updatedBy = user.sub
    return { success: true }
  })

  // Get contact settings
  app.get("/admin/settings/contact", { preHandler: [app.adminOnly] }, async () => {
    return store.siteSettings.contact || {}
  })

  // Update contact settings
  app.put<{ Body: any }>("/admin/settings/contact", { preHandler: [app.adminOnly] }, async (request) => {
    const user = request.user
    store.siteSettings.contact = request.body as any
    store.siteSettings.updatedAt = nowIso()
    store.siteSettings.updatedBy = user.sub
    return { success: true }
  })

  // Get about settings
  app.get("/admin/settings/about", { preHandler: [app.adminOnly] }, async () => {
    return store.siteSettings.about || {}
  })

  // Update about settings
  app.put<{ Body: any }>("/admin/settings/about", { preHandler: [app.adminOnly] }, async (request) => {
    const user = request.user
    store.siteSettings.about = request.body as any
    store.siteSettings.updatedAt = nowIso()
    store.siteSettings.updatedBy = user.sub
    return { success: true }
  })

  // Get home settings
  app.get("/admin/settings/home", { preHandler: [app.adminOnly] }, async () => {
    return store.siteSettings.home || {}
  })

  // Update home settings
  app.put<{ Body: any }>("/admin/settings/home", { preHandler: [app.adminOnly] }, async (request) => {
    const user = request.user
    store.siteSettings.home = request.body as any
    store.siteSettings.updatedAt = nowIso()
    store.siteSettings.updatedBy = user.sub
    return { success: true }
  })

  // Get theme settings
  app.get("/admin/settings/theme", { preHandler: [app.adminOnly] }, async () => {
    return store.siteSettings.theme || {}
  })

  // Update theme settings
  app.put<{ Body: any }>("/admin/settings/theme", { preHandler: [app.adminOnly] }, async (request) => {
    const user = request.user
    store.siteSettings.theme = request.body as any
    store.siteSettings.updatedAt = nowIso()
    store.siteSettings.updatedBy = user.sub
    return { success: true }
  })

  // Public API: Get settings (for frontend)
  app.get("/site-settings", async (request, reply) => {
    return {
      general: store.siteSettings.general,
      header: store.siteSettings.header,
      footer: store.siteSettings.footer,
      contact: store.siteSettings.contact,
      about: store.siteSettings.about,
      home: store.siteSettings.home,
      theme: store.siteSettings.theme,
      activeBanners: store.bannersContent?.filter((b) => b.active) ?? [],
    }
  })
}
