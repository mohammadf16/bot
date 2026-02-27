"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Settings,
  Layout,
  AlignJustify,
  Phone,
  Info,
  Home,
  Palette,
  Save,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Image as ImageIcon,
  Link2,
  GripVertical,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { uploadUserImage } from "@/lib/image-upload"

// ─── Types ───────────────────────────────────────────────────────────────────

type NavLink = { id: string; label: string; href: string; isExternal?: boolean; children?: NavLink[] }
type FooterColumn = { title: string; links: { label: string; href: string }[] }
type SocialLink = { platform: string; url: string; icon: string }

type GeneralSettings = {
  siteName: string
  siteTagline: string
  logoUrl: string
  faviconUrl: string
  maintenanceMode: boolean
  maintenanceMessage: string
  defaultLanguage: string
  copyrightText: string
}

type HeaderSettings = {
  sticky: boolean
  transparent: boolean
  announcementBarActive: boolean
  announcementText: string
  announcementColor: string
  announcementLink: string
  navLinks: NavLink[]
  ctaLabel: string
  ctaHref: string
}

type FooterSettings = {
  companyDescription: string
  columns: FooterColumn[]
  socialLinks: SocialLink[]
  bottomLinks: { label: string; href: string }[]
  newsletter: boolean
  newsletterText: string
}

type ContactSettings = {
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

type AboutSettings = {
  heroTitle: string
  heroSubtitle: string
  heroImage: string
  missionTitle: string
  missionText: string
  visionTitle: string
  visionText: string
  statsUsers: string
  statsRaffles: string
  statsPrizes: string
  statsSatisfaction: string
  valuesTitle: string
  values: { title: string; description: string; color: string }[]
  teamTitle: string
  team: { name: string; role: string; image: string; bio: string }[]
  timelineTitle: string
  timeline: { year: string; title: string; description: string }[]
  ctaTitle: string
  ctaText: string
  ctaButton: string
  ctaLink: string
}

type HomeSettings = {
  heroTitle: string
  heroSubtitle: string
  heroCta1: string
  heroCta1Link: string
  heroCta2: string
  heroCta2Link: string
  statsUsers: string
  statsRaffles: string
  statsPrizes: string
  featureTitle: string
  featureSubtitle: string
  features: { icon: string; title: string; description: string }[]
  serviceTitle: string
  serviceSubtitle: string
  ctaTitle: string
  ctaSubtitle: string
  ctaCta: string
}

type ThemeSettings = {
  accentGold: string
  accentCyan: string
  accentGoldLight: string
  accentCyanLight: string
  fontMain: string
  fontHeading: string
  borderRadius: string
  glassOpacity: string
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = "general" | "header" | "footer" | "contact" | "about" | "home" | "theme" | "rules" | "legal" | "banners" | "seo_global"

const TABS: { id: Tab; label: string; icon: React.ElementType; desc: string; group: "site" | "content" }[] = [
  // ── Site Management ──
  { id: "general", label: "تنظیمات کلی", icon: Settings, desc: "نام سایت، لوگو، حالت تعمیرات", group: "site" },
  { id: "header", label: "هدر", icon: Layout, desc: "منوی ناوبری، بار اعلانات", group: "site" },
  { id: "footer", label: "فوتر", icon: AlignJustify, desc: "ستون‌های لینک، شبکه‌های اجتماعی", group: "site" },
  { id: "contact", label: "تماس با ما", icon: Phone, desc: "آدرس، تلفن، ایمیل، نقشه", group: "site" },
  { id: "about", label: "درباره ما", icon: Info, desc: "ماموریت، تیم، تایم‌لاین", group: "site" },
  { id: "home", label: "صفحه اصلی", icon: Home, desc: "هیرو، ویژگی‌ها، CTA", group: "site" },
  { id: "theme", label: "ظاهر سایت", icon: Palette, desc: "رنگ‌ها، فونت، استایل", group: "site" },
  // ── Content Management ──
  { id: "rules", label: "قوانین", icon: AlignJustify, desc: "قوانین و مقررات پلتفرم", group: "content" },
  { id: "legal", label: "متون حقوقی", icon: Info, desc: "شرایط استفاده و سلب مسئولیت", group: "content" },
  { id: "banners", label: "بنرها", icon: Layout, desc: "بنرهای تبلیغاتی و اطلاع‌رسانی", group: "content" },
  { id: "seo_global", label: "SEO عمومی", icon: Settings, desc: "تنظیمات سئو و آنالیتیکس", group: "content" },
]

// ─── Default Data ─────────────────────────────────────────────────────────────

const DEFAULT_GENERAL: GeneralSettings = {
  siteName: "LUX",
  siteTagline: "پلتفرم هوشمند خودرو",
  logoUrl: "",
  faviconUrl: "",
  maintenanceMode: false,
  maintenanceMessage: "سایت در حال به‌روزرسانی است. به زودی باز می‌گردیم.",
  defaultLanguage: "fa",
  copyrightText: "© ۱۴۰۵ LUX — تمامی حقوق محفوظ است",
}

const DEFAULT_HEADER: HeaderSettings = {
  sticky: true,
  transparent: true,
  announcementBarActive: false,
  announcementText: "",
  announcementColor: "#D4AF37",
  announcementLink: "",
  navLinks: [
    { id: "1", label: "خانه", href: "/" },
    { id: "2", label: "قرعه‌کشی‌ها", href: "/raffles" },
    { id: "3", label: "خودروها", href: "/cars" },
    { id: "4", label: "وبلاگ", href: "/blog" },
    { id: "5", label: "درباره ما", href: "/about" },
    { id: "6", label: "تماس", href: "/contact" },
  ],
  ctaLabel: "ورود / ثبت نام",
  ctaHref: "/login",
}

const DEFAULT_FOOTER: FooterSettings = {
  companyDescription: "LUX پیشرو در قرعه‌کشی شفاف و هوشمند خودرو در ایران",
  columns: [
    {
      title: "لینک‌های سریع",
      links: [
        { label: "قرعه‌کشی‌ها", href: "/raffles" },
        { label: "گردونه شانس", href: "/wheel" },
        { label: "بازی اسلاید", href: "/slide" },
        { label: "وام خودرو", href: "/loan" },
      ],
    },
    {
      title: "اطلاعات",
      links: [
        { label: "درباره ما", href: "/about" },
        { label: "وبلاگ", href: "/blog" },
        { label: "قوانین", href: "/rules" },
        { label: "شفافیت", href: "/fairness" },
      ],
    },
    {
      title: "پشتیبانی",
      links: [
        { label: "تماس با ما", href: "/contact" },
        { label: "سوالات متداول", href: "/faq" },
        { label: "تیکت", href: "/dashboard/tickets" },
      ],
    },
  ],
  socialLinks: [
    { platform: "instagram", url: "https://instagram.com/lux", icon: "instagram" },
    { platform: "telegram", url: "https://t.me/lux", icon: "telegram" },
    { platform: "twitter", url: "", icon: "twitter" },
    { platform: "youtube", url: "", icon: "youtube" },
  ],
  bottomLinks: [
    { label: "حریم خصوصی", href: "/privacy" },
    { label: "قوانین استفاده", href: "/terms" },
  ],
  newsletter: true,
  newsletterText: "در خبرنامه ما عضو شوید و اول بدانید",
}

const DEFAULT_CONTACT: ContactSettings = {
  address: "تهران، ...",
  city: "تهران",
  postalCode: "",
  phone: "",
  phone2: "",
  email: "info@lux.ir",
  emailSupport: "support@lux.ir",
  supportHours: "شنبه تا چهارشنبه ۹ تا ۱۷",
  telegramLink: "https://t.me/lux",
  instagramLink: "https://instagram.com/lux",
  whatsappNumber: "",
  linkedinUrl: "",
  twitterUrl: "",
  youtubeUrl: "",
  mapEmbedUrl: "",
  mapLat: "35.6892",
  mapLng: "51.3890",
}

const DEFAULT_ABOUT: AboutSettings = {
  heroTitle: "درباره LUX",
  heroSubtitle: "ما تجربه خرید خودرو را متحول کرده‌ایم",
  heroImage: "",
  missionTitle: "ماموریت ما",
  missionText: "ارائه راهکار شفاف، امن و لذت‌بخش برای تملک خودرو رویایی",
  visionTitle: "چشم‌انداز ما",
  visionText: "پیشرو بودن در فناوری قرعه‌کشی هوشمند در خاورمیانه",
  statsUsers: "۵۰,۰۰۰+",
  statsRaffles: "۲۰۰+",
  statsPrizes: "۱,۵۰۰+",
  statsSatisfaction: "۹۸٪",
  valuesTitle: "ارزش‌های ما",
  values: [
    { title: "شفافیت", description: "هش عمومی قبل از هر قرعه‌کشی", color: "green" },
    { title: "تجربه", description: "رابط کاربری روان و سریع", color: "gold" },
    { title: "امنیت", description: "رمزنگاری کامل داده‌ها", color: "cyan" },
  ],
  teamTitle: "تیم ما",
  team: [],
  timelineTitle: "مسیر ما",
  timeline: [
    { year: "۱۴۰۲", title: "تاسیس", description: "ایده‌آل‌سازی مفهوم LUX" },
    { year: "۱۴۰۳", title: "راه‌اندازی", description: "اولین قرعه‌کشی آنلاین" },
    { year: "۱۴۰۴", title: "رشد", description: "۵۰,۰۰۰ کاربر فعال" },
  ],
  ctaTitle: "با ما همراه شوید",
  ctaText: "همین امروز ثبت نام کنید و شانس خود را امتحان کنید",
  ctaButton: "شروع کنید",
  ctaLink: "/register",
}

const DEFAULT_HOME: HomeSettings = {
  heroTitle: "خودرو رویایی‌ات را با LUX بُرد",
  heroSubtitle: "قرعه‌کشی شفاف، هوشمند و لذت‌بخش",
  heroCta1: "مشاهده قرعه‌کشی‌ها",
  heroCta1Link: "/raffles",
  heroCta2: "گردونه شانس",
  heroCta2Link: "/wheel",
  statsUsers: "۵۰,۰۰۰+",
  statsRaffles: "۲۰۰+",
  statsPrizes: "۱,۵۰۰+",
  featureTitle: "چرا LUX؟",
  featureSubtitle: "ما قرعه‌کشی را به سطح جدیدی رسانده‌ایم",
  features: [
    { icon: "🔐", title: "شفافیت کامل", description: "هش SHA-256 قبل از هر قرعه‌کشی منتشر می‌شود" },
    { icon: "⚡", title: "سریع و روان", description: "تجربه کاربری بهینه شده در همه دستگاه‌ها" },
    { icon: "💰", title: "کش‌بک پلکانی", description: "هر چه بیشتر شرکت کنید، بیشتر دریافت می‌کنید" },
    { icon: "🏆", title: "جوایز واقعی", description: "خودروهای صفرکیلومتر و جوایز نقدی" },
  ],
  serviceTitle: "خدمات LUX",
  serviceSubtitle: "یک پلتفرم، تجربه‌های متفاوت",
  ctaTitle: "کلاب VIP",
  ctaSubtitle: "با ثبت نام در کلاب VIP از امکانات ویژه بهره‌مند شوید",
  ctaCta: "عضویت در کلاب VIP",
}

const DEFAULT_THEME: ThemeSettings = {
  accentGold: "#D4AF37",
  accentCyan: "#00BCD4",
  accentGoldLight: "#F0CD6A",
  accentCyanLight: "#4DD0E1",
  fontMain: "IRANSans",
  fontHeading: "IRANSans",
  borderRadius: "1rem",
  glassOpacity: "0.05",
}

// ─── Helper Components ────────────────────────────────────────────────────────

function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-sm text-white/70 mb-1.5 block font-semibold">{label}</label>
      {hint && <p className="text-xs text-white/30 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, dir = "rtl", mono = false, ...rest }: {
  value: string; onChange: (v: string) => void; placeholder?: string; dir?: "rtl" | "ltr"
  mono?: boolean; [key: string]: unknown
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      dir={dir}
      className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-accent-gold/60 transition-colors text-sm ${mono ? "font-mono" : ""} ${dir === "ltr" ? "text-left" : ""}`}
      {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
    />
  )
}

function TextArea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-accent-gold/60 transition-colors text-sm resize-none"
    />
  )
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${value ? "border-accent-gold/40 bg-accent-gold/10" : "border-white/10 bg-white/5"}`}
    >
      {value
        ? <ToggleRight className="w-6 h-6 text-accent-gold" />
        : <ToggleLeft className="w-6 h-6 text-white/30" />
      }
      <span className={`text-sm font-semibold ${value ? "text-accent-gold" : "text-white/50"}`}>{label}</span>
    </button>
  )
}

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5">
        <h3 className="font-bold text-white">{title}</h3>
        {desc && <p className="text-xs text-white/40 mt-0.5">{desc}</p>}
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  )
}

