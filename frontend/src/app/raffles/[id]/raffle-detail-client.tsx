"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Minus, Plus, Ticket, Wallet, CreditCard, AlertCircle } from "lucide-react"
import { apiRequest, randomIdempotencyKey } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { formatToman } from "@/lib/money"

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

type RaffleDetail = {
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
  linkedVehicle?: LinkedVehicle
}

type BuyResponse = {
  totalPaid?: number
  cashback?: number
  ticketsBought?: number
  slideNumbers?: number[]
  status?: "pending"
  paymentId?: string
}

type ProofResponse = {
  proof: {
    revealedServerSeed: string
    externalEntropy: string
    winnerTicketIndexes: number[]
  }
  verification: { valid: boolean }
  winners: Array<{ ticketId?: string; ticketIndex?: number; userId?: string }>
}

export default function RaffleDetailClient({ id }: { id: string }) {
  const { isAuthenticated, user, refreshMe } = useAuth()
  const router = useRouter()
  const [raffle, setRaffle] = useState<RaffleDetail | null>(null)
  const [proof, setProof] = useState<ProofResponse | null>(null)
  const [count, setCount] = useState(1)
  const [isBuying, setIsBuying] = useState(false)
  const router = useRouter()

  const walletBalance = user?.walletBalance ?? 0

  const soldPercent = useMemo(() => {
    if (!raffle || raffle.maxTickets <= 0) return 0
    return Math.min(100, Math.round((raffle.ticketsSold / raffle.maxTickets) * 100))
  }, [raffle])

  // Estimated total based on basePrice (actual may vary with dynamic pricing)
  const estimatedTotal = useMemo(() => {
    if (!raffle) return 0
    return raffle.dynamicPricing.basePrice * count
  }, [raffle, count])

  const hasEnoughBalance = walletBalance >= estimatedTotal

  const load = useCallback(async () => {
    try {
      const data = await apiRequest<RaffleDetail>(`/raffles/${id}`, { method: "GET" }, { auth: false })
      setRaffle(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در دریافت جزئیات قرعه کشی")
    }
  }, [id])

  const loadProof = useCallback(async () => {
    try {
      const data = await apiRequest<ProofResponse>(`/raffles/${id}/proof`, { method: "GET" }, { auth: false })
      setProof(data)
    } catch {
      setProof(null)
    }
  }, [id])

  useEffect(() => {
    void load()
    void loadProof()
  }, [load, loadProof])

  function adjustCount(delta: number) {
    setCount((prev) => Math.max(1, prev + delta))
  }

  function handleCountInput(val: string) {
    const n = parseInt(val.replace(/[^0-9]/g, ""), 10)
    if (!isNaN(n) && n >= 1) setCount(n)
    else if (val === "") setCount(1)
  }

  async function buyFromWallet() {
    if (!raffle) return
    if (!isAuthenticated) {
      toast.error("ابتدا وارد حساب شوید")
      return
    }
    if (raffle.status !== "open") {
      toast.error("این قرعه کشی باز نیست")
      return
    }

    setIsBuying(true)
    try {
      const data = await apiRequest<BuyResponse>(`/raffles/${raffle.id}/buy`, {
        method: "POST",
        headers: { "Idempotency-Key": randomIdempotencyKey() },
        body: JSON.stringify({ count, paymentMethod: "WALLET" }),
      })
      const nums = data.slideNumbers?.map((n) => n.toLocaleString("fa-IR")).join("، ")
      toast.success(
        data.ticketsBought
          ? `${data.ticketsBought.toLocaleString("fa-IR")} بلیط خریداری شد${nums ? ` — شناسه‌های بلیط: ${nums}` : ""}`
          : "خرید بلیط با موفقیت انجام شد",
        { duration: 8000 }
      )
      await Promise.all([load(), refreshMe()])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خرید ناموفق بود")
    } finally {
      setIsBuying(false)
    }
  }

  async function buyCardToCard() {
    if (!raffle) return
    if (!isAuthenticated) {
      toast.error("ابتدا وارد حساب شوید")
      return
    }
    if (raffle.status !== "open") {
      toast.error("این قرعه کشی باز نیست")
      return
    }
    if (!/^\d{4}$/.test(fromCardLast4)) {
      toast.error("۴ رقم آخر کارت نامعتبر است")
      return
    }
    if (trackingCode.trim().length < 4) {
      toast.error("کد پیگیری نامعتبر است")
      return
    }
    if (!receiptFile) {
      toast.error("تصویر رسید را انتخاب کنید")
      return
    }

    setIsBuying(true)
    try {
      const receiptImageUrl = await uploadUserImage(receiptFile)
      await apiRequest<BuyResponse>(`/raffles/${raffle.id}/buy`, {
        method: "POST",
        headers: { "Idempotency-Key": randomIdempotencyKey() },
        body: JSON.stringify({
          count,
          paymentMethod: "CARD_TO_CARD",
          fromCardLast4,
          trackingCode: trackingCode.trim(),
          receiptImageUrl,
        }),
      })
      toast.success("رسید شما ثبت شد و پس از تایید ادمین، بلیط صادر می‌شود")
      setReceiptFile(null)
      setFromCardLast4("")
      setTrackingCode("")
      await Promise.all([load(), refreshMe()])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ارسال رسید ناموفق بود")
    } finally {
      setIsBuying(false)
    }
  }

  if (!raffle) {
    return (
      <main className="min-h-screen pt-32 px-4" dir="rtl">
        <p className="text-white/70">در حال دریافت اطلاعات...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-28 pb-16" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 space-y-6">

        {/* Vehicle Info */}
        {raffle.linkedVehicle && (
          <section className="card glass overflow-hidden p-0">
            {raffle.linkedVehicle.imageUrl && (
              <img
                src={raffle.linkedVehicle.imageUrl}
                alt={raffle.linkedVehicle.title}
                className="w-full h-56 object-cover"
              />
            )}
            <div className="p-5">
              <p className="text-xs text-white/50 mb-1">خودروی جایزه</p>
              <h2 className="text-xl font-black">{raffle.linkedVehicle.title}</h2>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-white/70">
                {raffle.linkedVehicle.model && <span className="rounded-full bg-white/10 px-3 py-1">{raffle.linkedVehicle.model}</span>}
                {raffle.linkedVehicle.year && <span className="rounded-full bg-white/10 px-3 py-1">{raffle.linkedVehicle.year}</span>}
                {raffle.linkedVehicle.city && <span className="rounded-full bg-white/10 px-3 py-1">{raffle.linkedVehicle.city}</span>}
                {raffle.linkedVehicle.listedPriceIrr && (
                  <span className="rounded-full bg-accent-gold/20 text-accent-gold px-3 py-1">
                    ارزش: {formatToman(raffle.linkedVehicle.listedPriceIrr)} تومان
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Raffle Info */}
        <section className="card glass p-6">
          <h1 className="text-3xl font-black mb-2">{raffle.title}</h1>
          <p className="text-sm text-accent-gold mb-1">جایزه اصلی: {raffle.rewardConfig.mainPrizeTitle}</p>
          <p className="text-xs text-white/50 mb-3">
            قیمت هر بلیط از <span className="text-white/80 font-bold">{formatToman(raffle.dynamicPricing.minPrice)}</span> تا <span className="text-white/80 font-bold">{formatToman(raffle.dynamicPricing.basePrice)}</span> تومان
          </p>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-accent-gold transition-all" style={{ width: `${soldPercent}%` }} />
          </div>
          <p className="text-xs text-white/60 mt-2">
            {raffle.ticketsSold.toLocaleString("fa-IR")} / {raffle.maxTickets.toLocaleString("fa-IR")} بلیط فروخته شده
          </p>
        </section>

        {/* ── Direct Purchase Block ── */}
        <section className="rounded-2xl border-2 border-accent-gold/40 bg-gradient-to-br from-amber-900/20 to-black/40 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Ticket size={20} className="text-accent-gold" />
            <h2 className="text-xl font-black">خرید مستقیم بلیط</h2>
          </div>

          {/* Quantity picker */}
          <div>
            <p className="text-xs text-white/60 mb-2">تعداد بلیط</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjustCount(-1)}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                min={1}
                value={count}
                onChange={(e) => handleCountInput(e.target.value)}
                className="w-24 text-center text-2xl font-black bg-black/40 border border-white/20 rounded-xl py-2 focus:outline-none focus:border-accent-gold"
              />
              <button
                onClick={() => adjustCount(1)}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Plus size={16} />
              </button>
              <span className="text-white/60 text-sm">عدد بلیط</span>
            </div>
          </div>

          {/* Price summary */}
          <div className="rounded-xl bg-black/30 border border-white/10 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">تعداد بلیط</span>
              <span className="font-bold">{count.toLocaleString("fa-IR")} عدد</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">قیمت تقریبی هر بلیط</span>
              <span className="font-bold">{formatToman(raffle.dynamicPricing.basePrice)} تومان</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between">
              <span className="text-white/60">جمع تقریبی</span>
              <span className="text-accent-gold font-black text-base">{formatToman(estimatedTotal)} تومان</span>
            </div>
            {isAuthenticated ? (
              <div className="flex justify-between items-center pt-1">
                <span className="text-white/60 flex items-center gap-1"><Wallet size={12} /> موجودی کیف پول</span>
                <span className={`font-bold ${hasEnoughBalance ? "text-green-400" : "text-red-400"}`}>
                  {formatToman(walletBalance)} تومان
                </span>
              </div>
            ) : null}
          </div>

          {/* Buy from wallet */}
          {raffle.status === "open" ? (
            isAuthenticated ? (
              hasEnoughBalance ? (
                <button
                  onClick={() => void buyFromWallet()}
                  disabled={isBuying}
                  className="w-full py-4 rounded-2xl bg-accent-gold text-black font-black text-lg flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors disabled:opacity-60"
                >
                  <Wallet size={20} />
                  {isBuying ? "در حال خرید..." : `خرید ${count.toLocaleString("fa-IR")} بلیط از کیف پول`}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm">
                    <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-red-300">موجودی ناکافی</p>
                      <p className="text-white/60 text-xs mt-0.5">
                        برای خرید {count.toLocaleString("fa-IR")} بلیط به{" "}
                        <span className="text-white font-bold">{formatToman(estimatedTotal - walletBalance)}</span> تومان بیشتر نیاز دارید.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/wallet?charge=${estimatedTotal - walletBalance}`)}
                    className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Wallet size={20} />
                    شارژ کیف پول و خرید بلیط
                  </button>
                  <p className="text-xs text-center text-white/40">پس از شارژ موجودی، به این صفحه برگردید</p>
                </div>
              )
            ) : (
              <Link
                href="/login"
                className="w-full py-4 rounded-2xl bg-accent-gold text-black font-black text-lg flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors"
              >
                ورود به حساب برای خرید بلیط
              </Link>
            )
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-white/60">
              <AlertCircle size={16} />
              این قرعه کشی در حال حاضر باز نیست
            </div>
          )}

          {/* Card-to-card navigation */}
          {raffle.status === "open" && isAuthenticated ? (
            <div className="border-t border-white/10 pt-4">
              <button
                onClick={() => {
                  const params = new URLSearchParams({
                    type: "raffle",
                    raffleId: raffle.id,
                    count: String(count),
                    amount: String(estimatedTotal),
                    title: encodeURIComponent(raffle.title),
                    returnUrl: encodeURIComponent(`/raffles/${raffle.id}`),
                  })
                  router.push(`/payment/card-to-card?${params.toString()}`)
                }}
                className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                <CreditCard size={14} />
                پرداخت با کارت به کارت ({count.toLocaleString("fa-IR")} بلیط — {formatToman(estimatedTotal)} تومان)
              </button>
            </div>
          ) : null}
        </section>

        {/* Back link */}
        <div>
          <Link href="/raffles" className="btn-secondary">← بازگشت به لیست قرعه‌کشی‌ها</Link>
        </div>

        {/* Proof section */}
        {proof ? (
          <section className="card glass p-6 space-y-3">
            <h2 className="text-xl font-black">اثبات قرعه کشی</h2>
            <p className="text-sm">اعتبارسنجی: {proof.verification.valid ? "معتبر ✓" : "نامعتبر ✗"}</p>
            <p className="text-xs text-white/60 break-all">Server Seed: {proof.proof.revealedServerSeed}</p>
            <p className="text-xs text-white/60 break-all">External Entropy: {proof.proof.externalEntropy}</p>
            <div className="space-y-2">
              {proof.winners.map((winner, index) => (
                <div key={`${winner.ticketId ?? index}`} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
                  برنده {index + 1}: تیکت {winner.ticketIndex?.toLocaleString("fa-IR") ?? "-"} - کاربر {winner.userId ?? "-"}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
