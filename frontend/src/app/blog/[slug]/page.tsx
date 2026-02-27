"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowRight, Eye, Clock, Tag, Share2, BookOpen, Calendar, User, Star, ChevronRight } from "lucide-react"
import { apiRequest } from "@/lib/api"

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  coverImage: string
  featured: boolean
  views: number
  author: string
  publishedAt: string | null
  createdAt: string
}

const MOCK_POSTS: Record<string, BlogPost> = {
  "rahnama-gheraekeshi": {
    id: "1",
    title: "راهنمای کامل شرکت در قرعه‌کشی خودرو",
    slug: "rahnama-gheraekeshi",
    excerpt: "نحوه خرید بلیط پلکانی، دریافت کش‌بک و پیگیری نتایج را بیاموزید.",
    content: `## چرا قرعه‌کشی LUX متفاوت است؟

پلتفرم LUX با تکیه بر اصول **شفافیت کامل** و **تجربه کاربری روان**، سیستم قرعه‌کشی خودرو را به شکلی نو طراحی کرده است.

## مراحل شرکت در قرعه‌کشی

### ۱. ایجاد حساب کاربری
ابتدا در پلتفرم LUX ثبت نام کنید. فرایند ثبت‌نام کمتر از ۲ دقیقه طول می‌کشد.

### ۲. شارژ کیف پول
از درگاه امن LUX، مبلغ مورد نظر را به کیف پول دیجیتال خود واریز کنید.

### ۳. انتخاب قرعه‌کشی و خرید بلیط
- قرعه‌کشی مورد نظر را انتخاب کنید.
- تعداد بلیط‌های پلکانی (از یک تا ماکزیمم مجاز) را تعیین کنید.
- سیستم به ازای هر بلیط، کش‌بک تدریجی به حساب شما اضافه می‌کند.

### ۴. پیگیری نتایج
- در لحظه برگزاری قرعه‌کشی، هش نتیجه به صورت عمومی منتشر می‌شود.
- نتیجه قابل تأیید و اثبات‌پذیر است.
- در صورت برنده شدن، فرایند تحویل جایزه آغاز می‌شود.

## سیستم کش‌بک پلکانی

| تعداد بلیط | کش‌بک دریافتی |
|---|---|
| ۱ تا ۵ | ۲٪ |
| ۶ تا ۱۰ | ۴٪ |
| ۱۱ به بالا | ۶٪ |

## نکات کلیدی

- هر کاربر حداکثر با ۳۰٪ بلیط‌های یک قرعه‌کشی شرکت می‌کند تا فرصت برابر باشد.
- برنده‌نشدن، به معنی از دست دادن پول نیست — کش‌بک دریافت می‌کنید.
- تمام تراکنش‌ها در کیف پول ثبت و قابل پیگیری است.
`,
    category: "راهنما",
    tags: ["قرعه‌کشی", "بلیط", "آموزش"],
    coverImage: "",
    featured: true,
    views: 1240,
    author: "تیم LUX",
    publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  "shafafiat-gheraekeshi": {
    id: "2",
    title: "شفافیت و عدالت در قرعه‌کشی آنلاین",
    slug: "shafafiat-gheraekeshi",
    excerpt: "هش قبل از اجرا، لاگ عمومی و تاییدپذیری نتایج — چطور مطمئن می‌شویم قرعه‌کشی منصفانه است؟",
    content: `## اثبات‌پذیری نتایج

همه قرعه‌کشی‌های LUX بر اساس پروتکل **Commit-Reveal** اجرا می‌شوند. یعنی:

1. **قبل از قرعه‌کشی**: یک تعهد رمزنگاری‌شده (هش SHA-256) از نتیجه، منتشر می‌شود.
2. **بعد از قرعه‌کشی**: کلید اصلی (seed) که هش از آن ساخته شده، فاش می‌شود.
3. هر کسی می‌تواند تایید کند که نتیجه با تعهد اولیه مطابقت دارد.

## لاگ عمومی

تمام رویدادهای قرعه‌کشی در [صفحه شفافیت](/fairness) پلتفرم LUX قابل مشاهده است.

## چرا این مهم است؟

در سیستم‌های سنتی، برگزارکننده قرعه‌کشی می‌تواند نتیجه را دستکاری کند. در LUX، این کار **غیرممکن** است.
`,
    category: "شفافیت",
    tags: ["شفافیت", "هش", "امنیت"],
    coverImage: "",
    featured: false,
    views: 830,
    author: "تیم فنی LUX",
    publishedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
}

const CATEGORY_COLORS: Record<string, string> = {
  راهنما: "text-accent-gold bg-accent-gold/10 border-accent-gold/20",
  آموزشی: "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20",
  شفافیت: "text-green-400 bg-green-400/10 border-green-400/20",
  "بازار خودرو": "text-orange-400 bg-orange-400/10 border-orange-400/20",
  تکنولوژی: "text-violet-400 bg-violet-400/10 border-violet-400/20",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

function renderMarkdown(text: string) {
  return text
    .split("\n")
    .map((line, i) => {
      if (line.startsWith("## ")) return <h2 key={i} className="text-2xl font-black mt-8 mb-4 text-white">{line.slice(3)}</h2>
      if (line.startsWith("### ")) return <h3 key={i} className="text-xl font-black mt-6 mb-3 text-white/90">{line.slice(4)}</h3>
      if (line.startsWith("- ")) return <li key={i} className="text-white/70 leading-7 mr-4 list-disc">{renderInline(line.slice(2))}</li>
      if (line.startsWith("| ") && line.endsWith("|")) {
        const cells = line.split("|").filter((c) => c.trim() && c.trim() !== "---")
        if (!cells.length) return null
        return (
          <tr key={i} className="border-b border-white/5">
            {cells.map((c, j) => <td key={j} className="py-2 px-4 text-white/70 text-sm">{c.trim()}</td>)}
          </tr>
        )
      }
      if (line.trim() === "" || line.trim() === "---") return <div key={i} className="my-2" />
      return <p key={i} className="text-white/70 leading-8 mb-3">{renderInline(line)}</p>
    })
}

function renderInline(text: string): React.ReactNode {
  return text.split(/(\*\*.*?\*\*)/).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export default function BlogArticlePage() {
  const params = useParams()
  const slug = params?.slug as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiRequest<{ post: BlogPost }>(`/blog/posts/${slug}`)
        if (data?.post) setPost(data.post)
        else throw new Error()
      } catch {
        setPost(MOCK_POSTS[slug] ?? null)
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <main className="min-h-screen pt-32 pb-20 flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4 text-white/30">
          <BookOpen className="w-10 h-10 animate-pulse" />
          <p>در حال بارگذاری مطلب...</p>
        </div>
      </main>
    )
  }

  if (!post) {
    return (
      <main className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center gap-6" dir="rtl">
        <BookOpen className="w-14 h-14 text-white/20" />
        <h1 className="text-2xl font-black text-white/50">مطلب یافت نشد</h1>
        <Link href="/blog" className="btn-primary">بازگشت به وبلاگ</Link>
      </main>
    )
  }

  const readTime = Math.max(2, Math.ceil(post.content.split(/\s+/).length / 200))

  return (
    <main className="min-h-screen pb-20" dir="rtl">
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-gold/4 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-white/40 mb-8">
            <Link href="/" className="hover:text-white transition-colors">خانه</Link>
            <ChevronRight className="w-3 h-3 rotate-180" />
            <Link href="/blog" className="hover:text-white transition-colors">وبلاگ</Link>
            <ChevronRight className="w-3 h-3 rotate-180" />
            <span className="text-white/60 line-clamp-1">{post.title}</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {post.featured && (
                <span className="flex items-center gap-1 text-xs text-accent-gold font-bold">
                  <Star className="w-3.5 h-3.5" /> مطلب ویژه
                </span>
              )}
              <span className={`text-xs px-3 py-1 rounded-full border font-bold ${CATEGORY_COLORS[post.category] ?? "text-white/60 bg-white/10 border-white/20"}`}>{post.category}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black leading-tight">{post.title}</h1>
            <p className="text-white/60 text-lg leading-8">{post.excerpt}</p>

            <div className="flex items-center gap-4 pt-2 border-t border-white/5 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-white/40">
                <User className="w-4 h-4" />
                {post.author}
              </div>
              {post.publishedAt && (
                <div className="flex items-center gap-1.5 text-sm text-white/40">
                  <Calendar className="w-4 h-4" />
                  {formatDate(post.publishedAt)}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-white/40">
                <Clock className="w-4 h-4" />
                {readTime} دقیقه مطالعه
              </div>
              <div className="flex items-center gap-1.5 text-sm text-white/40">
                <Eye className="w-4 h-4" />
                {post.views.toLocaleString("fa-IR")} بازدید
              </div>
              <button
                onClick={handleShare}
                className="mr-auto flex items-center gap-1.5 text-sm text-white/40 hover:text-accent-gold transition-colors"
              >
                <Share2 className="w-4 h-4" />
                {copied ? "کپی شد!" : "اشتراک‌گذاری"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Cover Image */}
      {post.coverImage ? (
        <div className="max-w-3xl mx-auto px-4 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt={post.title} className="w-full aspect-video object-cover rounded-2xl" />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 mb-8">
          <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-accent-gold/10 via-accent-cyan/5 to-transparent border border-white/5 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-white/10" />
          </div>
        </div>
      )}

      {/* Article Content */}
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-3xl mx-auto px-4"
      >
        <div className="card glass p-8 md:p-12 leading-8 text-white/75 space-y-1 prose-dark">
          {renderMarkdown(post.content)}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex items-center gap-3 mt-8 flex-wrap">
            <Tag className="w-4 h-4 text-white/30" />
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs bg-white/5 border border-white/10 text-white/50 px-3 py-1 rounded-full">#{tag}</span>
            ))}
          </div>
        )}

        {/* Back */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
          <Link href="/blog" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
            <ArrowRight className="w-4 h-4" />
            بازگشت به وبلاگ
          </Link>
          <button onClick={handleShare} className="flex items-center gap-2 text-sm px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
            <Share2 className="w-4 h-4" />
            {copied ? "کپی شد!" : "اشتراک‌گذاری"}
          </button>
        </div>
      </motion.article>
    </main>
  )
}
