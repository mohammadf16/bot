"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import toast from "react-hot-toast"

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<"balance" | "charge" | "withdraw" | "ledger">("balance")
  const [withdrawAmount, setWithdrawAmount] = useState("")

  const wallet = {
    withdrawable: 500000,
    cashback: 250000,
    pending: 100000,
    chances: 15,
    participations: {
      completed: 3,
      total: 5,
    },
  }

  const transactions = [
    { date: "۱۴۰۳/۱۱/۲۰", type: "خرید بلیط", amount: "−۲٬۰۰۰٬۰۰۰", status: "تکمیل شده" },
    { date: "۱۴۰۳/۱۱/۱۸", type: "کش‌بک", amount: "+۴۰۰٬۰۰۰", status: "تکمیل شده" },
    { date: "۱۴۰۳/۱۱/۱۵", type: "برداشت", amount: "+۱٬۰۰۰٬۰۰۰", status: "درخواست شده" },
  ]

  const handleCharge = () => {
    toast.success("صفحه درگاه پرداخت بارگذاری شد")
  }

  const handleWithdraw = () => {
    if (!withdrawAmount) {
      toast.error("مبلغ را وارد کنید")
      return
    }
    toast.success("درخواست برداشت ثبت شد")
    setWithdrawAmount("")
  }

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-5xl font-bold mb-12">
          <span className="text-gradient">کیف پول</span>
        </h1>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {[
            {
              label: "موجودی قابل برداشت",
              value: wallet.withdrawable,
              color: "accent-gold",
            },
            {
              label: "کش‌بک",
              value: wallet.cashback,
              color: "accent-cyan",
            },
            {
              label: "در انتظار",
              value: wallet.pending,
              color: "status-warning",
            },
            {
              label: "شانس‌ها",
              value: wallet.chances,
              color: "accent-gold",
            },
          ].map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="card glass"
            >
              <p className="text-dark-text/60 text-sm mb-2">{card.label}</p>
              <p className={`text-2xl font-bold text-${card.color}`}>
                {card.value.toLocaleString("fa-IR")}
                {card.label.includes("شانس") && " شانس"}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Withdrawal Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card glass mb-12 p-8"
        >
          <h3 className="text-xl font-bold mb-6">شرط برداشت</h3>
          <p className="text-dark-text/60 mb-4">
            برای برداشت کیف‌پول، باید حداقل ۵ بار در قرعه‌کشی‌ها شرکت کنید
          </p>

          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="h-6 bg-dark-bg rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-gold to-accent-cyan"
                  initial={{ width: 0 }}
                  whileInView={{ width: "60%" }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-accent-gold">
                {wallet.participations.completed}/{wallet.participations.total}
              </p>
              <p className="text-sm text-dark-text/60">شرکت تکمیل شده</p>
            </div>
          </div>

          <p className="text-sm text-dark-text/50 mt-4">
            {wallet.participations.total - wallet.participations.completed} بار دیگر نیاز دارید
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-4 border-b border-dark-border/30 overflow-x-auto">
            {[
              { id: "balance", label: "موجودی" },
              { id: "charge", label: "شارژ کیف پول" },
              { id: "withdraw", label: "برداشت" },
              { id: "ledger", label: "تراکنش‌ها" },
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
            {activeTab === "balance" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="card glass p-8">
                  <h3 className="text-2xl font-bold mb-6">تفصیل موجودی</h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-dark-bg/50 rounded-lg">
                      <span>موجودی قابل برداشت</span>
                      <span className="text-2xl font-bold text-accent-gold">
                        {wallet.withdrawable.toLocaleString("fa-IR")}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-dark-bg/50 rounded-lg">
                      <span>کش‌بک</span>
                      <span className="text-2xl font-bold text-accent-cyan">
                        {wallet.cashback.toLocaleString("fa-IR")}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-dark-bg/50 rounded-lg">
                      <span>در انتظار</span>
                      <span className="text-2xl font-bold text-status-warning">
                        {wallet.pending.toLocaleString("fa-IR")}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-dark-bg/50 rounded-lg">
                      <span>شانس‌های موجود</span>
                      <span className="text-2xl font-bold text-accent-gold">
                        {wallet.chances}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "charge" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="card glass p-8 max-w-2xl">
                  <h3 className="text-2xl font-bold mb-6">شارژ کیف پول</h3>

                  <div className="space-y-4 mb-8">
                    {[
                      { amount: 100000, label: "۱۰۰ هزار تومان" },
                      { amount: 500000, label: "۵۰۰ هزار تومان" },
                      { amount: 1000000, label: "۱ میلیون تومان" },
                      { amount: 5000000, label: "۵ میلیون تومان" },
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => setWithdrawAmount(chip.amount.toString())}
                        className="w-full p-4 border border-dark-border/50 rounded-lg hover:border-accent-gold/50 hover:bg-dark-surface/50 transition-all text-left font-semibold"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCharge}
                    className="btn-primary w-full py-4"
                  >
                    ادامه به درگاه پرداخت
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === "withdraw" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="card glass p-8 max-w-2xl">
                  <h3 className="text-2xl font-bold mb-6">درخواست برداشت</h3>

                  <div className="mb-6">
                    <p className="text-dark-text/60 mb-4">موجودی قابل برداشت</p>
                    <div className="bg-dark-bg/50 rounded-lg p-4 text-2xl font-bold text-accent-gold">
                      {wallet.withdrawable.toLocaleString("fa-IR")}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-dark-text/60 mb-2">مبلغ برداشت</label>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="مبلغ را وارد کنید"
                      className="w-full bg-dark-bg/50 rounded-lg px-4 py-3 border border-dark-border text-dark-text placeholder-dark-text/40"
                    />
                  </div>

                  {wallet.participations.completed < wallet.participations.total && (
                    <div className="bg-status-warning/10 border border-status-warning/30 rounded-lg p-4 mb-6">
                      <p className="text-status-warning text-sm">
                        ⚠️ شما هنوز شرط برداشت را تکمیل نکرده‌اید
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleWithdraw}
                    disabled={wallet.participations.completed < wallet.participations.total}
                    className={`w-full py-4 ${
                      wallet.participations.completed >= wallet.participations.total
                        ? "btn-primary"
                        : "opacity-50 cursor-not-allowed btn-primary"
                    }`}
                  >
                    تایید برداشت
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === "ledger" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="card glass overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-dark-bg/50 border-b border-dark-border/30">
                      <tr>
                        <th className="px-6 py-4 text-right font-semibold">تاریخ</th>
                        <th className="px-6 py-4 text-right font-semibold">نوع</th>
                        <th className="px-6 py-4 text-right font-semibold">مبلغ</th>
                        <th className="px-6 py-4 text-right font-semibold">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-dark-border/10 hover:bg-dark-surface/30 transition-colors"
                        >
                          <td className="px-6 py-4">{tx.date}</td>
                          <td className="px-6 py-4">{tx.type}</td>
                          <td
                            className={`px-6 py-4 font-bold ${
                              tx.amount.startsWith("+")
                                ? "text-status-success"
                                : "text-accent-gold"
                            }`}
                          >
                            {tx.amount}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full bg-status-success/10 text-status-success text-sm">
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
