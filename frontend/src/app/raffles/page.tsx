"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest, randomIdempotencyKey } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, CarFront, ShieldCheck, Sparkles, Ticket, Zap } from "lucide-react"

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
  const { isAuthenticated, user, refreshMe } = useAuth()
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
      toast.error(err instanceof Error ? err.message : "خطا در دریافت قرعه‌کشی")
    }
  }

  useEffect(() => {
    void loadRaffles()
  }, [])

  async function buyTickets() {
    if (!current) return
    if (!isAuthenticated) return toast.error("ابتدا وارد شوید")
    if (current.status !== "open") return toast.error("این قرعه‌کشی فعلا باز نیست")

    try {
      const data = await apiRequest<BuyResponse>(`/raffles/${current.id}/buy`, {
        method: "POST",
        headers: { "Idempotency-Key": randomIdempotencyKey() },
        body: JSON.stringify({ count }),
      })
      setBuyPreview(data)
      toast.success("خرید انجام شد")
      await loadRaffles()
      await refreshMe()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خرید انجام نشد")
    }
  }

  async function buyCombo(code: "silver" | "gold") {
    if (!current) return
    if (!isAuthenticated) return toast.error("ابتدا وارد شوید")
    if (current.status !== "open") return toast.error("این قرعه‌کشی فعلا باز نیست")

    try {
      await apiRequest(`/raffles/${current.id}/buy-combo`, {
        method: "POST",
        body: JSON.stringify({ code }),
      })
      toast.success(`پکیج ${code === "silver" ? "نقره‌ای" : "طلایی"} خریداری شد`)
      await loadRaffles()
      await refreshMe()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خرید پکیج انجام نشد")
    }
  }

  const soldPercent = useMemo(() => {
    if (!current || current.maxTickets <= 0) return 0
    return Math.min(100, Math.round((current.ticketsSold / current.maxTickets) * 100))
  }, [current])

  const statusLabel = useMemo(() => {
    if (!current) return "-"
    if (current.status === "open") return "باز"
    if (current.status === "closed") return "بسته"
    if (current.status === "drawn") return "برنده اعلام شده"
    return "پیش‌نویس"
  }, [current])

  const estimatedUnitPrice = useMemo(() => {
    if (!current) return 0
    const p = current.dynamicPricing
    const dynamic = p.basePrice * Math.pow(p.decayFactor, Math.max(0, current.ticketsSold))
    return Math.max(p.minPrice, Math.floor(dynamic))
  }, [current])

  return (
    <main className="min-h-screen pt-20 pb-16 text-right" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-5 px-4 sm:space-y-6 sm:px-6">
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#1F2937] p-4 sm:p-6">
          <div className="absolute -top-24 -left-10 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-10 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />

          <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px]">
                <Sparkles size={13} className="text-amber-300" />
                قرعه‌کشی یکپارچه
              </div>
              <h1 className="text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl">
                قرعه‌کشی حرفه‌ای
                <span className="block text-cyan-300">با مسیر شانس متصل</span>
              </h1>
              <p className="text-xs leading-6 text-white/75 sm:text-sm">
                خرید بلیط، دریافت شانس و اتصال مستقیم به ماشین اسلاید و اسلاید آرنا در یک مسیر.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <Link href="/slide-game" className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3.5 py-2 text-xs font-black text-black transition-colors hover:bg-cyan-300 sm:text-sm">
                  ماشین اسلاید
                  <ArrowLeft size={14} />
                </Link>
                <Link href="/slide-arena" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-white/15 sm:text-sm">
                  اسلاید آرنا
                  <ArrowLeft size={14} />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 lg:col-span-4">
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="mb-1 text-[11px] text-white/60">شانس</p>
                <p className="text-lg font-black text-cyan-300 sm:text-xl">{(user?.chances ?? 0).toLocaleString("fa-IR")}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="mb-1 text-[11px] text-white/60">تومان</p>
                <p className="text-lg font-black text-amber-300 sm:text-xl">{(user?.walletBalance ?? 0).toLocaleString("fa-IR")}</p>
              </div>
              <div className="col-span-2 rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="mb-1 text-[11px] text-white/60">قرعه‌کشی فعال</p>
                <p className="text-base font-black text-white sm:text-lg">{raffles.filter((r) => r.status === "open").length.toLocaleString("fa-IR")} مورد</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              <div>
                <label className="mb-2 block text-xs text-white/70 sm:text-sm">انتخاب قرعه‌کشی</label>
                <select
                  value={selectedRaffleId}
                  onChange={(e) => setSelectedRaffleId(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2.5 text-sm"
                >
                  {raffles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.status})
                    </option>
                  ))}
                </select>
              </div>

              {current ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3.5">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs text-white/65">وضعیت</p>
                      <span className="rounded-full border border-white/20 bg-white/5 px-2 py-1 text-[11px]">{statusLabel}</span>
                    </div>
                    <h2 className="text-base font-black sm:text-lg">{current.title}</h2>
                    <p className="mt-2 text-xs text-white/70 sm:text-sm">
                      قیمت تقریبی هر بلیط: <span className="font-black text-amber-300">{estimatedUnitPrice.toLocaleString("fa-IR")}</span> تومان
                    </p>
                  </div>

                  <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-white/70">پیشرفت فروش</span>
                      <span className="font-bold">{soldPercent.toLocaleString("fa-IR")}٪</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${soldPercent}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-white/65 sm:text-xs">
                      <span>فروخته‌شده: {current.ticketsSold.toLocaleString("fa-IR")}</span>
                      <span>باقی‌مانده: {(current.maxTickets - current.ticketsSold).toLocaleString("fa-IR")}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3.5 lg:col-span-7 lg:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3.5 sm:p-4">
                <h3 className="flex items-center gap-2 text-base font-black">
                  <Ticket size={16} className="text-cyan-300" />
                  خرید تکی
                </h3>
                <div>
                  <label className="mb-2 block text-xs text-white/70 sm:text-sm">تعداد بلیط</label>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2.5 text-sm"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n.toLocaleString("fa-IR")}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={buyTickets}
                  className="w-full rounded-lg bg-cyan-400 py-2.5 text-sm font-black text-black transition-colors hover:bg-cyan-300 disabled:opacity-60"
                  disabled={!current || current.status !== "open"}
                >
                  خرید تکی
                </button>
                {!isAuthenticated ? <p className="text-[11px] text-amber-300">برای خرید باید وارد حساب شوید.</p> : null}
              </div>

              <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3.5 sm:p-4">
                <h3 className="flex items-center gap-2 text-base font-black">
                  <ShieldCheck size={16} className="text-amber-300" />
                  پکیج‌ها
                </h3>
                {current?.comboPackages?.map((p) => (
                  <div key={p.code} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-sm font-bold">{p.code === "silver" ? "پکیج نقره‌ای" : "پکیج طلایی"}</p>
                    <p className="mt-1 text-xs text-white/70 sm:text-sm">
                      {p.paidTickets.toLocaleString("fa-IR")} خرید + {p.bonusTickets.toLocaleString("fa-IR")} هدیه + {p.bonusChances.toLocaleString("fa-IR")} شانس
                    </p>
                    {p.vipDays > 0 ? <p className="mt-1 text-[11px] text-amber-300">+ {p.vipDays.toLocaleString("fa-IR")} روز VIP</p> : null}
                    <button
                      className="mt-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-bold transition-colors hover:bg-white/10 disabled:opacity-60 sm:text-sm"
                      onClick={() => buyCombo(p.code)}
                      disabled={!current || current.status !== "open"}
                    >
                      خرید پکیج
                    </button>
                  </div>
                ))}
                {buyPreview ? (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs sm:text-sm">
                    <p>
                      جمع پرداخت: <b>{buyPreview.totalPaid.toLocaleString("fa-IR")}</b> تومان
                    </p>
                    <p>
                      کش‌بک: <b>{buyPreview.cashback.toLocaleString("fa-IR")}</b> تومان
                    </p>
                    {buyPreview.pity ? <p>حافظه شانس: x{buyPreview.pity.pityMultiplier.toFixed(2)}</p> : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-500/10 to-amber-500/10 p-4 sm:p-5">
          <div className="grid grid-cols-1 items-center gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h3 className="flex items-center gap-2 text-base font-black sm:text-lg">
                <Zap size={18} className="text-cyan-300" />
                اتصال به بازی‌های شانس
              </h3>
              <p className="mt-2 text-xs leading-6 text-white/75 sm:text-sm">
                شانس دریافتی از پکیج‌ها را مستقیم در ماشین اسلاید و اسلاید آرنا استفاده کن.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Link href="/slide-game" className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-3.5 py-2 text-xs font-black text-black transition-colors hover:bg-cyan-300 sm:text-sm">
                <CarFront size={14} />
                ورود به ماشین اسلاید
              </Link>
              <Link href="/slide-arena" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10 sm:text-sm">
                <Zap size={14} />
                ورود به اسلاید آرنا
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
