"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import {
  History,
  Sparkles,
  Trophy,
  Wallet,
  Zap,
  Star,
  Lock,
  ChevronLeft,
  Volume2,
  VolumeX,
  AlertCircle
} from "lucide-react"
import toast from "react-hot-toast"
import confetti from "canvas-confetti"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

const formatToman = (amount: number) => amount.toLocaleString("fa-IR")

// --- Types ---
interface WheelSegment {
  label: string
  weight: number
  color?: string
  textColor?: string
}

interface WheelConfig {
  wheelCostChances: number
  segments: WheelSegment[]
}

interface WheelTier {
  enabled: boolean
  costAsset: string
  costAmount: number
  segments: WheelSegment[]
}

interface WheelConfigResponse {
  config: WheelConfig
  tiers: {
    normal: WheelTier
    gold: WheelTier
    jackpot: WheelTier
  }
}

interface WheelSpinRecord {
  id: string
  label: string
  win: boolean
  amount?: number
  chancesDelta?: number
  createdAt: string
}

// --- Constants ---
const SPIN_DURATION = 5 // ثانیه
const MIN_SPINS = 5 // حداقل تعداد دور کامل

// پالت رنگی مدرن و نئونی
const PALETTE = [
  "#F43F5E", // Rose
  "#8B5CF6", // Violet
  "#0EA5E9", // Sky
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#6366F1", // Indigo
  "#14B8A6", // Teal
]

// --- Helper Components ---

/**
 * کامپوننت رسم کننده هر قاچ گردونه
 * بازطراحی شده با SVG خالص برای شارپ بودن متن‌ها
 */
