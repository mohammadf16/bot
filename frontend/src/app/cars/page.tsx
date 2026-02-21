"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { CalendarDays, Fuel, Gauge, MapPin, Settings2, Users, CreditCard, Gem, Banknote } from "lucide-react"
import { motion } from "framer-motion"

type Vehicle = {
  id: string
  sourceType: "lottery_winback" | "external_purchase"
  status: "available" | "reserved" | "sold" | "archived"
  vehicle: {
    title: string
    imageUrl: string
    model: string
    year: number
    city: string
    mileageKm: number
    isNew: boolean
    transmission: "automatic" | "manual"
    fuelType: "gasoline" | "hybrid" | "electric" | "diesel"
    participantsCount: number
    raffleParticipantsCount: number
  }
  listedPriceIrr?: number
  listedPriceGoldSot?: number
}

type BuyPayload = {
  paymentAsset: "IRR" | "GOLD_SOT" | "LOAN"
  loanMonths?: number
  downPaymentIrr?: number
}

export default function CarsPage() {
  const [items, setItems] = useState<Vehicle[]>([])
  const { user } = useAuth()
  const isProUser = useMemo(() => Number(user?.vipLevelId ?? 1) >= 3, [user?.vipLevelId])

  async function load() {
    try {
      const data = await apiRequest<{ items: Vehicle[] }>("/showroom/vehicles", { method: "GET" }, { auth: false })
      setItems(data.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت خودروها")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function buy(vehicleId: string, payload: BuyPayload) {
    try {
      await apiRequest(`/showroom/vehicles/${vehicleId}/orders`, {
        method: "POST",
        body: JSON.stringify(payload),
      })
      toast.success("سفارش خودرو ثبت شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت سفارش ناموفق بود")
    }
  }

  return (
    <main className="min-h-screen pt-24 md:pt-28 pb-16 bg-gradient-to-br from-[#050505] via-[#0A0A0A] to-black" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <section className="rounded-3xl border border-[#D4AF37]/20 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300">
            فروشگاه خودرو
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#F7D778] via-[#D4AF37] to-[#B8941F]">
            خرید نقدی یا وامی خودرو
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/75 max-w-3xl leading-7">
            امکان خرید با تومان، سوت، یا وام (فقط کاربران پرو). در خرید وامی می‌توانید تعداد اقساط و پیش‌پرداخت را انتخاب کنید.
          </p>
        </section>

        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-white">خودروهای موجود</h2>
          <span className="text-sm text-white/60">{items.length} خودرو</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((car, idx) => (
            <CarCard key={car.id} car={car} onBuy={buy} index={idx} isProUser={isProUser} />
          ))}
        </div>
      </div>
    </main>
  )
}

function CarCard({
  car,
  onBuy,
  index,
  isProUser,
}: {
  car: Vehicle
  onBuy: (vehicleId: string, payload: BuyPayload) => Promise<void>
  index: number
  isProUser: boolean
}) {
  const [buyState, setBuyState] = useState<"idle" | "loading">("idle")
  const [loanMonths, setLoanMonths] = useState(12)
  const defaultDownPayment = Math.round((car.listedPriceIrr ?? 0) * 0.2)
  const [downPayment, setDownPayment] = useState(defaultDownPayment)

  const fuelLabel: Record<Vehicle["vehicle"]["fuelType"], string> = {
    gasoline: "بنزینی",
    hybrid: "هیبرید",
    electric: "برقی",
    diesel: "دیزلی",
  }

  const loanPlan = useMemo(() => {
    const price = car.listedPriceIrr ?? 0
    const principal = Math.max(0, price - downPayment)
    const monthlyRate = 0.015
    const total = Math.round(principal * (1 + monthlyRate * loanMonths))
    return {
      principal,
      total,
      monthlyInstallment: loanMonths > 0 ? Math.ceil(total / loanMonths) : 0,
    }
  }, [car.listedPriceIrr, downPayment, loanMonths])

  async function handleBuy(payload: BuyPayload) {
    setBuyState("loading")
    await onBuy(car.id, payload)
    setBuyState("idle")
  }

  return (
    <motion.article
      className="rounded-3xl border border-[#D4AF37]/20 bg-white/[0.04] backdrop-blur-xl overflow-hidden shadow-2xl h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <Link href={`/cars/${car.id}`} className="block relative overflow-hidden bg-black/50">
        <div className="relative h-64 sm:h-72">
          <img src={car.vehicle.imageUrl} alt={car.vehicle.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      </Link>

      <div className="flex-1 p-5 sm:p-6 space-y-4 flex flex-col">
        <Link href={`/cars/${car.id}`} className="block">
          <h2 className="text-base sm:text-lg font-black text-white mb-1 line-clamp-2">{car.vehicle.title}</h2>
          <p className="text-xs sm:text-sm text-white/60">{car.vehicle.model}</p>
        </Link>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CalendarDays size={12} />
              <span className="font-bold">{car.vehicle.year.toLocaleString("fa-IR")}</span>
            </div>
            <p className="text-white/60">سال</p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/[0.05] p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1"><Gauge size={12} /></div>
            <p className="text-white/60 text-[10px]">{car.vehicle.isNew ? "نو" : `${car.vehicle.mileageKm.toLocaleString("fa-IR")} کم`}</p>
          </div>
          <div className="rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1"><Fuel size={12} /></div>
            <p className="text-white/60 text-[10px]">{fuelLabel[car.vehicle.fuelType]}</p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/[0.05] p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1"><Settings2 size={12} /></div>
            <p className="text-white/60 text-[10px]">{car.vehicle.transmission === "automatic" ? "اتوماتیک" : "دنده‌ای"}</p>
          </div>
        </div>

        <div className="space-y-2 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <MapPin size={14} className="text-[#D4AF37] flex-shrink-0" />
            <span className="font-bold">{car.vehicle.city}</span>
          </div>
          {car.listedPriceIrr ? (
            <div className="rounded-lg border border-[#D4AF37]/35 bg-[#D4AF37]/10 p-3">
              <p className="text-xs text-white/70 mb-1">قیمت تومان</p>
              <p className="text-lg font-black text-amber-300">{car.listedPriceIrr.toLocaleString("fa-IR")}</p>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-3 text-center">
            <p className="text-xs text-white/60 mb-1">ماشین</p>
            <p className="font-black text-[#E2C060] flex items-center justify-center gap-1">
              <Users size={13} />
              {car.vehicle.participantsCount.toLocaleString("fa-IR")}
            </p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/[0.05] p-3 text-center">
            <p className="text-xs text-white/60 mb-1">قرعه</p>
            <p className="font-black text-white flex items-center justify-center gap-1">
              <Users size={13} />
              {car.vehicle.raffleParticipantsCount.toLocaleString("fa-IR")}
            </p>
          </div>
        </div>

        {car.listedPriceIrr ? (
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 space-y-2">
            <p className="text-xs text-amber-200 font-bold">خرید وامی خودرو</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-white/70">تعداد اقساط</label>
                <select
                  value={loanMonths}
                  onChange={(e) => setLoanMonths(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs"
                >
                  {[6, 12, 18, 24, 36].map((m) => (
                    <option key={m} value={m}>{m.toLocaleString("fa-IR")} قسط</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/70">پیش‌پرداخت</label>
                <input
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value.replace(/[^\d]/g, "")))}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs"
                />
              </div>
            </div>
            <p className="text-[11px] text-white/75">مبلغ وام: {loanPlan.principal.toLocaleString("fa-IR")} تومان</p>
            <p className="text-[11px] text-white/75">هر قسط: {loanPlan.monthlyInstallment.toLocaleString("fa-IR")} تومان</p>
            <p className="text-[11px] text-white/75">جمع بازپرداخت: {loanPlan.total.toLocaleString("fa-IR")} تومان</p>
            {!isProUser ? <p className="text-[11px] text-rose-300">خرید وامی فقط برای کاربران پرو فعال است.</p> : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2.5 pt-2 mt-auto">
          {car.listedPriceIrr ? (
            <button
              onClick={() => handleBuy({ paymentAsset: "IRR" })}
              disabled={buyState === "loading"}
              className="w-full rounded-lg bg-[#D4AF37] py-3 text-sm font-black text-black hover:bg-[#E2C060] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              <Banknote size={14} />
              {buyState === "loading" ? "در حال پردازش..." : "خرید نقدی"}
            </button>
          ) : null}

          <div className="flex gap-2.5">
            {car.listedPriceGoldSot ? (
              <button
                onClick={() => handleBuy({ paymentAsset: "GOLD_SOT" })}
                disabled={buyState === "loading"}
                className="flex-1 rounded-lg border border-[#D4AF37]/45 bg-[#D4AF37]/10 py-3 text-xs font-black text-[#E2C060] hover:border-[#D4AF37]/80 hover:bg-[#D4AF37]/20 disabled:opacity-60 transition-all flex items-center justify-center gap-1"
              >
                <Gem size={12} />
                سوت
              </button>
            ) : null}
            {car.listedPriceIrr ? (
              <button
                onClick={() => handleBuy({ paymentAsset: "LOAN", loanMonths, downPaymentIrr: downPayment })}
                disabled={buyState === "loading" || !isProUser}
                className="flex-1 rounded-lg border border-amber-400/45 bg-amber-500/10 py-3 text-xs font-black text-amber-200 hover:border-amber-300 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
              >
                <CreditCard size={12} />
                خرید وامی
              </button>
            ) : null}
            <Link
              href={`/cars/${car.id}`}
              className="flex-1 rounded-lg border border-white/25 bg-white/[0.06] py-3 text-xs font-black text-white hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 transition-all text-center"
            >
              جزئیات
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
