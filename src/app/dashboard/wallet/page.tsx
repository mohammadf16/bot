"use client"

import { motion } from "framer-motion"
import { Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, Plus } from "lucide-react"

export default function WalletPage() {
  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Balance Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-gradient-to-br from-accent-gold to-yellow-600 rounded-[2.5rem] p-8 md:p-12 text-black relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[200px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold opacity-60 mb-1">موجودی فعلی</p>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight">۲۵,۴۰۰,۰۰۰ <span className="text-lg opacity-60 font-bold">تومان</span></h2>
              </div>
              <div className="bg-black/10 p-3 rounded-2xl backdrop-blur-sm">
                <Wallet className="w-8 h-8" />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button className="flex-1 bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                <Plus className="w-5 h-5" />
                افزایش موجودی
              </button>
              <button className="flex-1 bg-white/20 backdrop-blur-md text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/30 transition-colors">
                <ArrowUpRight className="w-5 h-5" />
                برداشت وجه
              </button>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="space-y-4">
           <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[2.5rem] h-full flex flex-col justify-center items-center text-center gap-4">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">کارت‌های بانکی</h3>
              <p className="text-xs text-white/40">۲ کارت متصل شده</p>
              <button className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-sm font-bold">
                مدیریت کارت‌ها
              </button>
           </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-xl font-black mb-6">تراکنش‌های اخیر</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${i === 1 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  {i === 1 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-bold">{i === 1 ? 'برداشت وجه' : 'شارژ کیف پول'}</p>
                  <p className="text-xs text-white/30">۱۴۰۲/۱۱/۲۸ - ۱۲:۳۰</p>
                </div>
              </div>
              <p className={`font-black text-lg ${i === 1 ? 'text-white' : 'text-emerald-500'}`}>
                {i === 1 ? '-' : '+'} ۵,۰۰۰,۰۰۰
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
