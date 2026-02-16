"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"

type Raffle = {
  id: string
  title: string
  maxTickets: number
  ticketsSold: number
  status: "draft" | "open" | "closed" | "drawn"
  tiers: Array<{ order: number; price: number; discountPercent: number }>
}

export default function AdminRafflesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    maxTickets: "1000",
  })
  const [raffles, setRaffles] = useState<Raffle[]>([])

  const load = async () => {
    try {
      const data = await apiRequest<{ items: Raffle[] }>("/admin/raffles")
      setRaffles(data.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت قرعه کشی‌ها")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleCreateRaffle = async () => {
    if (!formData.title || !formData.maxTickets) {
      toast.error("تمام فیلدهای ضروری را تکمیل کنید")
      return
    }
    try {
      await apiRequest("/admin/raffles", {
        method: "POST",
        body: JSON.stringify({
          title: formData.title,
          maxTickets: Number(formData.maxTickets),
        }),
      })
      toast.success("قرعه کشی جدید ایجاد شد")
      setShowCreateForm(false)
      setFormData({ title: "", maxTickets: "1000" })
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ایجاد قرعه کشی")
    }
  }

  const changeStatus = async (id: string, action: "open" | "close") => {
    try {
      await apiRequest(`/admin/raffles/${id}/${action}`, { method: "POST" })
      toast.success("وضعیت به‌روزرسانی شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در تغییر وضعیت")
    }
  }

  const runDraw = async (id: string) => {
    try {
      await apiRequest(`/admin/raffles/${id}/draw`, {
        method: "POST",
        body: JSON.stringify({
          winnersCount: 1,
          externalEntropy: `entropy-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        }),
      })
      toast.success("Draw با موفقیت انجام شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در draw")
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">مدیریت قرعه کشی</h1>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary">
          + ایجاد قرعه کشی جدید
        </button>
      </div>

      {showCreateForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="card glass p-8">
          <h2 className="text-2xl font-bold mb-6">تنظیم مبلغ و تعداد قرعه کشی</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-dark-text/60 mb-2">نام قرعه کشی</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-dark-bg/50 rounded-lg px-4 py-3 border border-dark-border text-dark-text" />
            </div>
            <div>
              <label className="block text-dark-text/60 mb-2">تعداد کل بلیط</label>
              <input type="number" value={formData.maxTickets} onChange={(e) => setFormData({ ...formData, maxTickets: e.target.value })} className="w-full bg-dark-bg/50 rounded-lg px-4 py-3 border border-dark-border text-dark-text" />
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={handleCreateRaffle} className="btn-primary">ثبت قرعه کشی</button>
            <button onClick={() => setShowCreateForm(false)} className="btn-tertiary">انصراف</button>
          </div>
        </motion.div>
      )}

      <div className="card glass overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-bg/50 border-b border-dark-border/30">
            <tr>
              <th className="px-6 py-4 text-right font-semibold">نام</th>
              <th className="px-6 py-4 text-right font-semibold">مبلغ پایه</th>
              <th className="px-6 py-4 text-right font-semibold">فروخته شده</th>
              <th className="px-6 py-4 text-right font-semibold">وضعیت</th>
              <th className="px-6 py-4 text-right font-semibold">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {raffles.map((raffle) => (
              <tr key={raffle.id} className="border-b border-dark-border/10 hover:bg-dark-surface/30 transition-colors">
                <td className="px-6 py-4">{raffle.title}</td>
                <td className="px-6 py-4">{(raffle.tiers[0]?.price ?? 0).toLocaleString("fa-IR")}</td>
                <td className="px-6 py-4">{raffle.ticketsSold.toLocaleString("fa-IR")} / {raffle.maxTickets.toLocaleString("fa-IR")}</td>
                <td className="px-6 py-4"><span className="px-3 py-1 rounded-full bg-status-success/10 text-status-success text-sm">{raffle.status}</span></td>
                <td className="px-6 py-4 flex gap-2">
                  {raffle.status === "draft" && <button onClick={() => changeStatus(raffle.id, "open")} className="btn-secondary text-sm px-3 py-2">باز</button>}
                  {raffle.status === "open" && <button onClick={() => changeStatus(raffle.id, "close")} className="btn-secondary text-sm px-3 py-2">بستن</button>}
                  {raffle.status === "closed" && <button onClick={() => runDraw(raffle.id)} className="btn-secondary text-sm px-3 py-2">Draw</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