const WheelSlice = ({
  index,
  total,
  segment,
}: {
  index: number
  total: number
  segment: WheelSegment
}) => {
  const angle = 360 / total
  const rotation = index * angle
  
  const radius = 50 
  const center = 50

  // تبدیل زاویه به رادیان
  const startAngleRad = (rotation - 90) * (Math.PI / 180)
  const endAngleRad = (rotation + angle - 90) * (Math.PI / 180)

  const x1 = center + radius * Math.cos(startAngleRad)
  const y1 = center + radius * Math.sin(startAngleRad)
  const x2 = center + radius * Math.cos(endAngleRad)
  const y2 = center + radius * Math.sin(endAngleRad)

  // مسیر رسم قاچ
  const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`

  // زاویه وسط برای چرخش متن
  const midAngle = (rotation - 90) + (angle / 2)
  
  // منطق خوانایی (فلیپ کردن متن در سمت چپ)
  const normalizedAngle = (midAngle + 360) % 360
  const shouldFlip = normalizedAngle > 90 && normalizedAngle < 270

  // محاسبه پوزیشن متن در فضای قطبی
  const textRadius = 32 // فاصله از مرکز (0 تا 50)
  
  return (
    <g className="hover:opacity-90 transition-opacity">
      {/* خود اسلایس */}
      <path 
        d={d} 
        fill={segment.color} 
        stroke="rgba(255,255,255,0.15)" // خط جداکننده شیشه‌ای
        strokeWidth="0.5"
      />
      
      {/* متن با استفاده از SVG Text استاندارد (بسیار شارپ‌تر از HTML) */}
      <g transform={`rotate(${midAngle}, ${center}, ${center})`}>
        <text
          x={center + textRadius}
          y={center}
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
          transform={shouldFlip ? `rotate(180, ${center + textRadius}, ${center})` : undefined}
          style={{
            fontSize: '3.5px',
            fontWeight: 800,
            fontFamily: 'var(--font-sans)',
            filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))', // سایه نرم فقط برای خوانایی
          }}
        >
          {/* محدود کردن طول متن به صورت دستی یا نمایش کوتاه */}
          {segment.label.length > 15 ? segment.label.substring(0, 14) + ".." : segment.label}
        </text>
        
        {/* آیکون جایزه ویژه اگر وزن کمی داشته باشد */}
        {segment.weight > 0 && segment.weight < 5 && (
           <text
             x={center + textRadius}
             y={center + 5} // کمی پایین‌تر از متن
             fontSize="3px"
             textAnchor="middle"
             transform={shouldFlip ? `rotate(180, ${center + textRadius}, ${center + 5})` : undefined}
           >
             ⭐
           </text>
        )}
      </g>
    </g>
  )
}

// --- Main Page Component ---

export default function WheelPage() {
  const { user, refreshMe, isAuthenticated } = useAuth()
  const controls = useAnimation()
  
  // تعریف تایپ‌های State
  const [config, setConfig] = useState<WheelConfig | null>(null)
  const [history, setHistory] = useState<WheelSpinRecord[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [lastResult, setLastResult] = useState<WheelSpinRecord | null>(null)
  const [currentRotation, setCurrentRotation] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [tier, setTier] = useState<"normal" | "gold" | "jackpot">("normal")
  const [tiers, setTiers] = useState<WheelConfigResponse["tiers"] | null>(null)

  // تعریف تایپ Ref
  const spinSound = useRef<HTMLAudioElement | null>(null)
  const winSound = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      spinSound.current = new Audio("/sounds/spin.mp3") 
      winSound.current = new Audio("/sounds/win.mp3")
      
      if(spinSound.current) spinSound.current.volume = 0.5
      if(winSound.current) winSound.current.volume = 0.6
    }
  }, [])

  const loadData = useCallback(async () => {
    try {
      const [cData, hData] = await Promise.all([
        apiRequest<WheelConfigResponse>("/wheel/config", { method: "GET" }, { auth: false }),
        isAuthenticated
          ? apiRequest<{ items: WheelSpinRecord[] }>("/wheel/history", { method: "GET" })
          : Promise.resolve({ items: [] as WheelSpinRecord[] }),
      ])
      setTiers(cData.tiers)

      const selectedTier = cData?.tiers?.[tier]
      const segmentsData = selectedTier?.segments || cData?.config?.segments || [
        { label: "100 سکه", weight: 10 },
        { label: "پوچ", weight: 10 },
        { label: "5000 تومان", weight: 5 },
        { label: "آیفون 13", weight: 1 },
        { label: "گردونه رایگان", weight: 10 },
        { label: "20 امتیاز", weight: 10 },
      ]

      const coloredSegments = segmentsData.map((s, i) => ({
        ...s,
        color: s.color || PALETTE[i % PALETTE.length],
      }))

      setConfig({ 
          wheelCostChances: selectedTier?.costAmount || cData?.config?.wheelCostChances || 1,
          segments: coloredSegments 
      })
      
      if(hData?.items) setHistory(hData.items)

    } catch (err) {
      console.error(err)
      toast.error("خطا در دریافت اطلاعات گردونه")
    }
  }, [isAuthenticated, tier])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const chances = user?.chances ?? 0
  const balance = user?.walletBalance ?? 0
  const selectedTier = tiers?.[tier]
  const canSpin = useMemo(
    () => {
      if (!config || !isAuthenticated || isSpinning || !selectedTier?.enabled) return false
      if (selectedTier.costAsset === "IRR") return balance >= selectedTier.costAmount
      return chances >= selectedTier.costAmount
    },
    [config, isAuthenticated, isSpinning, selectedTier, balance, chances]
  )

  const handleSpin = async () => {
    if (!canSpin || !config) return

    setIsSpinning(true)
    setLastResult(null)
    
    if (soundEnabled && spinSound.current) {
        spinSound.current.currentTime = 0
        spinSound.current.loop = true
        spinSound.current.play().catch(() => {})
    }

    try {
      const { result } = await apiRequest<{ result: WheelSpinRecord }>("/wheel/spin", {
        method: "POST",
        body: JSON.stringify({ tier }),
      })

      const segmentCount = config.segments.length
      const segmentAngle = 360 / segmentCount
      
      const winnerIndex = config.segments.findIndex((s) => s.label === result.label)
      const targetIndex = winnerIndex !== -1 ? winnerIndex : 0

      // ناحیه امن (محاسبه دقیق)
      const safeZone = segmentAngle * 0.8 
      const randomOffset = (Math.random() * safeZone) - (safeZone / 2)

      const targetWedgeCenter = (targetIndex * segmentAngle) + (segmentAngle / 2)
      const rotationNeeded = 360 - targetWedgeCenter
      const extraSpins = 360 * MIN_SPINS
      
      const finalRotation = currentRotation + extraSpins + rotationNeeded + randomOffset

      await controls.start({
        rotate: finalRotation,
        transition: {
          duration: SPIN_DURATION,
          ease: [0.15, 0, 0.15, 1], // افکت ترمز واقعی‌تر
        },
      })

      setCurrentRotation(finalRotation)
      setLastResult(result)
      
      if (soundEnabled) {
          if (spinSound.current) {
              spinSound.current.pause()
              spinSound.current.currentTime = 0
          }
          if (winSound.current && result.win) {
              winSound.current.play().catch(() => {})
          }
      }
      
      if(result.win) {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#F59E0B", "#EC4899", "#10B981"],
            zIndex: 9999
          })
          toast.success(`تبریک! برنده ${result.label} شدید`, {
             icon: '🎉',
             style: { background: '#10B981', color: '#fff' }
          })
      } else {
         toast.error('متاسفانه پوچ بود!', { icon: '😢' })
      }

      await refreshMe()
      await loadData()

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در برقراری ارتباط با سرور")
      if (soundEnabled && spinSound.current) spinSound.current.pause()
    } finally {
      setIsSpinning(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 pb-20 overflow-x-hidden relative" dir="rtl">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-900/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-900/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10 space-y-12">
        
        {/* --- Header --- */}
        <header className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 md:p-6 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
             <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 rotate-3 shrink-0 ring-1 ring-white/20">
                  <Sparkles className="text-white w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">گردونه شانس</h1>
                  <p className="text-white/40 text-sm font-medium mt-1">شانس خودت رو برای جوایز میلیونی امتحان کن</p>
                </div>
             </div>

             <div className="flex flex-wrap items-center gap-3">
               <div className="h-12 px-5 rounded-2xl bg-[#0F0F11] border border-white/5 flex items-center gap-3 shadow-inner">
                 <Wallet className="text-emerald-400 w-5 h-5" />
                 <div className="flex flex-col">
                   <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">موجودی</span>
                   <span className="font-mono font-bold text-white">{formatToman(balance)}</span>
                 </div>
               </div>
               
               <div className="h-12 px-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                 <Zap className="text-amber-500 w-5 h-5 animate-pulse" />
                 <div className="flex flex-col">
                   <span className="text-[10px] text-amber-500/60 font-bold uppercase tracking-wider">شانس</span>
                   <span className="font-mono font-bold text-amber-500 text-lg">{chances.toLocaleString("fa-IR")}</span>
                 </div>
               </div>

               <button 
                 onClick={() => setSoundEnabled(!soundEnabled)}
                 className="w-12 h-12 rounded-2xl bg-[#0F0F11] border border-white/5 flex items-center justify-center hover:bg-white/5 transition-colors shrink-0 text-white/50 hover:text-white"
               >
                 {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
               </button>
             </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 md:gap-3">
            {(["normal", "gold", "jackpot"] as const).map((t) => {
              const isActive = tier === t
              const item = tiers?.[t]
              return (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`rounded-2xl border px-3 py-2 text-right transition ${
                    isActive ? "border-violet-400 bg-violet-500/10" : "border-white/10 bg-[#0F0F11]"
                  }`}
                >
                  <p className="text-sm font-black">{t === "normal" ? "گردونه معمولی" : t === "gold" ? "گردونه طلایی" : "گردونه جکپات"}</p>
                  <p className="text-[11px] text-white/50 mt-1">
                    هزینه: {(item?.costAmount ?? config?.wheelCostChances ?? 0).toLocaleString("fa-IR")} {item?.costAsset ?? "CHANCE"}
                  </p>
                  {item && !item.enabled ? <p className="text-[10px] text-rose-400 mt-1">غیرفعال</p> : null}
                </button>
              )
            })}
          </div>
        </header>

        <div className="grid lg:grid-cols-[1fr,380px] gap-12 items-start">
          
          {/* --- Wheel Section --- */}
          <div className="flex flex-col items-center justify-center">
            
            <div className="relative w-full max-w-[420px] aspect-square mx-auto mb-12 group">
              
              {/* Glow Behind */}
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-fuchsia-600/20 rounded-full blur-[60px] animate-pulse" />

              {/* Wheel Case (Ring) */}
              <div className="w-full h-full relative z-10 p-2">
                {/* Metallic Ring */}
                <div className="absolute inset-0 rounded-full bg-[#18181b] shadow-2xl border-[12px] border-[#27272a] ring-1 ring-white/5" />
                
                {/* Ticks (نشانگرهای دور حلقه) */}
                <div className="absolute inset-3 rounded-full border border-dashed border-white/10" />
                {[...Array(12)].map((_, i) => (
                    <div 
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-white/30 rounded-full top-0 left-1/2 -ml-[3px]"
                        style={{ 
                            transformOrigin: `center ${210}px`, // تقریبی نصف عرض کانتینر
                            transform: `rotate(${i * 30}deg)`
                        }}
                    />
                ))}

                {/* Pointer (نشانگر اصلی) - طراحی نئونی */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 filter drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                    <div className="w-10 h-12 bg-[#09090b] clip-path-marker flex flex-col items-center pt-1 border-t-4 border-amber-500">
                       <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_10px_#f59e0b]" />
                       <div className="w-0.5 h-full bg-gradient-to-b from-amber-500/50 to-transparent mt-1" />
                    </div>
                </div>

                {/* Spinning Part */}
                <motion.div
                  className="w-full h-full relative rounded-full overflow-hidden border-[6px] border-[#09090b] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"
                  animate={controls}
                  initial={{ rotate: 0 }}
                  style={{ transformOrigin: "center" }}
                >
                  {config ? (
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full"
                      style={{ filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.3))' }}
                    >
                      <circle cx="50" cy="50" r="50" fill="#18181b" />
                      
                      {config.segments.map((segment, i) => (
                        <WheelSlice
                          key={i}
                          index={i}
                          total={config.segments.length}
                          segment={segment}
                        />
                      ))}
                    </svg>
                  ) : (
                    <div className="w-full h-full bg-[#18181b] animate-pulse rounded-full flex items-center justify-center">
                       <div className="w-16 h-16 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
                    </div>
                  )}
                </motion.div>

                {/* Center Hub (توپی وسط) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#18181b] rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.5)] border-4 border-[#27272a] flex items-center justify-center z-20">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#27272a] to-[#09090b] rounded-full flex items-center justify-center shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20" />
                        <Star className="w-6 h-6 text-amber-500 fill-amber-500 animate-pulse" />
                    </div>
                </div>
              </div>
            </div>

            {/* Spin Button */}
            <div className="relative z-20 w-full max-w-[280px]">
              {isAuthenticated ? (
                <button
                  onClick={handleSpin}
                  disabled={!canSpin}
                  className={`
                    w-full relative group py-5 rounded-2xl font-black text-xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(139,92,246,0.3)]
                    transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 animate-gradient-xy" />
                  <div className="absolute inset-[2px] bg-[#09090b] rounded-[14px] flex items-center justify-center z-10" />
                  
                  <div className="relative z-20 flex flex-col items-center justify-center gap-1">
                    <span className="flex items-center gap-2 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-fuchsia-400 transition-all">
                       {isSpinning ? "در حال چرخش..." : "شروع چرخش"}
                       {!isSpinning && <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-white" />}
                    </span>
                    {!isSpinning && config && (
                      <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                          هزینه: <span className="text-violet-400">{config.wheelCostChances} شانس</span>
                      </div>
                    )}
                  </div>
                </button>
              ) : (
                 <div className="bg-[#18181b] border border-white/5 p-5 rounded-2xl text-center shadow-lg">
                    <Lock className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">لطفاً برای شرکت در بازی وارد شوید</p>
                 </div>
              )}
            </div>
          </div>

          {/* --- Sidebar Info --- */}
          <div className="space-y-6">
            
            {/* Last Result Card */}
            <AnimatePresence mode="wait">
               {lastResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-6 rounded-3xl relative overflow-hidden text-center border shadow-lg ${
                        lastResult.win 
                        ? 'bg-[#0f1d16] border-emerald-500/20' 
                        : 'bg-[#1f1212] border-red-500/20'
                    }`}
                  >
                     <div className="relative z-10">
                        {lastResult.win ? (
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 ring-1 ring-emerald-500/20">
                                <Trophy className="w-6 h-6 text-emerald-400" />
                            </div>
                        ) : (
                            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3 ring-1 ring-red-500/20">
                                <AlertCircle className="w-6 h-6 text-red-400" />
                            </div>
                        )}
                        <h3 className={`font-bold text-xs uppercase tracking-widest mb-1 ${lastResult.win ? 'text-emerald-400' : 'text-red-400'}`}>
                            {lastResult.win ? 'تبریک!' : 'متاسفانه'}
                        </h3>
                        <div className="text-2xl md:text-3xl font-black text-white">
                            {lastResult.label}
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>

            {/* History Card */}
            <div className="bg-[#0F0F11] border border-white/5 rounded-3xl overflow-hidden flex flex-col h-[500px] shadow-xl">
              <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
                <h3 className="font-bold flex items-center gap-2 text-gray-200">
                  <History className="text-violet-500 w-5 h-5" />
                  تاریخچه چرخش‌ها
                </h3>
                <span className="text-xs bg-white/5 px-2.5 py-1 rounded-lg text-gray-400 font-mono">
                    {history.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-3">
                        <History className="w-10 h-10 opacity-20" />
                        <span className="text-sm">هنوز چرخشی انجام نداده‌اید</span>
                    </div>
                ) : (
                    history.map((item, i) => (
                    <motion.div
                        key={item.id || i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-3.5 rounded-2xl bg-[#18181b] hover:bg-[#202024] border border-white/5 transition-all group flex items-center justify-between"
                    >
                        <div className="flex flex-col gap-1">
                           <span className="font-bold text-sm text-gray-300 group-hover:text-white transition-colors">
                               {item.label}
                           </span>
                           <span className="text-[10px] text-gray-600 font-medium font-mono">
                               {item.createdAt ? new Date(item.createdAt).toLocaleTimeString("fa-IR") : "--:--"}
                           </span>
                        </div>
                        <div className={`
                            px-2.5 py-1 rounded-lg text-[10px] font-bold border 
                            ${item.win 
                                ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' 
                                : 'bg-red-500/5 border-red-500/10 text-red-500'
                            }
                        `}>
                        {item.win ? "بـرد" : "باخت"}
                        </div>
                    </motion.div>
                    ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx global>{`
         .clip-path-marker {
            clip-path: polygon(0% 0%, 100% 0%, 50% 100%);
         }
         .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
         }
         .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.02);
         }
         .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #27272a;
            border-radius: 10px;
         }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
             background: #3f3f46;
         }
         @keyframes gradient-xy {
             0%, 100% { background-position: 0% 50% }
             50% { background-position: 100% 50% }
         }
         .animate-gradient-xy {
             background-size: 200% 200%;
             animation: gradient-xy 3s ease infinite;
         }
      `}</style>
    </main>
  )
}
