"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Search, ArrowLeft, Eye, Star, BookOpen, Clock } from "lucide-react"
import { apiRequest } from "@/lib/api"

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  tags: string[]
  coverImage: string
  status: "draft" | "published" | "archived"
  featured: boolean
  views: number
  author: string
  publishedAt: string | null
  createdAt: string
  content?: string
}

const MOCK_POSTS: BlogPost[] = [
  { id: "1", title: "راهنمای کامل شرکت در قرعه‌کشی خودرو", slug: "rahnama-gheraekeshi", excerpt: "نحوه خرید بلیط پلکانی، دریافت کش‌بک و پیگیری نتایج را بیاموزید. همه چیز درباره سیستم قرعه‌کشی شفاف LUX.", category: "راهنما", tags: ["قرعه‌کشی", "بلیط", "آموزش"], coverImage: "", status: "published", featured: true, views: 1240, author: "تیم LUX", publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(), createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: "2", title: "شفافیت و عدالت در قرعه‌کشی آنلاین", slug: "shafafiat-gheraekeshi", excerpt: "هش قبل از اجرا، لاگ عمومی و تاییدپذیری نتایج — چطور مطمئن می‌شویم قرعه‌کشی منصفانه است؟", category: "شفافیت", tags: ["شفافیت", "هش", "امنیت"], coverImage: "", status: "published", featured: false, views: 830, author: "تیم فنی LUX", publishedAt: new Date(Date.now() - 10 * 86400000).toISOString(), createdAt: new Date(Date.now() - 12 * 86400000).toISOString() },
  { id: "3", title: "استراتژی استفاده بهینه از گردونه شانس", slug: "strategy-wheel", excerpt: "بهترین مدل استفاده از شانس گردونه، ساختار زیرمجموعه‌دهی و به حداکثر رساندن امتیازات روزانه.", category: "آموزشی", tags: ["گردونه", "شانس", "استراتژی"], coverImage: "", status: "published", featured: false, views: 540, author: "تیم LUX", publishedAt: new Date(Date.now() - 14 * 86400000).toISOString(), createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
  { id: "4", title: "بازار خودرو ایران در سال ۱۴۰۴", slug: "car-market-1404", excerpt: "تحلیل روند قیمت خودرو، نرخ ارز و تاثیر آن بر تصمیم خرید. کدام خودروها بیشترین رشد را داشتند؟", category: "بازار خودرو", tags: ["بازار", "قیمت", "تحلیل"], coverImage: "", status: "published", featured: true, views: 2100, author: "تیم تحریریه", publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(), createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: "5", title: "همه آنچه باید درباره کیف پول LUX بدانید", slug: "wallet-guide", excerpt: "شارژ حساب، برداشت، سیستم پاداش و امنیت کیف پول — راهنمای جامع مدیریت مالی در پلتفرم LUX.", category: "راهنما", tags: ["کیف پول", "مالی", "شارژ"], coverImage: "", status: "published", featured: false, views: 670, author: "تیم LUX", publishedAt: new Date(Date.now() - 20 * 86400000).toISOString(), createdAt: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: "6", title: "فناوری پشت صحنه: چرا LUX از بلاک‌چین الهام گرفته؟", slug: "tech-behind-lux", excerpt: "توضیح فنی معماری سیستم اثبات‌پذیری قرعه‌کشی، هش‌های قابل تایید و شفافیت داده‌ها در LUX.", category: "تکنولوژی", tags: ["بلاک‌چین", "هش", "فناوری"], coverImage: "", status: "published", featured: false, views: 420, author: "تیم فنی LUX", publishedAt: new Date(Date.now() - 25 * 86400000).toISOString(), createdAt: new Date(Date.now() - 25 * 86400000).toISOString() },
]

const ALL_CATEGORIES = ["همه", "راهنما", "آموزشی", "شفافیت", "اخبار", "بازار خودرو", "تکنولوژی"]
const CATEGORY_COLORS: Record<string, string> = {
  راهنما: "text-accent-gold bg-accent-gold/10 border-accent-gold/20",
  آموزشی: "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20",
  شفافیت: "text-green-400 bg-green-400/10 border-green-400/20",
  اخبار: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "بازار خودرو": "text-orange-400 bg-orange-400/10 border-orange-400/20",
  تکنولوژی: "text-violet-400 bg-violet-400/10 border-violet-400/20",
}

function randomGradient(id: string) {
  const g = ["from-accent-gold/20 to-yellow-900/10","from-accent-cyan/20 to-blue-900/10","from-green-500/20 to-emerald-900/10","from-violet-500/20 to-purple-900/10","from-orange-500/20 to-red-900/10","from-pink-500/20 to-rose-900/10"]
  return g[id.charCodeAt(0) % g.length]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(MOCK_POSTS)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("همه")

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiRequest<{ posts: BlogPost[] }>("/blog/posts")
        if (data?.posts?.length) setPosts(data.posts.filter((p) => p.status === "published"))
      } catch { /* fallback to mock */ }
    })()
  }, [])

  const filtered = posts.filter((p) => {
    const matchSearch = !search || p.title.includes(search) || p.excerpt.includes(search)
    const matchCat = activeCategory === "همه" || p.category === activeCategory
    return matchSearch && matchCat
  })

  const heroPost = filtered.find((p) => p.featured) ?? filtered[0]
  const rest = filtered.filter((p) => p.id !== heroPost?.id)

  return (
    <main className="min-h-screen pb-20" dir="rtl">
      {/* Header */}
      <div className="relative overflow-hidden pt-32 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-gold/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-accent-gold/8 blur-[80px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-accent-gold" />
              <span className="text-sm text-white/50 font-bold uppercase tracking-widest">LUX Blog</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-4" style={{ background: "linear-gradient(135deg,#D4AF37,#fff 60%,#00BCD4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>وبلاگ</h1>
            <p className="text-white/50 text-lg max-w-xl">راهنماها، تحلیل‌های بازار، اخبار و آموزش‌های LUX — همه در یک‌جا</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Search + Category */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex-1 max-w-md">
            <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
            <input type="text" placeholder="جستجو در مطالب..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent border-none outline-none text-sm w-full placeholder:text-white/20" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {ALL_CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${activeCategory === cat ? "bg-accent-gold text-black border-accent-gold" : "bg-white/5 text-white/50 border-white/10 hover:text-white hover:border-white/30"}`}>{cat}</button>
            ))}
          </div>
        </motion.div>

        {/* Hero Post */}
        {heroPost && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-10">
            <Link href={`/blog/${heroPost.slug}`}>
              <div className="group relative rounded-3xl overflow-hidden border border-white/10 hover:border-accent-gold/40 transition-all duration-300 cursor-pointer">
                <div className={`absolute inset-0 bg-gradient-to-br ${randomGradient(heroPost.id)}`} />
                <div className="relative z-10 p-8 md:p-12 grid md:grid-cols-5 gap-8 items-center min-h-[280px]">
                  <div className="md:col-span-3 space-y-4">
                    {heroPost.featured && <div className="flex items-center gap-2"><Star className="w-4 h-4 text-accent-gold" /><span className="text-xs text-accent-gold font-bold uppercase tracking-widest">مطلب ویژه</span></div>}
                    <span className={`text-xs px-3 py-1 rounded-full border font-bold inline-block ${CATEGORY_COLORS[heroPost.category] ?? "text-white/60 bg-white/10 border-white/20"}`}>{heroPost.category}</span>
                    <h2 className="text-3xl md:text-4xl font-black leading-tight group-hover:text-accent-gold transition-colors">{heroPost.title}</h2>
                    <p className="text-white/60 leading-7 line-clamp-2">{heroPost.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{heroPost.views.toLocaleString("fa-IR")}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{Math.max(1, Math.ceil(heroPost.excerpt.split(" ").length / 40))} دقیقه</span>
                      {heroPost.publishedAt && <span>{formatDate(heroPost.publishedAt)}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-accent-gold font-bold group-hover:gap-3 transition-all pt-2">
                      خواندن مطلب <ArrowLeft className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="hidden md:flex md:col-span-2 justify-end">
                    <div className="w-36 h-36 rounded-full bg-gradient-to-br from-accent-gold/20 to-accent-cyan/10 border border-accent-gold/20 flex items-center justify-center">
                      <BookOpen className="w-14 h-14 text-accent-gold/40" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Rest grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((post, idx) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: idx * 0.06 }}>
              <Link href={`/blog/${post.slug}`}>
                <div className="group card glass hover:border-white/20 transition-all cursor-pointer h-full flex flex-col">
                  <div className={`h-32 rounded-t-[inherit] overflow-hidden bg-gradient-to-br ${randomGradient(post.id)} flex-shrink-0`} />
                  <div className="p-5 flex flex-col flex-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold self-start mb-2 ${CATEGORY_COLORS[post.category] ?? "text-white/50 bg-white/5 border-white/10"}`}>{post.category}</span>
                    <h3 className="font-black text-base mb-1.5 group-hover:text-accent-gold transition-colors line-clamp-2 leading-tight">{post.title}</h3>
                    <p className="text-white/50 text-xs leading-5 line-clamp-2 flex-1">{post.excerpt}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-3 text-xs text-white/30">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views.toLocaleString("fa-IR")}</span>
                      </div>
                      {post.publishedAt && <span className="text-xs text-white/30">{formatDate(post.publishedAt)}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-white/30">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold">مطلبی یافت نشد</p>
          </div>
        )}
      </div>
    </main>
  )
}
