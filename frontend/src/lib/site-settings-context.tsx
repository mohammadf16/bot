"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/+$/, "")

// ─── Types ────────────────────────────────────────────────────────────────────

export type SiteGeneral = {
  siteName: string
  siteTagline: string
  logoUrl: string
  faviconUrl: string
  maintenanceMode: boolean
  maintenanceMessage: string
  defaultLanguage: string
  copyrightText: string
}

export type SiteHeader = {
  sticky: boolean
  transparent: boolean
  announcementBarActive: boolean
  announcementText: string
  announcementColor: string
  announcementLink: string
  navLinks: Array<{ id: string; label: string; href: string; isExternal?: boolean }>
  ctaLabel: string
  ctaHref: string
}

export type SiteFooter = {
  companyDescription: string
  columns: Array<{ title: string; links: Array<{ label: string; href: string }> }>
  socialLinks: Array<{ platform: string; url: string; icon: string }>
  bottomLinks: Array<{ label: string; href: string }>
  newsletter: boolean
  newsletterText: string
}

export type SiteContact = {
  address: string
  city: string
  postalCode: string
  phone: string
  phone2: string
  email: string
  emailSupport: string
  supportHours: string
  telegramLink: string
  instagramLink: string
  whatsappNumber: string
  linkedinUrl: string
  twitterUrl: string
  youtubeUrl: string
  mapEmbedUrl: string
  mapLat: string
  mapLng: string
}

export type SiteAbout = {
  heroTitle: string
  heroSubtitle: string
  missionText: string
  visionText: string
  statsUsers: string
  statsRaffles: string
  statsPrizes: string
  statsSatisfaction: string
}

export type SiteHome = {
  heroTitle: string
  heroSubtitle: string
  heroCta1: string
  heroCta1Link: string
  statsUsers: string
  statsRaffles: string
  statsPrizes: string
}

export type SiteTheme = {
  accentGold: string
  accentCyan: string
  fontMain: string
}

export type SiteSettings = {
  general: SiteGeneral
  header: SiteHeader
  footer: SiteFooter
  contact: SiteContact
  about: SiteAbout
  home: SiteHome
  theme: SiteTheme
}

const DEFAULT_SETTINGS: SiteSettings = {
  general: {
    siteName: "LUX",
    siteTagline: "پلتفرم هوشمند خودرو",
    logoUrl: "",
    faviconUrl: "",
    maintenanceMode: false,
    maintenanceMessage: "",
    defaultLanguage: "fa",
    copyrightText: "© ۱۴۰۵ LUX — تمامی حقوق محفوظ است",
  },
  header: {
    sticky: true,
    transparent: true,
    announcementBarActive: false,
    announcementText: "",
    announcementColor: "#D4AF37",
    announcementLink: "",
    navLinks: [],
    ctaLabel: "ورود / ثبت نام",
    ctaHref: "/login",
  },
  footer: {
    companyDescription: "LUX پیشرو در قرعه‌کشی شفاف و هوشمند خودرو در ایران",
    columns: [],
    socialLinks: [],
    bottomLinks: [],
    newsletter: true,
    newsletterText: "در خبرنامه ما عضو شوید",
  },
  contact: {
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    phone2: "",
    email: "",
    emailSupport: "",
    supportHours: "",
    telegramLink: "",
    instagramLink: "",
    whatsappNumber: "",
    linkedinUrl: "",
    twitterUrl: "",
    youtubeUrl: "",
    mapEmbedUrl: "",
    mapLat: "35.6892",
    mapLng: "51.3890",
  },
  about: {
    heroTitle: "درباره LUX",
    heroSubtitle: "",
    missionText: "",
    visionText: "",
    statsUsers: "۵۰,۰۰۰+",
    statsRaffles: "۲۰۰+",
    statsPrizes: "۱,۵۰۰+",
    statsSatisfaction: "۹۸٪",
  },
  home: {
    heroTitle: "خودرو رویایی‌ات را با LUX بُرد",
    heroSubtitle: "قرعه‌کشی شفاف، هوشمند و لذت‌بخش",
    heroCta1: "مشاهده قرعه‌کشی‌ها",
    heroCta1Link: "/raffles",
    statsUsers: "۵۰,۰۰۰+",
    statsRaffles: "۲۰۰+",
    statsPrizes: "۱,۵۰۰+",
  },
  theme: {
    accentGold: "#D4AF37",
    accentCyan: "#00BCD4",
    fontMain: "IRANSans",
  },
}

// ─── Context ──────────────────────────────────────────────────────────────────

type SiteSettingsContextValue = {
  settings: SiteSettings
  loading: boolean
  refetch: () => void
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  loading: false,
  refetch: () => {},
})

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/site-settings`, { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      setSettings((prev) => ({
        general: { ...prev.general, ...(data.general ?? {}) },
        header: { ...prev.header, ...(data.header ?? {}) },
        footer: { ...prev.footer, ...(data.footer ?? {}) },
        contact: { ...prev.contact, ...(data.contact ?? {}) },
        about: { ...prev.about, ...(data.about ?? {}) },
        home: { ...prev.home, ...(data.home ?? {}) },
        theme: { ...prev.theme, ...(data.theme ?? {}) },
      }))
    } catch {
      // keep defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refetch: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
