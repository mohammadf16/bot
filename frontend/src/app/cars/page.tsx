"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import toast from "react-hot-toast"
import { CalendarDays, Fuel, Gauge, MapPin, Settings2, Users, ShoppingCart, ArrowLeft, ShieldCheck, Sparkles, Gem, CarFront, CreditCard, Banknote, ChevronDown, Wallet } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { formatMoneyInput, formatToman, parseTomanInput } from "@/lib/money"

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
  directPurchaseEnabled?: boolean
  directPurchaseGroupSize?: number
  directPurchaseCurrentParticipants?: number
  directPurchaseTotalCostPerParticipant?: number
}

type BuyPayload = {
  paymentAsset: "IRR" | "GOLD_SOT" | "LOAN"
  loanMonths?: number
  downPaymentIrr?: number
}

export default function CarsPage() {
  const [items, setItems] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const isProUser = useMemo(() => Number(user?.vipLevelId ?? 1) >= 3, [user?.vipLevelId])

  async function load() {
    setIsLoading(true)
    try {
      const data = await apiRequest<{ items: Vehicle[] }>("/showroom/vehicles", { method: "GET" }, { auth: false })
      setItems(data.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت خودروها")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function buy(vehicleId: string, payload: BuyPayload) {
    try {
      const result = await apiRequest<{
        order?: { id: string; status: string; slideEntryNumbers?: number[] }
        slideDraw?: { drawId?: string; ticketNumbers?: number[] }
      }>(`/showroom/vehicles/${vehicleId}/orders`, {
        method: "POST",
        body: JSON.stringify(payload),
      })
      const ticketNumbers = result.slideDraw?.ticketNumbers ?? result.order?.slideEntryNumbers ?? []
      const base = payload.paymentAsset === "LOAN" ? "درخواست خرید اقساطی ثبت شد" : "سفارش خودرو ثبت شد"
      toast.success(ticketNumbers.length ? `${base} | شماره بلیط اسلاید: ${ticketNumbers.join(" , ")}` : base, {
        style: { background: '#D4AF37', color: '#000' }
      })
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت سفارش ناموفق بود")
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white relative overflow-x-hidden selection:bg-[#D4AF37]/30 selection:text-[#D4AF37] pb-24" dir="rtl">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 pt-20 md:pt-28">
        
        {/* --- Header دقیقا مطابق با اسکرین‌شات ارسالی شما --- */}
        <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#121212] p-6 md:p-10 lg:p-12 mb-8 shadow-2xl">
          {/* گرادینت بسیار ملایم پس‌زمینه برای شیک‌تر شدن */}
          <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-start w-full">
            {/* Badge */}
            <div className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/50 bg-transparent px-4 py-1.5 md:px-5 md:py-2 text-[11px] md:text-sm text-[#D4AF37] mb-5 font-medium tracking-wide">
              فروشگاه خودرو
            </div>
            
            {/* Title - با استفاده از break-words برای جلوگیری از بیرون‌زدگی */}
            <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-black text-[#D4AF37] mb-3 md:mb-5 leading-tight md:leading-tight lg:leading-tight max-w-full break-words">
              خرید نقدی یا وامی خودرو
            </h1>
            
            {/* Subtitle */}
            <p className="text-sm md:text-base lg:text-lg text-white/90 leading-relaxed md:leading-loose font-normal max-w-4xl break-words">
              امکان خرید با تومان، سوت، یا وام (فقط کاربران پرو). در خرید وامی می‌توانید تعداد اقساط و پیش‌پرداخت را انتخاب کنید.
            </p>
          </div>
        </section>

        {/* --- Toolbar --- */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-2 md:gap-3">
            <CarFront size={20} className="text-[#D4AF37] hidden md:block" />
            <h2 className="text-lg md:text-2xl lg:text-3xl font-black text-white">خودروهای موجود</h2>
          </div>
          <span className="text-xs md:text-sm font-medium text-white/50 px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-white/5 border border-white/5">
            {isLoading ? "..." : `${items.length} دستگاه`}
          </span>
        </div>

        {/* --- Direct Purchase Section --- */}
        {!isLoading && items.some((car) => car.directPurchaseEnabled) && (
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <ShoppingCart size={20} className="text-[#D4AF37]" />
              <h2 className="text-lg md:text-2xl lg:text-3xl font-black text-white">خرید مستقیم گروهی</h2>
            </div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6 lg:gap-8 items-start"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
              }}
            >
              {items
                .filter((car) => car.directPurchaseEnabled)
                .map((car) => (
                  <DirectPurchaseCard key={car.id} car={car} />
                ))}
            </motion.div>
          </div>
        )}

        {/* --- Toolbar --- */}

        {/* --- Minimal Grid --- */}
        <AnimatePresence mode="wait">
          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6 lg:gap-8 items-start">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="h-[500px] rounded-2xl border border-white/5 bg-[#0a0a0a] animate-pulse" />
               ))}
             </div>
          ) : items.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6 lg:gap-8 items-start"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
              }}
            >
              {items.map((car) => (
                <CarCard key={car.id} car={car} onBuy={buy} isProUser={isProUser} walletBalance={user?.walletBalance ?? 0} />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-12 md:p-16 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ShoppingCart size={32} className="mx-auto mb-4 text-white/20" />
              <h3 className="text-base md:text-lg font-bold text-white/80 mb-2">فروشگاه خالی است</h3>
              <p className="text-xs md:text-sm text-white/40">در حال حاضر خودرویی برای فروش در این بخش وجود ندارد.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

// --- Direct Purchase Card ---
function DirectPurchaseCard({ car }: { car: Vehicle }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [cardLast4, setCardLast4] = useState("")
  const [trackingCode, setTrackingCode] = useState("")

  const remainingTickets = (car.directPurchaseGroupSize ?? 0) - (car.directPurchaseCurrentParticipants ?? 0)
  const costPerParticipant = car.directPurchaseTotalCostPerParticipant ?? 0

  const handleParticipate = async () => {
    if (!cardLast4 || !trackingCode) {
      toast.error("لطفاً کارت و کد رهگیری را وارد کنید")
      return
    }

    setIsProcessing(true)
    try {
      await apiRequest(`/showroom/vehicles/${car.id}/orders`, {
        method: "POST",
        body: JSON.stringify({
          paymentAsset: "CARD_TO_CARD",
          fromCardLast4: cardLast4,
          trackingCode: trackingCode,
        }),
      })
      toast.success("درخواست خرید شما ثبت شد. منتظر تأیید باشید.", {
        style: { background: "#D4AF37", color: "#000" },
      })
      setShowPaymentModal(false)
      setCardLast4("")
      setTrackingCode("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت درخواست ناموفق بود")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 },
      }}
      className="relative rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/10 to-black/40 overflow-hidden flex flex-col group transition-colors duration-300 hover:border-[#D4AF37]/60 h-full"
    >
      {/* --- Image Section --- */}
      <div className="relative h-56 md:h-64 lg:h-[280px] shrink-0 overflow-hidden bg-black/50">
        <img src={car.vehicle.imageUrl} alt={car.vehicle.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />

        {/* Badge */}
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold shadow-md border backdrop-blur-md bg-[#D4AF37]/20 text-[#F7D778] border-[#D4AF37]/50">
            <ShoppingCart size={14} />
            خرید مستقیم
          </span>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-4 inset-x-5">
          <p className="text-white/50 text-xs md:text-sm mb-1 font-medium tracking-wide">{car.vehicle.model}</p>
          <h2 className="text-xl md:text-2xl font-bold text-[#D4AF37] line-clamp-1">{car.vehicle.title}</h2>
        </div>
      </div>

      {/* --- Details Section --- */}
      <div className="flex-1 p-5 md:p-6 flex flex-col">
        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-5">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.03] text-xs md:text-sm text-white/80 font-medium">
            <CalendarDays size={16} className="text-[#D4AF37] shrink-0" />
            <span>{car.vehicle.year.toLocaleString("fa-IR")}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.03] text-xs md:text-sm text-white/80 font-medium">
            <Gauge size={16} className="text-[#D4AF37] shrink-0" />
            <span>{car.vehicle.isNew ? "صفر" : `${car.vehicle.mileageKm.toLocaleString("fa-IR")}km`}</span>
          </div>
        </div>

        {/* Group Purchase Info */}
        <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4 mb-4 space-y-3">
          <h3 className="font-bold text-sm text-[#D4AF37] flex items-center gap-2">
            <Users size={16} />
            اطلاعات گروپ
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">شرکت‌کنندگان</span>
              <span className="font-black text-[#D4AF37]">{(car.directPurchaseCurrentParticipants ?? 0).toLocaleString("fa-IR")} نفر</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">بلیط باقی‌مانده</span>
              <span className="font-black text-white">{remainingTickets.toLocaleString("fa-IR")} عدد</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F7D778] transition-all duration-300"
                style={{
                  width: `${((car.directPurchaseCurrentParticipants ?? 0) / (car.directPurchaseGroupSize ?? 1)) * 100}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-white/50 text-center">
              {((car.directPurchaseCurrentParticipants ?? 0) / (car.directPurchaseGroupSize ?? 1) * 100).toFixed(1)}% پر شده
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-4 pb-4 border-b border-white/5">
          <p className="text-xs md:text-sm text-white/50 mb-1">هزینه هر نفر</p>
          <p className="text-2xl md:text-3xl font-black text-[#D4AF37]">
            {formatToman(costPerParticipant)}
          </p>
          <p className="text-[10px] text-white/40 mt-1">تومان</p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => remainingTickets > 0 && setShowPaymentModal(true)}
          disabled={remainingTickets <= 0}
          className={`w-full rounded-lg py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            remainingTickets > 0
              ? "bg-[#D4AF37] text-black hover:bg-[#E2C060]"
              : "bg-white/10 text-white/50 cursor-not-allowed"
          }`}
        >
          <CreditCard size={16} />
          {remainingTickets > 0 ? "شرکت با پرداخت درگاه" : "تکمیل شده"}
        </button>
      </div>

      {/* --- Payment Modal --- */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-w-md w-full"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-black mb-4 text-[#D4AF37]">تحویل درگاه پرداخت</h3>
              <p className="text-sm text-white/70 mb-4">لطفاً کارتوں را واشن دادید و کد پیگیری را وارد کنید</p>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-white/50 block mb-1.5">4 رقم آخر کارت</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white outline-none focus:border-[#D4AF37]/50"
                    placeholder="مثال: 1234"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1.5">کد رهگیری</label>
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white outline-none focus:border-[#D4AF37]/50 dir-ltr text-right"
                    placeholder="کد رهگیری درگاه"
                  />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
                <p className="text-xs text-white/60 mb-1">مبلغ قابل پرداخت</p>
                <p className="text-lg font-black text-[#D4AF37]">{formatToman(costPerParticipant)}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 rounded-lg border border-white/10 bg-transparent hover:bg-white/5 py-2 text-sm font-bold text-white/70 transition-colors"
                >
                  لغو
                </button>
                <button
                  onClick={handleParticipate}
                  disabled={isProcessing || !cardLast4 || !trackingCode}
                  className="flex-1 rounded-lg bg-[#D4AF37] hover:bg-[#E2C060] disabled:opacity-50 py-2 text-sm font-bold text-black transition-colors"
                >
                  {isProcessing ? "درحال پردازش..." : "تأیید درخواست"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

// --- Minimal Flat Car Card with Slide-down Buy Panel ---
function CarCard({ 
  car, 
  onBuy, 
  isProUser,
  walletBalance
}: { 
  car: Vehicle
  onBuy: (vehicleId: string, payload: BuyPayload) => void
  isProUser: boolean
  walletBalance: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isBuyPanelOpen, setIsBuyPanelOpen] = useState(false)
  const [buyState, setBuyState] = useState<"idle" | "loading">("idle")
  const [loanOpen, setLoanOpen] = useState(false)
  
  // Loan States
  const [loanMonths, setLoanMonths] = useState(12)
  const defaultDownPayment = Math.round((car.listedPriceIrr ?? 0) * 0.2)
  const [downPayment, setDownPayment] = useState(defaultDownPayment)

  const fuelLabel: Record<Vehicle["vehicle"]["fuelType"], string> = {
    gasoline: "بنزینی",
    hybrid: "هیبرید",
    electric: "برقی",
    diesel: "دیزلی",
  }
  const transmissionLabel = car.vehicle.transmission === "automatic" ? "اتومات" : "دستی"

  // Loan Calculation Logic
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

  const handleBuy = async (payload: BuyPayload) => {
    setBuyState("loading")
    await Promise.resolve(onBuy(car.id, payload))
    setBuyState("idle")
  }

  const handleDownPaymentChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDownPayment(parseTomanInput(e.target.value) ?? 0)
  }

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 }
      }}
      className="relative rounded-2xl border border-white/5 bg-[#0A0A0A] overflow-hidden flex flex-col group transition-colors duration-300 hover:border-[#D4AF37]/30 h-full"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* --- Image Section --- */}
      <Link href={`/cars/${car.id}`} className="block relative h-56 md:h-64 lg:h-[280px] shrink-0 overflow-hidden bg-black/50">
        <img 
          src={car.vehicle.imageUrl} 
          alt={car.vehicle.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/20 to-transparent opacity-90" />
        
        {/* Corner Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold shadow-md border backdrop-blur-md ${
            car.sourceType === "lottery_winback" 
              ? "bg-[#D4AF37]/20 text-[#F7D778] border-[#D4AF37]/50" 
              : "bg-black/60 text-white border-white/20"
          }`}>
            {car.sourceType === "lottery_winback" ? <Sparkles size={14} className="text-[#F7D778]" /> : <ShieldCheck size={14} />}
            {car.sourceType === "lottery_winback" ? "موجود از بازخرید" : "فروش مستقیم"}
          </span>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-4 inset-x-5">
          <p className="text-white/50 text-xs md:text-sm mb-1 font-medium tracking-wide">{car.vehicle.model}</p>
          <h2 className="text-xl md:text-2xl font-bold text-white group-hover:text-[#D4AF37] transition-colors line-clamp-1">
            {car.vehicle.title}
          </h2>
        </div>

        {/* Hover Action */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 rounded bg-white/10 border border-white/20 px-5 py-2.5 text-sm font-medium text-white">
                ورود به گالری
                <ArrowLeft size={18} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      {/* --- Details Section --- */}
      <div className="flex-1 p-5 md:p-6 flex flex-col">
        
        {/* Enlarged Specs Grid */}
        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-5">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.03] text-xs md:text-sm text-white/80 font-medium">
            <CalendarDays size={16} className="text-[#D4AF37] shrink-0" />
            <span className="truncate">{car.vehicle.year.toLocaleString("fa-IR")}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.03] text-xs md:text-sm text-white/80 font-medium">
            <Gauge size={16} className="text-[#D4AF37] shrink-0" />
            <span className="truncate">{car.vehicle.isNew ? "صفر" : `${car.vehicle.mileageKm.toLocaleString("fa-IR")}km`}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.03] text-xs md:text-sm text-white/80 font-medium">
            <Fuel size={16} className="text-[#D4AF37] shrink-0" />
            <span className="truncate">{fuelLabel[car.vehicle.fuelType]}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.03] text-xs md:text-sm text-white/80 font-medium">
            <Settings2 size={16} className="text-[#D4AF37] shrink-0" />
            <span className="truncate">{transmissionLabel}</span>
          </div>
        </div>

        {/* Location & Participants */}
        <div className="flex justify-between items-center mb-5 pb-5 border-b border-white/5">
          <div className="flex items-center gap-2 text-xs md:text-sm text-white/70">
            <MapPin size={16} className="text-white/40 shrink-0" />
            <span className="truncate">{car.vehicle.city}</span>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-white/70">
            <Users size={16} className="text-[#D4AF37]/60 shrink-0" />
            <span className="truncate">{car.vehicle.participantsCount.toLocaleString("fa-IR")} متقاضی</span>
          </div>
        </div>

        {/* Default View: Price and Toggle Button */}
        <div className="mt-auto flex flex-col gap-4">
          {/* Price Tag */}
          {car.listedPriceIrr && (
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs md:text-sm text-white/50">قیمت نقدی</span>
              <p className="text-xl md:text-2xl font-black text-[#D4AF37] break-all">
                {formatToman(car.listedPriceIrr)} <span className="text-xs md:text-sm text-[#D4AF37]/60 font-medium">تومان</span>
              </p>
            </div>
          )}

          {/* Toggle Buy Panel Button */}
          <button
            onClick={() => setIsBuyPanelOpen(!isBuyPanelOpen)}
            className={`w-full rounded-xl py-3.5 text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0 ${
              isBuyPanelOpen 
                ? "bg-white/10 text-white" 
                : "bg-[#D4AF37] text-black hover:bg-[#E2C060]"
            }`}
          >
            {isBuyPanelOpen ? "بستن پنل خرید" : "گزینه‌های خرید"}
            <ChevronDown size={16} className={`transition-transform duration-300 ${isBuyPanelOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Sliding Buy Panel - Added precise overflow handling to prevent layout breaking */}
          <AnimatePresence>
            {isBuyPanelOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden w-full"
              >
                <div className="pt-2 space-y-3 pb-2 w-full">

                  {/* ═══ خرید مستقیم (نقدی) — prominent first section ═══ */}
                  {car.listedPriceIrr && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <p className="text-xs font-black text-white/80 mb-3 flex items-center gap-2">
                        <Banknote size={15} className="text-white/60" />
                        خرید مستقیم نقدی
                      </p>
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-xs text-white/40">مبلغ کل</span>
                        <span className="text-base font-black text-white">{formatToman(car.listedPriceIrr)} <span className="text-xs text-white/40">تومان</span></span>
                      </div>
                      {walletBalance >= car.listedPriceIrr ? (
                        <button
                          onClick={() => handleBuy({ paymentAsset: "IRR" })}
                          disabled={buyState !== "idle"}
                          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white py-3.5 text-sm font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Wallet size={16} />
                          {buyState === "loading" ? "در حال پردازش..." : `خرید از کیف پول — موجودی: ${walletBalance.toLocaleString("fa-IR")} ت`}
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleBuy({ paymentAsset: "IRR" })}
                            disabled={buyState !== "idle"}
                            className="w-full rounded-xl bg-white/10 hover:bg-white/15 text-white py-3.5 text-sm font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Banknote size={16} />
                            {buyState === "loading" ? "در حال پردازش..." : "خرید نقدی"}
                          </button>
                          <Link
                            href={`/wallet?charge=${Math.max(0, car.listedPriceIrr - walletBalance)}`}
                            className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/20 hover:bg-emerald-900/40 py-3 text-xs font-bold text-emerald-400 transition-colors flex items-center justify-center gap-2"
                          >
                            <Wallet size={14} />
                            شارژ کیف پول — کمبود: {Math.max(0, car.listedPriceIrr - walletBalance).toLocaleString("fa-IR")} تومان
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ═══ پرداخت با طلا ═══ */}
                  {car.listedPriceGoldSot && (
                    <button
                      onClick={() => handleBuy({ paymentAsset: "GOLD_SOT" })}
                      disabled={buyState !== "idle"}
                      className="w-full rounded-xl border border-[#D4AF37]/30 bg-transparent hover:bg-[#D4AF37]/10 py-3 text-sm font-bold text-[#D4AF37] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Gem size={16} /> پرداخت با طلا (سوت)
                    </button>
                  )}

                  {/* ═══ خرید اقساطی — collapsible PRO section ═══ */}
                  {car.listedPriceIrr && (
                    <div className="rounded-xl border border-white/10 overflow-hidden">
                      <button
                        onClick={() => setLoanOpen(!loanOpen)}
                        className="w-full flex items-center justify-between p-4 text-sm font-bold text-white/70 hover:text-white hover:bg-white/[0.03] transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <CreditCard size={15} className={isProUser ? "text-[#D4AF37]" : "text-white/30"} />
                          خرید اقساطی
                          {!isProUser && <span className="text-[10px] text-[#D4AF37] px-2 py-0.5 rounded bg-[#D4AF37]/10">ویژه پرو</span>}
                        </span>
                        <ChevronDown size={15} className={`transition-transform duration-300 ${loanOpen ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {loanOpen && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className={`px-4 pb-4 space-y-4 border-t border-white/5 pt-4 ${!isProUser ? "opacity-40 grayscale pointer-events-none" : ""}`}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] text-white/50 block mb-1.5">تعداد اقساط</label>
                                  <select
                                    value={loanMonths}
                                    onChange={(e) => setLoanMonths(Number(e.target.value))}
                                    className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-[#D4AF37]/50"
                                  >
                                    {[6, 12, 18, 24, 36].map((m) => (
                                      <option key={m} value={m}>{m.toLocaleString("fa-IR")} ماهه</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] text-white/50 block mb-1.5">پیش‌پرداخت (تومان)</label>
                                  <input
                                    type="text"
                                    value={downPayment ? formatMoneyInput(String(downPayment)) : ""}
                                    onChange={handleDownPaymentChange}
                                    className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-[#D4AF37]/50 dir-ltr text-right placeholder-white/30"
                                    placeholder="مبلغ"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-xs px-1 border-t border-white/5 pt-3">
                                <span className="text-white/50">هر قسط:</span>
                                <span className="text-white font-black">{formatToman(loanPlan.monthlyInstallment)} تومان</span>
                              </div>
                              <button
                                onClick={() => handleBuy({ paymentAsset: "LOAN", loanMonths, downPaymentIrr: downPayment })}
                                disabled={buyState !== "idle" || !isProUser}
                                className="w-full rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 py-3 text-sm font-bold text-[#D4AF37] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <CreditCard size={15} /> ثبت درخواست اقساط
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  
                  <Link 
                    href={`/cars/${car.id}`} 
                    className="w-full rounded-lg border border-white/10 bg-transparent hover:bg-white/5 py-3 text-xs md:text-sm font-bold text-white/70 transition-colors flex items-center justify-center shrink-0"
                  >
                    مشاهده جزئیات کامل خودرو
                  </Link>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.article>
  )
}
