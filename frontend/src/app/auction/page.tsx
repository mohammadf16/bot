"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest, getAccessToken } from "@/lib/api"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/api/v1/live"

type Auction = {
  id: string
  title: string
  description?: string
  currentBid: number
  status: "draft" | "open" | "closed" | "cancelled"
  endAt: string
  bidsCount?: number
  bestBid?: number
}

export default function AuctionPage() {
  const [items, setItems] = useState<Auction[]>([])
  const [bids, setBids] = useState<Record<string, string>>({})

  async function load() {
    try {
      const data = await apiRequest<{ items: Auction[] }>("/auctions/live", { method: "GET" }, { auth: false })
      setItems(data.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت مزایده")
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
        if (msg.payload?.type === "system.info") void load()
      } catch {
        // noop
      }
    }
    return () => socket.close()
  }, [])

  async function bid(auctionId: string) {
    const amount = Number(bids[auctionId])
    if (!Number.isFinite(amount) || amount <= 0) return toast.error("مبلغ نامعتبر")
    try {
      await apiRequest(`/auctions/live/${auctionId}/bid`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      })
      toast.success("پیشنهاد ثبت شد")
      setBids((prev) => ({ ...prev, [auctionId]: "" }))
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت پیشنهاد ناموفق بود")
    }
  }

  return (
    <main className="min-h-screen pt-28 pb-16" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <section className="card glass p-8">
          <h1 className="text-4xl font-black mb-2">مزایده خودرو (Live Auction)</h1>
          <p className="text-white/70">حالت کور: قیمت سایر کاربران نمایش داده نمی شود و برنده در پایان اعلام می شود.</p>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          {items.map((a) => {
            const blind = a.description?.includes("BLIND")
            return (
              <div key={a.id} className="card glass p-6 space-y-3">
                <h3 className="text-2xl font-black">{a.title}</h3>
                <p className="text-sm text-white/60">حالت: {blind ? "مزایده کور" : "مزایده معمولی"}</p>
                <p className="text-sm">پایان: {new Date(a.endAt).toLocaleString("fa-IR")}</p>
                <p className="text-sm">وضعیت: {a.status}</p>
                <p className="text-sm">تعداد پیشنهاد: {a.bidsCount?.toLocaleString("fa-IR") ?? 0}</p>
                <p className="text-sm">بالاترین قیمت قابل مشاهده: {blind ? "مخفی" : (a.bestBid ?? a.currentBid).toLocaleString("fa-IR")}</p>
                <div className="flex gap-2">
                  <input
                    value={bids[a.id] ?? ""}
                    onChange={(e) => setBids((prev) => ({ ...prev, [a.id]: e.target.value }))}
                    className="flex-1 bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2"
                    placeholder="مبلغ پیشنهاد"
                  />
                  <button disabled={a.status !== "open"} onClick={() => bid(a.id)} className="btn-primary disabled:opacity-60">ثبت</button>
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </main>
  )
}
