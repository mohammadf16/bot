"use client"

import { motion } from "framer-motion"

export default function ChecksPage() {
  const checks = [
    { id: 1, name: "حواله ۱۰۰ میلیون", seller: "علی محمدی", escrow: "در انتظار تایید", price: "۱۰۰,۰۰۰,۰۰۰" },
    { id: 2, name: "حواله ۵۰ میلیون", seller: "فاطمه حسینی", escrow: "در حال پردازش", price: "۵۰,۰۰۰,۰۰۰" },
  ]

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 text-right" dir="rtl">
        <h1 className="text-5xl font-black mb-12"><span className="text-gradient">خرید حواله خودرو</span></h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {checks.map((check, idx) => (
            <motion.div key={check.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: idx * 0.1 }} className="card glass p-6">
              <h3 className="text-xl font-black mb-4">{check.name}</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between"><span className="text-dark-text/60">فروشنده</span><span className="font-semibold">{check.seller}</span></div>
                <div className="flex justify-between"><span className="text-dark-text/60">قیمت</span><span className="font-bold text-accent-gold">{check.price} تومان</span></div>
                <div className="flex justify-between"><span className="text-dark-text/60">وضعیت</span><span className="px-3 py-1 rounded-full bg-status-warning/10 text-status-warning text-sm">{check.escrow}</span></div>
              </div>
              <button className="btn-primary w-full">مشاهده جزئیات</button>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  )
}
