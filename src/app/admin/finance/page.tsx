"use client"

import { motion } from "framer-motion"

export default function AdminFinancePage() {
  const withdrawals = [
    {
      id: 1,
      user: "علی محمدی",
      amount: 1000000,
      status: "pending",
      date: "۱۴۰۳/۱۱/۲۰",
    },
    {
      id: 2,
      user: "فاطمه حسینی",
      amount: 500000,
      status: "completed",
      date: "۱۴۰۳/۱۱/۱۹",
    },
  ]

  return (
    <div>
      <h1 className="text-4xl font-bold mb-12">مدیریت مالی</h1>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {[
          { label: "کل برداشت‌ها", value: "۵۰ میلیون" },
          { label: "درخواست‌های در حال بررسی", value: "۱۲" },
          { label: "کل کش‌بک", value: "۱۰۰ میلیون" },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="card glass p-6"
          >
            <p className="text-dark-text/60 mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-accent-gold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Withdrawals */}
      <div className="card glass overflow-hidden">
        <div className="p-6 border-b border-dark-border/30">
          <h2 className="text-xl font-bold">درخواست‌های برداشت</h2>
        </div>

        <table className="w-full">
          <thead className="bg-dark-bg/50 border-b border-dark-border/30">
            <tr>
              <th className="px-6 py-4 text-right font-semibold">کاربر</th>
              <th className="px-6 py-4 text-right font-semibold">مبلغ</th>
              <th className="px-6 py-4 text-right font-semibold">تاریخ</th>
              <th className="px-6 py-4 text-right font-semibold">وضعیت</th>
              <th className="px-6 py-4 text-right font-semibold">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((wd) => (
              <tr
                key={wd.id}
                className="border-b border-dark-border/10 hover:bg-dark-surface/30"
              >
                <td className="px-6 py-4">{wd.user}</td>
                <td className="px-6 py-4 font-bold">
                  {wd.amount.toLocaleString("fa-IR")}
                </td>
                <td className="px-6 py-4">{wd.date}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      wd.status === "pending"
                        ? "bg-status-warning/10 text-status-warning"
                        : "bg-status-success/10 text-status-success"
                    }`}
                  >
                    {wd.status === "pending" ? "در حال بررسی" : "تکمیل شده"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="btn-secondary text-sm">تایید</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
