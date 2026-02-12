"use client"

import { motion } from "framer-motion"
import { Users, Copy, Share2, Zap, Gift, Trophy, ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"

export default function ReferralPage() {
  const referralCode = "LUX-77219"
  const stats = [
    { label: "تعداد زیرمجموعه‌ها", value: "۱۲ نفر", icon: Users },
    { label: "شانس‌های کسب شده", value: "۱۲ شانس", icon: Zap },
    { label: "کش‌بک دریافتی", value: "۲,۴۰۰,۰۰۰", unit: "تومان", icon: Gift },
  ]

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode)
    toast.success("کد معرف کپی شد!")
  }

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">سیستم <span className="text-accent-gold">زیرمجموعه‌گیری</span></h1>
          <p className="text-white/40 text-sm font-bold">دوستانت رو دعوت کن، هم اونا هدیه بگیرن هم تو!</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Referral Code Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gradient-to-br from-[#111] to-black border border-white/5 p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 blur-3xl rounded-full" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-6">دعوت از دوستان</h2>
              <p className="text-white/60 mb-10 max-w-lg leading-relaxed">
                با ارسال لینک یا کد معرف به دوستان خود، به ازای هر نفری که ثبت‌نام کند و اولین بلیط خود را بخرد، <span className="text-accent-gold font-bold">۱ شانس رایگان گردونه</span> دریافت می‌کنید. همچنین ۵٪ از مبلغ خرید آن‌ها به عنوان کش‌بک به کیف پول شما واریز می‌شود.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-xs text-white/40 font-bold uppercase tracking-widest">کد معرف شما</span>
                  <span className="text-xl font-black text-white">{referralCode}</span>
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="bg-white text-black px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-accent-gold transition-all"
                >
                  <Copy size={20} />
                  کپی کد
                </button>
              </div>
            </div>
          </div>

          {/* Rules / Rewards */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-[2rem]">
              <Trophy className="text-accent-gold w-10 h-10 mb-6" />
              <h3 className="text-xl font-bold mb-4">جوایز زیرمجموعه</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                  هر ۵ زیرمجموعه = ۱ بلیط رایگان قرعه‌کشی
                </li>
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                  هر ۲ شانس گردونه = ۱ بار چرخش گردونه
                </li>
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                  هر ۵ بار شرکت = امکان برداشت نقدی موجودی
                </li>
              </ul>
            </div>
            <div className="bg-accent-gold/5 border border-accent-gold/10 p-8 rounded-[2rem] flex flex-col justify-center text-center">
              <Zap className="text-accent-gold w-12 h-12 mx-auto mb-6 animate-pulse" />
              <h3 className="text-2xl font-black mb-2 text-white">کمپین طلایی</h3>
              <p className="text-sm text-white/40 mb-6">بیشترین زیرمجموعه در این ماه ۵۰۰ شانس گردونه جایزه می‌گیرد!</p>
              <button className="text-accent-gold font-bold flex items-center justify-center gap-2 hover:gap-4 transition-all">
                مشاهده جدول برترین‌ها
                <ArrowLeft size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={i} className="bg-[#0A0A0A] border border-white/5 p-8 rounded-[2rem] group hover:border-white/10 transition-all">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="text-accent-gold w-6 h-6" />
                </div>
                <p className="text-white/40 text-xs font-bold uppercase mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">{stat.value}</span>
                  {stat.unit && <span className="text-xs text-white/20 font-bold">{stat.unit}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
