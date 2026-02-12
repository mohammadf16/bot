"use client"

import { motion } from "framer-motion"
import { 
  Ticket, 
  Wallet, 
  Trophy, 
  ChevronLeft, 
  Zap, 
  Star,
  Clock,
  ArrowUpRight
} from "lucide-react"
import Link from "next/link"

export default function UserDashboard() {
  const stats = [
    { label: "بلیط‌های فعال", value: "۱۲", icon: Ticket, color: "text-blue-500" },
    { label: "موجودی کیف پول", value: "۲۵,۴۰۰,۰۰۰", unit: "تومان", icon: Wallet, color: "text-accent-gold" },
    { label: "شانس گردونه", value: "۴۸", icon: Zap, color: "text-purple-500" },
    { label: "بردهای قبلی", value: "۳", icon: Trophy, color: "text-emerald-500" },
  ]

  const myTickets = [
    { car: "Mercedes-Benz G63", id: "#44219", date: "۲۴ بهمن", status: "active", progress: 65 },
    { car: "Porsche 911 Turbo S", id: "#38920", date: "۲۸ بهمن", status: "active", progress: 20 },
  ]

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">سلام، <span className="text-accent-gold">علیرضا</span></h1>
          <p className="text-white/40 text-sm font-bold">امروز شانس باهاته! یه نگاهی به قرعه‌کشی‌های جدید بنداز.</p>
        </div>
        <Link href="/wheel" className="flex items-center gap-4 bg-gradient-to-r from-accent-gold to-yellow-600 px-6 py-4 rounded-[2rem] group hover:scale-105 transition-all">
          <div className="w-10 h-10 bg-black/20 rounded-2xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-black" />
          </div>
          <div>
            <p className="text-[10px] text-black/60 font-black uppercase tracking-widest leading-none mb-1">گردونه شانس</p>
            <p className="text-sm font-black text-black">شانست رو امتحان کن!</p>
          </div>
          <ChevronLeft className="w-5 h-5 text-black group-hover:-translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-colors group"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer">
                  <ArrowUpRight className="w-4 h-4 text-white/20" />
                </div>
              </div>
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black">{stat.value}</span>
                {stat.unit && <span className="text-[10px] text-white/20 font-bold">{stat.unit}</span>}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Active Tickets */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black flex items-center gap-3">
              <Ticket className="w-6 h-6 text-accent-gold" />
              بلیط‌های فعال من
            </h2>
            <Link href="/dashboard/tickets" className="text-xs text-white/40 font-bold hover:text-accent-gold">مشاهده همه</Link>
          </div>
          <div className="space-y-4">
            {myTickets.map((ticket, idx) => (
              <div key={idx} className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black mb-1">{ticket.car}</h3>
                    <p className="text-xs text-white/40 font-bold">کد پیگیری: {ticket.id}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-accent-gold text-xs font-black mb-1">
                      <Clock className="w-4 h-4" />
                      {ticket.date}
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">در انتظار</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/20">
                    <span>پیشرفت قرعه‌کشی</span>
                    <span>{ticket.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${ticket.progress}%` }}
                      className="h-full bg-accent-gold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Recent Activity */}
        <div className="space-y-6">
          <h2 className="text-xl font-black flex items-center gap-3 px-2">
            <Star className="w-6 h-6 text-accent-gold" />
            پیشنهادات ویژه
          </h2>
          <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden h-[340px] flex flex-col justify-end">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center opacity-20 grayscale" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
            
            <div className="relative z-10">
              <span className="bg-white text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter mb-4 inline-block">پیشنهاد داغ</span>
              <h3 className="text-3xl font-black mb-4 leading-tight">با خرید ۳ بلیط، ۱ شانس <br /> <span className="text-accent-gold">رایگان</span> گردونه بگیرید!</h3>
              <button className="bg-white text-black px-8 py-4 rounded-2xl text-sm font-black hover:bg-accent-gold transition-colors">
                خرید بلیط
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
