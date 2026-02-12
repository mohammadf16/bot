"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import toast from "react-hot-toast"

export default function AdminRafflesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    prize: "",
    basePrice: "",
    mode: "random",
    targetNumber: "",
  })

  const raffles = [
    {
      id: 1,
      name: "BMW X7",
      basePrice: 1000000,
      sold: 650,
      total: 1000,
      status: "active",
    },
    {
      id: 2,
      name: "Mercedes AMG",
      basePrice: 1500000,
      sold: 900,
      total: 1000,
      status: "active",
    },
  ]

  const handleCreateRaffle = () => {
    if (!formData.name || !formData.prize || !formData.basePrice) {
      toast.error("تمام فیلدها را پر کنید")
      return
    }
    toast.success("قرعه‌کشی ایجاد شد")
    setShowCreateForm(false)
    setFormData({ name: "", prize: "", basePrice: "", mode: "random", targetNumber: "" })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold">مدیریت قرعه‌کشی</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary"
        >
          + ایجاد قرعه‌کشی جدید
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card glass p-8 mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">قرعه‌کشی جدید</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-dark-text/60 mb-2">نام قرعه‌کشی</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثلاً: BMW X7"
                className="w-full bg-dark-bg/50 rounded-lg px-4 py-3 border border-dark-border text-dark-text"
              />
            </div>

            <div>
              <label className="block text-dark-text/60 mb-2">جایزه</label>
              <input
                type="text"
                value={formData.prize}
                onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                placeholder="BMW X7 2024"
                className="w-full bg-dark-bg/50 rounded-lg px-4 py-3 border border-dark-border text-dark-text"
              />
            </div>

            <div>
              <label className="block text-dark-text/60 mb-2">قیمت پایه</label>
              <input
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                placeholder="1000000"
                className="w-full bg-dark-bg/50 rounded-lg px-4 py-3 border border-dark-border text-dark-text"
              />
            </div>

            <div>
              <label className="block text-dark-text/60 mb-2">حالت</label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className="w-full bg-dark-bg/50 rounded-lg px-4 py-3 border border-dark-border text-dark-text"
              >
                <option value="random">تصادفی</option>
                <option value="target">عدد هدف</option>
              </select>
            </div>

            {formData.mode === "target" && (
              <div>
                <label className="block text-dark-text/60 mb-2">عدد هدف</label>
                <input
                  type="number"
                  value={formData.targetNumber}
                  onChange={(e) => setFormData({ ...formData, targetNumber: e.target.value })}
                  placeholder="42"
                  className="w-full bg-dark-bg/50 rounded-lg px-4 py-3 border border-dark-border text-dark-text"
                />
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button onClick={handleCreateRaffle} className="btn-primary">
              ایجاد
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="btn-tertiary"
            >
              انصراف
            </button>
          </div>
        </motion.div>
      )}

      {/* Raffles List */}
      <div className="card glass overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-bg/50 border-b border-dark-border/30">
            <tr>
              <th className="px-6 py-4 text-right font-semibold">نام</th>
              <th className="px-6 py-4 text-right font-semibold">قیمت پایه</th>
              <th className="px-6 py-4 text-right font-semibold">فروخته شده</th>
              <th className="px-6 py-4 text-right font-semibold">وضعیت</th>
              <th className="px-6 py-4 text-right font-semibold">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {raffles.map((raffle) => (
              <tr
                key={raffle.id}
                className="border-b border-dark-border/10 hover:bg-dark-surface/30 transition-colors"
              >
                <td className="px-6 py-4">{raffle.name}</td>
                <td className="px-6 py-4">
                  {raffle.basePrice.toLocaleString("fa-IR")}
                </td>
                <td className="px-6 py-4">
                  {raffle.sold} / {raffle.total}
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full bg-status-success/10 text-status-success text-sm">
                    {raffle.status === "active" ? "فعال" : raffle.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="btn-tertiary text-sm">ویرایش</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
