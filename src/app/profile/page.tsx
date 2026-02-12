"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import Link from "next/link"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "tickets" | "referral" | "rules" | "settings">("dashboard")

  const userStats = {
    tickets: 15,
    chances: 25,
    participations: 3,
    cashback: 500000,
    withdrawable: 250000,
  }

  const tickets = [
    { raffleId: 1, raffleName: "BMW X7", ticketCount: 5, totalSpent: 5000000, cashback: 1000000 },
    { raffleId: 2, raffleName: "Mercedes AMG", ticketCount: 10, totalSpent: 8000000, cashback: 1600000 },
  ]

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-5xl font-bold mb-12">
          <span className="text-gradient">حساب کاربری</span>
        </h1>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-4 border-b border-dark-border/30 overflow-x-auto">
            {[
              { id: "dashboard", label: "داشبورد" },
              { id: "tickets", label: "بلیط‌های من" },
              { id: "referral", label: "دعوت دوستان" },
              { id: "rules", label: "قوانین" },
              { id: "settings", label: "تنظیمات" },
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
            {activeTab === "dashboard" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[
                    { label: "بلیط‌های من", value: userStats.tickets, color: "accent-gold" },
                    { label: "شانس‌ها", value: userStats.chances, color: "accent-cyan" },
                    { label: "کش‌بک", value: `${(userStats.cashback / 1000000).toFixed(1)}M`, color: "status-success" },
                  ].map((stat, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className="card glass p-6"
                    >
                      <p className="text-dark-text/60 mb-2">{stat.label}</p>
                      <p className={`text-3xl font-bold text-${stat.color}`}>{stat.value}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="card glass p-8">
                  <h3 className="text-2xl font-bold mb-6">وضعیت برداشت</h3>
                  <p className="text-dark-text/60 mb-4">
                    موجودی قابل برداشت: <span className="font-bold text-accent-gold">{(userStats.withdrawable / 1000000).toFixed(1)}M</span>
                  </p>
                  <Link href="/wallet" className="btn-primary">
                    رفتن به کیف پول
                  </Link>
                </div>
              </motion.div>
            )}

            {activeTab === "tickets" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <motion.div
                      key={ticket.raffleId}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="card glass p-6"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold mb-2">{ticket.raffleName}</h3>
                          <div className="grid grid-cols-3 gap-6 text-sm text-dark-text/60">
                            <div>
                              <p>تعداد بلیط</p>
                              <p className="font-bold text-accent-gold">{ticket.ticketCount}</p>
                            </div>
                            <div>
                              <p>کل هزینه</p>
                              <p className="font-bold">{(ticket.totalSpent / 1000000).toFixed(0)}M</p>
                            </div>
                            <div>
                              <p>کش‌بک</p>
                              <p className="font-bold text-status-success">{(ticket.cashback / 1000000).toFixed(0)}M</p>
                            </div>
                          </div>
                        </div>
                        <Link href={`/raffles/${ticket.raffleId}`} className="btn-secondary text-sm">
                          جزئیات
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "referral" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="card glass p-8"
              >
                <h3 className="text-2xl font-bold mb-6">دعوت دوستان</h3>

                <div className="mb-8">
                  <p className="text-dark-text/60 mb-4">کد دعوت شما</p>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value="REF_ALI_123456789"
                      readOnly
                      className="flex-1 bg-dark-bg/50 rounded-lg px-4 py-3 border border-dark-border text-dark-text"
                    />
                    <button className="btn-primary">کپی</button>
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-dark-text/60 mb-4">QR Code</p>
                  <div className="w-48 h-48 bg-dark-bg/50 rounded-lg flex items-center justify-center border border-dark-border">
                    <span className="text-dark-text/40">QR Code</span>
                  </div>
                </div>

                <div>
                  <p className="text-dark-text/60 mb-4">دوستان دعوت شده</p>
                  <div className="space-y-2">
                    {[
                      { name: "فاطمه", date: "۱۴۰۳/۱۱/۱۵", status: "تایید شده", chances: "1" },
                      { name: "محمد", date: "۱۴۰۳/۱۱/۱۰", status: "تایید شده", chances: "1" },
                    ].map((referral, idx) => (
                      <div key={idx} className="flex justify-between p-3 bg-dark-bg/50 rounded-lg">
                        <div>
                          <p className="font-semibold">{referral.name}</p>
                          <p className="text-xs text-dark-text/60">{referral.date}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 bg-status-success/10 text-status-success rounded text-xs">
                            {referral.status}
                          </span>
                          <p className="text-sm font-bold mt-1">{referral.chances} شانس</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "rules" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="card glass p-8 space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold mb-4">قوانین سایت</h3>
                  <p className="text-dark-text/70">
                    تمام مشخصات و قوانین بازی، قرعه‌کشی و برداشت پول را اینجا مشاهده کنید.
                  </p>
                </div>

                <Link href="/fairness" className="btn-primary inline-block">
                  نمایش صفحه شفافیت
                </Link>

                <div className="border-t border-dark-border/30 pt-6">
                  <h4 className="font-bold mb-2">نسخه قوانین</h4>
                  <p className="text-dark-text/60 text-sm">v1.0 — ۱۴۰۳/۱۰/۱۵</p>
                </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-8">
                  <div className="card glass p-8">
                    <h3 className="text-2xl font-bold mb-6">تنظیمات امنیتی</h3>
                    <div className="space-y-4">
                      <button className="w-full btn-secondary">تغییر رمز عبور</button>
                      <button className="w-full btn-secondary">فعال‌سازی احراز دو مرحله‌ای</button>
                      <button className="w-full btn-tertiary text-status-danger">خروج از تمام دستگاه‌ها</button>
                    </div>
                  </div>

                  <div className="card glass p-8">
                    <h3 className="text-2xl font-bold mb-6">اطلاعات حساب</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-dark-text/60 mb-2">نام</label>
                        <input
                          type="text"
                          value="علی محمدی"
                          className="w-full bg-dark-bg/50 rounded-lg px-4 py-3 border border-dark-border text-dark-text"
                        />
                      </div>

                      <div>
                        <label className="block text-dark-text/60 mb-2">ایمیل</label>
                        <input
                          type="email"
                          value="ali@example.com"
                          className="w-full bg-dark-bg/50 rounded-lg px-4 py-3 border border-dark-border text-dark-text"
                        />
                      </div>

                      <button className="btn-primary">ذخیره تغییرات</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
