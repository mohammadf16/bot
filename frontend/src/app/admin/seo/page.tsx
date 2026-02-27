"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Globe,
  FileText,
  Code,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  TrendingUp,
  Eye,
  Zap,
  Link,
  Smartphone,
  BookOpen,
  CheckCircle,
  Users,
} from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"

type SEOPage = {
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

type StructuredData = {
  id: string
  type: "article" | "product" | "organization" | "breadcrumb"
  pagePath: string
  data: Record<string, any>
  status: "active" | "draft"
}

type SEOStats = {
  totalPages: number
  pagesWithMetadata: number
  pagesWithoutMetadata: number
  avgKeywordDensity: number
  sitemapVersion: string
  robotsUpdated: string
  totalBacklinks?: number
}

type TabType = "dashboard" | "pages" | "structured" | "sitemap" | "robots" | "analytics" | "google-analytics" | "google-console" | "keywords" | "backlinks" | "mobile" | "content-quality" | "audit" | "competitors"

export default function SEOManagement() {
  const [tab, setTab] = useState<TabType>("dashboard")
  const [stats, setStats] = useState<SEOStats | null>(null)
  const [seoPages, setSEOPages] = useState<SEOPage[]>([])
  const [structuredDataList, setStructuredDataList] = useState<StructuredData[]>([])
  const [editingPage, setEditingPage] = useState<SEOPage | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<Partial<SEOPage>>({
    status: "draft",
    keywords: [],
  })
  const [sitemap, setSitemap] = useState<string | null>(null)
  const [robots, setRobots] = useState<string | null>(null)
  const [copied, setCopied] = useState("")
  const [googleAnalytics, setGoogleAnalytics] = useState<any>({ gaId: "", trackingId: "", enabled: false })
  const [googleSearchConsole, setGoogleSearchConsole] = useState<any>({
    propertyId: "",
    verificationCode: "",
    enabled: false,
  })
  const [keywords, setKeywords] = useState<any[]>([])
  const [backlinks, setBacklinks] = useState<any>(null)
  const [mobileOptimization, setMobileOptimization] = useState<any>(null)
  const [contentQuality, setContentQuality] = useState<any>(null)
  const [auditReport, setAuditReport] = useState<any>(null)
  const [competitors, setCompetitors] = useState<any>(null)

  useEffect(() => {
    fetchSEOData()
  }, [])

  async function fetchSEOData() {
    try {
      const [
        statsData,
        pagesData,
        structuredData,
        sitemapData,
        robotsData,
        gaData,
        gscData,
        keywordsData,
        backlinksData,
        mobileData,
        contentData,
        auditData,
        competitorsData,
      ] = await Promise.all([
        apiRequest<SEOStats>("/admin/seo/stats"),
        apiRequest<SEOPage[]>("/admin/seo/pages"),
        apiRequest<StructuredData[]>("/admin/seo/structured-data"),
        apiRequest<{ content: string }>("/admin/seo/sitemap"),
        apiRequest<{ content: string }>("/admin/seo/robots"),
        apiRequest("/admin/seo/google-analytics").catch(() => null),
        apiRequest("/admin/seo/google-search-console").catch(() => null),
        apiRequest("/admin/seo/keywords").catch(() => null),
        apiRequest("/admin/seo/backlinks").catch(() => null),
        apiRequest("/admin/seo/mobile-optimization").catch(() => null),
        apiRequest("/admin/seo/content-quality").catch(() => null),
        apiRequest("/admin/seo/audit").catch(() => null),
        apiRequest("/admin/seo/competitors").catch(() => null),
      ])
      setStats(statsData)
      setSEOPages(pagesData)
      setStructuredDataList(structuredData)
      setSitemap(sitemapData.content)
      setRobots(robotsData.content)
      if (gaData) setGoogleAnalytics(gaData as any)
      if (gscData) setGoogleSearchConsole(gscData as any)
      if (keywordsData) setKeywords(keywordsData as any)
      if (backlinksData) setBacklinks(backlinksData)
      if (mobileData) setMobileOptimization(mobileData)
      if (contentData) setContentQuality(contentData)
      if (auditData) setAuditReport(auditData)
      if (competitorsData) setCompetitors(competitorsData)
    } catch (err) {
      toast.error("خطا در دریافت داده‌های SEO")
    }
  }

  async function saveSEOPage(page: Partial<SEOPage>) {
    try {
      if (editingPage) {
        await apiRequest(`/admin/seo/pages/${editingPage.id}`, {
          method: "PUT",
          body: JSON.stringify(page),
        })
        toast.success("صفحه SEO بروز شد")
      } else {
        await apiRequest<SEOPage>("/admin/seo/pages", {
          method: "POST",
          body: JSON.stringify(page),
        })
        toast.success("صفحه SEO جدید افزوده شد")
      }
      await fetchSEOData()
      setShowAddForm(false)
      setEditingPage(null)
      setFormData({ status: "draft", keywords: [] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره‌سازی")
    }
  }

  async function deleteSEOPage(id: string) {
    if (!confirm("آیا مطمئنید؟")) return
    try {
      await apiRequest(`/admin/seo/pages/${id}`, { method: "DELETE" })
      await fetchSEOData()
      toast.success("صفحه حذف شد")
    } catch {
      toast.error("خطا در حذف صفحه")
    }
  }

  async function updateRobots(content: string) {
    try {
      await apiRequest("/admin/seo/robots", {
        method: "PUT",
        body: JSON.stringify({ content }),
      })
      setRobots(content)
      await fetchSEOData()
      toast.success("فایل robots.txt بروز شد")
    } catch {
      toast.error("خطا در بروز رسانی robots.txt")
    }
  }

  async function regenerateSitemap() {
    try {
      const result = await apiRequest<{ content: string }>("/admin/seo/sitemap/regenerate", {
        method: "POST",
      })
      setSitemap(result.content)
      await fetchSEOData()
      toast.success("نقشه سایت مجدد تولید شد")
    } catch {
      toast.error("خطا در تولید نقشه سایت")
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(""), 2000)
  }

  const dashboardCards = useMemo(
    () => [
      {
        label: "کل صفحات",
        value: stats?.totalPages ?? 0,
        icon: Globe,
        color: "from-blue-600 to-blue-400",
      },
      {
        label: "صفحات با متادیتا",
        value: stats?.pagesWithMetadata ?? 0,
        icon: Check,
        color: "from-green-600 to-green-400",
      },
      {
        label: "صفحات بدون متادیتا",
        value: stats?.pagesWithoutMetadata ?? 0,
        icon: AlertCircle,
        color: "from-red-600 to-red-400",
      },
      {
        label: "میانگین چگالی کلیدواژه",
        value: `${(stats?.avgKeywordDensity ?? 0).toFixed(2)}%`,
        icon: TrendingUp,
        color: "from-purple-600 to-purple-400",
      },
    ],
    [stats],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-black">مدیریت SEO</h1>
          <p className="text-white/50 mt-1">بهینه‌سازی موتور جستجو و افزایش دید</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchSEOData}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm font-bold"
          >
            بروز رسانی
          </motion.button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5">
        {[
          { id: "dashboard", label: "داشبورد", icon: BarChart3 },
          { id: "pages", label: "صفحات", icon: FileText },
          { id: "structured", label: "Structured Data", icon: Code },
          { id: "sitemap", label: "نقشه سایت", icon: Globe },
          { id: "robots", label: "Robots.txt", icon: Search },
          { id: "google-analytics", label: "Google Analytics", icon: Zap },
          { id: "google-console", label: "Google Console", icon: Globe },
          { id: "keywords", label: "کلیدواژه‌ها", icon: Search },
          { id: "backlinks", label: "بک‌لینک‌ها", icon: Link },
          { id: "mobile", label: "موبایل", icon: Smartphone },
          { id: "content-quality", label: "کیفیت محتوا", icon: BookOpen },
          { id: "audit", label: "تدقیق SEO", icon: CheckCircle },
          { id: "competitors", label: "رقبا", icon: Users },
          { id: "analytics", label: "تحلیل", icon: TrendingUp },
        ].map(({ id, label, icon: Icon }) => (
          <motion.button
            key={id}
            whileHover={{ y: -2 }}
            onClick={() => setTab(id as TabType)}
            className={`px-4 py-3 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap text-sm font-bold ${
              tab === id
                ? "bg-accent-gold text-black shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </motion.button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === "dashboard" && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {dashboardCards.map((card) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.label}
                whileHover={{ y: -4 }}
                className={`bg-gradient-to-br ${card.color} p-0.5 rounded-2xl`}
              >
                <div className="bg-[#0C0C0C] rounded-2xl p-6 h-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/50 text-sm">{card.label}</p>
                      <p className="text-3xl font-black mt-2">{card.value}</p>
                    </div>
                    <Icon className={`w-8 h-8 opacity-30`} />
                  </div>
                </div>
              </motion.div>
            )
          })}

          {/* Quick Stats */}
          <motion.div
            whileHover={{ y: -4 }}
            className="md:col-span-2 lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <h3 className="font-bold text-lg mb-4">وضعیت فایل‌های SEO</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-white/50 text-sm">نسخه Sitemap</p>
                <p className="text-xl font-bold mt-2">{stats?.sitemapVersion ?? "۱.۰"}</p>
                <p className="text-xs text-white/30 mt-1">فایل فعال</p>
              </div>
              <div>
                <p className="text-white/50 text-sm">بروز رسانی Robots.txt</p>
                <p className="text-sm font-bold mt-2 text-accent-gold">
                  {stats?.robotsUpdated ? new Date(stats.robotsUpdated).toLocaleDateString("fa-IR") : "بروز"}
                </p>
              </div>
              <div>
                <p className="text-white/50 text-sm">کل بک‌لینک‌ها</p>
                <p className="text-xl font-bold mt-2">{stats?.totalBacklinks ?? "-"}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Pages Tab */}
      {tab === "pages" && (
        <motion.div key="pages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowAddForm(true)
              setEditingPage(null)
              setFormData({ status: "draft", keywords: [] })
            }}
            className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-black rounded-xl font-bold hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all"
          >
            <Plus className="w-4 h-4" />
            صفحه جدید
          </motion.button>

          {showAddForm && (
            <SEOPageForm
              page={editingPage}
              initialData={formData}
              onSave={saveSEOPage}
              onCancel={() => {
                setShowAddForm(false)
                setEditingPage(null)
              }}
              onChange={setFormData}
            />
          )}

          <div className="grid gap-4">
            {seoPages.map((page) => (
              <motion.div
                key={page.id}
                whileHover={{ y: -2 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{page.path}</h3>
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          page.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {page.status === "active" ? "فعال" : "پیش‌نویس"}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm mb-3">{page.title}</p>
                    <p className="text-white/50 text-sm mb-3">{page.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {page.keywords?.map((keyword) => (
                        <span key={keyword} className="px-2 py-1 bg-white/5 rounded-lg text-xs text-accent-gold">
                          #{keyword}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      {page.views !== undefined && (
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {page.views.toLocaleString("fa-IR")} بازدید
                        </div>
                      )}
                      <div>اخیراً: {new Date(page.lastModified).toLocaleDateString("fa-IR")}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setEditingPage(page)
                        setFormData(page)
                        setShowAddForm(true)
                      }}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                    >
                      <Edit className="w-4 h-4 text-accent-gold" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteSEOPage(page.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </motion.button>
                  </div>
                </div>

                {/* Advanced SEO Preview */}
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs font-bold text-white/50 mb-2">پیش‌نمایش موتور جستجو</p>
                  <div className="bg-[#0C0C0C] rounded-xl p-3 text-xs">
                    <p className="text-blue-400 font-semibold">{page.title}</p>
                    <p className="text-green-600 text-[10px]">example.com{page.path}</p>
                    <p className="text-white/50 text-[10px] mt-1">{page.description}</p>
                  </div>
                </div>

                {/* Open Graph Preview */}
                {(page.ogTitle || page.ogImage) && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs font-bold text-white/50 mb-2">پیش‌نمایش شبکه‌های اجتماعی</p>
                    <div className="bg-[#0C0C0C] rounded-xl p-3 text-xs border border-white/5">
                      {page.ogImage && (
                        <img src={page.ogImage} alt="OG" className="w-full h-32 object-cover rounded-lg mb-2" />
                      )}
                      <p className="font-semibold">{page.ogTitle || page.title}</p>
                      <p className="text-white/50 text-[10px]">{page.ogDescription || page.description}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Structured Data Tab */}
      {tab === "structured" && (
        <motion.div key="structured" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-4">Structured Data (Schema.org)</h3>
            <p className="text-white/50 text-sm mb-4">
              داده‌های ساختاری کمک می‌کند به موتورهای جستجو محتوای صفحه را بهتر درک کنند.
            </p>

            <div className="grid gap-4">
              {structuredDataList.map((data) => (
                <motion.div
                  key={data.id}
                  whileHover={{ y: -2 }}
                  className="bg-[#0C0C0C] border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="inline-block px-2 py-1 bg-white/5 rounded-lg text-xs font-bold text-accent-gold">
                        {data.type}
                      </span>
                      <p className="text-sm text-white/70 mt-2">{data.pagePath}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        data.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {data.status === "active" ? "فعال" : "پیش‌نویس"}
                    </span>
                  </div>
                  <pre className="bg-black/50 p-3 rounded-lg text-xs overflow-x-auto text-white/70 mt-3">
                    {JSON.stringify(data.data, null, 2)}
                  </pre>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Sitemap Tab */}
      {tab === "sitemap" && (
        <motion.div key="sitemap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">نقشه سایت XML</h3>
                <p className="text-white/50 text-sm mt-1">موقعیت: /sitemap.xml</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={regenerateSitemap}
                className="px-4 py-2 bg-accent-gold text-black rounded-xl font-bold hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all"
              >
                تولید مجدد
              </motion.button>
            </div>

            {sitemap && (
              <div className="relative">
                <pre className="bg-black/50 p-4 rounded-xl text-xs overflow-auto max-h-96 text-white/70 border border-white/5">
                  {sitemap}
                </pre>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copyToClipboard(sitemap, "sitemap")}
                  className="absolute top-2 left-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                >
                  {copied === "sitemap" ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/50" />
                  )}
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Robots Tab */}
      {tab === "robots" && (
        <motion.div key="robots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-2">فایل Robots.txt</h3>
            <p className="text-white/50 text-sm mb-4">موقعیت: /robots.txt</p>

            <textarea
              value={robots || ""}
              onChange={(e) => setRobots(e.target.value)}
              className="w-full h-64 bg-black/50 border border-white/10 rounded-xl p-4 text-white/70 text-xs resize-none focus:outline-none focus:border-accent-gold transition-colors"
              placeholder="User-agent: *&#10;Disallow: /admin&#10;Allow: /"
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateRobots(robots || "")}
              className="mt-4 px-4 py-2 bg-accent-gold text-black rounded-xl font-bold hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all"
            >
              ذخیره تغییرات
            </motion.button>
          </div>

          {/* Robots Helper */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-4">قالب‌های پیشنهادی</h3>
            <div className="space-y-2">
              {[
                {
                  label: "اجازه کامل",
                  content: "User-agent: *\nAllow: /",
                },
                {
                  label: "مسدود صفحات خاص",
                  content:
                    "User-agent: *\nDisallow: /admin/\nDisallow: /private/\nAllow: /public/",
                },
                {
                  label: "مسدود تمام بات‌ها",
                  content: "User-agent: *\nDisallow: /",
                },
              ].map((template) => (
                <motion.button
                  key={template.label}
                  whileHover={{ y: -2 }}
                  onClick={() => setRobots(template.content)}
                  className="w-full text-right p-3 bg-black/50 border border-white/10 hover:border-white/20 rounded-xl transition-colors"
                >
                  <p className="font-bold text-sm">{template.label}</p>
                  <p className="text-xs text-white/50 mt-1 whitespace-pre-wrap">{template.content}</p>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Analytics Tab */}
      {tab === "analytics" && (
        <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Pages */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <h3 className="font-bold text-lg mb-4">بیشترین بازدید</h3>
              <div className="space-y-2">
                {[...seoPages]
                  .sort((a, b) => (b.views || 0) - (a.views || 0))
                  .slice(0, 5)
                  .map((page) => (
                    <div key={page.id} className="flex items-center justify-between p-2 bg-black/50 rounded-lg">
                      <p className="text-sm">{page.path}</p>
                      <p className="text-xs text-accent-gold font-bold">{(page.views || 0).toLocaleString("fa-IR")}</p>
                    </div>
                  ))}
              </div>
            </motion.div>

            {/* Pages Without Metadata */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <h3 className="font-bold text-lg mb-4">صفحات بدون متادیتا</h3>
              <div className="space-y-2">
                {seoPages
                  .filter((p) => !p.title || !p.description)
                  .slice(0, 5)
                  .map((page) => (
                    <div key={page.id} className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg">
                      <p className="text-sm text-red-400">{page.path}</p>
                      <button
                        onClick={() => {
                          setEditingPage(page)
                          setFormData(page)
                          setShowAddForm(true)
                          setTab("pages")
                        }}
                        className="text-xs px-2 py-1 bg-accent-gold text-black rounded transition-colors"
                      >
                        ویرایش
                      </button>
                    </div>
                  ))}
              </div>
            </motion.div>
          </div>

          {/* SEO Score Overview */}
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-gradient-to-r from-accent-gold/20 to-yellow-500/20 border border-accent-gold/20 rounded-2xl p-6"
          >
            <h3 className="font-bold text-lg mb-4">امتیاز SEO کلی</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "متادیتا",
                  score:
                    stats && stats.totalPages > 0
                      ? Math.round((stats.pagesWithMetadata / stats.totalPages) * 100)
                      : 0,
                },
                {
                  label: "Structured Data",
                  score: structuredDataList.length > 0 ? 85 : 0,
                },
                {
                  label: "Sitemap",
                  score: sitemap ? 100 : 0,
                },
                {
                  label: "Robots.txt",
                  score: robots ? 100 : 0,
                },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-2xl font-black text-accent-gold">{item.score}%</div>
                  <p className="text-xs text-white/50 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Google Analytics Tab */}
      {tab === "google-analytics" && (
        <motion.div key="google-analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-6">تنظیمات Google Analytics</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Google Analytics ID (GA ID)</label>
                <input
                  type="text"
                  value={googleAnalytics.gaId}
                  onChange={(e) => setGoogleAnalytics({ ...googleAnalytics, gaId: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Tracking ID</label>
                <input
                  type="text"
                  value={googleAnalytics.trackingId}
                  onChange={(e) => setGoogleAnalytics({ ...googleAnalytics, trackingId: e.target.value })}
                  placeholder="UA-XXXXXXXXX-X"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-gold transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={googleAnalytics.enabled}
                  onChange={(e) => setGoogleAnalytics({ ...googleAnalytics, enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-bold">فعال کن</label>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  try {
                    await apiRequest("/admin/seo/google-analytics", {
                      method: "PUT",
                      body: JSON.stringify(googleAnalytics),
                    })
                    toast.success("Google Analytics با موفق ذخیره شد")
                  } catch {
                    toast.error("خطا در ذخیره Google Analytics")
                  }
                }}
                className="w-full px-4 py-2 bg-accent-gold text-black rounded-xl font-bold hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all"
              >
                ذخیره
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Google Search Console Tab */}
      {tab === "google-console" && (
        <motion.div key="google-console" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-6">تنظیمات Google Search Console</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Property ID</label>
                <input
                  type="text"
                  value={googleSearchConsole.propertyId}
                  onChange={(e) => setGoogleSearchConsole({ ...googleSearchConsole, propertyId: e.target.value })}
                  placeholder="sc-domain:example.com"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Verification Code</label>
                <input
                  type="text"
                  value={googleSearchConsole.verificationCode}
                  onChange={(e) =>
                    setGoogleSearchConsole({ ...googleSearchConsole, verificationCode: e.target.value })
                  }
                  placeholder="Verification code"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-gold transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={googleSearchConsole.enabled}
                  onChange={(e) => setGoogleSearchConsole({ ...googleSearchConsole, enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-bold">تایید شده</label>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  try {
                    await apiRequest("/admin/seo/google-search-console", {
                      method: "PUT",
                      body: JSON.stringify(googleSearchConsole),
                    })
                    toast.success("Google Search Console با موفق ذخیره شد")
                  } catch {
                    toast.error("خطا در ذخیره Google Search Console")
                  }
                }}
                className="w-full px-4 py-2 bg-accent-gold text-black rounded-xl font-bold hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all"
              >
                ذخیره
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Keywords Tab */}
      {tab === "keywords" && (
        <motion.div key="keywords" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <motion.div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-4">تحلیل کلیدواژه‌ها</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="text-right py-3 px-4 font-bold">کلیدواژه</th>
                    <th className="text-right py-3 px-4 font-bold">تعداد استفاده</th>
                    <th className="text-right py-3 px-4 font-bold">موقعیت متوسط</th>
                    <th className="text-right py-3 px-4 font-bold">حجم جستجو</th>
                    <th className="text-right py-3 px-4 font-bold">ترافیک تخمینی</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((kw: any, idx: number) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4">{kw.keyword}</td>
                      <td className="py-3 px-4">{kw.usage}</td>
                      <td className="py-3 px-4">{kw.position}</td>
                      <td className="py-3 px-4">{kw.volume?.toLocaleString("fa-IR")}</td>
                      <td className="py-3 px-4 text-accent-gold font-bold">{kw.traffic?.toLocaleString("fa-IR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Backlinks Tab */}
      {tab === "backlinks" && (
        <motion.div key="backlinks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {backlinks && (
            <motion.div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">تحلیل بک‌لینک‌ها</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-black/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-accent-gold">{backlinks.totalBacklinks}</p>
                  <p className="text-xs text-white/50 mt-1">کل بک‌لینک‌ها</p>
                </div>
                <div className="bg-black/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-accent-gold">{backlinks.domainsLinking}</p>
                  <p className="text-xs text-white/50 mt-1">دامنه‌های متصل</p>
                </div>
                <div className="bg-black/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-accent-gold">{backlinks.avgAuthority}</p>
                  <p className="text-xs text-white/50 mt-1">میانگین Authority</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold mb-3">بهترین بک‌لینک‌ها</h4>
                {backlinks.topBacklinks?.slice(0, 10).map((link: any, idx: number) => (
                  <div key={idx} className="bg-black/50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-bold truncate">{link.sourceUrl}</p>
                      <p className="text-xs text-white/50">{link.anchorText}</p>
                    </div>
                    <p className="text-sm text-accent-gold font-bold ml-4">Authority: {link.authority}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Mobile Optimization Tab */}
      {tab === "mobile" && (
        <motion.div key="mobile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {mobileOptimization && (
            <motion.div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">بهینه‌سازی موبایلی</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-black/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-accent-gold">{mobileOptimization.mobileUsable}%</p>
                  <p className="text-xs text-white/50 mt-1">صفحات قابل استفاده</p>
                </div>
                <div className="bg-black/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-accent-gold">{mobileOptimization.viewportConfigured}%</p>
                  <p className="text-xs text-white/50 mt-1">Viewport تنظیم شده</p>
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <h4 className="font-bold">مشکلات موبایلی</h4>
                <p className="text-sm text-orange-400">مشکلات Font Size: {mobileOptimization.fontSizeIssues}</p>
                <p className="text-sm text-orange-400">مشکلات Tap Target: {mobileOptimization.tapTargetIssues}</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold mb-2">توصیه‌ها</h4>
                {mobileOptimization.recommendations?.map((rec: string, idx: number) => (
                  <p key={idx} className="text-sm text-white/70 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {rec}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Content Quality Tab */}
      {tab === "content-quality" && (
        <motion.div key="content-quality" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {contentQuality && (
            <motion.div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">کیفیت محتوا</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-black/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-accent-gold">{contentQuality.totalPages}</p>
                  <p className="text-xs text-white/50 mt-1">کل صفحات</p>
                </div>
                <div className="bg-black/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-accent-gold">{contentQuality.pagesWithKeywords}</p>
                  <p className="text-xs text-white/50 mt-1">صفحات با کلیدواژه</p>
                </div>
                <div className="bg-black/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-accent-gold">{contentQuality.pagesWithOGTags}</p>
                  <p className="text-xs text-white/50 mt-1">صفحات با OG Tags</p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <h4 className="font-bold">توزیع کیفیت</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>عالی</span>
                      <span className="text-accent-gold">{contentQuality.quality?.excellent}</span>
                    </div>
                    <div className="w-full bg-black/50 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${(contentQuality.quality?.excellent / contentQuality.totalPages) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>خوب</span>
                      <span className="text-accent-gold">{contentQuality.quality?.good}</span>
                    </div>
                    <div className="w-full bg-black/50 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{
                          width: `${(contentQuality.quality?.good / contentQuality.totalPages) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>ضعیف</span>
                      <span className="text-accent-gold">{contentQuality.quality?.poor}</span>
                    </div>
                    <div className="w-full bg-black/50 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{
                          width: `${(contentQuality.quality?.poor / contentQuality.totalPages) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-white/50">میانگین طول عنوان:</span>
                  <span className="text-accent-gold ml-2">{contentQuality.averageTitleLength?.toFixed(0)} کاراکتر</span>
                </p>
                <p>
                  <span className="text-white/50">میانگین طول توضیح:</span>
                  <span className="text-accent-gold ml-2">
                    {contentQuality.averageDescriptionLength?.toFixed(0)} کاراکتر
                  </span>
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* SEO Audit Tab */}
      {tab === "audit" && (
        <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {auditReport && (
            <motion.div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">گزارش تدقیق SEO</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-600/20 to-green-400/20 rounded-xl p-4 border border-green-500/20">
                  <p className="text-3xl font-black text-green-400">{auditReport.score}</p>
                  <p className="text-xs text-white/50 mt-1">نمره کلی</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-black/50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-red-400">{auditReport.issues?.critical}</p>
                    <p className="text-xs text-white/50 mt-1">مسائل حیاتی</p>
                  </div>
                  <div className="bg-black/50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-yellow-400">{auditReport.issues?.warning}</p>
                    <p className="text-xs text-white/50 mt-1">هشدارها</p>
                  </div>
                  <div className="bg-black/50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-blue-400">{auditReport.issues?.notice}</p>
                    <p className="text-xs text-white/50 mt-1">اطلاعات</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <h4 className="font-bold">بررسی‌ها</h4>
                {Object.entries(auditReport.checks || {}).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center gap-2 p-2 bg-black/50 rounded-lg">
                    {value ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-sm flex-1">{key}</span>
                    <span className={value ? "text-green-500 text-xs font-bold" : "text-red-500 text-xs font-bold"}>
                      {value ? "تایید شده" : "نیاز به بهبود"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold mb-2">توصیه‌های بهبود</h4>
                {auditReport.recommendations?.map((rec: string, idx: number) => (
                  <p key={idx} className="text-sm text-white/70 flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent-gold" />
                    {rec}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Competitors Tab */}
      {tab === "competitors" && (
        <motion.div key="competitors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {competitors && (
            <motion.div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">تحلیل رقبا</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-black/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-accent-gold">{competitors.comparison?.yourBacklinks}</p>
                  <p className="text-xs text-white/50 mt-1">بک‌لینک‌های شما</p>
                </div>
                <div className="bg-black/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-accent-gold">
                    {competitors.comparison?.avgCompetitorBacklinks}
                  </p>
                  <p className="text-xs text-white/50 mt-1">میانگین رقبا</p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold">بالاترین رقبا</h4>
                {competitors.competitors?.slice(0, 10).map((comp: any, idx: number) => (
                  <div key={idx} className="bg-black/50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-bold">{comp.domain}</p>
                      <p className="text-xs text-white/50 mt-1">
                        Traffic: {comp.trafficEstimate?.toLocaleString("fa-IR")} | Authority: {comp.authority}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-accent-gold font-bold">{comp.backlinks}</p>
                      <p className="text-xs text-white/50">بک‌لینک‌ها</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}

function SEOPageForm({
  page,
  initialData,
  onSave,
  onCancel,
  onChange,
}: {
  page: SEOPage | null
  initialData: Partial<SEOPage>
  onSave: (data: Partial<SEOPage>) => void
  onCancel: () => void
  onChange: (data: Partial<SEOPage>) => void
}) {
  const [formState, setFormState] = useState(initialData)
  const [keywordInput, setKeywordInput] = useState("")

  const handleAddKeyword = () => {
    if (keywordInput.trim()) {
      setFormState((prev) => ({
        ...prev,
        keywords: [...(prev.keywords || []), keywordInput.trim()],
      }))
      setKeywordInput("")
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setFormState((prev) => ({
      ...prev,
      keywords: (prev.keywords || []).filter((k) => k !== keyword),
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4"
    >
      <h3 className="font-bold text-lg">{page ? "ویرایش صفحه" : "صفحه جدید"}</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">مسیر صفحه *</label>
          <input
            type="text"
            value={formState.path || ""}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, path: e.target.value }))
            }
            placeholder="/about"
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-gold transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">عنوان صفحه (Title) *</label>
          <input
            type="text"
            value={formState.title || ""}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="عنوان برای موتور جستجو"
            maxLength={60}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-gold transition-colors"
          />
          <p className="text-xs text-white/40 mt-1">
            {formState.title?.length || 0}/60 کاراکتر
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">توضیح (Description) *</label>
          <textarea
            value={formState.description || ""}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="توضیح صفحه برای موتور جستجو"
            maxLength={160}
            rows={3}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-gold transition-colors resize-none"
          />
          <p className="text-xs text-white/40 mt-1">
            {formState.description?.length || 0}/160 کاراکتر
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">کلیدواژه‌ها</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddKeyword()
                }
              }}
              placeholder="کلیدواژه جدید..."
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-gold transition-colors"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddKeyword}
              className="px-4 py-2 bg-accent-gold text-black rounded-xl font-bold"
            >
              افزودن
            </motion.button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formState.keywords?.map((keyword) => (
              <motion.div
                key={keyword}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-3 py-1 bg-accent-gold/20 border border-accent-gold/30 rounded-lg text-sm"
              >
                <span>{keyword}</span>
                <button
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="text-accent-gold hover:text-red-400 transition-colors"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">عنوان OG</label>
            <input
              type="text"
              value={formState.ogTitle || ""}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, ogTitle: e.target.value }))
              }
              placeholder="برای شبکه‌های اجتماعی"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-gold transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">تصویر OG</label>
            <input
              type="url"
              value={formState.ogImage || ""}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, ogImage: e.target.value }))
              }
              placeholder="https://..."
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-gold transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">توضیح OG</label>
          <textarea
            value={formState.ogDescription || ""}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                ogDescription: e.target.value,
              }))
            }
            placeholder="توضیح شبکه‌های اجتماعی"
            rows={2}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-gold transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">URL Canonical</label>
          <input
            type="url"
            value={formState.canonicalUrl || ""}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, canonicalUrl: e.target.value }))
            }
            placeholder="https://example.com/page"
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-gold transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">وضعیت</label>
          <select
            value={formState.status || "draft"}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                status: e.target.value as "active" | "draft",
              }))
            }
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-gold transition-colors"
          >
            <option value="draft">پیش‌نویس</option>
            <option value="active">فعال</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-white/5">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            onChange(formState)
            onSave(formState)
          }}
          className="flex-1 px-4 py-2 bg-accent-gold text-black rounded-xl font-bold hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all"
        >
          ذخیره
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors"
        >
          انصراف
        </motion.button>
      </div>
    </motion.div>
  )
}
