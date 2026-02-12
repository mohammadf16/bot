"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"
import { Clock, ArrowLeft, Filter, Search } from "lucide-react"

export default function RafflesPage() {
  const [filter, setFilter] = useState<"active" | "completed" | "upcoming">("active")

  const raffles = [
    {
      id: 1,
      name: "BMW X7 M-Sport",
      basePrice: "۱,۰۰۰,۰۰۰ تومان",
      prize: "BMW X7 2024 - صفر کیلومتر",
      timeLeft: "۳ روز و ۱۲ ساعت",
      soldPercentage: 65,
      status: "active",
      image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800",
      color: "from-blue-600/20"
    },
    {
      id: 2,
      name: "Mercedes AMG G63",
      basePrice: "۱,۵۰۰,۰۰۰ تومان",
      prize: "Mercedes-Benz G-Class AMG",
      timeLeft: "۱ روز و ۴ ساعت",
      soldPercentage: 92,
      status: "active",
      image: "https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&q=80&w=800",
      color: "from-gray-600/20"
    },
    {
      id: 3,
      name: "Tesla Model S Plaid",
      basePrice: "۸۰۰,۰۰۰ تومان",
      prize: "Tesla Model S Plaid 2024",
      timeLeft: "پایان یافته",
      soldPercentage: 100,
      status: "completed",
      image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800",
      color: "from-red-600/20"
    },
    {
      id: 4,
      name: "Porsche 911 GT3",
      basePrice: "۲,۵۰۰,۰۰۰ تومان",
      prize: "Porsche 911 GT3 RS",
      timeLeft: "شروع از هفته آینده",
      soldPercentage: 0,
      status: "upcoming",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800",
      color: "from-yellow-600/20"
    },
  ]

  const filteredRaffles = raffles.filter((r) => r.status === filter)

  return (
    <main className="min-h-screen bg-dark-bg pt-32 pb-20 text-right" dir="rtl">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-accent-gold font-bold tracking-widest text-sm"
            >
              <div className="w-8 h-px bg-accent-gold" />
              PREMIUM RAFFLES
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
              لیست <span className="text-accent-gold">قرعه‌کشی‌ها</span>
            </h1>
            <p className="text-dark-text/60 max-w-xl text-lg leading-relaxed">
              شانس خود را برای برنده شدن لوکس‌ترین خودروهای دنیا امتحان کنید. تمامی قرعه‌کشی‌ها تحت نظارت و با شفافیت کامل برگزار می‌شوند.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-text/40" />
              <input 
                type="text" 
                placeholder="جستجوی خودرو..." 
                className="bg-dark-bg border border-white/5 rounded-xl py-3 pr-12 pl-4 text-sm focus:outline-none focus:border-accent-gold transition-all w-64 text-right"
              />
            </div>
            <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
              <Filter className="w-5 h-5 text-accent-gold" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
          {[
            { label: "فعال", value: "active", count: 12 },
            { label: "تمام شده", value: "completed", count: 8 },
            { label: "آینده", value: "upcoming", count: 4 },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`px-8 py-4 rounded-2xl font-bold whitespace-nowrap transition-all flex items-center gap-3 ${
                filter === f.value
                  ? "bg-accent-gold text-dark-bg shadow-lg shadow-accent-gold/20"
                  : "bg-white/5 text-dark-text/60 hover:bg-white/10"
              }`}
            >
              {f.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${filter === f.value ? "bg-dark-bg/20" : "bg-white/10"}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Raffles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRaffles.map((raffle, idx) => (
            <motion.div
              key={raffle.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <Link href={`/raffles/${raffle.id}`}>
                <div className="group relative bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden hover:border-accent-gold/50 transition-all duration-500">
                  {/* Image Header */}
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={raffle.image} 
                      alt={raffle.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent opacity-60" />
                    
                    {/* Badge */}
                    <div className="absolute top-6 right-6">
                      <div className="px-4 py-2 bg-dark-bg/80 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold text-accent-gold flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
                        {raffle.status === 'active' ? 'در حال برگزاری' : raffle.status === 'completed' ? 'پایان یافته' : 'بزودی'}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 space-y-6">
                    <div>
                      <h3 className="text-2xl font-black text-white mb-2 group-hover:text-accent-gold transition-colors">{raffle.name}</h3>
                      <p className="text-dark-text/60 text-sm font-medium">{raffle.prize}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="text-[10px] text-dark-text/40 font-bold uppercase mb-1">قیمت هر بلیط</div>
                        <div className="text-accent-gold font-black">{raffle.basePrice}</div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="text-[10px] text-dark-text/40 font-bold uppercase mb-1">زمان باقی‌مانده</div>
                        <div className="text-white font-black flex items-center gap-1">
                          <Clock className="w-3 h-3 text-accent-cyan" />
                          {raffle.timeLeft}
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-dark-text/40">ظرفیت تکمیل شده</span>
                        <span className="text-sm font-black text-white">{raffle.soldPercentage}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${raffle.soldPercentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-l from-accent-gold to-yellow-500 rounded-full"
                        />
                      </div>
                    </div>

                    <button className="w-full py-4 bg-white text-dark-bg font-black rounded-2xl group-hover:bg-accent-gold transition-all duration-300 flex items-center justify-center gap-3">
                      مشاهده و خرید بلیط
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  )
}
