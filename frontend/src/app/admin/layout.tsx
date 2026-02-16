"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Trophy,
  PieChart,
  Gift,
  Radio,
  FileText,
  ShieldAlert,
  Gavel,
  TimerReset,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  MessageSquare,
  Car,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Array<{
    id: string
    title: string
    body?: string
    readAt?: string
    createdAt: string
    kind: "info" | "success" | "warning"
  }>>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (user.role !== "admin") {
      router.replace("/dashboard")
    }
  }, [isLoading, user, router])

  useEffect(() => {
    if (!user || user.role !== "admin") return
    ;(async () => {
      try {
        const data = await apiRequest<{
          items: Array<{
            id: string
            title: string
            body?: string
            readAt?: string
            createdAt: string
            kind: "info" | "success" | "warning"
          }>
          unreadCount: number
        }>("/me/notifications", { method: "GET" })
        setNotifications(data.items)
        setUnreadCount(data.unreadCount)
      } catch {
        // noop
      }
    })()
  }, [user])

  const topNotifications = useMemo(() => notifications.slice(0, 8), [notifications])

  async function markOneRead(notificationId: string) {
    try {
      await apiRequest(`/me/notifications/${notificationId}/read`, { method: "POST" })
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)))
      setUnreadCount((n) => Math.max(0, n - 1))
    } catch {
      // noop
    }
  }

  async function markAllRead() {
    try {
      await apiRequest("/me/notifications/read-all", { method: "POST" })
      const now = new Date().toISOString()
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })))
      setUnreadCount(0)
    } catch {
      // noop
    }
  }

  const adminMenu = [
    { label: "داشبورد", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "کاربران", href: "/admin/users", icon: Users },
    { label: "مدیریت مالی و کیف پول", href: "/admin/finance", icon: CreditCard },
    { label: "مدیریت قرعه کشی", href: "/admin/raffles", icon: Trophy },
    { label: "تعرفه و قیمت گذاری", href: "/admin/pricing", icon: PieChart },
    { label: "بازی ها و شانس", href: "/admin/wheel", icon: Gift },
    { label: "مانیتورینگ لایو", href: "/admin/live", icon: Radio },
    { label: "قوانین و محتوا", href: "/admin/content", icon: FileText },
    { label: "گزارش امنیت", href: "/admin/audit", icon: ShieldAlert },
    { label: "مدیریت مزایده", href: "/admin/rewards", icon: Gavel },
    { label: "مدیریت نمایشگاه", href: "/admin/showroom", icon: Car },
    { label: "تیکت پشتیبانی", href: "/admin/support", icon: MessageSquare },
    { label: "قرعه کشی اسلاید", href: "/admin/slide", icon: TimerReset },
  ]

  return (
    <div className="min-h-screen bg-[#080808] text-white flex" dir="rtl">
      <aside
        className={`
        fixed lg:sticky top-0 h-screen z-50 bg-[#0C0C0C] border-l border-white/5 transition-all duration-300 overflow-hidden
        ${isMenuOpen ? "w-72 right-0" : "w-72 -right-72 lg:right-0"}
      `}
      >
        <div className="h-full flex flex-col p-6 min-h-0">
          <div className="flex items-center gap-4 mb-12 px-2">
            <div className="w-10 h-10 bg-accent-gold rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-xl font-black tracking-tighter">
              پنل <span className="text-accent-gold">مدیریت</span>
            </h1>
          </div>

          <nav className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-1">
            {adminMenu.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group
                    ${
                      isActive
                        ? "bg-accent-gold text-black font-bold shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                        : "hover:bg-white/5 text-white/50 hover:text-white"
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-black" : "group-hover:scale-110 transition-transform"}`} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <button
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors w-full"
              onClick={async () => {
                await logout()
                toast.success("از پنل خارج شدید")
                router.push("/login")
              }}
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-bold">خروج از پنل</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-white/5 bg-[#080808]/80 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-colors">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
            <div className="hidden md:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5 w-64 lg:w-96">
              <Search className="w-4 h-4 text-white/30" />
              <input type="text" placeholder="جستجو در پنل مدیریت..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-white/20" />
            </div>
          </div>

          <div className="relative flex items-center gap-3 md:gap-6">
            <button onClick={() => setNotifOpen((s) => !s)} className="relative p-2 hover:bg-white/5 rounded-xl transition-colors group">
              <Bell className="w-5 h-5 text-white/50 group-hover:text-white" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[#D4AF37] text-black text-[10px] font-black rounded-full border border-[#080808] flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </button>
            {notifOpen && (
              <div className="absolute left-0 top-12 w-[360px] max-w-[92vw] bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 shadow-2xl z-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-black text-sm">اعلان‌ها</p>
                  <button onClick={markAllRead} className="text-xs text-accent-gold hover:underline">
                    خواندن همه
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {topNotifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!n.readAt) void markOneRead(n.id)
                      }}
                      className={`w-full text-right p-3 rounded-xl border transition ${
                        n.readAt ? "bg-white/5 border-white/10" : "bg-[#D4AF37]/10 border-[#D4AF37]/30"
                      }`}
                    >
                      <p className="text-sm font-bold">{n.title}</p>
                      {n.body ? <p className="text-xs text-white/60 mt-1">{n.body}</p> : null}
                      <p className="text-[10px] text-white/40 mt-1">{new Date(n.createdAt).toLocaleString("fa-IR")}</p>
                    </button>
                  ))}
                  {!topNotifications.length ? <p className="text-xs text-white/50 p-2">اعلانی ندارید.</p> : null}
                </div>
              </div>
            )}
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">مدیر سیستم</p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">{user?.email ?? "Admin"}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-gold to-yellow-600 p-px">
                <div className="w-full h-full rounded-[11px] bg-[#0C0C0C] flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent-gold" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>

      {isMenuOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMenuOpen(false)} />}
    </div>
  )
}
