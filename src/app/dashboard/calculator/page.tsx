"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calculator, Zap, Ticket, Gift, TrendingDown, Wallet } from "lucide-react"

export default function CalculatorPage() {
  const [tickets, setTickets] = useState(1)
  
  const ticketPricing = [
    { price: 1000000, cashback: 200000 },
    { price: 800000, cashback: 160000 },
    { price: 650000, cashback: 130000 },
    { price: 550000, cashback: 110000 },
  ]

  const calculate = (count: number) => {
    let total = 0
    let cashback = 0
    for (let i = 1; i <= count; i++) {
      const tier = ticketPricing[Math.min(i - 1, 3)]
      total += tier.price
      cashback += tier.cashback
    }
    return { total, cashback }
  }

  const { total, cashback } = calculate(tickets)

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">ماشین‌حساب <span className="text-accent-gold">سود و شانس</span></h1>
        <p className="text-white/40 text-sm font-bold">قبل از خرید، سود و شانس خودت رو دقیق حساب کن!</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-[#0A0A0A] border border-white/5 p-8 md:p-12 rounded-[2.5rem]">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-accent-gold/10 rounded-2xl flex items-center justify-center">
              <Calculator className="text-accent-gold w-6 h-6" />
            </div>
            <h2 className="text-xl font-black">تنظیمات خرید</h2>
          </div>

          <div className="space-y-8">
            <div>
              <label className="text-sm font-bold text-white/40 block mb-4 uppercase tracking-widest">تعداد بلیط مورد نظر</label>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setTickets(Math.max(1, tickets - 1))}
                  className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl hover:bg-white/10 transition-colors"
                >-</button>
                <input 
                  type="number" 
                  value={tickets}
                  onChange={(e) => setTickets(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-3xl font-black focus:border-accent-gold outline-none transition-colors"
                />
                <button 
                  onClick={() => setTickets(tickets + 1)}
                  className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl hover:bg-white/10 transition-colors"
                >+</button>
              </div>
            </div>

            <div className="bg-accent-gold/5 border border-accent-gold/10 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <TrendingDown className="text-accent-gold w-5 h-5" />
                <span className="text-sm font-bold">قانون تخفیف پلکانی</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">
                هر چقدر بلیط بیشتری بخرید، قیمت بلیط‌های بعدی کمتر می‌شود. همچنین ۲۰٪ مبلغ هر بلیط به صورت نقد به کیف پول شما برمی‌گردد.
              </p>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between">
            <Ticket className="text-accent-gold w-8 h-8 mb-4" />
            <div>
              <p className="text-white/40 text-xs font-bold uppercase mb-1">مبلغ کل خرید</p>
              <h3 className="text-2xl font-black text-white">{total.toLocaleString("fa-IR")} <span className="text-[10px] opacity-40">تومان</span></h3>
            </div>
          </div>

          <div className="bg-accent-cyan/5 border border-accent-cyan/10 p-8 rounded-[2rem] flex flex-col justify-between">
            <Gift className="text-accent-cyan w-8 h-8 mb-4" />
            <div>
              <p className="text-accent-cyan/60 text-xs font-bold uppercase mb-1">کش‌بک دریافتی</p>
              <h3 className="text-2xl font-black text-accent-cyan">{cashback.toLocaleString("fa-IR")} <span className="text-[10px] opacity-40">تومان</span></h3>
            </div>
          </div>

          <div className="bg-purple-500/5 border border-purple-500/10 p-8 rounded-[2rem] flex flex-col justify-between">
            <Zap className="text-purple-500 w-8 h-8 mb-4" />
            <div>
              <p className="text-purple-500/60 text-xs font-bold uppercase mb-1">شانس گردونه رایگان</p>
              <h3 className="text-2xl font-black text-purple-500">{tickets} شانس</h3>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[2rem] flex flex-col justify-between">
            <Wallet className="text-emerald-500 w-8 h-8 mb-4" />
            <div>
              <p className="text-emerald-500/60 text-xs font-bold uppercase mb-1">هزینه واقعی شما</p>
              <h3 className="text-2xl font-black text-emerald-500">{(total - cashback).toLocaleString("fa-IR")} <span className="text-[10px] opacity-40">تومان</span></h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
