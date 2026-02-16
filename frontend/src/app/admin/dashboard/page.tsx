"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { CreditCard, Users, Trophy, Settings, ShieldCheck, ArrowUpRight, Radio } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { formatToman } from "@/lib/money"

type Summary = {
  monthlySales: number
  activeUsers: number
  soldTickets: number
  pendingWithdrawals: number
}

type LiveMetrics = {
  openRaffles: number
  closedRaffles: number
  gameDifficulty?: number
  slide?: {
    upcoming?: { id: string; title: string; scheduledAt: string } | null
  }
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [live, setLive] = useState<LiveMetrics | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [summaryData, liveData] = await Promise.all([
          apiRequest<Summary>("/admin/dashboard/summary"),
          apiRequest<LiveMetrics>("/admin/live/metrics"),
        ])
        setSummary(summaryData)
        setLive(liveData)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "خطا در دریافت آمار داشبورد")
      }
    })()
  }, [])

  const kpis = useMemo(() => ([
    { label: "فروش این ماه", value: formatToman(summary?.monthlySales ?? 0), icon: CreditCard },
    { label: "کاربر فعال", value: `${(summary?.activeUsers ?? 0).toLocaleString("fa-IR")} نفر`, icon: Users },
    { label: "بلیط فروخته‌شده", value: (summary?.soldTickets ?? 0).toLocaleString("fa-IR"), icon: Trophy },
    { label: "برداشت در انتظار", value: `${(summary?.pendingWithdrawals ?? 0).toLocaleString("fa-IR")} درخواست`, icon: ShieldCheck },
  ]), [summary])

  const controls = [
    { title: "تعیین مبلغ و تعداد قرعه‌کشی", href: "/admin/raffles", desc: "تنظیم بلیط پایه، ظرفیت و مدل قرعه‌کشی" },
    { title: "مدیریت کاربران", href: "/admin/users", desc: "وضعیت کاربران، دسترسی و حساب‌ها" },
    { title: "مدیریت مالی و کیف پول", href: "/admin/finance", desc: "برداشت‌ها، شارژها و کش‌بک" },
    { title: "مدیریت بازی‌ها", href: "/admin/wheel", desc: "گردونه و ماشین اسلاید" },
    { title: "مدیریت نمایشگاه", href: "/admin/showroom", desc: "افزودن خودرو، قیمت‌گذاری و وضعیت سفارش‌ها" },
    { title: "تیکت پشتیبانی", href: "/admin/support", desc: "پاسخ‌گویی تیکت‌ها و پیگیری وضعیت کاربران" },
    { title: "زمان‌بندی اسلاید", href: "/admin/slide", desc: "تنظیم زمان قرعه‌کشی اسلاید و جوایز بازه‌ای" },
    { title: "مانیتورینگ لایو", href: "/admin/live", desc: "رویدادهای زنده، سیگنال ریسک و وضعیت لحظه‌ای" },
    { title: "گزارش امنیت", href: "/admin/audit", desc: "گزارش تغییرات و لاگ‌های امنیتی کامل" },
  ]

  return (
    <div className="space-y-10" dir="rtl">
      <div>
        <h1 className="text-3xl font-black mb-2">داشبورد مدیریت</h1>
        <p className="text-white/40 text-sm">کنترل کامل فروش خودرو، قرعه‌کشی، مزایده و بازی‌های مالی</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }} className="bg-[#0C0C0C] border border-white/5 p-6 rounded-[2rem]">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <kpi.icon className="w-6 h-6 text-accent-gold" />
            </div>
            <p className="text-white/40 text-xs mb-1">{kpi.label}</p>
            <p className="font-black text-lg">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      <section className="bg-[#0C0C0C] border border-white/5 rounded-[2rem] p-6">
        <h2 className="font-black text-lg mb-4 flex items-center gap-2">
          <Radio className="text-accent-gold w-5 h-5" />
          وضعیت عملیاتی لحظه‌ای
        </h2>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-white/50">قرعه باز</p>
            <p className="font-black">{(live?.openRaffles ?? 0).toLocaleString("fa-IR")}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-white/50">قرعه بسته</p>
            <p className="font-black">{(live?.closedRaffles ?? 0).toLocaleString("fa-IR")}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-white/50">سختی اسلاید</p>
            <p className="font-black">{(live?.gameDifficulty ?? 0).toLocaleString("fa-IR")}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-white/50">اسلاید بعدی</p>
            <p className="font-black text-xs">{live?.slide?.upcoming?.title ?? "ندارد"}</p>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {controls.map((item) => (
          <Link key={item.href} href={item.href} className="bg-[#0C0C0C] border border-white/5 rounded-[1.5rem] p-6 hover:border-accent-gold/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <Settings className="text-accent-gold" size={18} />
              <ArrowUpRight size={16} className="text-white/30" />
            </div>
            <h2 className="font-black mb-1">{item.title}</h2>
            <p className="text-sm text-white/45">{item.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
