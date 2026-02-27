"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Search,
  Tag,
  X,
  Save,
  Image as ImageIcon,
  Globe,
  Lock,
  Star,
  BookOpen,
  TrendingUp,
  Upload,
  Loader2,
  Link2,
} from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { uploadUserImage } from "@/lib/image-upload"
import Link from "next/link"

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  coverImage: string
  status: "draft" | "published" | "archived"
  featured: boolean
  views: number
  author: string
  publishedAt: string | null
  createdAt: string
}

const CATEGORIES = ["راهنما", "آموزشی", "شفافیت", "اخبار", "بازار خودرو", "سرگرمی", "تکنولوژی"]

const EMPTY_POST: Omit<BlogPost, "id" | "views" | "createdAt"> = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "راهنما",
  tags: [],
  coverImage: "",
  status: "draft",
  featured: false,
  author: "تیم LUX",
  publishedAt: null,
}

function slugify(text: string) {
  return text
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\u0600-\u06FFa-z0-9-]/gi, "")
    .toLowerCase()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

const MOCK_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "راهنمای کامل شرکت در قرعه‌کشی خودرو",
    slug: "rahnama-gheraekeshi",
    excerpt: "نحوه خرید بلیط پلکانی، دریافت کش‌بک و پیگیری نتایج را بیاموزید.",
    content: "## راهنمای شرکت در قرعه‌کشی\n\nبرای شرکت در قرعه‌کشی ابتدا باید ...",
    category: "راهنما",
    tags: ["قرعه‌کشی", "بلیط", "آموزش"],
    coverImage: "",
    status: "published",
    featured: true,
    views: 1240,
    author: "تیم LUX",
    publishedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "2",
    title: "شفافیت و عدالت در قرعه‌کشی آنلاین",
    slug: "shafafiat-gheraekeshi",
    excerpt: "هش قبل از اجرا، لاگ عمومی و تاییدپذیری نتایج — چطور می‌دانیم قرعه‌کشی منصفانه است؟",
    content: "## شفافیت در قرعه‌کشی\n\nما از روش هش‌گذاری ...",
    category: "شفافیت",
    tags: ["شفافیت", "هش", "امنیت"],
    coverImage: "",
    status: "published",
    featured: false,
    views: 830,
    author: "تیم فنی LUX",
    publishedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "3",
    title: "استراتژی استفاده بهینه از گردونه شانس",
    slug: "strategy-wheel",
    excerpt: "بهترین مدل استفاده از شانس گردونه و ساختار زیرمجموعه‌دهی",
    content: "## استراتژی گردونه شانس\n\nگردونه شانس هر روز ...",
    category: "آموزشی",
    tags: ["گردونه", "شانس", "استراتژی"],
    coverImage: "",
    status: "draft",
    featured: false,
    views: 0,
    author: "تیم LUX",
    publishedAt: null,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
]

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(MOCK_POSTS)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "published" | "archived">("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Omit<BlogPost, "id" | "views" | "createdAt">>(EMPTY_POST)
  const [tagInput, setTagInput] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageDragOver, setImageDragOver] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiRequest<{ posts: BlogPost[] }>("/admin/blog/posts")
        if (data?.posts?.length) setPosts(data.posts)
      } catch {
        // use mock
      }
    })()
  }, [])

  const filtered = posts.filter((p) => {
    const matchSearch = p.title.includes(search) || p.excerpt.includes(search) || p.tags.some((t) => t.includes(search))
    const matchStatus = filterStatus === "all" || p.status === filterStatus
    const matchCat = filterCategory === "all" || p.category === filterCategory
    return matchSearch && matchStatus && matchCat
  })

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    draft: posts.filter((p) => p.status === "draft").length,
    featured: posts.filter((p) => p.featured).length,
    totalViews: posts.reduce((acc, p) => acc + p.views, 0),
  }

  function openCreate() {
    setFormData({ ...EMPTY_POST })
    setEditingPost(null)
    setIsCreating(true)
    setPreview(false)
  }

  function openEdit(post: BlogPost) {
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: [...post.tags],
      coverImage: post.coverImage,
      status: post.status,
      featured: post.featured,
      author: post.author,
      publishedAt: post.publishedAt,
    })
    setEditingPost(post)
    setIsCreating(true)
    setPreview(false)
  }

  async function handleSave() {
    if (!formData.title.trim()) { toast.error("عنوان مطلب الزامی است"); return }
    if (!formData.excerpt.trim()) { toast.error("خلاصه مطلب الزامی است"); return }
    if (!formData.content.trim()) { toast.error("متن مطلب الزامی است"); return }

    const slug = formData.slug.trim() || slugify(formData.title)
    const payload = { ...formData, slug }

    setLoading(true)
    try {
      if (editingPost) {
        await apiRequest(`/admin/blog/posts/${editingPost.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        setPosts((prev) => prev.map((p) => (p.id === editingPost.id ? { ...p, ...payload } : p)))
        toast.success("مطلب ویرایش شد")
      } else {
        let newPost: BlogPost
        try {
          newPost = await apiRequest<BlogPost>("/admin/blog/posts", { method: "POST", body: JSON.stringify(payload) })
        } catch {
          newPost = {
            ...payload,
            id: crypto.randomUUID(),
            views: 0,
            createdAt: new Date().toISOString(),
            publishedAt: payload.status === "published" ? new Date().toISOString() : null,
          }
        }
        setPosts((prev) => [newPost, ...prev])
        toast.success("مطلب جدید ایجاد شد")
      }
      setIsCreating(false)
      setEditingPost(null)
    } catch {
      toast.error("خطا در ذخیره مطلب")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiRequest(`/admin/blog/posts/${id}`, { method: "DELETE" })
    } catch { /* mock */ }
    setPosts((prev) => prev.filter((p) => p.id !== id))
    setDeleteConfirm(null)
    toast.success("مطلب حذف شد")
  }

  async function toggleFeatured(post: BlogPost) {
    const updated = { ...post, featured: !post.featured }
    setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)))
    try { await apiRequest(`/admin/blog/posts/${post.id}`, { method: "PUT", body: JSON.stringify(updated) }) } catch { /* noop */ }
    toast.success(updated.featured ? "به مطالب ویژه اضافه شد" : "از مطالب ویژه حذف شد")
  }

  async function handleImageUpload(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("فایل باید تصویر باشد"); return }
    if (file.size > 5 * 1024 * 1024) { toast.error("حجم تصویر نباید از ۵ مگابایت بیشتر باشد"); return }
    setImageUploading(true)
    try {
      const url = await uploadUserImage(file)
      setFormData((p) => ({ ...p, coverImage: url }))
      toast.success("تصویر آپلود شد")
    } catch {
      toast.error("خطا در آپلود تصویر")
    } finally {
      setImageUploading(false)
    }
  }

  function addTag() {
    const t = tagInput.trim()
    if (t && !formData.tags.includes(t)) {
      setFormData((p) => ({ ...p, tags: [...p.tags, t] }))
    }
    setTagInput("")
  }

  const statusBadge = (status: BlogPost["status"]) => {
    const map = { published: "text-green-400 bg-green-400/10 border-green-400/30", draft: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", archived: "text-white/40 bg-white/5 border-white/10" }
    const labels = { published: "منتشر شده", draft: "پیش‌نویس", archived: "آرشیو" }
    return <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${map[status]}`}>{labels[status]}</span>
  }

  return (
    <div className="space-y-6 pb-16" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black">مدیریت وبلاگ</h1>
          <p className="text-white/40 text-sm mt-1">ایجاد، ویرایش و مدیریت مقالات وبلاگ</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          مطلب جدید
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "کل مطالب", value: stats.total, icon: BookOpen, color: "text-white" },
          { label: "منتشر شده", value: stats.published, icon: Globe, color: "text-green-400" },
          { label: "پیش‌نویس", value: stats.draft, icon: Lock, color: "text-yellow-400" },
          { label: "مطالب ویژه", value: stats.featured, icon: Star, color: "text-accent-gold" },
          { label: "کل بازدید", value: stats.totalViews.toLocaleString("fa-IR"), icon: TrendingUp, color: "text-accent-cyan" },
        ].map((s) => (
          <div key={s.label} className="card glass p-4">
            <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card glass p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="جستجو در مطالب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-white/20"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
        >
          <option value="all">همه وضعیت‌ها</option>
          <option value="published">منتشر شده</option>
          <option value="draft">پیش‌نویس</option>
          <option value="archived">آرشیو</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
        >
          <option value="all">همه دسته‌بندی‌ها</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-white/40 text-sm">{filtered.length} مطلب</span>
      </div>

      {/* Posts Table */}
      <div className="card glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/40">
                <th className="text-right py-4 px-5 font-semibold">عنوان مطلب</th>
                <th className="text-right py-4 px-4 font-semibold hidden md:table-cell">دسته‌بندی</th>
                <th className="text-right py-4 px-4 font-semibold hidden lg:table-cell">وضعیت</th>
                <th className="text-right py-4 px-4 font-semibold hidden lg:table-cell">بازدید</th>
                <th className="text-right py-4 px-4 font-semibold hidden xl:table-cell">تاریخ</th>
                <th className="text-right py-4 px-5 font-semibold">عملیات</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((post) => (
                  <motion.tr
                    key={post.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {post.featured && <Star className="w-3.5 h-3.5 text-accent-gold flex-shrink-0" />}
                        <div>
                          <p className="font-bold text-white line-clamp-1">{post.title}</p>
                          <p className="text-white/40 text-xs line-clamp-1 mt-0.5">{post.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <span className="text-xs bg-accent-gold/10 text-accent-gold border border-accent-gold/20 px-2 py-0.5 rounded-full">{post.category}</span>
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">{statusBadge(post.status)}</td>
                    <td className="py-4 px-4 hidden lg:table-cell text-white/60">{post.views.toLocaleString("fa-IR")}</td>
                    <td className="py-4 px-4 hidden xl:table-cell text-white/40 text-xs">
                      {post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleFeatured(post)}
                          className={`p-1.5 rounded-lg transition-colors ${post.featured ? "text-accent-gold bg-accent-gold/10 hover:bg-accent-gold/20" : "text-white/30 hover:text-accent-gold hover:bg-accent-gold/10"}`}
                          title="ویژه"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <button className="p-1.5 rounded-lg text-white/30 hover:text-accent-cyan hover:bg-accent-cyan/10 transition-colors" title="پیش‌نمایش">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                        <button onClick={() => openEdit(post)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors" title="ویرایش">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm(post.id)} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors" title="حذف">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-white/30">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>مطلبی یافت نشد</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0C0C0C] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-black mb-2">حذف مطلب</h3>
              <p className="text-white/50 text-sm mb-6">آیا مطمئن هستید؟ این عمل برگشت‌پذیر نیست.</p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(deleteConfirm)} className="btn-primary flex-1 !bg-red-600 hover:!bg-red-700">حذف</button>
                <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">انصراف</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Drawer */}
      <AnimatePresence>
        {isCreating && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setIsCreating(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-full max-w-2xl bg-[#0A0A0A] border-r border-white/10 z-50 flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div>
                  <h2 className="text-xl font-black">{editingPost ? "ویرایش مطلب" : "مطلب جدید"}</h2>
                  <p className="text-white/40 text-xs mt-0.5">{editingPost ? `ویرایش: ${editingPost.title}` : "ایجاد مطلب جدید برای وبلاگ"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreview(!preview)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${preview ? "bg-accent-cyan/20 border-accent-cyan/40 text-accent-cyan" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    پیش‌نمایش
                  </button>
                  <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {preview ? (
                  /* Preview Mode */
                  <div className="space-y-4">
                    {formData.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={formData.coverImage} alt={formData.title} className="w-full aspect-video object-cover rounded-2xl" />
                    )}
                    {!formData.coverImage && (
                      <div className="w-full aspect-video bg-gradient-to-br from-accent-gold/10 to-accent-cyan/10 rounded-2xl flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-white/20" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-accent-gold/20 text-accent-gold border border-accent-gold/20 px-3 py-1 rounded-full font-bold">{formData.category}</span>
                      {formData.tags.map((t) => (
                        <span key={t} className="text-xs bg-white/5 text-white/50 border border-white/10 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                    <h2 className="text-3xl font-black">{formData.title || "عنوان مطلب..."}</h2>
                    <p className="text-white/60 leading-7">{formData.excerpt || "خلاصه مطلب..."}</p>
                    <hr className="border-white/10" />
                    <div className="text-white/70 leading-8 whitespace-pre-wrap text-sm">{formData.content || "متن مطلب..."}</div>
                  </div>
                ) : (
                  /* Edit Mode */
                  <>
                    <div>
                      <label className="text-sm text-white/60 mb-1.5 block">عنوان مطلب *</label>
                      <input
                        value={formData.title}
                        onChange={(e) => {
                          setFormData((p) => ({
                            ...p,
                            title: e.target.value,
                            slug: p.slug || slugify(e.target.value),
                          }))
                        }}
                        placeholder="عنوان جذاب و خوانا بنویسید..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-gold/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-white/60 mb-1.5 block">Slug (آدرس پیوند)</label>
                      <input
                        value={formData.slug}
                        onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                        placeholder="slug-url-post"
                        dir="ltr"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-gold/50 transition-colors text-left font-mono text-sm"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-white/60 mb-1.5 block">دسته‌بندی</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-white"
                        >
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-white/60 mb-1.5 block">وضعیت انتشار</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as BlogPost["status"] }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-white"
                        >
                          <option value="draft">پیش‌نویس</option>
                          <option value="published">منتشر شده</option>
                          <option value="archived">آرشیو</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-white/60 mb-1.5 block">خلاصه / توضیح کوتاه *</label>
                      <textarea
                        value={formData.excerpt}
                        onChange={(e) => setFormData((p) => ({ ...p, excerpt: e.target.value }))}
                        placeholder="یک تا دو جمله توضیح مختصر که در لیست مطالب نمایش داده می‌شود..."
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-gold/50 transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-white/60 mb-1.5 block">متن کامل مطلب * <span className="text-white/30">(Markdown پشتیبانی می‌شود)</span></label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                        placeholder="## عنوان&#10;&#10;متن مطلب را اینجا بنویسید...&#10;&#10;### زیربخش&#10;&#10;توضیحات تکمیلی..."
                        rows={12}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-gold/50 transition-colors resize-y font-mono text-sm leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-white/60 mb-1.5 block">تصویر بندانگشتی</label>
                      {/* Drop zone */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setImageDragOver(true) }}
                        onDragLeave={() => setImageDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault(); setImageDragOver(false)
                          const file = e.dataTransfer.files[0]
                          if (file) handleImageUpload(file)
                        }}
                        className={`relative rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
                          imageDragOver ? "border-accent-gold bg-accent-gold/5" : "border-white/10 bg-white/3"
                        }`}
                      >
                        {formData.coverImage ? (
                          <div className="relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={formData.coverImage} alt="cover" className="w-full aspect-video object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-bold hover:bg-white/30 transition-colors">
                                <Upload className="w-4 h-4" />
                                تغییر تصویر
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
                              </label>
                              <button onClick={() => setFormData((p) => ({ ...p, coverImage: "" }))} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/30 backdrop-blur-sm rounded-xl text-sm font-bold hover:bg-red-500/50 transition-colors">
                                <X className="w-4 h-4" />
                                حذف
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8 flex flex-col items-center gap-3">
                            {imageUploading ? (
                              <>
                                <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
                                <p className="text-sm text-white/50">در حال آپلود...</p>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-8 h-8 text-white/20" />
                                <div className="text-center">
                                  <p className="text-sm text-white/50 mb-1">تصویر را اینجا رها کنید</p>
                                  <p className="text-xs text-white/30">یا از یک روش زیر انتخاب کنید</p>
                                </div>
                                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-accent-gold/10 border border-accent-gold/30 text-accent-gold rounded-xl text-sm font-bold hover:bg-accent-gold/20 transition-colors">
                                  <Upload className="w-4 h-4" />
                                  آپلود از دستگاه
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
                                </label>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {/* URL fallback */}
                      <div className="flex items-center gap-2 mt-2">
                        <Link2 className="w-4 h-4 text-white/30 flex-shrink-0" />
                        <input
                          value={formData.coverImage}
                          onChange={(e) => setFormData((p) => ({ ...p, coverImage: e.target.value }))}
                          placeholder="یا لینک مستقیم تصویر را وارد کنید..."
                          dir="ltr"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-accent-gold/50 transition-colors text-left text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-white/60 mb-1.5 block">تگ‌ها</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
                          placeholder="تگ جدید..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none text-sm"
                        />
                        <button onClick={addTag} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10 transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <span key={tag} className="flex items-center gap-1.5 bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-1 rounded-full">
                            <Tag className="w-3 h-3" />
                            {tag}
                            <button onClick={() => setFormData((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }))} className="hover:text-red-400 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-white/60 mb-1.5 block">نویسنده</label>
                      <input
                        value={formData.author}
                        onChange={(e) => setFormData((p) => ({ ...p, author: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent-gold/50 transition-colors"
                      />
                    </div>

                    <label className="flex items-center gap-3 p-4 bg-white/3 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData((p) => ({ ...p, featured: e.target.checked }))}
                        className="w-4 h-4 accent-yellow-500"
                      />
                      <div>
                        <p className="font-bold text-sm">مطلب ویژه</p>
                        <p className="text-white/40 text-xs">در بنر صفحه وبلاگ برجسته نمایش داده می‌شود</p>
                      </div>
                      <Star className="w-4 h-4 mr-auto text-accent-gold" />
                    </label>
                  </>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-white/5 flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "در حال ذخیره..." : "ذخیره مطلب"}
                </button>
                <button onClick={() => setIsCreating(false)} className="btn-secondary px-6">انصراف</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
