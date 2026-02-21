"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Ticket,
  Wallet,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronLeft,
  History,
  ShieldCheck,
  Calculator,
  CircleDollarSign,
  Disc3,
  Car,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { formatToman } from "@/lib/money"

export default function DashboardLayout({
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
    if (!user) router.replace("/login")
  }, [isLoading, user, router])

  useEffect(() => {
    if (!user) return
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

  const userMenu = [
    { label: "داشبورد", href: "/dashboard", icon: LayoutDashboard },
    { label: "خرید بلیط", href: "/raffles", icon: Ticket },
    { label: "تاریخچه بلیط ها", href: "/dashboard/tickets", icon: History },
    { label: "ماشین حساب سود", href: "/dashboard/calculator", icon: Calculator },
    { label: "کیف پول و شارژ", href: "/dashboard/wallet", icon: Wallet },
    { label: "کش بک و برداشت", href: "/wallet", icon: CircleDollarSign },
    { label: "گردونه شانس", href: "/wheel", icon: Disc3 },
    { label: "قرعه‌کشی ماشین اسلاید", href: "/slide-game", icon: Car },
    { label: "اسلاید آرنا", href: "/slide-arena", icon: Car },
    { label: "زیرمجموعه گیری", href: "/dashboard/referral", icon: User },
    { label: "تاریخچه جوایز", href: "/dashboard/history", icon: Ticket },
    { label: "قوانین و مقررات", href: "/dashboard/rules", icon: ShieldCheck },
  ]

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <aside
        className={`
        fixed lg:sticky top-0 h-screen z-50 bg-[#0A0A0A] border-l border-white/5 transition-all duration-300 ease-in-out
        w-72 ${isMenuOpen ? "right-0" : "-right-72 lg:right-0"}
      `}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-12 px-2">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                <ChevronLeft className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-xl font-black tracking-tighter">
                LUX<span className="text-[#D4AF37]">.</span>
              </h1>
            </Link>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {userMenu.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative
                    ${
                      isActive
                        ? "bg-[#D4AF37] text-black font-bold shadow-[0_10px_20px_-5px_rgba(212,175,55,0.3)]"
                        : "hover:bg-white/5 text-white/40 hover:text-white"
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-black" : "group-hover:scale-110 transition-transform"}`} />
                  <span className="text-sm">{item.label}</span>
                  {isActive && (
                    <motion.div layoutId="activeTab" className="absolute inset-0 bg-[#D4AF37] rounded-2xl -z-10" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <button
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-colors w-full"
              onClick={async () => {
                await logout()
                toast.success("از حساب خارج شدید")
                router.push("/login")
              }}
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-bold">خروج از حساب</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-20 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-colors text-[#D4AF37]"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
                <User size={14} className="text-[#D4AF37]" />
              </div>
              <div className="flex flex-col">
                <span className="text-white/20 text-[10px] leading-none mb-1">پنل کاربری</span>
                <span className="text-xs font-bold text-white">خوش آمدید، {user?.email ?? "کاربر"} </span>
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-3 md:gap-6">
            <div className="hidden md:flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <div className="text-right">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none mb-1">موجودی کیف پول</p>
                <p className="text-sm font-black text-[#D4AF37]">{formatToman(user?.walletBalance ?? 0)} تومان</p>
              </div>
              <Link href="/dashboard/wallet" className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center hover:scale-105 transition-transform">
                <Wallet className="w-4 h-4 text-black" />
              </Link>
            </div>

            <button onClick={() => setNotifOpen((s) => !s)} className="relative p-2 hover:bg-white/5 rounded-xl transition-colors group">
              <Bell size={20} className="text-white/40 group-hover:text-white transition-colors" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[#D4AF37] text-black text-[10px] font-black rounded-full border border-[#050505] flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </button>
            {notifOpen && (
              <div className="absolute left-4 md:left-8 top-20 w-[360px] max-w-[92vw] bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 shadow-2xl z-50">
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
          </div>
        </header>

        <main className="p-4 md:p-8">{children}</main>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMenuOpen(false)} />
      )}
    </div>
  )
}
