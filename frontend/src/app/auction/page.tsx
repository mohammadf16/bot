"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest, getAccessToken, LIVE_WS_URL } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { formatMoneyInput, formatToman, parseTomanInput } from "@/lib/money"
import { CalendarDays, Car, Fuel, Gauge, MapPin, Settings2, Trophy } from "lucide-react"

const WS_URL = LIVE_WS_URL
const BID_STEP = 10_000_000

type AuctionItem = {
  id: string
  title: string
  description?: string
  imageUrl?: string
  startPrice: number
  currentBid: number
  minStep?: number
  status: "draft" | "open" | "closed" | "cancelled"
  endAt: string
  bidsCount?: number
  bestBid?: number
  vehicle?: {
    model: string
    year: number
    city: string
    mileageKm: number
    transmission: "automatic" | "manual"
    fuelType: "gasoline" | "hybrid" | "electric" | "diesel"
  }
  topBidder?: {
    userId: string
    displayName: string
    amount: number
  }
}

export default function AuctionPage() {
  const [items, setItems] = useState<AuctionItem[]>([])
  const [bids, setBids] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const { user } = useAuth()

  const isProUser = useMemo(() => Number(user?.vipLevelId ?? 1) >= 3, [user?.vipLevelId])

  async function load() {
    try {
      const data = await apiRequest<{ items: AuctionItem[] }>("/auctions/live", { method: "GET" }, { auth: false })
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
        if (msg.payload?.type === "system.info" || msg.payload?.type === "showroom.order") void load()
      } catch {
        // noop
      }
    }
    return () => socket.close()
  }, [])

  function parseMinStep(a: AuctionItem): number {
    const byField = Number(a.minStep ?? 0)
    if (Number.isFinite(byField) && byField > 0) return byField
    const byDescription = Number(a.description?.match(/MIN_STEP:(\d+)/)?.[1] ?? 0)
    if (Number.isFinite(byDescription) && byDescription > 0) return byDescription
    return BID_STEP
  }

  function suggestBid(a: AuctionItem, multiplier = 1): number {
    const step = parseMinStep(a)
    const current = a.topBidder?.amount ?? a.bestBid ?? a.currentBid
    return current + step * multiplier
  }

  async function bid(a: AuctionItem) {
    const parsedBid = parseTomanInput(bids[a.id] ?? "")
    const step = parseMinStep(a)
    const minimum = suggestBid(a, 1)
    if (!isProUser) return toast.error("شرکت در مزایده فقط برای کاربران پرو فعال است")
    if (!parsedBid || !Number.isFinite(parsedBid) || parsedBid <= 0) return toast.error("مبلغ نامعتبر است")
    const raw = parsedBid
    if (raw < minimum) return toast.error(`حداقل پیشنهاد ${formatToman(minimum)} تومان است`)
    if (raw % step !== 0) return toast.error(`مبلغ باید مضرب ${formatToman(step)} تومان باشد`)

    setSubmittingId(a.id)
    try {
      await apiRequest(`/auctions/live/${a.id}/bid`, {
        method: "POST",
        body: JSON.stringify({ amount: raw }),
      })
      toast.success("پیشنهاد ثبت شد")
      setBids((prev) => ({ ...prev, [a.id]: "" }))
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت پیشنهاد ناموفق بود")
    } finally {
      setSubmittingId(null)
    }
  }

  const fuelLabel: Record<NonNullable<AuctionItem["vehicle"]>["fuelType"], string> = {
    gasoline: "بنزینی",
    hybrid: "هیبرید",
    electric: "برقی",
    diesel: "دیزلی",
  }

  return (
    <main className="min-h-screen pt-28 pb-16" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <section className="card glass p-8">
          <h1 className="text-4xl font-black mb-3">مزایده خودرو</h1>
          <p className="text-white/70 mb-2">حداقل افزایش هر مزایده براساس تنظیمات همان مزایده محاسبه می‌شود.</p>
          <p className="text-sm text-amber-300">
            دسترسی ثبت پیشنهاد: فقط کاربران پرو (VIP طلایی و بالاتر)
          </p>
        </section>

        {!isProUser ? (
          <section className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-4 text-amber-200">
            حساب شما پرو نیست؛ مشاهده مزایده آزاد است اما ثبت پیشنهاد نیاز به ارتقای VIP دارد.
          </section>
        ) : null}

        <section className="grid md:grid-cols-2 gap-5">
          {items.map((a) => {
            const step = parseMinStep(a)
            const minimum = suggestBid(a, 1)
            const isLoading = submittingId === a.id
            return (
              <article key={a.id} className="card glass overflow-hidden">
                <div className="relative h-56 bg-black/30">
                  {a.imageUrl ? (
                    <img
                      src={a.imageUrl}
                      alt={a.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-white/50 text-sm bg-black/40">
                      تصویر برای این مزایده ثبت نشده است
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 right-3 rounded-lg bg-black/65 px-3 py-1.5 text-xs border border-white/20">
                    وضعیت: {a.status}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <h3 className="text-2xl font-black">{a.title}</h3>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-white/10 bg-black/25 p-2.5 inline-flex items-center gap-2">
                      <Car size={14} />
                      <span>{a.vehicle?.model ?? "-"}</span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/25 p-2.5 inline-flex items-center gap-2">
                      <CalendarDays size={14} />
                      <span>{a.vehicle?.year?.toLocaleString("fa-IR") ?? "-"}</span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/25 p-2.5 inline-flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{a.vehicle?.city ?? "-"}</span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/25 p-2.5 inline-flex items-center gap-2">
                      <Gauge size={14} />
                      <span>{a.vehicle?.mileageKm !== undefined ? `${a.vehicle.mileageKm.toLocaleString("fa-IR")} کیلومتر` : "-"}</span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/25 p-2.5 inline-flex items-center gap-2">
                      <Settings2 size={14} />
                      <span>{a.vehicle?.transmission ? (a.vehicle.transmission === "manual" ? "دنده‌ای" : "اتوماتیک") : "-"}</span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/25 p-2.5 inline-flex items-center gap-2">
                      <Fuel size={14} />
                      <span>{a.vehicle ? fuelLabel[a.vehicle.fuelType] : "-"}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p>قیمت پایه: <b>{formatToman(a.startPrice)} تومان</b></p>
                    <p>بالاترین قیمت: <b>{formatToman(a.topBidder?.amount ?? a.bestBid ?? a.currentBid)} تومان</b></p>
                    <p>پله افزایش: <b>{formatToman(step)} تومان</b></p>
                    <p>تعداد پیشنهاد: <b>{(a.bidsCount ?? 0).toLocaleString("fa-IR")}</b></p>
                    <p>پایان: <b>{new Date(a.endAt).toLocaleString("fa-IR")}</b></p>
                  </div>

                  <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm">
                    <p className="inline-flex items-center gap-1 font-bold text-amber-300">
                      <Trophy size={14} />
                      بالاترین پیشنهاددهنده
                    </p>
                    <p className="mt-1">
                      {a.topBidder ? `${a.topBidder.displayName} - ${formatToman(a.topBidder.amount)} تومان` : "هنوز پیشنهادی ثبت نشده"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 5].map((m) => (
                        <button
                          key={m}
                          type="button"
                          className="rounded-lg border border-white/15 bg-white/5 py-2 text-xs hover:border-amber-400/60"
                          onClick={() => setBids((prev) => ({ ...prev, [a.id]: formatMoneyInput(String(suggestBid(a, m))) }))}
                        >
                          +{formatToman(step * m)}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={bids[a.id] ?? ""}
                        onChange={(e) => setBids((prev) => ({ ...prev, [a.id]: formatMoneyInput(e.target.value) }))}
                        className="flex-1 bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2"
                        placeholder={`حداقل ${formatToman(minimum)}`}
                      />
                      <button
                        disabled={a.status !== "open" || !isProUser || isLoading}
                        onClick={() => bid(a)}
                        className="btn-primary disabled:opacity-60"
                      >
                        {isLoading ? "..." : "ثبت پیشنهاد"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      </div>
    </main>
  )
}
