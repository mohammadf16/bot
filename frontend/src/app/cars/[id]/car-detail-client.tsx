"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest, randomIdempotencyKey } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { formatMoneyInput, formatToman, parseTomanInput } from "@/lib/money"
import { CalendarDays, CreditCard, Fuel, Gem, Banknote, GaugeCircle, MapPin, Minus, Plus, Settings2, Ticket, Users } from "lucide-react"

type Vehicle = {
  id: string
  sourceType: "lottery_winback" | "external_purchase"
  status: "available" | "reserved" | "sold" | "archived"
  vehicle: {
    title: string
    imageUrl: string
    description?: string
    model: string
    year: number
    city: string
    mileageKm: number
    isNew: boolean
    transmission: "automatic" | "manual"
    fuelType: "gasoline" | "hybrid" | "electric" | "diesel"
    participantsCount: number
    raffleParticipantsCount: number
    raffle: {
      cashbackPercent: number
      cashbackToGoldPercent: number
      tomanPerGoldSot: number
      goldSotBack: number
      mainPrizeTitle: string
      mainPrizeValueIrr: number
    }
  }
  listedPriceIrr?: number
  listedPriceGoldSot?: number
}

type BuyPayload = {
  paymentAsset: "IRR" | "GOLD_SOT" | "LOAN" | "CARD_TO_CARD"
  loanMonths?: number
  downPaymentIrr?: number
}

type LinkedRaffle = {
  id: string
  title: string
  status: string
  maxTickets: number
  ticketsSold: number
  dynamicPricing: { basePrice: number; minPrice: number; decayFactor: number }
  rewardConfig: { cashbackPercent: number; mainPrizeTitle: string; mainPrizeValueIrr: number }
  linkedVehicle?: { id: string }
}

