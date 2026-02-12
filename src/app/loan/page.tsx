"use client"

import { motion } from "framer-motion"

export default function LoanPage() {
  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-5xl font-bold mb-12">
          <span className="text-gradient">وام خودرو</span>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card glass p-8"
        >
          <h2 className="text-2xl font-bold mb-6">درخواست وام</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-dark-text/60 mb-2">نام و نام خانوادگی</label>
              <input
                type="text"
                placeholder="علی محمدی"
                className="w-full bg-dark-bg/50 rounded-lg px-4 py-3 border border-dark-border text-dark-text"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-dark-text/60 mb-2">شماره ملی</label>
                <input
                  type="text"
                  placeholder="0011223344"
                  className="w-full bg-dark-bg/50 rounded-lg px-4 py-3 border border-dark-border text-dark-text"
                />
              </div>

              <div>
                <label className="block text-dark-text/60 mb-2">تلفن</label>
                <input
                  type="tel"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="w-full bg-dark-bg/50 rounded-lg px-4 py-3 border border-dark-border text-dark-text"
                />
              </div>
            </div>

            <div>
              <label className="block text-dark-text/60 mb-2">درآمد ماهانه</label>
              <input
                type="number"
                placeholder="۵٬۰۰۰٬۰۰۰"
                className="w-full bg-dark-bg/50 rounded-lg px-4 py-3 border border-dark-border text-dark-text"
              />
            </div>

            <div>
              <label className="block text-dark-text/60 mb-2">مبلغ وام مورد نظر</label>
              <input
                type="number"
                placeholder="۳۰۰٬۰۰۰٬۰۰۰"
                className="w-full bg-dark-bg/50 rounded-lg px-4 py-3 border border-dark-border text-dark-text"
              />
            </div>

            <button className="btn-primary w-full py-4">تکمیل درخواست</button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
