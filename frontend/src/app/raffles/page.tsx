"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest, randomIdempotencyKey } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

type ComboPackage = {
  code: "silver" | "gold"
  title: string
  paidTickets: number
  bonusTickets: number
  bonusChances: number
  vipDays: number
}

type RaffleItem = {
  id: string
  title: string
  status: "draft" | "open" | "closed" | "drawn"
  maxTickets: number
  ticketsSold: number
  seedCommitHash: string
  dynamicPricing: { basePrice: number; decayFactor: number; minPrice: number }
  comboPackages: ComboPackage[]
}

type BuyResponse = {
  totalPaid: number
  ticketPrices: number[]
  cashback: number
  pity?: { missStreak: number; pityMultiplier: number }
}

export default function RafflesPage() {
  const { isAuthenticated } = useAuth()
  const [raffles, setRaffles] = useState<RaffleItem[]>([])
  const [selectedRaffleId, setSelectedRaffleId] = useState<string>("")
  const [count, setCount] = useState(1)
  const [buyPreview, setBuyPreview] = useState<BuyResponse | null>(null)

  const current = useMemo(() => raffles.find((r) => r.id === selectedRaffleId) ?? null, [raffles, selectedRaffleId])

  async function loadRaffles() {
    try {
      const data = await apiRequest<{ items: RaffleItem[] }>("/raffles", { method: "GET" }, { auth: false })
      setRaffles(data.items)
      const open = data.items.find((r) => r.status === "open")
      setSelectedRaffleId((prev) => prev || open?.id || data.items[0]?.id || "")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت قرعه کشی")
    }
  }

  useEffect(() => {
    void loadRaffles()
  }, [])

  async function buyTickets() {
    if (!current) return
    if (!isAuthenticated) return toast.error("ابتدا وارد شوید")
    try {
      const data = await apiRequest<BuyResponse>(`/raffles/${current.id}/buy`, {
        method: "POST",
        headers: { "Idempotency-Key": randomIdempotencyKey() },
        body: JSON.stringify({ count }),
      })
      setBuyPreview(data)
      toast.success("خرید با قیمت پویا انجام شد")
      await loadRaffles()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خرید انجام نشد")
    }
  }

  async function buyCombo(code: "silver" | "gold") {
    if (!current) return
    if (!isAuthenticated) return toast.error("ابتدا وارد شوید")
    try {
      await apiRequest(`/raffles/${current.id}/buy-combo`, {
        method: "POST",
        body: JSON.stringify({ code }),
      })
      toast.success(`پکیج ${code === "silver" ? "نقره ای" : "طلایی"} خریداری شد`)
      await loadRaffles()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خرید پکیج انجام نشد")
    }
  }

  return (
    <main className="min-h-screen bg-dark-bg pt-32 pb-20 text-right" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <section className="card glass p-8">
          <h1 className="text-4xl font-black mb-3">قرعه کشی هوشمند</h1>
          <p className="text-dark-text/70">قیمت پویا: قیمت پایه × (0.8)^(تعداد خرید - 1) با کف ۵۰٪</p>
        </section>

        <section className="card glass p-8">
          <label className="text-sm text-dark-text/60 mb-2 block">انتخاب قرعه کشی</label>
          <select
            value={selectedRaffleId}
            onChange={(e) => setSelectedRaffleId(e.target.value)}
            className="w-full bg-dark-bg/50 border border-dark-border/40 rounded-xl px-3 py-3 mb-4"
          >
            {raffles.map((r) => (
              <option key={r.id} value={r.id}>{r.title} ({r.status})</option>
            ))}
          </select>

          {current ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-black/20 rounded-xl border border-white/10 p-4 text-sm">
                  <p>بلیط فروخته شده: <b>{current.ticketsSold.toLocaleString("fa-IR")}</b></p>
                  <p>باقیمانده: <b>{(current.maxTickets - current.ticketsSold).toLocaleString("fa-IR")}</b></p>
                </div>
                <div>
                  <label className="text-sm text-dark-text/60 mb-2 block">تعداد بلیط تکی</label>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full bg-dark-bg/50 border border-dark-border/40 rounded-xl px-3 py-3"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n.toLocaleString("fa-IR")}</option>
                    ))}
                  </select>
                </div>
                <button onClick={buyTickets} className="btn-primary w-full">خرید تکی (قیمت پویا)</button>
              </div>

              <div className="space-y-3">
                <h3 className="font-black">پکیج های ترکیبی</h3>
                {current.comboPackages.map((p) => (
                  <div key={p.code} className="bg-black/20 rounded-xl border border-white/10 p-4">
                    <p className="font-bold">{p.code === "silver" ? "پکیج نقره ای" : "پکیج طلایی"}</p>
                    <p className="text-sm text-white/70">{p.paidTickets} خرید + {p.bonusTickets} هدیه + {p.bonusChances} شانس</p>
                    {p.vipDays > 0 ? <p className="text-xs text-amber-300 mt-1">+ {p.vipDays} روز VIP</p> : null}
                    <button className="btn-secondary mt-3" onClick={() => buyCombo(p.code)}>خرید پکیج</button>
                  </div>
                ))}
                {buyPreview ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-sm">
                    <p>جمع پرداخت: <b>{buyPreview.totalPaid.toLocaleString("fa-IR")}</b> تومان</p>
                    <p>کش بک: <b>{buyPreview.cashback.toLocaleString("fa-IR")}</b> تومان</p>
                    {buyPreview.pity ? <p>حافظه شانس: x{buyPreview.pity.pityMultiplier.toFixed(2)}</p> : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
