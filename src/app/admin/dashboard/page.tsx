"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Trophy, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  ExternalLink,
  ChevronRight
} from "lucide-react"

export default function AdminDashboard() {
  const kpis = [
    { label: "کل فروش (ماه)", value: "۵۰۰,۰۰۰,۰۰۰", unit: "تومان", change: "+۲۰.۴٪", trend: "up", icon: CreditCard },
    { label: "کاربران جدید", value: "۱,۲۴۰", unit: "نفر", change: "+۱۵.۲٪", trend: "up", icon: Users },
    { label: "بلیط‌های فروخته شده", value: "۴,۸۹۰", unit: "عدد", change: "+۸.۱٪", trend: "up", icon: Trophy },
    { label: "نرخ تبدیل", value: "۱۲.۵", unit: "درصد", change: "-۲.۴٪", trend: "down", icon: TrendingUp },
  ]

  const recentTransactions = [
    { user: "امیررضا علوی", action: "خرید بلیط پورشه", amount: "۵,۰۰۰,۰۰۰", status: "success", time: "۲ دقیقه پیش" },
    { user: "سارا کریمی", action: "شارژ کیف پول", amount: "۱۲,۰۰۰,۰۰۰", status: "pending", time: "۵ دقیقه پیش" },
    { user: "محمد نوری", action: "خرید بلیط بنز", amount: "۳,۵۰۰,۰۰۰", status: "success", time: "۱۲ دقیقه پیش" },
    { user: "نیلوفر اسدی", action: "برداشت جایزه", amount: "۱,۰۰۰,۰۰۰", status: "failed", time: "۱ ساعت پیش" },
  ]

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">خلاصه <span className="text-accent-gold">وضعیت سیستم</span></h1>
          <p className="text-white/40 text-sm">گزارش عملکرد سایت در ۲۴ ساعت گذشته</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-gold" />
            آخرین بروزرسانی: امروز، ۱۲:۳۰
          </div>
          <button className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-black hover:bg-accent-gold transition-colors flex items-center gap-2">
            خروجی اکسل
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#0C0C0C] border border-white/5 p-6 rounded-[2rem] hover:border-accent-gold/20 transition-colors group"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-accent-gold" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${kpi.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {kpi.change}
                  {kpi.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
              </div>
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">{kpi.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black">{kpi.value}</span>
                <span className="text-[10px] text-white/20 font-bold">{kpi.unit}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Activity Chart Placeholder */}
        <div className="lg:col-span-2 bg-[#0C0C0C] border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-black">نمودار فروش روزانه</h2>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none">
              <option>۷ روز گذشته</option>
              <option>۳۰ روز گذشته</option>
            </select>
          </div>
          <div className="p-8 h-80 flex flex-col justify-end gap-4">
            <div className="flex items-end justify-between h-full gap-2">
              {[40, 70, 45, 90, 65, 85, 55].map((h, i) => (
                <div key={i} className="flex-1 group relative">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className="w-full bg-accent-gold/20 rounded-t-xl group-hover:bg-accent-gold transition-colors relative"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {h}M
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-white/20 font-bold uppercase tracking-widest">
              <span>Sat</span><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#0C0C0C] border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-black">تراکنش‌های اخیر</h2>
            <Link href="/admin/finance" className="text-accent-gold text-xs font-bold flex items-center gap-1 hover:underline">
              همه
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-6 space-y-4">
            {recentTransactions.map((tx, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-colors group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 
                  tx.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 
                  'bg-rose-500/10 text-rose-500'
                }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{tx.user}</p>
                  <p className="text-[10px] text-white/30 truncate">{tx.action}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-accent-gold">{tx.amount}</p>
                  <p className="text-[10px] text-white/20">{tx.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
