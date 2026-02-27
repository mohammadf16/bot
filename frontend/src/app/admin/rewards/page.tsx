"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest, getAccessToken, LIVE_WS_URL } from "@/lib/api"
import { formatJalaliDateTime, jalaliDateTimeInputToLocal, toJalaliDateTimeInput } from "@/lib/date"
import { formatMoneyInput, formatToman, parseTomanInput } from "@/lib/money"

const WS_URL = LIVE_WS_URL

type Auction = {
  id: string
  title: string
  description?: string
  startPrice: number
  currentBid: number
  status: "draft" | "open" | "closed" | "cancelled"
  endAt: string
  bidsCount?: number
}

export default function AdminRewardsPage() {
  const [items, setItems] = useState<Auction[]>([])
  const [form, setForm] = useState({
    title: "",
    mode: "blind" as "blind" | "visible",
    startPrice: formatMoneyInput("1000000000"),
    minStep: formatMoneyInput("1000000"),
    startsAt: toJalaliDateTimeInput(new Date(Date.now() + 60 * 60 * 1000)),
    endsAt: toJalaliDateTimeInput(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  })
  const [broadcast, setBroadcast] = useState({ title: "", body: "", kind: "info" as "info" | "success" | "warning" })

  async function load() {
    try {
      const data = await apiRequest<{ items: Auction[] }>("/auctions/live", { method: "GET" }, { auth: false })
      setItems(data.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت مزایده ها")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    const socket = new WebSocket(token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL)
    socket.onmessage = () => {
      void load()
    }
    return () => socket.close()
  }, [])

  async function createAuction() {
    const startsAtLocal = jalaliDateTimeInputToLocal(form.startsAt)
    const endsAtLocal = jalaliDateTimeInputToLocal(form.endsAt)
    if (!startsAtLocal || !endsAtLocal) {
      toast.error("تاریخ شروع و پایان معتبر نیست")
      return
    }

    const startPrice = parseTomanInput(form.startPrice)
    const minStep = parseTomanInput(form.minStep)
    if (!startPrice || !minStep) {
      toast.error("قیمت پایه و حداقل گام نامعتبر است")
      return
    }

    try {
      await apiRequest("/admin/auctions/live", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          mode: form.mode,
          startPrice,
          minStep,
          startsAt: new Date(startsAtLocal).toISOString(),
          endsAt: new Date(endsAtLocal).toISOString(),
        }),
      })
      toast.success("مزایده ایجاد شد")
      setForm((p) => ({ ...p, title: "" }))
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ایجاد مزایده")
    }
  }

  async function closeAuction(id: string) {
    try {
      await apiRequest(`/admin/auctions/live/${id}/close`, { method: "POST" })
      toast.success("مزایده بسته شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در بستن مزایده")
    }
  }

  async function sendBroadcast() {
    try {
      await apiRequest("/admin/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify(broadcast),
      })
      toast.success("اعلان همگانی ارسال شد")
      setBroadcast({ title: "", body: "", kind: "info" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ارسال اعلان ناموفق بود")
    }
  }

  const inputClass = "bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2"

  return (
    <div className="space-y-8" dir="rtl">
      <h1 className="text-4xl font-bold">Mission Control - مزایده و اعلان</h1>

      <section className="card glass p-6 space-y-4">
        <h2 className="text-2xl font-bold">ایجاد مزایده کور یا معمولی</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="عنوان" />
          <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as "blind" | "visible" })} className={inputClass}>
            <option value="blind">مزایده کور</option>
            <option value="visible">مزایده معمولی</option>
          </select>
          <input value={form.startPrice} onChange={(e) => setForm({ ...form, startPrice: formatMoneyInput(e.target.value) })} className={inputClass} placeholder="قیمت پایه" inputMode="numeric" />
          <input value={form.minStep} onChange={(e) => setForm({ ...form, minStep: formatMoneyInput(e.target.value) })} className={inputClass} placeholder="حداقل گام" inputMode="numeric" />
          <input value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className={inputClass} placeholder="شروع (شمسی)" />
          <input value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className={inputClass} placeholder="پایان (شمسی)" />
        </div>
        <button onClick={createAuction} className="btn-primary">ثبت مزایده</button>
      </section>

      <section className="card glass p-6 space-y-4">
        <h2 className="text-2xl font-bold">ارسال اعلان همگانی</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <input value={broadcast.title} onChange={(e) => setBroadcast((p) => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="عنوان" />
          <input value={broadcast.body} onChange={(e) => setBroadcast((p) => ({ ...p, body: e.target.value }))} className={`${inputClass} md:col-span-2`} placeholder="متن پیام" />
          <select value={broadcast.kind} onChange={(e) => setBroadcast((p) => ({ ...p, kind: e.target.value as "info" | "success" | "warning" }))} className={inputClass}>
            <option value="info">اطلاعاتی</option>
            <option value="success">موفق</option>
            <option value="warning">هشدار</option>
          </select>
        </div>
        <button onClick={sendBroadcast} className="btn-secondary">ارسال اعلان</button>
      </section>

      <section className="card glass p-6">
        <h2 className="text-2xl font-bold mb-3">مزایده های فعال</h2>
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a.id} className="p-3 rounded-lg border border-white/10 bg-black/20 flex justify-between items-center">
              <div>
                <p>{a.title}</p>
                <p className="text-xs text-white/60">
                  {a.description?.includes("BLIND") ? "کور" : "معمولی"} | {a.status} | bids:{(a.bidsCount ?? 0).toLocaleString("fa-IR")} | پایان: {formatJalaliDateTime(a.endAt)}
                </p>
                <p className="text-xs text-white/60">
                  قیمت پایه: {formatToman(a.startPrice)} تومان | بالاترین پیشنهاد: {formatToman(a.currentBid)} تومان
                </p>
              </div>
              {a.status === "open" ? <button onClick={() => void closeAuction(a.id)} className="btn-secondary">بستن مزایده</button> : null}
            </div>
          ))}
          {!items.length ? <p className="text-white/60">مزایده ای وجود ندارد.</p> : null}
        </div>
      </section>
    </div>
  )
}
