"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { CalendarDays, Fuel, GaugeCircle, MapPin, Settings2, Users, CreditCard, Gem, Banknote } from "lucide-react"

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

export default function CarDetailClient({ id }: { id: string }) {
  const [car, setCar] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loanMonths, setLoanMonths] = useState(12)
  const [downPaymentIrr, setDownPaymentIrr] = useState(0)
  const { user } = useAuth()

  const isProUser = useMemo(() => Number(user?.vipLevelId ?? 1) >= 3, [user?.vipLevelId])

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await apiRequest<{ item: Vehicle }>(`/showroom/vehicles/${id}`, { method: "GET" }, { auth: false })
      setCar(data.item)
      if (data.item.listedPriceIrr) setDownPaymentIrr(Math.round(data.item.listedPriceIrr * 0.2))
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

  async function buy(paymentAsset: "IRR" | "GOLD_SOT" | "LOAN") {
    if (!car) return
    if (paymentAsset === "LOAN") {
      if (!isProUser) return toast.error("خرید وامی فقط برای کاربران پرو فعال است")
      if (downPaymentIrr < loanPlan.minDownPayment) {
        return toast.error(`حداقل پیش پرداخت ${loanPlan.minDownPayment.toLocaleString("fa-IR")} تومان است`)
      }
    }
    setSubmitting(true)
    try {
      await apiRequest(`/showroom/vehicles/${car.id}/orders`, {
        method: "POST",
        body: JSON.stringify({
          paymentAsset,
          loanMonths: paymentAsset === "LOAN" ? loanMonths : undefined,
          downPaymentIrr: paymentAsset === "LOAN" ? downPaymentIrr : undefined,
        }),
      })
      toast.success("سفارش با موفقیت ثبت شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت سفارش انجام نشد")
    } finally {
      setSubmitting(false)
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
            <div className="rounded-xl bg-black/25 border border-white/10 p-3 inline-flex items-center gap-2"><Users size={14} /> {car.vehicle.participantsCount.toLocaleString("fa-IR")} شرکت‌کننده</div>
            <div className="rounded-xl bg-black/25 border border-white/10 p-3">{car.vehicle.raffleParticipantsCount.toLocaleString("fa-IR")} شرکت‌کننده قرعه</div>
          </div>
        </section>

        <section className="card glass p-5 md:p-8">
          <h1 className="text-2xl md:text-4xl font-black mb-2">{car.vehicle.title}</h1>
          <p className="text-accent-gold text-2xl font-black mb-1">{car.listedPriceIrr?.toLocaleString("fa-IR") ?? "-"} تومان</p>
          <p className="text-sm text-white/60 mb-5">قیمت سوت: {car.listedPriceGoldSot?.toLocaleString("fa-IR") ?? "-"}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-sm">
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3 inline-flex items-center gap-2"><CalendarDays size={14} /> سال: {car.vehicle.year.toLocaleString("fa-IR")}</div>
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3">{car.vehicle.model}</div>
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3 inline-flex items-center gap-2"><MapPin size={14} /> شهر: {car.vehicle.city}</div>
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3 inline-flex items-center gap-2"><GaugeCircle size={14} /> {car.vehicle.isNew ? "نو (بدون کارکرد)" : `${car.vehicle.mileageKm.toLocaleString("fa-IR")} کیلومتر`}</div>
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3 inline-flex items-center gap-2"><Settings2 size={14} /> {car.vehicle.transmission === "automatic" ? "اتوماتیک" : "دنده‌ای"}</div>
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
                  <label className="text-xs text-white/70">پیش‌پرداخت</label>
                  <input
                    value={downPaymentIrr}
                    onChange={(e) => setDownPaymentIrr(Number(e.target.value.replace(/[^\d]/g, "")))}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-2 py-2 text-xs"
                  />
                </div>
              </div>
              <p>مبلغ وام: <span className="text-accent-gold font-bold">{loanPlan.principal.toLocaleString("fa-IR")} تومان</span></p>
              <p>هر قسط: <span className="text-accent-gold font-bold">{loanPlan.monthlyInstallment.toLocaleString("fa-IR")} تومان</span></p>
              <p>جمع بازپرداخت: <span className="text-accent-gold font-bold">{loanPlan.total.toLocaleString("fa-IR")} تومان</span></p>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3">
            <button disabled={submitting} onClick={() => buy("IRR")} className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2">
              <Banknote size={14} />
              خرید نقدی
            </button>
            <button disabled={submitting} onClick={() => buy("GOLD_SOT")} className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2">
              <Gem size={14} />
              خرید با سوت
            </button>
            <button
              disabled={submitting || !isProUser}
              onClick={() => buy("LOAN")}
              className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CreditCard size={14} />
              خرید وامی
            </button>
            <Link href="/cars" className="btn-secondary w-full sm:w-auto text-center">بازگشت به فروشگاه</Link>
          </div>
        </section>
      </div>
    </main>
  )
}

