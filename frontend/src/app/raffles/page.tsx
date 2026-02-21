"use client"

import React, { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { ArrowLeft, CarFront, ShieldCheck, Sparkles, Ticket, Zap, Award, Users, Crown, Gem, Wallet, Timer, ChevronDown, CircleDollarSign, Gift } from "lucide-react"
import { motion, AnimatePresence, useMotionTemplate } from "framer-motion"

// --- Mocking Dependencies to run in this environment ---
const randomIdempotencyKey = () => Math.random().toString(36).substring(7)

// Mock Auth Hook
const useAuth = () => ({
  isAuthenticated: true,
  user: { chances: 12, walletBalance: 25000000 },
  refreshMe: async () => {}
})

// Mock API Request
const apiRequest = async <T,>(url: string, options?: any, config?: any): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (url === "/raffles") {
        resolve({
          items: [
            {
              id: "r1",
              title: "جشنواره طلایی پاییز",
              status: "open",
              maxTickets: 5000,
              ticketsSold: 3450,
              participantsCount: 1205,
              seedCommitHash: "abc123xyz",
              dynamicPricing: { basePrice: 50000, decayFactor: 1, minPrice: 50000 },
              comboPackages: [
                { code: "silver", title: "پکیج نقره‌ای", paidTickets: 10, bonusTickets: 2, bonusChances: 1, vipDays: 0 },
                { code: "gold", title: "پکیج طلایی", paidTickets: 50, bonusTickets: 15, bonusChances: 5, vipDays: 7 }
              ],
              rewardConfig: {
                cashbackPercent: 5,
                cashbackToGoldPercent: 2,
                tomanPerGoldSot: 3500,
                mainPrizeTitle: "تویوتا لندکروز سری 300",
                mainPrizeValueIrr: 20000000000
              }
            },
            {
              id: "r2",
              title: "قرعه‌کشی هفتگی شانس",
              status: "drawn",
              maxTickets: 1000,
              ticketsSold: 1000,
              participantsCount: 450,
              seedCommitHash: "def456uvw",
              dynamicPricing: { basePrice: 20000, decayFactor: 1, minPrice: 20000 },
              comboPackages: [],
              rewardConfig: {
                cashbackPercent: 2,
                cashbackToGoldPercent: 1,
                tomanPerGoldSot: 3500,
                mainPrizeTitle: "آیفون 15 پرو مکس",
                mainPrizeValueIrr: 1000000000
              }
            }
          ]
        } as unknown as T)
      } else if (url.includes("/buy")) {
        resolve({
          totalPaid: 500000,
          ticketPrices: [50000],
          cashback: 25000,
          goldSot: 5,
          rewardConfig: { cashbackPercent: 5, cashbackToGoldPercent: 2 }
        } as unknown as T)
      }
    }, 600)
  })
}
// --------------------------------------------------------

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
  participantsCount: number
  seedCommitHash: string
  dynamicPricing: { basePrice: number; decayFactor: number; minPrice: number }
  comboPackages: ComboPackage[]
  rewardConfig: {
    cashbackPercent: number
    cashbackToGoldPercent: number
    tomanPerGoldSot: number
    mainPrizeTitle: string
    mainPrizeValueIrr: number
  }
}

type BuyResponse = {
  totalPaid: number
  ticketPrices: number[]
  cashback: number
  goldSot?: number
  rewardConfig?: {
    cashbackPercent: number
    cashbackToGoldPercent: number
  }
  pity?: { missStreak: number; pityMultiplier: number }
}

