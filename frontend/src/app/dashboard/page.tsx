"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Ticket, Wallet, Trophy, Zap, Users, Receipt, Bell, Activity } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

type TicketItem = {
  id: string
  raffleTitle: string
  index: number
  pricePaid: number
  raffleStatus: string
}

type ReferralInfo = {
  totalReferrals: number
}

type WalletHistory = {
  type: string
  amount: number
}

type ActivityItem = {
  id: string
  source: "wallet" | "audit" | "notification"
  type: string
  title: string
  body?: string
  amount?: number
  createdAt: string
}

export default function UserDashboard() {
  const { user, refreshMe } = useAuth()
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [referral, setReferral] = useState<ReferralInfo>({ totalReferrals: 0 })
  const [history, setHistory] = useState<WalletHistory[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        await refreshMe()
        const [tData, rData, hData, aData] = await Promise.all([
          apiRequest<{ items: TicketItem[] }>("/me/tickets"),
          apiRequest<ReferralInfo & { referralCode: string }>("/me/referral"),
          apiRequest<{ items: WalletHistory[] }>("/me/history"),
          apiRequest<{ items: ActivityItem[] }>("/me/activity"),
        ])
        setTickets(tData.items)
        setReferral(rData)
        setHistory(hData.items)
        setActivities(aData.items)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "خطا در دریافت داشبورد")
      }
    })()
  }, [refreshMe])

  const cashback = useMemo(() => history.filter((h) => h.type === "cashback").reduce((a, b) => a + b.amount, 0), [history])

  const stats = [
    { label: "بلیط های فعال", value: tickets.length.toLocaleString("fa-IR"), icon: Ticket, color: "text-blue-500" },
    { label: "موجودی کیف پول", value: (user?.walletBalance ?? 0).toLocaleString("fa-IR"), unit: "تومان", icon: Wallet, color: "text-accent-gold" },
    { label: "شانس قرعه", value: (user?.chances ?? 0).toLocaleString("fa-IR"), icon: Zap, color: "text-purple-500" },
    { label: "کش بک", value: cashback.toLocaleString("fa-IR"), unit: "تومان", icon: Wallet, color: "text-cyan-400" },
    { label: "زیرمجموعه", value: referral.totalReferrals.toLocaleString("fa-IR"), icon: Users, color: "text-emerald-500" },
  ]

  return (
    <div className="space-y-10" dir="rtl">
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">
          سلام، <span className="text-accent-gold">{user?.email ?? "کاربر"}</span>
        </h1>
        <p className="text-white/40 text-sm font-bold">خلاصه حساب، اعلان ها و گردش آخر فعالیت های شما</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }} className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[2rem]">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-white/40 text-xs mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black">{stat.value}</span>
                {stat.unit && <span className="text-[10px] text-white/20">{stat.unit}</span>}
              </div>
            </motion.div>
          )
        })}
      </div>

      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/wallet" className="bg-[#0A0A0A] border border-white/5 p-5 rounded-2xl hover:border-accent-gold/30 transition-colors">
          <Wallet className="text-accent-gold mb-3" />
          <p className="font-black">کیف پول</p>
        </Link>
        <Link href="/dashboard/tickets" className="bg-[#0A0A0A] border border-white/5 p-5 rounded-2xl hover:border-accent-gold/30 transition-colors">
          <Receipt className="text-accent-gold mb-3" />
          <p className="font-black">تاریخچه بلیط</p>
        </Link>
        <Link href="/dashboard/referral" className="bg-[#0A0A0A] border border-white/5 p-5 rounded-2xl hover:border-accent-gold/30 transition-colors">
          <Users className="text-accent-gold mb-3" />
          <p className="font-black">زیرمجموعه گیری</p>
        </Link>
        <Link href="/dashboard/notifications" className="bg-[#0A0A0A] border border-white/5 p-5 rounded-2xl hover:border-accent-gold/30 transition-colors">
          <Bell className="text-accent-gold mb-3" />
          <p className="font-black">اعلان ها</p>
        </Link>
      </section>

      <div className="space-y-4">
        <h2 className="text-xl font-black flex items-center gap-2"><Activity className="text-accent-gold" /> گردش آخر حساب</h2>
        {activities.slice(0, 8).map((item) => (
          <div key={item.id} className="bg-[#0A0A0A] border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <p className="font-bold">{item.title}</p>
              <p className="text-xs text-white/40">{new Date(item.createdAt).toLocaleString("fa-IR")}</p>
              {item.body ? <p className="text-xs text-white/60 mt-1">{item.body}</p> : null}
            </div>
            <div className="text-left">
              <p className="text-xs text-white/40">{item.source}</p>
              {typeof item.amount === "number" ? <p className="font-bold">{item.amount.toLocaleString("fa-IR")} تومان</p> : null}
            </div>
          </div>
        ))}
        {!activities.length ? <p className="text-sm text-white/50">فعلا فعالیتی ثبت نشده است.</p> : null}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black flex items-center gap-2"><Trophy className="text-accent-gold" /> بلیط های من</h2>
        {tickets.slice(0, 5).map((t) => (
          <div key={t.id} className="bg-[#0A0A0A] border border-white/5 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="font-bold">{t.raffleTitle}</p>
              <p className="text-xs text-white/40">کد بلیط: {t.id} - شماره: {t.index.toLocaleString("fa-IR")}</p>
            </div>
            <div className="text-left">
              <p className="font-bold">{t.pricePaid.toLocaleString("fa-IR")} تومان</p>
              <p className="text-xs text-white/40">{t.raffleStatus}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
