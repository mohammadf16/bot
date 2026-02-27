"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest, randomIdempotencyKey } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { uploadUserImage } from "@/lib/image-upload"
import { formatToman } from "@/lib/money"

type ComboPackage = {
  code: "silver" | "gold"
  title: string
  paidTickets: number
  bonusTickets: number
  bonusChances: number
  vipDays: number
}

type LinkedVehicle = {
  id: string
  title: string
  imageUrl?: string
  model?: string
  year?: number
  city?: string
  status: string
  listedPriceIrr?: number
}

type RaffleItem = {
  id: string
  title: string
  status: "draft" | "open" | "closed" | "drawn"
  maxTickets: number
  ticketsSold: number
  participantsCount: number
  dynamicPricing: { basePrice: number; minPrice: number; decayFactor: number }
  rewardConfig: {
    cashbackPercent: number
    cashbackToGoldPercent: number
    tomanPerGoldSot: number
    mainPrizeTitle: string
    mainPrizeValueIrr: number
  }
  comboPackages: ComboPackage[]
  linkedVehicle?: LinkedVehicle
}

type BuyResponse = {
  totalPaid?: number
  cashback?: number
  ticketsBought?: number
  status?: "pending"
  paymentId?: string
}

export default function RafflesPage() {
  const { isAuthenticated, refreshMe, user } = useAuth()
  const [raffles, setRaffles] = useState<RaffleItem[]>([])
  const [selectedRaffleId, setSelectedRaffleId] = useState<string>("")
  const [count, setCount] = useState(1)
  const [isBuying, setIsBuying] = useState(false)
  const [lastBuy, setLastBuy] = useState<BuyResponse | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "CARD_TO_CARD">("WALLET")
  const [fromCardLast4, setFromCardLast4] = useState("")
  const [trackingCode, setTrackingCode] = useState("")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [destinationCard, setDestinationCard] = useState("")

  const current = useMemo(
    () => raffles.find((item) => item.id === selectedRaffleId) ?? null,
    [raffles, selectedRaffleId],
  )

  const estimatedUnitPrice = useMemo(() => {
    if (!current) return 0
    const { basePrice, decayFactor, minPrice } = current.dynamicPricing
    const dynamic = basePrice * decayFactor ** Math.max(0, current.ticketsSold)
    return Math.max(minPrice, Math.floor(dynamic))
  }, [current])

  const soldPercent = useMemo(() => {
    if (!current || current.maxTickets <= 0) return 0
    return Math.min(100, Math.round((current.ticketsSold / current.maxTickets) * 100))
  }, [current])

  async function loadRaffles() {
    try {
      const data = await apiRequest<{ items: RaffleItem[] }>("/raffles", { method: "GET" }, { auth: false })
      setRaffles(data.items ?? [])
      const openRaffle = (data.items ?? []).find((item) => item.status === "open")
      setSelectedRaffleId((prev) => prev || openRaffle?.id || data.items?.[0]?.id || "")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در دریافت قرعه کشی ها")
    }
  }

  useEffect(() => {
    void loadRaffles()
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    void apiRequest<{ destinationCard: string }>("/payments/card-to-card/config", { method: "GET" })
      .then((data) => setDestinationCard(data.destinationCard || ""))
      .catch(() => {})
  }, [isAuthenticated])

  async function buildCardToCardPayload() {
    if (paymentMethod !== "CARD_TO_CARD") return {}
    if (!/^\d{4}$/.test(fromCardLast4)) throw new Error("۴ رقم آخر کارت نامعتبر است")
    if (trackingCode.trim().length < 4) throw new Error("کد پیگیری نامعتبر است")
    if (!receiptFile) throw new Error("تصویر رسید را انتخاب کنید")
    const receiptImageUrl = await uploadUserImage(receiptFile)
    return {
      paymentMethod,
      fromCardLast4,
      trackingCode: trackingCode.trim(),
      receiptImageUrl,
    }
  }

  async function buyTickets() {
    if (!current) return
    if (!isAuthenticated) {
      toast.error("ابتدا وارد حساب شوید")
      return
    }
    if (current.status !== "open") {
      toast.error("این قرعه کشی باز نیست")
      return
    }

    setIsBuying(true)
    try {
      const cardPayload = await buildCardToCardPayload()
      const data = await apiRequest<BuyResponse>(`/raffles/${current.id}/buy`, {
        method: "POST",
        headers: { "Idempotency-Key": randomIdempotencyKey() },
        body: JSON.stringify({ count, paymentMethod, ...cardPayload }),
      })
      setLastBuy(data)
      if (data.status === "pending") {
        toast.success("رسید شما ثبت شد و پس از تایید ادمین خرید انجام می‌شود")
      } else {
        toast.success("خرید بلیط با موفقیت انجام شد")
      }
      await Promise.all([loadRaffles(), refreshMe()])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خرید بلیط ناموفق بود")
    } finally {
      setIsBuying(false)
    }
  }

  async function buyCombo(code: "silver" | "gold") {
    if (!current) return
    if (!isAuthenticated) {
      toast.error("ابتدا وارد حساب شوید")
      return
    }
    if (current.status !== "open") {
      toast.error("این قرعه کشی باز نیست")
      return
    }
    setIsBuying(true)
    try {
      const cardPayload = await buildCardToCardPayload()
      const data = await apiRequest<BuyResponse>(`/raffles/${current.id}/buy-combo`, {
        method: "POST",
        body: JSON.stringify({ code, paymentMethod, ...cardPayload }),
      })
      if (data.status === "pending") {
        toast.success("رسید پکیج ثبت شد و در انتظار تایید ادمین است")
      } else {
        toast.success("پکیج با موفقیت خریداری شد")
      }
      await Promise.all([loadRaffles(), refreshMe()])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خرید پکیج ناموفق بود")
    } finally {
      setIsBuying(false)
    }
  }

  return (
    <main className="min-h-screen pt-28 pb-16" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <section className="card glass p-6">
          <h1 className="text-3xl font-black mb-2">قرعه کشی های فعال</h1>
          <p className="text-white/60 text-sm">
            موجودی کیف پول شما: {formatToman(user?.walletBalance ?? 0)} تومان | شانس ها: {(user?.chances ?? 0).toLocaleString("fa-IR")}
          </p>
        </section>

        <section className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3">
            {raffles.map((item) => {
              const pct = item.maxTickets > 0 ? Math.min(100, Math.round((item.ticketsSold / item.maxTickets) * 100)) : 0
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedRaffleId(item.id)}
                  className={`w-full text-right rounded-2xl border p-4 transition ${
                    selectedRaffleId === item.id ? "border-accent-gold bg-accent-gold/10" : "border-white/15 bg-black/20"
                  }`}
                >
                  {item.linkedVehicle?.imageUrl && (
                    <img
                      src={item.linkedVehicle.imageUrl}
                      alt={item.linkedVehicle.title}
                      className="w-full h-28 object-cover rounded-xl mb-3"
                    />
                  )}
                  <p className="font-black text-lg">{item.title}</p>
                  {item.linkedVehicle && (
                    <p className="text-xs text-accent-gold/80 mt-0.5">
                      {item.linkedVehicle.model ?? item.linkedVehicle.title}{item.linkedVehicle.year ? ` · ${item.linkedVehicle.year}` : ""}{item.linkedVehicle.city ? ` · ${item.linkedVehicle.city}` : ""}
                    </p>
                  )}
                  <p className="text-xs text-white/60 mt-1">شرکت کننده: {item.participantsCount.toLocaleString("fa-IR")}</p>
                  <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-accent-gold" style={{ width: `${pct}%` }} />
                  </div>
                </button>
              )
            })}
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-white/15 bg-black/25 p-5 md:p-6 space-y-5">
            {!current ? (
              <p className="text-white/70">قرعه کشی برای نمایش انتخاب نشده است.</p>
            ) : (
              <>
                {current.linkedVehicle?.imageUrl && (
                  <div className="rounded-xl overflow-hidden">
                    <img
                      src={current.linkedVehicle.imageUrl}
                      alt={current.linkedVehicle.title}
                      className="w-full h-40 object-cover"
                    />
                  </div>
                )}

                <div>
                  <p className="text-white/55 text-sm mb-1">قرعه کشی انتخاب شده</p>
                  <h2 className="text-2xl font-black">{current.title}</h2>
                  {current.linkedVehicle && (
                    <p className="text-xs text-white/60 mt-0.5">
                      {current.linkedVehicle.model ?? current.linkedVehicle.title}{current.linkedVehicle.year ? ` · ${current.linkedVehicle.year}` : ""}{current.linkedVehicle.city ? ` · ${current.linkedVehicle.city}` : ""}
                      {current.linkedVehicle.listedPriceIrr ? ` | ارزش: ${formatToman(current.linkedVehicle.listedPriceIrr)} تومان` : ""}
                    </p>
                  )}
                  <p className="text-sm text-accent-gold mt-1">جایزه اصلی: {current.rewardConfig.mainPrizeTitle}</p>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                    قیمت لحظه ای: <b>{formatToman(estimatedUnitPrice)} تومان</b>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                    فروش: <b>{current.ticketsSold.toLocaleString("fa-IR")} / {current.maxTickets.toLocaleString("fa-IR")}</b>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                    تکمیل ظرفیت: <b>{soldPercent}%</b>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3">
                  <label className="text-sm text-white/60 block">تعداد بلیط</label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <select
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="bg-black/50 border border-white/15 rounded-xl px-3 py-2"
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n.toLocaleString("fa-IR")} عدد</option>
                      ))}
                    </select>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as "WALLET" | "CARD_TO_CARD")}
                      className="bg-black/50 border border-white/15 rounded-xl px-3 py-2"
                    >
                      <option value="WALLET">پرداخت از کیف پول</option>
                      <option value="CARD_TO_CARD">پرداخت کارت به کارت</option>
                    </select>
                  </div>

                  {paymentMethod === "CARD_TO_CARD" ? (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-3">
                      <p className="text-xs text-white/70">کارت مقصد: <b>{destinationCard || "در حال دریافت از سرور..."}</b></p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input
                          value={fromCardLast4}
                          onChange={(e) => setFromCardLast4(e.target.value)}
                          placeholder="۴ رقم آخر کارت"
                          className="bg-black/40 border border-white/15 rounded-xl px-3 py-2"
                        />
                        <input
                          value={trackingCode}
                          onChange={(e) => setTrackingCode(e.target.value)}
                          placeholder="کد پیگیری"
                          className="bg-black/40 border border-white/15 rounded-xl px-3 py-2"
                        />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                        className="w-full text-xs text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80"
                      />
                    </div>
                  ) : null}

                  <button disabled={isBuying} onClick={() => void buyTickets()} className="btn-primary disabled:opacity-60">
                    {isBuying ? "در حال ثبت..." : "خرید بلیط"}
                  </button>
                </div>

                {current.comboPackages?.length ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {current.comboPackages.map((pkg) => (
                      <div key={pkg.code} className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <p className="font-bold mb-2">{pkg.title}</p>
                        <p className="text-xs text-white/60 mb-3">
                          {pkg.paidTickets.toLocaleString("fa-IR")} بلیط + {pkg.bonusTickets.toLocaleString("fa-IR")} هدیه
                        </p>
                        <button
                          disabled={isBuying}
                          onClick={() => void buyCombo(pkg.code)}
                          className="btn-secondary w-full disabled:opacity-60"
                        >
                          خرید پکیج
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {lastBuy ? (
                  <div className="rounded-xl border border-accent-gold/30 bg-accent-gold/10 p-4 text-sm">
                    {lastBuy.status === "pending" ? (
                      <p>رسید شما ثبت شد و خرید پس از تایید ادمین انجام می‌شود.</p>
                    ) : (
                      <>
                        <p>خرید اخیر شما: {(lastBuy.ticketsBought ?? 0).toLocaleString("fa-IR")} بلیط</p>
                        <p>جمع پرداخت: {formatToman(lastBuy.totalPaid ?? 0)} تومان</p>
                        <p>کش بک: {formatToman(lastBuy.cashback ?? 0)} تومان</p>
                      </>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