export default function CarDetailClient({ id }: { id: string }) {
  const [car, setCar] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loanMonths, setLoanMonths] = useState(12)
  const [downPaymentIrr, setDownPaymentIrr] = useState(0)
  const [linkedRaffle, setLinkedRaffle] = useState<LinkedRaffle | null>(null)
  const [raffleCount, setRaffleCount] = useState(1)
  const [raffleIsBuying, setRaffleIsBuying] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  const isProUser = useMemo(() => Number(user?.vipLevelId ?? 1) >= 3, [user?.vipLevelId])

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [vehicle, raffles] = await Promise.all([
        apiRequest<{ item: Vehicle }>(`/showroom/vehicles/${id}`, { method: "GET" }, { auth: false }),
        apiRequest<{ items: LinkedRaffle[] }>("/raffles", { method: "GET" }, { auth: false }).catch(() => ({ items: [] as LinkedRaffle[] })),
      ])
      setCar(vehicle.item)
      if (vehicle.item.listedPriceIrr) setDownPaymentIrr(Math.round(vehicle.item.listedPriceIrr * 0.2))
      const linked = (raffles.items ?? []).find((r) => r.linkedVehicle?.id === id && r.status === "open")
      setLinkedRaffle(linked ?? null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خودرو پیدا نشد")
      setCar(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const loanPlan = useMemo(() => {
    const price = car?.listedPriceIrr ?? 0
    const principal = Math.max(0, price - downPaymentIrr)
    const monthlyRate = 0.015
    const total = Math.round(principal * (1 + monthlyRate * loanMonths))
    return {
      principal,
      total,
      monthlyInstallment: loanMonths > 0 ? Math.ceil(total / loanMonths) : 0,
      minDownPayment: Math.round(price * 0.2),
    }
  }, [car?.listedPriceIrr, downPaymentIrr, loanMonths])

async function buy(payload: BuyPayload) {
    if (!car) return
    if (payload.paymentAsset === "LOAN") {
      if (!isProUser) return toast.error("خرید وامی فقط برای کاربران پرو فعال است")
      if (downPaymentIrr < loanPlan.minDownPayment) {
        return toast.error(`حداقل پیش پرداخت ${formatToman(loanPlan.minDownPayment)} تومان است`)
      }
    }

    setSubmitting(true)
    try {
      const result = await apiRequest<{
        order?: { id: string; status: string; slideEntryNumbers?: number[] }
        slideDraw?: { drawId?: string; ticketNumbers?: number[] }
      }>(`/showroom/vehicles/${car.id}/orders`, {
        method: "POST",
        body: JSON.stringify(payload),
      })
      const ticketNumbers = result.slideDraw?.ticketNumbers ?? result.order?.slideEntryNumbers ?? []
      if (payload.paymentAsset === "LOAN") {
        toast.success(ticketNumbers.length ? `خرید اقساطی ثبت شد | شماره بلیط اسلاید: ${ticketNumbers.join(" , ")}` : "درخواست خرید اقساطی ثبت شد")
      } else {
        toast.success(ticketNumbers.length ? `سفارش ثبت شد | شماره بلیط اسلاید: ${ticketNumbers.join(" , ")}` : "سفارش با موفقیت ثبت شد")
      }
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت سفارش انجام نشد")
    } finally {
      setSubmitting(false)
    }
  }

  async function buyRaffleFromWallet() {
    if (!linkedRaffle) return
    if (!isAuthenticated) { toast.error("ابتدا وارد حساب شوید"); return }
    setRaffleIsBuying(true)
    try {
      const data = await apiRequest<{ ticketsBought?: number }>(`/raffles/${linkedRaffle.id}/buy`, {
        method: "POST",
        headers: { "Idempotency-Key": randomIdempotencyKey() },
        body: JSON.stringify({ count: raffleCount, paymentMethod: "WALLET" }),
      })
      toast.success(data.ticketsBought ? `${data.ticketsBought.toLocaleString("fa-IR")} بلیط با موفقیت خریداری شد` : "خرید انجام شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خرید ناموفق بود")
    } finally {
      setRaffleIsBuying(false)
    }
  }

  const fuelLabel = useMemo(() => {
    if (!car) return ""
    const map: Record<Vehicle["vehicle"]["fuelType"], string> = {
      gasoline: "بنزینی",
      hybrid: "هیبرید",
      electric: "برقی",
      diesel: "دیزلی",
    }
    return map[car.vehicle.fuelType]
  }, [car])

  if (loading) {
    return <main className="min-h-screen pt-28 px-4" dir="rtl"><p className="text-white/70">در حال دریافت اطلاعات خودرو...</p></main>
  }

  if (!car) {
    return (
      <main className="min-h-screen pt-28 px-4" dir="rtl">
        <p className="text-white/70 mb-4">خودروی موردنظر پیدا نشد.</p>
        <Link href="/cars" className="btn-primary">بازگشت به فروشگاه</Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-24 md:pt-28 pb-20 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">
        <section>
          <div className="rounded-[2rem] overflow-hidden border border-white/10 bg-black/35">
            <img src={car.vehicle.imageUrl} alt={car.vehicle.title} className="w-full h-[320px] md:h-[430px] object-cover" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-black/25 border border-white/10 p-3 inline-flex items-center gap-2"><Users size={14} /> {car.vehicle.participantsCount.toLocaleString("fa-IR")} شرکت کننده</div>
            <div className="rounded-xl bg-black/25 border border-white/10 p-3">{car.vehicle.raffleParticipantsCount.toLocaleString("fa-IR")} شرکت کننده قرعه</div>
          </div>
        </section>

        <section className="card glass p-5 md:p-8">
          <h1 className="text-2xl md:text-4xl font-black mb-2">{car.vehicle.title}</h1>
          <p className="text-accent-gold text-2xl font-black mb-1">{car.listedPriceIrr ? formatToman(car.listedPriceIrr) : "-"} تومان</p>
          <p className="text-sm text-white/60 mb-5">قیمت سوت: {car.listedPriceGoldSot?.toLocaleString("fa-IR") ?? "-"}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-sm">
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3 inline-flex items-center gap-2"><CalendarDays size={14} /> سال: {car.vehicle.year.toLocaleString("fa-IR")}</div>
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3">{car.vehicle.model}</div>
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3 inline-flex items-center gap-2"><MapPin size={14} /> شهر: {car.vehicle.city}</div>
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3 inline-flex items-center gap-2"><GaugeCircle size={14} /> {car.vehicle.isNew ? "نو (بدون کارکرد)" : `${car.vehicle.mileageKm.toLocaleString("fa-IR")} کیلومتر`}</div>
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3 inline-flex items-center gap-2"><Settings2 size={14} /> {car.vehicle.transmission === "automatic" ? "اتوماتیک" : "دنده ای"}</div>
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3 inline-flex items-center gap-2"><Fuel size={14} /> {fuelLabel}</div>
          </div>

          {car.listedPriceIrr ? (
            <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 mb-6 space-y-2 text-sm">
              <p className="font-black">خرید وامی (فقط کاربران پرو)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/70">تعداد اقساط</label>
                  <select
                    value={loanMonths}
                    onChange={(e) => setLoanMonths(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-2 py-2 text-xs"
                  >
                    {[6, 12, 18, 24, 36].map((m) => (
                      <option key={m} value={m}>{m.toLocaleString("fa-IR")} قسط</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/70">پیش پرداخت</label>
                  <input
                    value={downPaymentIrr ? formatMoneyInput(String(downPaymentIrr)) : ""}
                    onChange={(e) => setDownPaymentIrr(parseTomanInput(e.target.value) ?? 0)}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-2 py-2 text-xs"
                  />
                </div>
              </div>
              <p>مبلغ وام: <span className="text-accent-gold font-bold">{formatToman(loanPlan.principal)} تومان</span></p>
              <p>هر قسط: <span className="text-accent-gold font-bold">{formatToman(loanPlan.monthlyInstallment)} تومان</span></p>
              <p>جمع بازپرداخت: <span className="text-accent-gold font-bold">{formatToman(loanPlan.total)} تومان</span></p>
            </div>
          ) : null}

          {car.listedPriceIrr ? (
            <div className="border border-white/15 rounded-2xl p-4 mb-6 text-sm bg-black/20">
              <p className="font-black mb-3">پرداخت کارت به کارت</p>
              <p className="text-xs text-white/60 mb-3">مبلغ: <span className="text-accent-gold font-bold">{formatToman(car.listedPriceIrr)} تومان</span> — صفحه پرداخت کارت به کارت باز می‌شود</p>
              <button
                disabled={submitting}
                onClick={() => {
                  const params = new URLSearchParams({
                    type: "vehicle",
                    vehicleId: car.id,
                    amount: String(car.listedPriceIrr!),
                    title: encodeURIComponent(car.vehicle.title),
                    returnUrl: encodeURIComponent(`/cars/${car.id}`),
                  })
                  router.push(`/payment/card-to-card?${params.toString()}`)
                }}
                className="btn-secondary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CreditCard size={14} />
                پرداخت کارت به کارت
              </button>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3">
            <button disabled={submitting} onClick={() => void buy({ paymentAsset: "IRR" })} className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2">
              <Banknote size={14} />
              خرید نقدی
            </button>
            <button disabled={submitting} onClick={() => void buy({ paymentAsset: "GOLD_SOT" })} className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2">
              <Gem size={14} />
              خرید با سوت
            </button>
            <button
              disabled={submitting || !isProUser}
              onClick={() => void buy({ paymentAsset: "LOAN", loanMonths, downPaymentIrr })}
              className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CreditCard size={14} />
              خرید وامی
            </button>
            <Link href="/cars" className="btn-secondary w-full sm:w-auto text-center">بازگشت به فروشگاه</Link>
          </div>

          {/* ── Raffle Ticket Direct Purchase ── */}
          {linkedRaffle ? (
            <div className="mt-6 rounded-2xl border-2 border-accent-gold/40 bg-gradient-to-br from-amber-900/20 to-black/40 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Ticket size={18} className="text-accent-gold" />
                <h3 className="text-base font-black">خرید بلیط قرعه‌کشی</h3>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-white/60">
                {linkedRaffle.rewardConfig.cashbackPercent > 0 ? (
                  <span className="rounded-full bg-accent-gold/20 text-accent-gold px-3 py-1">{linkedRaffle.rewardConfig.cashbackPercent}٪ کش‌بک</span>
                ) : null}
                <span className="rounded-full bg-white/10 px-3 py-1">جایزه: {linkedRaffle.rewardConfig.mainPrizeTitle}</span>
                <span className="rounded-full bg-white/10 px-3 py-1">{linkedRaffle.ticketsSold.toLocaleString("fa-IR")} / {linkedRaffle.maxTickets.toLocaleString("fa-IR")} بلیط فروخته شده</span>
              </div>

              <div>
                <p className="text-xs text-white/50 mb-2">تعداد بلیط</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setRaffleCount((c) => Math.max(1, c - 1))} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-black text-lg">{raffleCount.toLocaleString("fa-IR")}</span>
                  <button onClick={() => setRaffleCount((c) => Math.min(20, c + 1))} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                    <Plus size={14} />
                  </button>
                  <span className="text-xs text-white/50">
                    تقریباً {formatToman(linkedRaffle.dynamicPricing.basePrice * raffleCount)} تومان
                  </span>
                </div>
              </div>

              <div className="text-xs text-white/60 rounded-xl bg-black/30 p-3">
                موجودی کیف پول: <span className={Number(user?.walletBalance ?? 0) >= linkedRaffle.dynamicPricing.basePrice * raffleCount ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{formatToman(user?.walletBalance ?? 0)} تومان</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {Number(user?.walletBalance ?? 0) >= linkedRaffle.dynamicPricing.basePrice * raffleCount ? (
                  <button
                    disabled={raffleIsBuying}
                    onClick={() => void buyRaffleFromWallet()}
                    className="flex-1 py-3 rounded-xl bg-accent-gold text-black font-black text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors disabled:opacity-60"
                  >
                    <Ticket size={16} />
                    {raffleIsBuying ? "در حال خرید..." : "خرید از کیف پول"}
                  </button>
                ) : (
                  <Link
                    href="/wallet"
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    شارژ کیف پول
                  </Link>
                )}
                <button
                  onClick={() => {
                    const params = new URLSearchParams({
                      type: "raffle",
                      raffleId: linkedRaffle.id,
                      count: String(raffleCount),
                      amount: String(linkedRaffle.dynamicPricing.basePrice * raffleCount),
                      title: encodeURIComponent(linkedRaffle.title),
                      returnUrl: encodeURIComponent(`/cars/${car.id}`),
                    })
                    router.push(`/payment/card-to-card?${params.toString()}`)
                  }}
                  className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <CreditCard size={14} />
                  کارت به کارت
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
              <Ticket size={20} className="text-white/30 mx-auto mb-2" />
              <p className="text-sm text-white/50">در حال حاضر قرعه‌کشی فعالی برای این خودرو وجود ندارد.</p>
              <Link href="/raffles" className="text-xs text-accent-gold hover:underline mt-1 inline-block">مشاهده همه قرعه‌کشی‌ها</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
