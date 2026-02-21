"use client"

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react"
import toast from "react-hot-toast"
import { CalendarDays, Fuel, Gauge, MapPin, Settings2, Users, ShoppingCart, ArrowLeft, ShieldCheck, Sparkles, Gem, CarFront, CreditCard, Banknote, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ==========================================
// MOCK DATA & DEPENDENCIES (For Preview Environment)
// ==========================================
// Mock Link
const Link = ({ href, children, className }: { href: string; children: ReactNode; className?: string }) => (
  <a href={href} className={className} onClick={(e) => e.preventDefault()}>{children}</a>
)

// Mock Auth
const useAuth = () => {
  return {
    user: { vipLevelId: 3 } // Mocked as Pro User for demonstration
  }
}

// Mock API
const apiRequest = async <T,>(url: string, _options?: unknown, _config?: unknown): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (url === "/showroom/vehicles") {
        resolve({
          items: [
            {
              id: "car-1",
              sourceType: "external_purchase",
              status: "available",
              vehicle: {
                title: "پورشه 911 کاررا S",
                imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1400",
                model: "2023",
                year: 2023,
                city: "تهران",
                mileageKm: 0,
                isNew: true,
                transmission: "automatic",
                fuelType: "gasoline",
                participantsCount: 840,
                raffleParticipantsCount: 0
              },
              listedPriceIrr: 18500000000,
              listedPriceGoldSot: 4500
            },
            {
              id: "car-2",
              sourceType: "lottery_winback",
              status: "available",
              vehicle: {
                title: "لندروور دیفندر 110",
                imageUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1400",
                model: "2024",
                year: 2024,
                city: "اصفهان",
                mileageKm: 1200,
                isNew: false,
                transmission: "automatic",
                fuelType: "hybrid",
                participantsCount: 1250,
                raffleParticipantsCount: 450
              },
              listedPriceIrr: 22000000000,
              listedPriceGoldSot: 5200
            },
            {
              id: "car-3",
              sourceType: "external_purchase",
              status: "available",
              vehicle: {
                title: "تسلا مدل S Plaid",
                imageUrl: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=1400",
                model: "2023",
                year: 2023,
                city: "شیراز",
                mileageKm: 0,
                isNew: true,
                transmission: "automatic",
                fuelType: "electric",
                participantsCount: 300,
                raffleParticipantsCount: 120
              },
              listedPriceIrr: 15000000000,
              listedPriceGoldSot: 3800
            },
            {
              id: "car-4",
              sourceType: "lottery_winback",
              status: "available",
              vehicle: {
                title: "مرسدس بنز S500",
                imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1400",
                model: "2022",
                year: 2022,
                city: "تبریز",
                mileageKm: 15000,
                isNew: false,
                transmission: "automatic",
                fuelType: "gasoline",
                participantsCount: 2100,
                raffleParticipantsCount: 890
              },
              listedPriceIrr: 32000000000,
              listedPriceGoldSot: 7800
            },
            {
              id: "car-5",
              sourceType: "external_purchase",
              status: "available",
              vehicle: {
                title: "ب‌ام‌و M4 کامپتیشن",
                imageUrl: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=1400",
                model: "2023",
                year: 2023,
                city: "مشهد",
                mileageKm: 5000,
                isNew: false,
                transmission: "automatic",
                fuelType: "gasoline",
                participantsCount: 1540,
                raffleParticipantsCount: 300
              },
              listedPriceIrr: 14500000000,
              listedPriceGoldSot: 3500
            },
            {
              id: "car-6",
              sourceType: "lottery_winback",
              status: "available",
              vehicle: {
                title: "آئودی RS7",
                imageUrl: "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?q=80&w=1400",
                model: "2024",
                year: 2024,
                city: "تهران",
                mileageKm: 0,
                isNew: true,
                transmission: "automatic",
                fuelType: "gasoline",
                participantsCount: 3200,
                raffleParticipantsCount: 1100
              },
              listedPriceIrr: 28000000000,
              listedPriceGoldSot: 6800
            }
          ]
        } as unknown as T)
      } else if (url.includes("/orders")) {
        resolve({ success: true } as unknown as T)
      }
    }, 600)
  })
}
// ==========================================

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
      await apiRequest(`/showroom/vehicles/${vehicleId}/orders`, {
        method: "POST",
        body: JSON.stringify(payload),
      })
      toast.success(payload.paymentAsset === "LOAN" ? "درخواست خرید اقساطی ثبت شد" : "سفارش خودرو ثبت شد", {
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
                <CarCard key={car.id} car={car} onBuy={buy} isProUser={isProUser} />
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

// --- Minimal Flat Car Card with Slide-down Buy Panel ---
function CarCard({ 
  car, 
  onBuy, 
  isProUser
}: { 
  car: Vehicle
  onBuy: (vehicleId: string, payload: BuyPayload) => void
  isProUser: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isBuyPanelOpen, setIsBuyPanelOpen] = useState(false)
  const [buyState, setBuyState] = useState<"idle" | "loading">("idle")
  
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
    const val = e.target.value.replace(/\D/g, "")
    setDownPayment(Number(val))
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
                {car.listedPriceIrr.toLocaleString("fa-IR")} <span className="text-xs md:text-sm text-[#D4AF37]/60 font-medium">تومان</span>
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
                <div className="pt-2 space-y-4 pb-2 w-full">
                  
                  {/* --- Loan / Installment Details --- */}
                  {car.listedPriceIrr && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-all w-full box-border">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <p className="text-xs md:text-sm text-white/90 font-bold flex items-center gap-2">
                          <CreditCard size={16} className={isProUser ? "text-[#D4AF37]" : "text-white/40"} /> 
                          خرید اقساطی
                        </p>
                        {!isProUser && <span className="text-[10px] text-[#D4AF37] px-2 py-1 rounded bg-[#D4AF37]/10 whitespace-nowrap">ویژه پرو</span>}
                      </div>
                      
                      <div className={`space-y-4 ${!isProUser ? "opacity-40 grayscale pointer-events-none" : ""}`}>
                        {/* اصلاح گرید اینجا انجام شده تا در موبایل بیرون نزند */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="w-full">
                            <label className="text-[10px] md:text-xs text-white/50 block mb-1.5">تعداد اقساط</label>
                            <select
                              value={loanMonths}
                              onChange={(e) => setLoanMonths(Number(e.target.value))}
                              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs md:text-sm text-white outline-none focus:border-[#D4AF37]/50"
                            >
                              {[6, 12, 18, 24, 36].map((m) => (
                                <option key={m} value={m}>{m.toLocaleString("fa-IR")} ماهه</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-full">
                            <label className="text-[10px] md:text-xs text-white/50 block mb-1.5">پیش‌پرداخت (تومان)</label>
                            <input
                              type="text"
                              value={downPayment ? downPayment.toLocaleString("en-US") : ""}
                              onChange={handleDownPaymentChange}
                              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs md:text-sm text-white outline-none focus:border-[#D4AF37]/50 dir-ltr text-right placeholder-white/30"
                              placeholder="مبلغ"
                            />
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
                          <div className="flex justify-between items-center text-xs md:text-sm gap-2">
                            <span className="text-white/50 whitespace-nowrap">مبلغ هر قسط:</span>
                            <span className="text-white font-bold break-all text-left dir-ltr">
                              {loanPlan.monthlyInstallment.toLocaleString("fa-IR")}
                            </span>
                          </div>
                        </div>

                        {/* Buy with Loan Button */}
                        <button
                          onClick={() => handleBuy({ paymentAsset: "LOAN", loanMonths, downPaymentIrr: downPayment })}
                          disabled={buyState !== "idle" || !isProUser}
                          className="w-full rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 py-3 text-xs md:text-sm font-bold text-[#D4AF37] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shrink-0"
                        >
                          <CreditCard size={16} /> ثبت درخواست اقساط
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- Other Actions --- */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    {/* Main IRR Buy */}
                    {car.listedPriceIrr && (
                      <button 
                        onClick={() => handleBuy({ paymentAsset: "IRR" })}
                        disabled={buyState !== "idle"}
                        className="w-full rounded-lg bg-white/10 hover:bg-white/20 text-white py-3 text-xs md:text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                      >
                        <Banknote size={16} />
                        {buyState === "loading" ? "..." : "خرید نقدی"}
                      </button>
                    )}

                    {/* Buy with Gold */}
                    {car.listedPriceGoldSot && (
                      <button 
                        onClick={() => handleBuy({ paymentAsset: "GOLD_SOT" })}
                        disabled={buyState !== "idle"}
                        className="w-full rounded-lg border border-[#D4AF37]/30 bg-transparent hover:bg-[#D4AF37]/10 py-3 text-xs md:text-sm font-bold text-[#D4AF37] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                      >
                         <Gem size={16} /> پرداخت با طلا
                      </button>
                    )}
                  </div>
                  
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