// --- Theme Components ---
function AmbientLight({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute -inset-[500px] opacity-20 mix-blend-screen"
        style={{
          background: useMotionTemplate`
            radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(212, 175, 55, 0.16), transparent 40%)
          `,
        }}
      />
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-purple-900/10 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[8s]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-[#D4AF37]/5 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[10s]" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
    </div>
  )
}

const GlassButton = ({
  children,
  primary = false,
  onClick,
  className = "",
  disabled = false
}: {
  children: React.ReactNode
  primary?: boolean
  onClick?: () => void
  className?: string
  disabled?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    type="button"
    className={`
      relative px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold text-sm md:text-[15px] transition-all duration-300 overflow-hidden group
      ${
        primary
          ? "bg-[#D4AF37] text-black shadow-[0_0_20px_-5px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_-5px_rgba(212,175,55,0.6)]"
          : "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20"
      }
      ${disabled ? "opacity-50 cursor-not-allowed hover:shadow-[0_0_20px_-5px_rgba(212,175,55,0.4)]" : ""}
      ${className}
    `}
  >
    <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    {primary && !disabled && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />}
  </button>
)

export default function RafflesPage() {
  const { isAuthenticated, user, refreshMe } = useAuth()
  const [raffles, setRaffles] = useState<RaffleItem[]>([])
  const [selectedRaffleId, setSelectedRaffleId] = useState<string>("")
  const [count, setCount] = useState(1)
  const [buyPreview, setBuyPreview] = useState<BuyResponse | null>(null)
  const [isBuying, setIsBuying] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const current = useMemo(() => raffles.find((r) => r.id === selectedRaffleId) ?? null, [raffles, selectedRaffleId])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

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
      setIsBuying(true)
      const data = await apiRequest<BuyResponse>(`/raffles/${current.id}/buy`, {
        method: "POST",
        headers: { "Idempotency-Key": randomIdempotencyKey() },
        body: JSON.stringify({ count }),
      })
      setBuyPreview(data)
      toast.success("خرید با موفقیت انجام شد ✨", { style: { background: '#D4AF37', color: '#000' } })
      await loadRaffles()
      await refreshMe()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خرید انجام نشد")
    } finally {
      setIsBuying(false)
    }
  }

  async function buyCombo(code: "silver" | "gold") {
    if (!current) return
    if (!isAuthenticated) return toast.error("ابتدا وارد شوید")
    if (current.status !== "open") return toast.error("این قرعه‌کشی فعلا باز نیست")

    try {
      setIsBuying(true)
      await apiRequest(`/raffles/${current.id}/buy-combo`, {
        method: "POST",
        body: JSON.stringify({ code }),
      })
      toast.success(`پکیج ${code === "silver" ? "نقره‌ای" : "طلایی"} خریداری شد 🏆`, { style: { background: '#D4AF37', color: '#000' } })
      await loadRaffles()
      await refreshMe()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خرید پکیج انجام نشد")
    } finally {
      setIsBuying(false)
    }
  }

  const soldPercent = useMemo(() => {
    if (!current || current.maxTickets <= 0) return 0
    return Math.min(100, Math.round((current.ticketsSold / current.maxTickets) * 100))
  }, [current])

  const estimatedUnitPrice = useMemo(() => {
    if (!current) return 0
    const p = current.dynamicPricing
    const dynamic = p.basePrice * Math.pow(p.decayFactor, Math.max(0, current.ticketsSold))
    return Math.max(p.minPrice, Math.floor(dynamic))
  }, [current])

  return (
    <main className="min-h-screen bg-black text-white relative overflow-x-hidden selection:bg-[#D4AF37]/30 selection:text-[#F7D778] pb-24" dir="rtl">
      {/* Dynamic Environment Lighting */}
      <AmbientLight mouseX={mousePos.x} mouseY={mousePos.y} />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 md:px-12 pt-24 md:pt-32">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between border-b border-white/10 pb-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D4AF37]/30 bg-black/45 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-[#D4AF37] text-[10px] md:text-xs font-bold tracking-widest uppercase">سیستم شفاف قرعه‌کشی</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-2 tracking-tight">
              قرعه کشی های <span className="text-[#D4AF37]">فعال</span>
            </h1>
            <p className="text-sm md:text-lg text-white/50 max-w-2xl leading-relaxed">
              بلیط پلکانی بخرید، شانس گردونه بگیرید و در صورت برنده نشدن، از کش‌بک تضمینی استفاده کنید.
            </p>
          </div>
          
          {/* User Stats Snapshot */}
          <div className="flex gap-3 mt-4 md:mt-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-sm">
              <div className="p-2 bg-[#D4AF37]/10 rounded-xl"><Sparkles size={18} className="text-[#D4AF37]" /></div>
              <div>
                <p className="text-xs text-white/50">شانس‌های شما</p>
                <p className="font-black text-lg text-white">{(user?.chances ?? 0).toLocaleString("fa-IR")}</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-sm hidden sm:flex">
              <div className="p-2 bg-white/10 rounded-xl"><Wallet size={18} className="text-white" /></div>
              <div>
                <p className="text-xs text-white/50">موجودی (تومان)</p>
                <p className="font-black text-lg text-white">{(user?.walletBalance ?? 0).toLocaleString("fa-IR")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- Main Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          
          {/* Left Column: Raffle List */}
          <section className="lg:col-span-5 flex flex-col gap-4">
            <AnimatePresence>
              {raffles.length > 0 ? (
                <motion.div 
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                  }}
                >
                  {raffles.map((raffle, i) => (
                    <RaffleCard 
                      key={raffle.id} 
                      raffle={raffle} 
                      index={i}
                      isSelected={selectedRaffleId === raffle.id} 
                      onSelect={() => setSelectedRaffleId(raffle.id)}
                    />
                  ))}
                </motion.div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-sm">
                  <Timer size={40} className="mx-auto mb-4 text-white/30" />
                  <p className="text-white/60">در حال بارگذاری اطلاعات...</p>
                </div>
              )}
            </AnimatePresence>
          </section>

          {/* Right Column: Purchase Console */}
          <AnimatePresence mode="wait">
            {current && (
              <motion.section 
                key={current.id}
                className="lg:col-span-7 rounded-3xl border border-white/15 bg-black/40 p-6 md:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
              >
                {/* Subtle top reflection */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
                      خرید بلیط <span className="text-[#D4AF37]">{current.title}</span>
                    </h3>
                    <p className="text-sm md:text-base text-white/60">جایزه ویژه: <span className="text-white font-bold">{current.rewardConfig.mainPrizeTitle}</span></p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
                    current.status === "open" ? "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30" :
                    current.status === "drawn" ? "bg-white/10 text-white border-white/30" :
                    "bg-white/5 text-white/40 border-white/10"
                  }`}>
                    {current.status === "open" ? "در حال برگزاری" : current.status === "drawn" ? "برنده اعلام شد" : "بسته شده"}
                  </span>
                </div>

                {/* Status Grid */}
                <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-xs text-white/50 inline-flex items-center gap-1 mb-1.5"><Ticket size={14} /> قیمت پایه</p>
                    <p className="font-black text-sm md:text-base">{estimatedUnitPrice.toLocaleString("fa-IR")} <span className="text-[10px] text-white/40 font-normal">تومان</span></p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-xs text-white/50 inline-flex items-center gap-1 mb-2"><Users size={14} /> ظرفیت تکمیل</p>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#D4AF37] h-full rounded-full" style={{ width: `${soldPercent}%` }} />
                      </div>
                      <span className="text-xs font-bold text-[#D4AF37]">{soldPercent}%</span>
                    </div>
                  </div>
                  <div className="bg-[#D4AF37]/5 rounded-2xl p-4 border border-[#D4AF37]/20">
                    <p className="text-xs text-white/50 inline-flex items-center gap-1 mb-1.5"><Gift size={14} /> کش‌بک خرید</p>
                    <p className="font-black text-sm md:text-base text-[#D4AF37]">{current.rewardConfig.cashbackPercent}% نقد</p>
                  </div>
                </div>

                <div className="space-y-6 flex-1">
                  {/* Custom Ticket Purchase */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 transition-colors hover:border-[#D4AF37]/30">
                    <h4 className="text-sm font-bold text-white mb-4">انتخاب تعداد بلیط</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <select
                          value={count}
                          onChange={(e) => setCount(Number(e.target.value))}
                          className="w-full appearance-none rounded-xl border border-white/15 bg-black px-4 py-3.5 text-white text-sm focus:border-[#D4AF37] outline-none"
                        >
                          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>{n.toLocaleString("fa-IR")} عدد شانس ویژه</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                      </div>
                      <GlassButton 
                        primary 
                        onClick={buyTickets}
                        disabled={current.status !== "open" || !isAuthenticated || isBuying}
                        className="sm:w-48 py-3.5"
                      >
                        {isBuying ? "پردازش..." : "تایید و خرید"}
                      </GlassButton>
                    </div>
                  </div>

                  {/* VIP Packages */}
                  {current.comboPackages?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2 px-1">
                        <ShieldCheck size={16} className="text-[#D4AF37]" /> پیشنهادهای ویژه VIP
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {current.comboPackages.map((pkg) => (
                          <div
                            key={pkg.code}
                            className={`relative rounded-2xl border p-5 transition-all flex flex-col justify-between group ${
                              pkg.code === "gold" 
                                ? "border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/10 to-transparent hover:border-[#D4AF37]/60" 
                                : "border-white/10 bg-white/5 hover:bg-white/10"
                            }`}
                          >
                            <div className="mb-5">
                              <h5 className={`text-base font-black mb-3 ${pkg.code === "gold" ? "text-[#D4AF37]" : "text-white"}`}>
                                {pkg.title}
                              </h5>
                              <ul className="space-y-2 text-sm text-white/60">
                                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-white/40" /> {pkg.paidTickets.toLocaleString("fa-IR")} بلیط اصلی</li>
                                <li className="flex items-center gap-2 text-[#D4AF37]"><div className="w-1 h-1 rounded-full bg-[#D4AF37]" /> +{pkg.bonusTickets.toLocaleString("fa-IR")} بلیط هدیه</li>
                                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-white/40" /> {pkg.bonusChances.toLocaleString("fa-IR")} شانس گردونه</li>
                              </ul>
                            </div>
                            <GlassButton
                              primary={pkg.code === "gold"}
                              onClick={() => buyCombo(pkg.code)}
                              disabled={current.status !== "open" || !isAuthenticated || isBuying}
                              className="w-full py-2.5 text-xs"
                            >
                              خرید پکیج
                            </GlassButton>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Receipt Preview */}
                <AnimatePresence>
                  {buyPreview && (
                    <motion.div 
                      className="mt-6 rounded-2xl border border-white/20 bg-white/5 p-5 backdrop-blur-md"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <p className="text-sm font-bold text-white mb-3">رسید آخرین تراکنش شما</p>
                      <div className="flex flex-col sm:flex-row gap-4 text-sm text-white/70">
                        <div className="flex-1 bg-black/40 rounded-xl p-3 border border-white/5">
                          جمع پرداختی: <strong className="text-white text-base mr-2">{buyPreview.totalPaid?.toLocaleString("fa-IR")}</strong> تومان
                        </div>
                        <div className="flex-1 bg-[#D4AF37]/10 rounded-xl p-3 border border-[#D4AF37]/20 text-[#D4AF37]">
                          مبلغ کش‌بک: <strong className="text-base mr-2">{buyPreview.cashback?.toLocaleString("fa-IR")}</strong> تومان
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.section>
            )}
          </AnimatePresence>
        </div>

      </div>
    </main>
  )
}

// Minimal & Elegant Card matching the Home Page style
function RaffleCard({ 
  raffle, 
  isSelected, 
  onSelect,
  index
}: { 
  raffle: RaffleItem
  isSelected: boolean
  onSelect: () => void
  index: number
}) {
  const soldPercent = Math.min(100, Math.round((raffle.ticketsSold / raffle.maxTickets) * 100))
  
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      className={`group relative bg-white/5 rounded-3xl overflow-hidden border cursor-pointer transition-all duration-300 ${
        isSelected 
          ? 'border-[#D4AF37] shadow-[0_0_30px_-5px_rgba(212,175,55,0.2)]' 
          : 'border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/10'
      }`}
    >
      <div className="p-5 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-lg md:text-xl font-black transition-colors ${isSelected ? 'text-[#D4AF37]' : 'text-white'}`}>
            {raffle.title}
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-white/50 border border-white/10">
            {raffle.status === "open" ? "فعال" : "بسته"}
          </span>
        </div>
        
        <p className="text-sm text-white/50 mb-5">
          جایزه: <strong className="text-white/80">{raffle.rewardConfig.mainPrizeTitle}</strong>
        </p>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/50">پیشرفت ظرفیت</span>
          <span className="text-xs font-bold text-white">{soldPercent}%</span>
        </div>
        
        <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${isSelected ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8941F]' : 'bg-white/30 group-hover:bg-[#D4AF37]/60'}`} 
            style={{ width: `${soldPercent}%` }} 
          />
        </div>
      </div>
    </motion.article>
  )
}