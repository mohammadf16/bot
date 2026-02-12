"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import toast from "react-hot-toast"

export default function RaffleDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<"buy" | "chances" | "live" | "rules">("buy")
  const [ticketCount, setTicketCount] = useState(1)

  const raffle = {
    id: params.id,
    name: "BMW X7",
    prize: "BMW X7 2024",
    basePrice: 1000000,
    timeLeft: "3 روز و 5 ساعت",
    image: "🚗",
  }

  const ticketPricing = [
    { number: 1, price: 1000000, cashback: 200000, discount: 0 },
    { number: 2, price: 800000, cashback: 160000, discount: 20 },
    { number: 3, price: 650000, cashback: 130000, discount: 35 },
    { number: 4, price: 550000, cashback: 110000, discount: 45 },
  ]

  const calculateTotal = (count: number) => {
    let total = 0
    let cashback = 0
    for (let i = 1; i <= count; i++) {
      const tier = ticketPricing[Math.min(i - 1, 3)]
      total += tier.price
      cashback += tier.cashback
    }
    return { total, cashback }
  }

  const { total: totalPrice, cashback: totalCashback } = calculateTotal(ticketCount)
  const totalChances = ticketCount

  const handleBuyTickets = () => {
    toast.success(`${ticketCount} بلیط خریداری شد! ${totalCashback.toLocaleString("fa-IR")} تومان به کیف پول شما برگشت داده شد.`)
  }

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="card glass h-96 flex items-center justify-center text-9xl"
          >
            {raffle.image}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold mb-2">{raffle.name}</h1>
            <p className="text-dark-text/60 mb-6">{raffle.prize}</p>

            {/* Timer */}
            <div className="card glass p-6 mb-6">
              <p className="text-dark-text/60 mb-2">زمان باقی مانده</p>
              <p className="text-3xl font-bold text-accent-gold">{raffle.timeLeft}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-dark-text/60 text-sm">قیمت پایه</p>
                <p className="text-2xl font-bold text-accent-gold">
                  {raffle.basePrice.toLocaleString("fa-IR")}
                </p>
              </div>
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <p className="text-dark-text/60 text-sm">کش‌بک</p>
                <p className="text-2xl font-bold text-accent-cyan">۲۰٪</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-4 border-b border-dark-border/30 overflow-x-auto">
            {[
              { id: "buy", label: "خرید بلیط" },
              { id: "chances", label: "شانس‌ها" },
              { id: "live", label: "لایو" },
              { id: "rules", label: "قوانین" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-accent-gold text-accent-gold"
                    : "border-transparent text-dark-text/60 hover:text-dark-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === "buy" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Ticket Selection */}
                  <div className="card glass">
                    <h3 className="text-2xl font-bold mb-6">انتخاب تعداد بلیط</h3>

                    {/* Stepper */}
                    <div className="flex items-center gap-4 mb-8">
                      <button
                        onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                        className="btn-secondary px-4 py-2"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={ticketCount}
                        onChange={(e) => setTicketCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 bg-dark-bg/50 rounded-lg px-4 py-3 text-center text-2xl font-bold border border-dark-border text-dark-text"
                      />
                      <button
                        onClick={() => setTicketCount(ticketCount + 1)}
                        className="btn-secondary px-4 py-2"
                      >
                        +
                      </button>
                    </div>

                    {/* Pricing Table */}
                    <div className="mb-8">
                      <p className="text-dark-text/60 mb-4 text-sm">جدول قیمت پلکانی</p>
                      <div className="space-y-2 text-sm">
                        {ticketPricing.map((tier, idx) => (
                          <div
                            key={idx}
                            className={`flex justify-between p-3 rounded-lg transition-colors ${
                              ticketCount >= tier.number
                                ? "bg-accent-gold/10 border border-accent-gold/30"
                                : "bg-dark-bg/50 border border-dark-border/30"
                            }`}
                          >
                            <span>
                              بلیط {tier.number}: {tier.price.toLocaleString("fa-IR")} تومان
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="card glass">
                    <h3 className="text-2xl font-bold mb-6">خلاصه سفارش</h3>

                    <div className="space-y-6 mb-8">
                      <div className="flex justify-between items-center p-4 bg-dark-bg/50 rounded-lg border border-white/5">
                        <span className="text-dark-text/60">تعداد بلیط</span>
                        <span className="font-bold text-lg">{ticketCount}</span>
                      </div>

                      <div className="border-t border-dark-border/30 pt-6">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-dark-text/60">مجموع پرداخت</span>
                          <span className="text-2xl font-black text-accent-gold">
                            {totalPrice.toLocaleString("fa-IR")} <span className="text-xs font-bold opacity-50">تومان</span>
                          </span>
                        </div>

                        <div className="flex justify-between items-center mb-4 p-3 bg-accent-cyan/10 rounded-xl border border-accent-cyan/20">
                          <span className="text-accent-cyan text-sm font-bold">کش‌بک (۲۰٪ آنی)</span>
                          <span className="text-xl font-black text-accent-cyan">
                            {totalCashback.toLocaleString("fa-IR")} <span className="text-xs opacity-50">تومان</span>
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-accent-gold/10 rounded-xl border border-accent-gold/20">
                          <span className="text-accent-gold text-sm font-bold">شانس گردونه رایگان</span>
                          <span className="text-xl font-black text-accent-gold">
                            {totalChances} شانس
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={handleBuyTickets}
                        className="w-full py-5 bg-gradient-to-r from-accent-gold to-yellow-600 text-black font-black rounded-2xl hover:scale-[1.02] transition-all shadow-[0_10px_30px_-10px_rgba(212,175,55,0.4)]"
                      >
                        تایید و پرداخت نهایی
                      </button>
                    </div>

                    <button
                      onClick={handleBuyTickets}
                      className="btn-primary w-full py-4 text-lg"
                    >
                      تایید و پرداخت
                    </button>

                    <p className="text-xs text-dark-text/50 text-center mt-4">
                      با کلیک روی تایید، شما شرایط و قوانین را قبول می‌کنید
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "chances" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="card glass p-8"
              >
                <h3 className="text-2xl font-bold mb-6">شرکت با شانس‌ها</h3>
                <p className="text-dark-text/60 mb-6">
                  شما می‌توانید شانس‌های موجود خود را برای شرکت در قرعه‌کشی استفاده کنید
                </p>

                <div className="bg-dark-bg/50 rounded-lg p-6 mb-6">
                  <p className="text-dark-text/60 mb-2">شانس‌های موجود</p>
                  <p className="text-4xl font-bold text-accent-gold">۲۵ شانس</p>
                </div>

                <div className="bg-dark-bg/50 rounded-lg p-6 mb-6">
                  <p className="text-dark-text/60 mb-2">تبدیل</p>
                  <p className="text-lg mb-4">۵ شانس = ۱ ورود</p>
                  <p className="font-bold text-accent-cyan">می‌توانید ۵ بار شرکت کنید</p>
                </div>

                <button className="btn-primary w-full py-4">
                  تبدیل و شرکت
                </button>
              </motion.div>
            )}

            {activeTab === "live" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="card glass p-8"
              >
                <h3 className="text-2xl font-bold mb-6">نتایج لایو</h3>
                <p className="text-dark-text/60">قرعه‌کشی هنوز شروع نشده است</p>
              </motion.div>
            )}

            {activeTab === "rules" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="card glass p-8 space-y-6"
              >
                <h3 className="text-2xl font-bold">قوانین قرعه‌کشی</h3>

                <div>
                  <h4 className="font-bold mb-2">چگونه کار می‌کند</h4>
                  <p className="text-dark-text/60">
                    هر بلیط خریداری شده یک شانس گردونه شانس و ۲۰ درصد کش‌بک می‌دهد. شانس‌ها را می‌توانید تبدیل کنید.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold mb-2">شرایط برداشت</h4>
                  <p className="text-dark-text/60">
                    هر ۵ بار شرکت تکمیل شدن، شما می‌توانید کش‌بک خود را برداشت کنید.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold mb-2">جوایز</h4>
                  <ul className="text-dark-text/60 space-y-2">
                    <li>نفر ۱ تا ۴: جایزه نقدی</li>
                    <li>نفر ۵: ماشین</li>
                    <li>نفر ۶ تا ۱۰: ۹ ثوت طلا</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