function ImageUploader({ value, onChange, label, aspect = "square" }: {
  value: string; onChange: (url: string) => void; label: string; aspect?: "square" | "wide" | "logo"
}) {
  const [uploading, setUploading] = useState(false)
  const [drag, setDrag] = useState(false)

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("فایل باید تصویر باشد"); return }
    setUploading(true)
    try {
      const url = await uploadUserImage(file)
      onChange(url)
      toast.success("آپلود موفق")
    } catch {
      toast.error("خطا در آپلود")
    } finally {
      setUploading(false)
    }
  }

  const aspectClass = aspect === "wide" ? "aspect-video" : aspect === "logo" ? "aspect-[3/1]" : "aspect-square w-24"

  return (
    <Field label={label}>
      <div className="flex items-start gap-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          className={`${aspectClass} rounded-xl border-2 border-dashed transition-all overflow-hidden flex-shrink-0 flex items-center justify-center ${drag ? "border-accent-gold bg-accent-gold/5" : "border-white/10 bg-white/3"}`}
        >
          {value
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={value} alt={label} className="w-full h-full object-contain" />
            : uploading
              ? <Loader2 className="w-6 h-6 text-accent-gold animate-spin" />
              : <ImageIcon className="w-6 h-6 text-white/20" />
          }
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors w-fit">
            <Upload className="w-4 h-4" />
            آپلود فایل
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </label>
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-white/30 flex-shrink-0" />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="یا لینک مستقیم..."
              dir="ltr"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-accent-gold/50 transition-colors text-left text-xs"
            />
            {value && <button onClick={() => onChange("")} className="text-white/30 hover:text-red-400 transition-colors text-xs">پاک</button>}
          </div>
        </div>
      </div>
    </Field>
  )
}

function SaveButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-6 py-2.5 bg-accent-gold text-black rounded-xl font-bold hover:bg-accent-gold/90 transition-colors disabled:opacity-50 text-sm"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Banner = { id: string; title: string; text: string; buttonText: string; buttonLink: string; active: boolean; color: string }
type SeoGlobal = { siteName: string; siteTagline: string; defaultMetaTitle: string; defaultMetaDescription: string; ogImage: string; twitterHandle: string; googleAnalyticsId: string }

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general")
  const [saving, setSaving] = useState(false)

  const [general, setGeneral] = useState<GeneralSettings>(DEFAULT_GENERAL)
  const [header, setHeader] = useState<HeaderSettings>(DEFAULT_HEADER)
  const [footer, setFooter] = useState<FooterSettings>(DEFAULT_FOOTER)
  const [contact, setContact] = useState<ContactSettings>(DEFAULT_CONTACT)
  const [about, setAbout] = useState<AboutSettings>(DEFAULT_ABOUT)
  const [home, setHome] = useState<HomeSettings>(DEFAULT_HOME)
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME)
  // Content management state
  const [rules, setRules] = useState("")
  const [terms, setTerms] = useState("")
  const [disclaimer, setDisclaimer] = useState("")
  const [banners, setBanners] = useState<Banner[]>([
    { id: "b1", title: "بنر بالای صفحه", text: "", buttonText: "", buttonLink: "", active: false, color: "#D4AF37" },
    { id: "b2", title: "بنر وسط صفحه", text: "", buttonText: "", buttonLink: "", active: false, color: "#00BCD4" },
    { id: "b3", title: "بنر قرعه‌کشی", text: "", buttonText: "", buttonLink: "", active: false, color: "#FF5722" },
  ])
  const [seoGlobal, setSeoGlobal] = useState<SeoGlobal>({ siteName: "", siteTagline: "", defaultMetaTitle: "", defaultMetaDescription: "", ogImage: "", twitterHandle: "", googleAnalyticsId: "" })

  // nav link editing
  const [newNavLabel, setNewNavLabel] = useState("")
  const [newNavHref, setNewNavHref] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiRequest<{
          general?: Partial<GeneralSettings>
          header?: Partial<HeaderSettings>
          footer?: Partial<FooterSettings>
          contact?: Partial<ContactSettings>
          about?: Partial<AboutSettings>
          home?: Partial<HomeSettings>
          theme?: Partial<ThemeSettings>
        }>("/admin/settings")
        if (data.general) setGeneral((p) => ({ ...p, ...data.general }))
        if (data.header) setHeader((p) => ({ ...p, ...data.header }))
        if (data.footer) setFooter((p) => ({ ...p, ...data.footer }))
        if (data.contact) setContact((p) => ({ ...p, ...data.contact }))
        if (data.about) setAbout((p) => ({ ...p, ...data.about }))
        if (data.home) setHome((p) => ({ ...p, ...data.home }))
        if (data.theme) setTheme((p) => ({ ...p, ...data.theme }))
      } catch { /* use defaults */ }
      // Load content data
      try {
        const [rulesData, legalData] = await Promise.all([
          apiRequest<{ rules: string }>("/admin/content/rules"),
          apiRequest<{ terms: string; disclaimer: string }>("/admin/content/legal"),
        ])
        setRules(rulesData.rules || "")
        setTerms(legalData.terms || "")
        setDisclaimer(legalData.disclaimer || "")
      } catch { /* noop */ }
      try {
        const bannersData = await apiRequest<{ banners: Banner[] }>("/admin/content/banners")
        if (bannersData.banners?.length) setBanners(bannersData.banners)
      } catch { /* noop */ }
      try {
        const seoData = await apiRequest<SeoGlobal>("/admin/content/seo-global")
        if (seoData) setSeoGlobal((p) => ({ ...p, ...seoData }))
      } catch { /* noop */ }
    })()
  }, [])

  async function handleSave() {
    setSaving(true)
    const endpointMap: Record<Tab, string> = {
      general: "/admin/settings/general",
      header: "/admin/settings/header",
      footer: "/admin/settings/footer",
      contact: "/admin/settings/contact",
      about: "/admin/settings/about",
      home: "/admin/settings/home",
      theme: "/admin/settings/theme",
      rules: "/admin/content/rules",
      legal: "/admin/content/legal",
      banners: "/admin/content/banners",
      seo_global: "/admin/content/seo-global",
    }
    const endpoint = endpointMap[activeTab]

    const payloadMap: Record<Tab, unknown> = {
      general, header, footer, contact, about, home, theme,
      rules: { rules },
      legal: { terms, disclaimer },
      banners: { banners },
      seo_global: seoGlobal,
    }
    const payload = payloadMap[activeTab]

    try {
      await apiRequest(endpoint, { method: "PUT", body: JSON.stringify(payload) })
      toast.success("تنظیمات ذخیره شد ✓")
    } catch {
      toast.error("خطا در ذخیره — داده‌ها به صورت موقت ذخیره شد")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-20" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black">مدیریت سایت و محتوا</h1>
          <p className="text-white/40 text-sm mt-1">کنترل کامل محتوا، ظاهر، تماس و تنظیمات سایت — همه در یک پنل</p>
        </div>
        <SaveButton onClick={handleSave} loading={saving} />
      </div>

      {/* Tab Groups */}
      <div className="space-y-3">
        <div>
          <p className="text-xs text-white/30 font-bold mb-2 mr-1">⚙️ مدیریت سایت</p>
          <div className="flex gap-2 flex-wrap">
            {TABS.filter(t => t.group === "site").map((t) => {
              const Icon = t.icon
              const active = activeTab === t.id
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${active ? "bg-accent-gold text-black border-accent-gold shadow-[0_0_16px_rgba(212,175,55,0.3)]" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"}`}
                >
                  <Icon className="w-4 h-4" />{t.label}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <p className="text-xs text-white/30 font-bold mb-2 mr-1">📝 مدیریت محتوا</p>
          <div className="flex gap-2 flex-wrap">
            {TABS.filter(t => t.group === "content").map((t) => {
              const Icon = t.icon
              const active = activeTab === t.id
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${active ? "bg-accent-cyan text-black border-accent-cyan shadow-[0_0_16px_rgba(0,188,212,0.3)]" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"}`}
                >
                  <Icon className="w-4 h-4" />{t.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab description */}
      <p className="text-white/30 text-xs -mt-2">
        {TABS.find((t) => t.id === activeTab)?.desc}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >

          {/* ═══════════════ GENERAL ═══════════════ */}
          {activeTab === "general" && (
            <>
              <SectionCard title="هویت سایت" desc="نام، شعار و لوگوی سایت">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="نام سایت">
                    <TextInput value={general.siteName} onChange={(v) => setGeneral((p) => ({ ...p, siteName: v }))} placeholder="LUX" />
                  </Field>
                  <Field label="شعار سایت">
                    <TextInput value={general.siteTagline} onChange={(v) => setGeneral((p) => ({ ...p, siteTagline: v }))} placeholder="پلتفرم هوشمند خودرو" />
                  </Field>
                </div>
                <ImageUploader label="لوگوی سایت (SVG یا PNG شفاف)" value={general.logoUrl} onChange={(v) => setGeneral((p) => ({ ...p, logoUrl: v }))} aspect="logo" />
                <ImageUploader label="فاویکون سایت (ICO یا PNG 32×32)" value={general.faviconUrl} onChange={(v) => setGeneral((p) => ({ ...p, faviconUrl: v }))} aspect="square" />
              </SectionCard>

              <SectionCard title="حقوق مالکیت">
                <Field label="متن کپی‌رایت فوتر">
                  <TextInput value={general.copyrightText} onChange={(v) => setGeneral((p) => ({ ...p, copyrightText: v }))} />
                </Field>
              </SectionCard>

              <SectionCard title="حالت تعمیرات" desc="سایت را موقتاً برای بازدیدکنندگان غیرفعال کنید">
                <Toggle value={general.maintenanceMode} onChange={(v) => setGeneral((p) => ({ ...p, maintenanceMode: v }))} label={general.maintenanceMode ? "حالت تعمیرات فعال است" : "حالت تعمیرات غیرفعال"} />
                <Field label="پیام صفحه تعمیرات">
                  <TextArea value={general.maintenanceMessage} onChange={(v) => setGeneral((p) => ({ ...p, maintenanceMessage: v }))} rows={2} />
                </Field>
              </SectionCard>
            </>
          )}

          {/* ═══════════════ HEADER ═══════════════ */}
          {activeTab === "header" && (
            <>
              <SectionCard title="رفتار هدر">
                <div className="grid md:grid-cols-2 gap-3">
                  <Toggle value={header.sticky} onChange={(v) => setHeader((p) => ({ ...p, sticky: v }))} label="هدر چسبنده (sticky)" />
                  <Toggle value={header.transparent} onChange={(v) => setHeader((p) => ({ ...p, transparent: v }))} label="هدر شفاف روی تصویر" />
                </div>
              </SectionCard>

              <SectionCard title="دکمه CTA هدر">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="متن دکمه">
                    <TextInput value={header.ctaLabel} onChange={(v) => setHeader((p) => ({ ...p, ctaLabel: v }))} />
                  </Field>
                  <Field label="لینک دکمه">
                    <TextInput value={header.ctaHref} onChange={(v) => setHeader((p) => ({ ...p, ctaHref: v }))} dir="ltr" mono />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="بار اعلانات بالای سایت" desc="نوار اعلان که بالای هدر نمایش داده می‌شود">
                <Toggle value={header.announcementBarActive} onChange={(v) => setHeader((p) => ({ ...p, announcementBarActive: v }))} label="فعال‌سازی بار اعلانات" />
                <Field label="متن اعلان">
                  <TextInput value={header.announcementText} onChange={(v) => setHeader((p) => ({ ...p, announcementText: v }))} placeholder="🎉  قرعه‌کشی جدید شروع شد! همین الان شرکت کنید" />
                </Field>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="لینک اعلان (اختیاری)">
                    <TextInput value={header.announcementLink} onChange={(v) => setHeader((p) => ({ ...p, announcementLink: v }))} dir="ltr" placeholder="/raffles" />
                  </Field>
                  <Field label="رنگ زمینه">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={header.announcementColor}
                        onChange={(e) => setHeader((p) => ({ ...p, announcementColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                      />
                      <TextInput value={header.announcementColor} onChange={(v) => setHeader((p) => ({ ...p, announcementColor: v }))} dir="ltr" mono />
                    </div>
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="آیتم‌های منو ناوبری" desc="ترتیب نمایش لینک‌های هدر را مدیریت کنید">
                <div className="space-y-2">
                  {header.navLinks.map((link, i) => (
                    <div key={link.id} className="flex items-center gap-3 p-3 bg-white/3 border border-white/8 rounded-xl group">
                      <GripVertical className="w-4 h-4 text-white/20" />
                      <input
                        value={link.label}
                        onChange={(e) => setHeader((p) => ({ ...p, navLinks: p.navLinks.map((nl, ni) => ni === i ? { ...nl, label: e.target.value } : nl) }))}
                        className="flex-1 bg-transparent outline-none text-sm font-semibold"
                        placeholder="عنوان"
                      />
                      <input
                        value={link.href}
                        onChange={(e) => setHeader((p) => ({ ...p, navLinks: p.navLinks.map((nl, ni) => ni === i ? { ...nl, href: e.target.value } : nl) }))}
                        className="flex-1 bg-transparent outline-none text-sm font-mono text-white/50 text-left"
                        dir="ltr"
                        placeholder="/path"
                      />
                      <button onClick={() => setHeader((p) => ({ ...p, navLinks: p.navLinks.filter((_, ni) => ni !== i) }))} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    value={newNavLabel}
                    onChange={(e) => setNewNavLabel(e.target.value)}
                    placeholder="عنوان لینک جدید"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                    onKeyDown={(e) => { if (e.key === "Enter" && newNavLabel && newNavHref) { setHeader((p) => ({ ...p, navLinks: [...p.navLinks, { id: crypto.randomUUID(), label: newNavLabel, href: newNavHref }] })); setNewNavLabel(""); setNewNavHref("") } }}
                  />
                  <input
                    value={newNavHref}
                    onChange={(e) => setNewNavHref(e.target.value)}
                    placeholder="/مسیر"
                    dir="ltr"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none font-mono text-left"
                  />
                  <button
                    onClick={() => {
                      if (!newNavLabel || !newNavHref) return
                      setHeader((p) => ({ ...p, navLinks: [...p.navLinks, { id: crypto.randomUUID(), label: newNavLabel, href: newNavHref }] }))
                      setNewNavLabel(""); setNewNavHref("")
                    }}
                    className="px-4 py-2 bg-accent-gold/10 border border-accent-gold/30 text-accent-gold rounded-xl text-sm font-bold hover:bg-accent-gold/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </SectionCard>
            </>
          )}

          {/* ═══════════════ FOOTER ═══════════════ */}
          {activeTab === "footer" && (
            <>
              <SectionCard title="معرفی شرکت در فوتر">
                <Field label="متن معرفی کوتاه">
                  <TextArea value={footer.companyDescription} onChange={(v) => setFooter((p) => ({ ...p, companyDescription: v }))} rows={2} />
                </Field>
              </SectionCard>

              <SectionCard title="ستون‌های لینک فوتر" desc="هر ستون شامل یک عنوان و چندین لینک است">
                {footer.columns.map((col, ci) => (
                  <div key={ci} className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        value={col.title}
                        onChange={(e) => setFooter((p) => ({ ...p, columns: p.columns.map((c, i) => i === ci ? { ...c, title: e.target.value } : c) }))}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold outline-none"
                        placeholder="عنوان ستون"
                      />
                      <button
                        onClick={() => setFooter((p) => ({ ...p, columns: p.columns.filter((_, i) => i !== ci) }))}
                        className="p-2 text-white/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {col.links.map((link, li) => (
                      <div key={li} className="flex items-center gap-2">
                        <input
                          value={link.label}
                          onChange={(e) => setFooter((p) => ({ ...p, columns: p.columns.map((c, i) => i === ci ? { ...c, links: c.links.map((l, j) => j === li ? { ...l, label: e.target.value } : l) } : c) }))}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm outline-none"
                          placeholder="متن"
                        />
                        <input
                          value={link.href}
                          onChange={(e) => setFooter((p) => ({ ...p, columns: p.columns.map((c, i) => i === ci ? { ...c, links: c.links.map((l, j) => j === li ? { ...l, href: e.target.value } : l) } : c) }))}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm outline-none font-mono text-left"
                          dir="ltr"
                          placeholder="/path"
                        />
                        <button onClick={() => setFooter((p) => ({ ...p, columns: p.columns.map((c, i) => i === ci ? { ...c, links: c.links.filter((_, j) => j !== li) } : c) }))} className="p-1 text-white/20 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setFooter((p) => ({ ...p, columns: p.columns.map((c, i) => i === ci ? { ...c, links: [...c.links, { label: "", href: "" }] } : c) }))}
                      className="flex items-center gap-1 text-xs text-white/30 hover:text-accent-gold transition-colors"
                    >
                      <Plus className="w-3 h-3" /> افزودن لینک
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setFooter((p) => ({ ...p, columns: [...p.columns, { title: "ستون جدید", links: [] }] }))}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-4 h-4" /> افزودن ستون
                </button>
              </SectionCard>

              <SectionCard title="شبکه‌های اجتماعی">
                {footer.socialLinks.map((social, si) => (
                  <div key={si} className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">
                      {social.platform === "instagram" ? "📸" : social.platform === "telegram" ? "✈️" : social.platform === "twitter" ? "🐦" : social.platform === "youtube" ? "▶️" : "🔗"}
                    </span>
                    <input
                      value={social.platform}
                      onChange={(e) => setFooter((p) => ({ ...p, socialLinks: p.socialLinks.map((s, i) => i === si ? { ...s, platform: e.target.value } : s) }))}
                      className="w-28 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                      placeholder="instagram"
                      dir="ltr"
                    />
                    <input
                      value={social.url}
                      onChange={(e) => setFooter((p) => ({ ...p, socialLinks: p.socialLinks.map((s, i) => i === si ? { ...s, url: e.target.value } : s) }))}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none font-mono text-left"
                      placeholder="https://..."
                      dir="ltr"
                    />
                    <button onClick={() => setFooter((p) => ({ ...p, socialLinks: p.socialLinks.filter((_, i) => i !== si) }))} className="p-2 text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setFooter((p) => ({ ...p, socialLinks: [...p.socialLinks, { platform: "", url: "", icon: "" }] }))}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/50 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" /> افزودن شبکه اجتماعی
                </button>
              </SectionCard>

              <SectionCard title="لینک‌های ته فوتر (حریم خصوصی و ...)">
                {footer.bottomLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={link.label} onChange={(e) => setFooter((p) => ({ ...p, bottomLinks: p.bottomLinks.map((l, j) => j === i ? { ...l, label: e.target.value } : l) }))} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" placeholder="متن" />
                    <input value={link.href} onChange={(e) => setFooter((p) => ({ ...p, bottomLinks: p.bottomLinks.map((l, j) => j === i ? { ...l, href: e.target.value } : l) }))} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none font-mono text-left" dir="ltr" placeholder="/path" />
                    <button onClick={() => setFooter((p) => ({ ...p, bottomLinks: p.bottomLinks.filter((_, j) => j !== i) }))} className="p-2 text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => setFooter((p) => ({ ...p, bottomLinks: [...p.bottomLinks, { label: "", href: "" }] }))} className="flex items-center gap-2 text-xs text-white/30 hover:text-accent-gold transition-colors"><Plus className="w-3 h-3" /> افزودن لینک</button>
              </SectionCard>

              <SectionCard title="خبرنامه">
                <Toggle value={footer.newsletter} onChange={(v) => setFooter((p) => ({ ...p, newsletter: v }))} label="نمایش فرم خبرنامه در فوتر" />
                <Field label="متن دعوت به خبرنامه">
                  <TextInput value={footer.newsletterText} onChange={(v) => setFooter((p) => ({ ...p, newsletterText: v }))} />
                </Field>
              </SectionCard>
            </>
          )}

          {/* ═══════════════ CONTACT ═══════════════ */}
          {activeTab === "contact" && (
            <>
              <SectionCard title="اطلاعات آدرس">
                <Field label="آدرس کامل">
                  <TextArea value={contact.address} onChange={(v) => setContact((p) => ({ ...p, address: v }))} rows={2} />
                </Field>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="شهر">
                    <TextInput value={contact.city} onChange={(v) => setContact((p) => ({ ...p, city: v }))} />
                  </Field>
                  <Field label="کد پستی">
                    <TextInput value={contact.postalCode} onChange={(v) => setContact((p) => ({ ...p, postalCode: v }))} dir="ltr" mono />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="شماره‌های تماس">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="شماره تلفن اصلی">
                    <TextInput value={contact.phone} onChange={(v) => setContact((p) => ({ ...p, phone: v }))} dir="ltr" placeholder="021-XXXXXXXX" />
                  </Field>
                  <Field label="شماره تلفن دوم (اختیاری)">
                    <TextInput value={contact.phone2} onChange={(v) => setContact((p) => ({ ...p, phone2: v }))} dir="ltr" />
                  </Field>
                  <Field label="واتساپ">
                    <TextInput value={contact.whatsappNumber} onChange={(v) => setContact((p) => ({ ...p, whatsappNumber: v }))} dir="ltr" placeholder="+989..." />
                  </Field>
                  <Field label="ساعات پشتیبانی">
                    <TextInput value={contact.supportHours} onChange={(v) => setContact((p) => ({ ...p, supportHours: v }))} placeholder="شنبه تا چهارشنبه ۹–۱۷" />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="ایمیل‌ها">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="ایمیل اصلی">
                    <TextInput value={contact.email} onChange={(v) => setContact((p) => ({ ...p, email: v }))} dir="ltr" />
                  </Field>
                  <Field label="ایمیل پشتیبانی">
                    <TextInput value={contact.emailSupport} onChange={(v) => setContact((p) => ({ ...p, emailSupport: v }))} dir="ltr" />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="شبکه‌های اجتماعی">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="تلگرام">
                    <TextInput value={contact.telegramLink} onChange={(v) => setContact((p) => ({ ...p, telegramLink: v }))} dir="ltr" placeholder="https://t.me/..." />
                  </Field>
                  <Field label="اینستاگرام">
                    <TextInput value={contact.instagramLink} onChange={(v) => setContact((p) => ({ ...p, instagramLink: v }))} dir="ltr" placeholder="https://instagram.com/..." />
                  </Field>
                  <Field label="لینکدین">
                    <TextInput value={contact.linkedinUrl} onChange={(v) => setContact((p) => ({ ...p, linkedinUrl: v }))} dir="ltr" />
                  </Field>
                  <Field label="توییتر / X">
                    <TextInput value={contact.twitterUrl} onChange={(v) => setContact((p) => ({ ...p, twitterUrl: v }))} dir="ltr" />
                  </Field>
                  <Field label="یوتیوب">
                    <TextInput value={contact.youtubeUrl} onChange={(v) => setContact((p) => ({ ...p, youtubeUrl: v }))} dir="ltr" />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="نقشه" desc="لینک embed گوگل مپ">
                <Field label="لینک embed نقشه">
                  <TextInput value={contact.mapEmbedUrl} onChange={(v) => setContact((p) => ({ ...p, mapEmbedUrl: v }))} dir="ltr" placeholder="https://maps.google.com/maps?..." />
                </Field>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="عرض جغرافیایی (Latitude)">
                    <TextInput value={contact.mapLat} onChange={(v) => setContact((p) => ({ ...p, mapLat: v }))} dir="ltr" mono />
                  </Field>
                  <Field label="طول جغرافیایی (Longitude)">
                    <TextInput value={contact.mapLng} onChange={(v) => setContact((p) => ({ ...p, mapLng: v }))} dir="ltr" mono />
                  </Field>
                </div>
                {contact.mapEmbedUrl && (
                  <div className="rounded-xl overflow-hidden border border-white/10 h-48">
                    <iframe src={contact.mapEmbedUrl} className="w-full h-full" loading="lazy" />
                  </div>
                )}
              </SectionCard>
            </>
          )}

          {/* ═══════════════ ABOUT ═══════════════ */}
          {activeTab === "about" && (
            <>
              <SectionCard title="هیرو صفحه درباره ما">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="عنوان اصلی">
                    <TextInput value={about.heroTitle} onChange={(v) => setAbout((p) => ({ ...p, heroTitle: v }))} />
                  </Field>
                  <Field label="زیرعنوان">
                    <TextInput value={about.heroSubtitle} onChange={(v) => setAbout((p) => ({ ...p, heroSubtitle: v }))} />
                  </Field>
                </div>
                <ImageUploader label="تصویر هیرو" value={about.heroImage} onChange={(v) => setAbout((p) => ({ ...p, heroImage: v }))} aspect="wide" />
              </SectionCard>

              <SectionCard title="ماموریت و چشم‌انداز">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Field label="عنوان ماموریت">
                      <TextInput value={about.missionTitle} onChange={(v) => setAbout((p) => ({ ...p, missionTitle: v }))} />
                    </Field>
                    <Field label="متن ماموریت">
                      <TextArea value={about.missionText} onChange={(v) => setAbout((p) => ({ ...p, missionText: v }))} rows={3} />
                    </Field>
                  </div>
                  <div className="space-y-3">
                    <Field label="عنوان چشم‌انداز">
                      <TextInput value={about.visionTitle} onChange={(v) => setAbout((p) => ({ ...p, visionTitle: v }))} />
                    </Field>
                    <Field label="متن چشم‌انداز">
                      <TextArea value={about.visionText} onChange={(v) => setAbout((p) => ({ ...p, visionText: v }))} rows={3} />
                    </Field>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="آمارها">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: "statsUsers", label: "کاربران" },
                    { key: "statsRaffles", label: "قرعه‌کشی‌ها" },
                    { key: "statsPrizes", label: "جوایز" },
                    { key: "statsSatisfaction", label: "رضایت" },
                  ].map(({ key, label }) => (
                    <Field key={key} label={label}>
                      <TextInput
                        value={about[key as keyof AboutSettings] as string}
                        onChange={(v) => setAbout((p) => ({ ...p, [key]: v }))}
                        placeholder="۵۰,۰۰۰+"
                      />
                    </Field>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="ارزش‌های ما" desc="کارت‌های رنگی بخش ارزش‌ها">
                <Field label="عنوان بخش">
                  <TextInput value={about.valuesTitle} onChange={(v) => setAbout((p) => ({ ...p, valuesTitle: v }))} />
                </Field>
                {about.values.map((val, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/3 border border-white/8 rounded-xl">
                    <div className="space-y-2 flex-1">
                      <input value={val.title} onChange={(e) => setAbout((p) => ({ ...p, values: p.values.map((v, j) => j === i ? { ...v, title: e.target.value } : v) }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold outline-none" placeholder="عنوان ارزش" />
                      <input value={val.description} onChange={(e) => setAbout((p) => ({ ...p, values: p.values.map((v, j) => j === i ? { ...v, description: e.target.value } : v) }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" placeholder="توضیح" />
                    </div>
                    <select value={val.color} onChange={(e) => setAbout((p) => ({ ...p, values: p.values.map((v, j) => j === i ? { ...v, color: e.target.value } : v) }))} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-white">
                      <option value="gold">طلایی</option>
                      <option value="green">سبز</option>
                      <option value="cyan">آبی</option>
                      <option value="purple">بنفش</option>
                    </select>
                    <button onClick={() => setAbout((p) => ({ ...p, values: p.values.filter((_, j) => j !== i) }))} className="p-1.5 text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => setAbout((p) => ({ ...p, values: [...p.values, { title: "", description: "", color: "gold" }] }))} className="flex items-center gap-2 text-xs text-white/30 hover:text-accent-gold transition-colors"><Plus className="w-3 h-3" /> افزودن ارزش</button>
              </SectionCard>

              <SectionCard title="تیم ما">
                <Field label="عنوان بخش تیم">
                  <TextInput value={about.teamTitle} onChange={(v) => setAbout((p) => ({ ...p, teamTitle: v }))} />
                </Field>
                {about.team.map((member, i) => (
                  <div key={i} className="p-4 bg-white/3 border border-white/8 rounded-xl space-y-3">
                    <div className="flex items-start gap-3">
                      <ImageUploader label="عکس" value={member.image} onChange={(v) => setAbout((p) => ({ ...p, team: p.team.map((m, j) => j === i ? { ...m, image: v } : m) }))} aspect="square" />
                      <div className="flex-1 space-y-2">
                        <input value={member.name} onChange={(e) => setAbout((p) => ({ ...p, team: p.team.map((m, j) => j === i ? { ...m, name: e.target.value } : m) }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold outline-none" placeholder="نام" />
                        <input value={member.role} onChange={(e) => setAbout((p) => ({ ...p, team: p.team.map((m, j) => j === i ? { ...m, role: e.target.value } : m) }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" placeholder="سمت" />
                        <textarea value={member.bio} onChange={(e) => setAbout((p) => ({ ...p, team: p.team.map((m, j) => j === i ? { ...m, bio: e.target.value } : m) }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none resize-none" rows={2} placeholder="بیوگرافی کوتاه" />
                        <button onClick={() => setAbout((p) => ({ ...p, team: p.team.filter((_, j) => j !== i) }))} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">حذف عضو تیم</button>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setAbout((p) => ({ ...p, team: [...p.team, { name: "", role: "", image: "", bio: "" }] }))} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/50 hover:text-white transition-colors"><Plus className="w-4 h-4" /> افزودن عضو تیم</button>
              </SectionCard>

              <SectionCard title="تایم‌لاین (مسیر ما)">
                <Field label="عنوان بخش">
                  <TextInput value={about.timelineTitle} onChange={(v) => setAbout((p) => ({ ...p, timelineTitle: v }))} />
                </Field>
                {about.timeline.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/3 border border-white/8 rounded-xl">
                    <input value={item.year} onChange={(e) => setAbout((p) => ({ ...p, timeline: p.timeline.map((t, j) => j === i ? { ...t, year: e.target.value } : t) }))} className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-center outline-none" placeholder="۱۴۰۳" />
                    <div className="flex-1 space-y-2">
                      <input value={item.title} onChange={(e) => setAbout((p) => ({ ...p, timeline: p.timeline.map((t, j) => j === i ? { ...t, title: e.target.value } : t) }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold outline-none" placeholder="عنوان مرحله" />
                      <input value={item.description} onChange={(e) => setAbout((p) => ({ ...p, timeline: p.timeline.map((t, j) => j === i ? { ...t, description: e.target.value } : t) }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" placeholder="توضیح" />
                    </div>
                    <button onClick={() => setAbout((p) => ({ ...p, timeline: p.timeline.filter((_, j) => j !== i) }))} className="p-1.5 text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => setAbout((p) => ({ ...p, timeline: [...p.timeline, { year: "", title: "", description: "" }] }))} className="flex items-center gap-2 text-xs text-white/30 hover:text-accent-gold transition-colors"><Plus className="w-3 h-3" /> افزودن مرحله</button>
              </SectionCard>

              <SectionCard title="بخش CTA انتهای صفحه">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="عنوان">
                    <TextInput value={about.ctaTitle} onChange={(v) => setAbout((p) => ({ ...p, ctaTitle: v }))} />
                  </Field>
                  <Field label="متن">
                    <TextInput value={about.ctaText} onChange={(v) => setAbout((p) => ({ ...p, ctaText: v }))} />
                  </Field>
                  <Field label="متن دکمه">
                    <TextInput value={about.ctaButton} onChange={(v) => setAbout((p) => ({ ...p, ctaButton: v }))} />
                  </Field>
                  <Field label="لینک دکمه">
                    <TextInput value={about.ctaLink} onChange={(v) => setAbout((p) => ({ ...p, ctaLink: v }))} dir="ltr" mono />
                  </Field>
                </div>
              </SectionCard>
            </>
          )}

          {/* ═══════════════ HOME ═══════════════ */}
          {activeTab === "home" && (
            <>
              <SectionCard title="بخش هیرو (بالای صفحه)">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="عنوان اصلی هیرو">
                    <TextInput value={home.heroTitle} onChange={(v) => setHome((p) => ({ ...p, heroTitle: v }))} />
                  </Field>
                  <Field label="زیرعنوان هیرو">
                    <TextInput value={home.heroSubtitle} onChange={(v) => setHome((p) => ({ ...p, heroSubtitle: v }))} />
                  </Field>
                  <Field label="متن دکمه اول">
                    <TextInput value={home.heroCta1} onChange={(v) => setHome((p) => ({ ...p, heroCta1: v }))} />
                  </Field>
                  <Field label="لینک دکمه اول">
                    <TextInput value={home.heroCta1Link} onChange={(v) => setHome((p) => ({ ...p, heroCta1Link: v }))} dir="ltr" mono />
                  </Field>
                  <Field label="متن دکمه دوم">
                    <TextInput value={home.heroCta2} onChange={(v) => setHome((p) => ({ ...p, heroCta2: v }))} />
                  </Field>
                  <Field label="لینک دکمه دوم">
                    <TextInput value={home.heroCta2Link} onChange={(v) => setHome((p) => ({ ...p, heroCta2Link: v }))} dir="ltr" mono />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="آمارهای صفحه اصلی">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: "statsUsers", label: "کاربران" },
                    { key: "statsRaffles", label: "قرعه‌کشی‌ها" },
                    { key: "statsPrizes", label: "جوایز" },
                  ].map(({ key, label }) => (
                    <Field key={key} label={label}>
                      <TextInput value={home[key as keyof HomeSettings] as string} onChange={(v) => setHome((p) => ({ ...p, [key]: v }))} />
                    </Field>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="بخش ویژگی‌ها (چرا LUX)">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="عنوان بخش">
                    <TextInput value={home.featureTitle} onChange={(v) => setHome((p) => ({ ...p, featureTitle: v }))} />
                  </Field>
                  <Field label="زیرعنوان">
                    <TextInput value={home.featureSubtitle} onChange={(v) => setHome((p) => ({ ...p, featureSubtitle: v }))} />
                  </Field>
                </div>
                {home.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/3 border border-white/8 rounded-xl">
                    <input value={f.icon} onChange={(e) => setHome((p) => ({ ...p, features: p.features.map((ft, j) => j === i ? { ...ft, icon: e.target.value } : ft) }))} className="w-12 text-center bg-white/5 border border-white/10 rounded-xl py-2 text-xl outline-none" placeholder="🔐" />
                    <input value={f.title} onChange={(e) => setHome((p) => ({ ...p, features: p.features.map((ft, j) => j === i ? { ...ft, title: e.target.value } : ft) }))} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold outline-none" placeholder="عنوان" />
                    <input value={f.description} onChange={(e) => setHome((p) => ({ ...p, features: p.features.map((ft, j) => j === i ? { ...ft, description: e.target.value } : ft) }))} className="flex-[2] bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" placeholder="توضیح" />
                    <button onClick={() => setHome((p) => ({ ...p, features: p.features.filter((_, j) => j !== i) }))} className="p-1.5 text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => setHome((p) => ({ ...p, features: [...p.features, { icon: "✨", title: "", description: "" }] }))} className="flex items-center gap-2 text-xs text-white/30 hover:text-accent-gold transition-colors"><Plus className="w-3 h-3" /> افزودن ویژگی</button>
              </SectionCard>

              <SectionCard title="بخش خدمات">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="عنوان بخش خدمات">
                    <TextInput value={home.serviceTitle} onChange={(v) => setHome((p) => ({ ...p, serviceTitle: v }))} />
                  </Field>
                  <Field label="زیرعنوان">
                    <TextInput value={home.serviceSubtitle} onChange={(v) => setHome((p) => ({ ...p, serviceSubtitle: v }))} />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="بخش CTA (کلاب VIP)">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="عنوان">
                    <TextInput value={home.ctaTitle} onChange={(v) => setHome((p) => ({ ...p, ctaTitle: v }))} />
                  </Field>
                  <Field label="زیرعنوان">
                    <TextInput value={home.ctaSubtitle} onChange={(v) => setHome((p) => ({ ...p, ctaSubtitle: v }))} />
                  </Field>
                  <Field label="متن دکمه">
                    <TextInput value={home.ctaCta} onChange={(v) => setHome((p) => ({ ...p, ctaCta: v }))} />
                  </Field>
                </div>
              </SectionCard>
            </>
          )}

          {/* ═══════════════ THEME ═══════════════ */}
          {activeTab === "theme" && (
            <>
              <SectionCard title="رنگ‌های اصلی سایت" desc="رنگ‌های تم را تنظیم کنید">
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { key: "accentGold", label: "رنگ طلایی اصلی (accent-gold)" },
                    { key: "accentCyan", label: "رنگ آبی فیروزه‌ای (accent-cyan)" },
                    { key: "accentGoldLight", label: "رنگ طلایی روشن" },
                    { key: "accentCyanLight", label: "رنگ آبی روشن" },
                  ].map(({ key, label }) => (
                    <Field key={key} label={label}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            value={theme[key as keyof ThemeSettings] as string}
                            onChange={(e) => setTheme((p) => ({ ...p, [key]: e.target.value }))}
                            className="w-12 h-12 rounded-xl border-2 border-white/10 bg-transparent cursor-pointer p-1"
                          />
                          <div className="absolute inset-1 rounded-lg pointer-events-none" style={{ background: theme[key as keyof ThemeSettings] as string }} />
                        </div>
                        <TextInput
                          value={theme[key as keyof ThemeSettings] as string}
                          onChange={(v) => setTheme((p) => ({ ...p, [key]: v }))}
                          dir="ltr"
                          mono
                          placeholder="#D4AF37"
                        />
                      </div>
                    </Field>
                  ))}
                </div>

                {/* Live Preview */}
                <div className="mt-4 p-4 rounded-2xl border border-white/10 space-y-3">
                  <p className="text-xs text-white/30 font-semibold mb-3">پیش‌نمایش رنگ‌ها</p>
                  <div className="flex gap-3 flex-wrap">
                    <div className="px-4 py-2 rounded-xl font-bold text-black text-sm" style={{ background: theme.accentGold }}>دکمه طلایی</div>
                    <div className="px-4 py-2 rounded-xl font-bold text-black text-sm" style={{ background: theme.accentCyan }}>دکمه آبی</div>
                    <div className="px-4 py-2 rounded-xl font-bold text-sm border-2" style={{ borderColor: theme.accentGold, color: theme.accentGold }}>دکمه توخالی</div>
                    <div className="px-4 py-2 rounded-xl text-sm" style={{ color: theme.accentGold }}>متن طلایی</div>
                    <div className="px-4 py-2 rounded-xl text-sm" style={{ color: theme.accentCyan }}>متن آبی</div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="تایپوگرافی و استایل">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="فونت اصلی متن" hint="نام فونت CSS">
                    <TextInput value={theme.fontMain} onChange={(v) => setTheme((p) => ({ ...p, fontMain: v }))} dir="ltr" mono />
                  </Field>
                  <Field label="فونت عناوین" hint="نام فونت CSS">
                    <TextInput value={theme.fontHeading} onChange={(v) => setTheme((p) => ({ ...p, fontHeading: v }))} dir="ltr" mono />
                  </Field>
                  <Field label="شعاع گوشه‌ها (border-radius)" hint="مثلاً 1rem یا 16px">
                    <TextInput value={theme.borderRadius} onChange={(v) => setTheme((p) => ({ ...p, borderRadius: v }))} dir="ltr" mono />
                  </Field>
                  <Field label="شفافیت پس‌زمینه شیشه‌ای" hint="بین 0 تا 1، مثلاً 0.05">
                    <TextInput value={theme.glassOpacity} onChange={(v) => setTheme((p) => ({ ...p, glassOpacity: v }))} dir="ltr" mono />
                  </Field>
                </div>
              </SectionCard>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-200">
                <p className="font-bold mb-1">⚠️ نکته</p>
                <p className="text-amber-200/70">تغییرات رنگ و فونت نیاز به ری‌استارت سرور دارند تا در CSS اعمال شوند. پس از ذخیره، این تنظیمات در پایگاه داده ذخیره می‌شوند و ادمین توسعه می‌تواند آن‌ها را به tailwind.config اعمال کند.</p>
              </div>
            </>
          )}

          {/* ═══════════════ RULES ═══════════════ */}
          {activeTab === "rules" && (
            <>
              <SectionCard title="قوانین پلتفرم" desc="این متن در صفحه /rules نمایش داده می‌شود">
                <Field label="متن قوانین (Markdown پشتیبانی می‌شود)" hint="از # برای عناوین، ** برای bold و - برای لیست استفاده کنید">
                  <textarea
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    rows={20}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-gold/60 transition-colors text-sm resize-y font-mono text-left"
                    dir="rtl"
                    placeholder="# قوانین و مقررات&#10;&#10;## ماده ۱&#10;..."
                  />
                </Field>
              </SectionCard>
            </>
          )}

          {/* ═══════════════ LEGAL ═══════════════ */}
          {activeTab === "legal" && (
            <>
              <SectionCard title="شرایط استفاده (Terms &amp; Conditions)" desc="صفحه /terms">
                <Field label="متن شرایط استفاده">
                  <textarea
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    rows={14}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-gold/60 transition-colors text-sm resize-y font-mono"
                    dir="rtl"
                  />
                </Field>
              </SectionCard>
              <SectionCard title="سلب مسئولیت (Disclaimer)" desc="نمایش در صفحات قانونی">
                <Field label="متن سلب مسئولیت">
                  <textarea
                    value={disclaimer}
                    onChange={(e) => setDisclaimer(e.target.value)}
                    rows={8}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-gold/60 transition-colors text-sm resize-y font-mono"
                    dir="rtl"
                  />
                </Field>
              </SectionCard>
            </>
          )}

          {/* ═══════════════ BANNERS ═══════════════ */}
          {activeTab === "banners" && (
            <>
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 text-sm text-cyan-200 mb-2">
                💡 بنرها در بخش‌های مختلف سایت نمایش داده می‌شوند. آنها را فعال یا غیرفعال کنید.
              </div>
              {banners.map((banner) => (
                <SectionCard key={banner.id} title={banner.title}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="متن بنر">
                      <TextArea
                        value={banner.text}
                        onChange={(v) => setBanners((prev) => prev.map((b) => b.id === banner.id ? { ...b, text: v } : b))}
                        rows={2}
                      />
                    </Field>
                    <div className="space-y-3">
                      <Field label="متن دکمه">
                        <TextInput value={banner.buttonText} onChange={(v) => setBanners((prev) => prev.map((b) => b.id === banner.id ? { ...b, buttonText: v } : b))} />
                      </Field>
                      <Field label="لینک دکمه">
                        <TextInput value={banner.buttonLink} onChange={(v) => setBanners((prev) => prev.map((b) => b.id === banner.id ? { ...b, buttonLink: v } : b))} dir="ltr" mono />
                      </Field>
                    </div>
                    <div className="flex items-center gap-6">
                      <Toggle
                        value={banner.active}
                        onChange={(v) => setBanners((prev) => prev.map((b) => b.id === banner.id ? { ...b, active: v } : b))}
                        label={banner.active ? "فعال" : "غیرفعال"}
                      />
                      <Field label="رنگ بنر">
                        <div className="flex items-center gap-3">
                          <input type="color" value={banner.color} onChange={(e) => setBanners((prev) => prev.map((b) => b.id === banner.id ? { ...b, color: e.target.value } : b))}
                            className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer p-1" />
                          <TextInput value={banner.color} onChange={(v) => setBanners((prev) => prev.map((b) => b.id === banner.id ? { ...b, color: v } : b))} dir="ltr" mono />
                        </div>
                      </Field>
                    </div>
                  </div>
                </SectionCard>
              ))}
            </>
          )}

          {/* ═══════════════ SEO GLOBAL ═══════════════ */}
          {activeTab === "seo_global" && (
            <>
              <SectionCard title="هویت سایت برای موتورهای جستجو">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="نام سایت (site name در meta)">
                    <TextInput value={seoGlobal.siteName} onChange={(v) => setSeoGlobal((p) => ({ ...p, siteName: v }))} placeholder="LUX" />
                  </Field>
                  <Field label="شعار سایت (Tagline)">
                    <TextInput value={seoGlobal.siteTagline} onChange={(v) => setSeoGlobal((p) => ({ ...p, siteTagline: v }))} placeholder="پلتفرم هوشمند خودرو" />
                  </Field>
                  <Field label="پیش‌فرض Meta Title" hint="در صورت خالی بودن عنوان صفحه" className="md:col-span-2">
                    <TextInput value={seoGlobal.defaultMetaTitle} onChange={(v) => setSeoGlobal((p) => ({ ...p, defaultMetaTitle: v }))} />
                  </Field>
                  <Field label="پیش‌فرض Meta Description" className="md:col-span-2">
                    <TextArea value={seoGlobal.defaultMetaDescription} onChange={(v) => setSeoGlobal((p) => ({ ...p, defaultMetaDescription: v }))} rows={3} />
                  </Field>
                </div>
              </SectionCard>
              <SectionCard title="Open Graph و شبکه‌های اجتماعی">
                <Field label="آدرس تصویر OG (1200×630px)" hint="این تصویر هنگام اشتراک‌گذاری سایت نمایش داده می‌شود">
                  <TextInput value={seoGlobal.ogImage} onChange={(v) => setSeoGlobal((p) => ({ ...p, ogImage: v }))} dir="ltr" placeholder="https://..." />
                </Field>
                <Field label="توییتر / X Handle">
                  <TextInput value={seoGlobal.twitterHandle} onChange={(v) => setSeoGlobal((p) => ({ ...p, twitterHandle: v }))} dir="ltr" placeholder="@lux_platform" />
                </Field>
              </SectionCard>
              <SectionCard title="آنالیتیکس">
                <Field label="Google Analytics Measurement ID" hint="مثال: G-XXXXXXXXXX">
                  <TextInput value={seoGlobal.googleAnalyticsId} onChange={(v) => setSeoGlobal((p) => ({ ...p, googleAnalyticsId: v }))} dir="ltr" mono placeholder="G-XXXXXXXXXX" />
                </Field>
              </SectionCard>
            </>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Bottom Save Bar */}
      <div className="fixed bottom-0 right-0 left-0 lg:right-72 z-30 px-6 py-4 bg-[#0A0A0A]/90 backdrop-blur-sm border-t border-white/5 flex items-center justify-between">
        <p className="text-xs text-white/30">تغییرات ذخیره نشده در تب «{TABS.find(t => t.id === activeTab)?.label}» ممکن است از دست بروند</p>
        <SaveButton onClick={handleSave} loading={saving} />
      </div>
    </div>
  )
}
