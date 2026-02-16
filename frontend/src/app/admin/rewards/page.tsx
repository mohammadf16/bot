"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest, getAccessToken } from "@/lib/api"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/api/v1/live"

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
    startPrice: "1000000000",
    minStep: "1000000",
    startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
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
    socket.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as { type: string; payload: { type?: string } }
        if (msg.type !== "event") return
        const t = msg.payload?.type
        if (t === "showroom.order" || t === "showroom.vehicle" || t === "system.info") {
          void load()
        }
      } catch {
        // noop
      }
    }
    return () => socket.close()
  }, [])

  async function createAuction() {
    try {
      await apiRequest("/admin/auctions/live", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          mode: form.mode,
          startPrice: Number(form.startPrice),
          minStep: Number(form.minStep),
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
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
      toast.success("نوتیفیکیشن همگانی ارسال شد")
      setBroadcast({ title: "", body: "", kind: "info" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ارسال نوتیف ناموفق بود")
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      <h1 className="text-4xl font-bold">Mission Control - مزایده و اعلان</h1>

      <section className="card glass p-6 space-y-4">
        <h2 className="text-2xl font-bold">ایجاد مزایده کور یا معمولی</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2" placeholder="عنوان" />
          <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as any })} className="bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2">
            <option value="blind">مزایده کور</option>
            <option value="visible">مزایده معمولی</option>
          </select>
          <input value={form.startPrice} onChange={(e) => setForm({ ...form, startPrice: e.target.value })} className="bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2" placeholder="قیمت پایه" />
          <input value={form.minStep} onChange={(e) => setForm({ ...form, minStep: e.target.value })} className="bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2" placeholder="حداقل گام" />
          <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2" />
          <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2" />
        </div>
        <button onClick={createAuction} className="btn-primary">ثبت مزایده</button>
      </section>

      <section className="card glass p-6 space-y-4">
        <h2 className="text-2xl font-bold">ارسال اعلان همگانی</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <input value={broadcast.title} onChange={(e) => setBroadcast((p) => ({ ...p, title: e.target.value }))} className="bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2" placeholder="عنوان" />
          <input value={broadcast.body} onChange={(e) => setBroadcast((p) => ({ ...p, body: e.target.value }))} className="bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2 md:col-span-2" placeholder="متن پیام" />
          <select value={broadcast.kind} onChange={(e) => setBroadcast((p) => ({ ...p, kind: e.target.value as any }))} className="bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2">
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
                <p className="text-xs text-white/60">{a.description?.includes("BLIND") ? "کور" : "معمولی"} | {a.status} | bids:{a.bidsCount ?? 0}</p>
              </div>
              {a.status === "open" ? <button onClick={() => closeAuction(a.id)} className="btn-secondary">بستن مزایده</button> : null}
            </div>
          ))}
          {!items.length ? <p className="text-white/60">مزایده ای وجود ندارد.</p> : null}
        </div>
      </section>
    </div>
  )
}
