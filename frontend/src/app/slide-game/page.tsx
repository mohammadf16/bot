"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Trophy, Users, Zap, Activity, History, Sparkles, Cpu, Target } from "lucide-react"
import toast from "react-hot-toast"

// --- MOCKED DEPENDENCIES FOR PREVIEW ENVIRONMENT ---
// These replace the missing imports from "@/lib/api", "@/lib/money", and "@/lib/auth-context"

const formatToman = (amount: number) => `${amount.toLocaleString("fa-IR")} تومان`

const useAuth = () => {
  return { user: { id: "test-user", chances: 25 } }
}

const apiRequest = async <T,>(url: string, options?: any, _config?: any): Promise<T> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800))

  if (url === "/slide/draw/current") {
    return {
      draw: {
        id: "draw-test-01",
        status: "processing", // CHANGE THIS TO "scheduled", "processing", or "drawn" TO TEST EFFECTS
        title: "قرعه‌کشی ویژه‌ی ماشین اسلاید",
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        participants: [
          { userId: "u1", fullName: "علی کاظمی", email: "ali@example.com", chances: 12 },
          { userId: "u2", fullName: "سارا رضایی", email: "sara@example.com", chances: 5 },
          { userId: "u3", fullName: "رضا محمدی", email: "reza@example.com", chances: 20 },
        ],
        prizes: [
          { title: "جایزه بزرگ ویژه", rankFrom: 1, rankTo: 1, amount: 50000000 },
          { title: "اعتبار هدیه", rankFrom: 2, rankTo: 5, amount: 2000000 },
        ],
        totalEntries: 37,
        seedCommitHash: "0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
        proof: null,
        targetNumber: 849302, // The final winning number
      }
    } as any
  }

  if (url === "/slide/draw/current/me") {
    return {
      drawId: "draw-test-01",
      status: "scheduled",
      myEntryNumbers: [123456, 987654],
      myEntriesCount: 2,
      availableChances: 25
    } as any
  }

  if (url.includes("/entries")) {
    const body = JSON.parse(options?.body || "{}")
    const chances = body.chancesToUse || 1
    const newNumbers = Array.from({ length: chances }, () => randomSixDigit())
    return {
      assignedNumbers: newNumbers,
      chancesUsed: chances,
      availableChances: 25 - chances,
      myEntriesCount: 2 + chances
    } as any
  }

  throw new Error("API Route Not Found")
}
// ---------------------------------------------------

interface Participant {
  userId: string
  fullName: string
  email: string
  chances: number
}

interface Prize {
  title: string
  rankFrom: number
  rankTo: number
  amount?: number
}

interface Winner {
  rank: number
  fullName: string
  winningNumber: number
  prize: { title: string; amount?: number }
}

interface DrawProof {
  algorithm: string
  seedCommitHash: string
  revealedServerSeed: string
  externalEntropy: string
  participantsHash: string
  generatedAt: string
}

interface DrawData {
  id: string
  status: "scheduled" | "processing" | "drawn" | "cancelled"
  title: string
  scheduledAt: string
  participants: Participant[]
  prizes: Prize[]
  totalEntries: number
  winningLogs?: Array<{ rank: number; winningNumber: number; fullName: string; userId: string; prize: Prize }>
  winners?: Winner[]
  targetNumber?: number
  seedCommitHash?: string
  proof?: DrawProof | null
}

interface MyEntriesData {
  drawId: string
  status: "scheduled" | "processing" | "drawn" | "cancelled"
  myEntryNumbers: number[]
  myEntriesCount: number
  availableChances: number
}

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]

function toFaDigits(value: string) {
  return value.replace(/\d/g, (digit) => FA_DIGITS[Number(digit)] ?? digit)
}

function formatChanceNumber(value: number) {
  const normalized = Math.max(0, Math.trunc(value))
  return toFaDigits(String(normalized).padStart(6, "0"))
}

function randomSixDigit() {
  return Math.floor(Math.random() * 1_000_000)
}

function formatProcessingTimer(valueMs: number) {
  const safeMs = Math.max(0, Math.trunc(valueMs))
  const totalSeconds = Math.floor(safeMs / 1000)
  const centiseconds = Math.floor((safeMs % 1000) / 10)
  const sec = String(totalSeconds).padStart(2, "0")
  const cs = String(centiseconds).padStart(2, "0")
  return toFaDigits(`${sec}.${cs}`)
}

function shiftFaDigit(digit: string, delta: number) {
  const index = FA_DIGITS.indexOf(digit)
  if (index < 0) return digit
  const normalized = (index + delta + 10) % 10
  return FA_DIGITS[normalized]
}

export default function SlideGamePage() {
  const { user } = useAuth()
  const [draw, setDraw] = useState<DrawData | null>(null)
  const [myEntries, setMyEntries] = useState<MyEntriesData | null>(null)
  const [chancesToUse, setChancesToUse] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data: { draw: DrawData } = await apiRequest("/slide/draw/current", { method: "GET" }, { auth: false })
      const incoming = data?.draw
      if (!incoming) {
        setDraw(null)
        setMyEntries(null)
        return
      }

      const normalized: DrawData = {
        ...incoming,
        participants: Array.isArray(incoming.participants) ? incoming.participants : [],
        prizes: Array.isArray(incoming.prizes) ? incoming.prizes : [],
        totalEntries: typeof incoming.totalEntries === "number" ? incoming.totalEntries : 0,
        winningLogs: Array.isArray(incoming.winningLogs) ? incoming.winningLogs : [],
        winners: Array.isArray(incoming.winners) ? incoming.winners : [],
        seedCommitHash: typeof incoming.seedCommitHash === "string" ? incoming.seedCommitHash : undefined,
        proof: incoming.proof && typeof incoming.proof === "object" ? incoming.proof : null,
      }
      setDraw(normalized)

      if (user && normalized.id) {
        try {
          const me = await apiRequest<MyEntriesData>("/slide/draw/current/me", { method: "GET" })
          setMyEntries({
            ...me,
            myEntryNumbers: Array.isArray(me.myEntryNumbers) ? me.myEntryNumbers : [],
            myEntriesCount: typeof me.myEntriesCount === "number" ? me.myEntriesCount : 0,
            availableChances: typeof me.availableChances === "number" ? me.availableChances : 0,
          })
        } catch {
          setMyEntries(null)
        }
      } else {
        setMyEntries(null)
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void load()
    const tick = setInterval(() => setNow(Date.now()), 1000)
    const poll = setInterval(() => void load(), 1000)
    return () => {
      clearInterval(tick)
      clearInterval(poll)
    }
  }, [load])

  async function submitChances() {
    if (!draw) return
    if (!user) return toast.error("برای ثبت شانس ابتدا وارد شوید")
    if (draw.status !== "scheduled") return toast.error("قرعه کشی باز نیست")
    if (!Number.isInteger(chancesToUse) || chancesToUse < 1) return toast.error("تعداد شانس نامعتبر است")

    setIsSubmitting(true)
    try {
      const res = await apiRequest<{
        assignedNumbers: number[]
        chancesUsed: number
        availableChances: number
        myEntriesCount: number
      }>(`/slide/draw/${draw.id}/entries`, {
        method: "POST",
        body: JSON.stringify({ chancesToUse }),
      })

      toast.success(`${res.chancesUsed.toLocaleString("fa-IR")} شانس ثبت شد`)
      setMyEntries((prev) => ({
        drawId: draw.id,
        status: draw.status,
        myEntryNumbers: [...(prev?.myEntryNumbers ?? []), ...res.assignedNumbers].sort((a, b) => a - b),
        myEntriesCount: res.myEntriesCount,
        availableChances: res.availableChances,
      }))
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت شانس انجام نشد")
    } finally {
      setIsSubmitting(false)
    }
  }

  const countdown = useMemo(() => {
    if (!draw || draw.status !== "scheduled") return null
    const diff = new Date(draw.scheduledAt).getTime() - now
    if (diff <= 0) return { h: "00", m: "00", s: "00", expired: true }
    const total = Math.floor(diff / 1000)
    const h = String(Math.floor(total / 3600)).padStart(2, "0")
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0")
    const s = String(total % 60).padStart(2, "0")
    return { h, m, s, expired: false }
  }, [draw, now])

  const countdownLabel = useMemo(() => {
    if (!countdown) return toFaDigits("00:00:00")
    return toFaDigits(`${countdown.h}:${countdown.m}:${countdown.s}`)
  }, [countdown])

  const mySortedNumbers = useMemo(
    () => [...(myEntries?.myEntryNumbers ?? [])].sort((a, b) => a - b),
    [myEntries?.myEntryNumbers],
  )

  if (loading) return <LoadingScreen />

  return (
    <main className="min-h-screen bg-[#020202] text-white pt-24 pb-20 px-4 selection:bg-cyan-500/30 relative overflow-x-hidden" dir="rtl">
      <BackgroundEffects />
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/5 border border-cyan-500/20 text-[10px] font-black tracking-[0.3em] text-cyan-400 mb-5 uppercase backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.2)]"
          >
            <ShieldCheck size={12} />
            Secure & Provably Fair
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[clamp(2.5rem,8vw,5.5rem)] font-[900] leading-[1.05] tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-800 drop-shadow-lg"
          >
            ماشین اسلاید
          </motion.h1>
          <p className="text-white/55 text-sm md:text-base max-w-2xl mx-auto">
            شماره شانس بگیر، تا زمان قرعه عددها را زنده ببین، و در لحظه قرعه یک شماره ۶ رقمی از بین شماره‌های ثبت‌شده قفل می‌شود.
          </p>
        </header>

        {draw ? (
          <div className="space-y-8">
            <section className="relative rounded-[2.4rem] p-[1px] bg-gradient-to-b from-cyan-500/20 via-white/5 to-transparent shadow-[0_20px_100px_-20px_rgba(0,0,0,0.9)] z-20">
              <div className="bg-[#050505]/95 backdrop-blur-3xl rounded-[2.35rem] p-6 md:p-12 relative overflow-hidden">
                <BackgroundStageLight status={draw.status} />
                
                {/* Status Indicator */}
                <div className="absolute top-6 left-6 md:top-8 md:left-8 z-30">
                  <StatusBadge status={draw.status} />
                </div>

                <h2 className="text-xl md:text-3xl font-black text-center mb-10 md:mb-12 relative z-10 text-white/90 drop-shadow-md">{draw.title}</h2>

                {draw.status === "scheduled" && (
                  <div className="w-full max-w-4xl mx-auto mb-10 p-5 md:p-6 rounded-3xl border border-cyan-500/30 bg-cyan-500/10 relative z-10 shadow-[inset_0_0_30px_rgba(34,211,238,0.05)]">
                    <div className="grid md:grid-cols-3 gap-4 items-end">
                      <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                        <p className="text-[11px] text-white/50 mb-1">شانس باقی مانده</p>
                        <p className="text-2xl font-black text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                          {(myEntries?.availableChances ?? user?.chances ?? 0).toLocaleString("fa-IR")}
                        </p>
                      </div>
                      <div>
                        <label className="text-[11px] text-white/50 mb-1 block">تعداد شانس برای این قرعه</label>
                        <input
                          type="number"
                          min={1}
                          value={chancesToUse}
                          onChange={(e) => setChancesToUse(Math.max(1, Number(e.target.value || 1)))}
                          className="w-full rounded-2xl bg-black/50 border border-cyan-500/30 px-4 py-3 text-base outline-none focus:border-cyan-400 focus:bg-cyan-950/30 transition-all font-mono text-center"
                        />
                      </div>
                      <button
                        onClick={() => void submitChances()}
                        disabled={isSubmitting}
                        className="h-[52px] rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black text-sm disabled:opacity-50 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {isSubmitting ? "در حال ثبت..." : "ثبت شانس و دریافت شماره"}
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-white/70">
                      <Target size={14} className="text-cyan-400" />
                      تعداد شماره‌های ثبت‌شده شما:{" "}
                      <span className="text-cyan-300 font-bold text-sm">{(myEntries?.myEntriesCount ?? 0).toLocaleString("fa-IR")} عدد</span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-[11px] text-white/60 mb-3 uppercase tracking-widest">شماره‌های شانس من</p>
                      {mySortedNumbers.length ? (
                        <div className="max-h-24 overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                          {mySortedNumbers.map((number) => (
                            <span key={number} className="font-mono text-[12px] px-2.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                              {formatChanceNumber(number)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-white/40 italic">هنوز شماره‌ای ثبت نشده است.</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="relative z-10 my-8">
                  <SlotMachineBoard
                    status={draw.status}
                    targetNumber={draw.targetNumber}
                    countdownLabel={countdownLabel}
                    isExpired={Boolean(countdown?.expired)}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full max-w-5xl mx-auto mt-12 border-t border-white/10 pt-8 relative z-10">
                  <MetricCard icon={<Users size={20} />} label="شرکت‌کننده" value={(draw.participants?.length ?? 0).toLocaleString("fa-IR")} />
                  <MetricCard icon={<Sparkles size={20} />} label="شماره ثبت شده" value={(draw.totalEntries ?? 0).toLocaleString("fa-IR")} />
                  <MetricCard icon={<Zap size={20} />} label="شانس کل" value={(draw.participants ?? []).reduce((sum, item) => sum + item.chances, 0).toLocaleString("fa-IR")} />
                  <MetricCard icon={<ShieldCheck size={20} />} label="فرمت عدد" value="۶ رقمی" />
                  <MetricCard icon={<Activity size={20} />} label="موتور تولید" value={draw.proof?.algorithm ?? "Provable RNG"} color="text-emerald-400" />
                </div>
              </div>
            </section>

            {/* Other Sections below... */}
            <div className="grid grid-cols-12 gap-6 md:gap-8">
              <ParticipantsList participants={draw.participants ?? []} />
              <PrizesList status={draw.status} prizes={draw.prizes ?? []} winners={draw.winners ?? []} />
            </div>

            {(draw.winningLogs?.length ?? 0) > 0 && (
              <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                  <History className="text-cyan-400" size={20}/> لاگ شفاف برندگان
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-right">
                    <thead>
                      <tr className="text-white/40 border-b border-white/10 text-xs uppercase tracking-wider">
                        <th className="py-3 px-3 font-medium">رتبه</th>
                        <th className="py-3 px-3 font-medium">شماره برنده</th>
                        <th className="py-3 px-3 font-medium">برنده</th>
                        <th className="py-3 px-3 font-medium">جایزه</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draw.winningLogs?.map((log) => (
                        <tr key={`${log.rank}-${log.winningNumber}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-3 font-black text-cyan-400">{log.rank.toLocaleString("fa-IR")}</td>
                          <td className="py-3 px-3 font-mono text-white/90 bg-white/5 rounded mx-2 inline-block my-1">{formatChanceNumber(log.winningNumber)}</td>
                          <td className="py-3 px-3 font-medium">{log.fullName || log.userId}</td>
                          <td className="py-3 px-3 text-amber-400 font-bold">
                            {log.prize.title}
                            {log.prize.amount ? ` - ${formatToman(log.prize.amount)}` : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="rounded-[2rem] border border-cyan-500/30 bg-cyan-950/20 p-6 md:p-8 space-y-4 shadow-[0_0_30px_rgba(34,211,238,0.05)] backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
              <h3 className="text-xl font-black text-cyan-400 flex items-center gap-2">
                <ShieldCheck size={24} /> اثبات غیرقابل دستکاری (Provably Fair)
              </h3>
              <p className="text-sm text-white/60 leading-relaxed max-w-4xl">
                تمام مراحل این قرعه‌کشی با الگوریتم‌های رمزنگاری شده و شفاف انجام می‌شود. هش تعهد قبل از شروع قرعه منتشر می‌شود و بعد از قرعه، seed واقعی سرور منتشر می‌شود تا نتیجه توسط هر کسی قابل بازبینی باشد.
              </p>
              
              <div className="grid lg:grid-cols-2 gap-4 text-xs mt-6 relative z-10">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-inner">
                  <p className="text-white/40 mb-2 uppercase tracking-widest text-[10px]">Seed Commit Hash</p>
                  <p className="font-mono break-all text-cyan-300 bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/20">{draw.seedCommitHash ?? "در انتظار..."}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-inner flex flex-col justify-center">
                  <p className="text-white/40 mb-2 uppercase tracking-widest text-[10px]">وضعیت اثبات</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${draw.status === "drawn" && draw.proof ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-amber-400 shadow-[0_0_10px_#fbbf24] animate-pulse"}`} />
                    <p className="text-white/90 font-bold text-sm">
                      {draw.status === "drawn" && draw.proof ? "منتشر شده و تایید شده" : "در انتظار پایان قرعه‌کشی..."}
                    </p>
                  </div>
                </div>
              </div>

              {draw.status === "drawn" && draw.proof && (
                <div className="grid md:grid-cols-2 gap-4 text-xs mt-4 relative z-10">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 shadow-inner">
                    <p className="text-emerald-400/60 mb-2 uppercase tracking-widest text-[10px]">Revealed Server Seed</p>
                    <p className="font-mono break-all text-emerald-300">{draw.proof.revealedServerSeed}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 shadow-inner">
                    <p className="text-amber-400/60 mb-2 uppercase tracking-widest text-[10px]">External Entropy (Block Hash)</p>
                    <p className="font-mono break-all text-amber-300">{draw.proof.externalEntropy}</p>
                  </div>
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4 shadow-inner md:col-span-2">
                    <p className="text-blue-400/60 mb-2 uppercase tracking-widest text-[10px]">Participants Hash</p>
                    <p className="font-mono break-all text-blue-200">{draw.proof.participantsHash}</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
      <GlobalStyles />
    </main>
  )
}

// --------------------------------------------------------------------------------
// Refined SlotMachineBoard - Cleaner, Less Exaggerated, with Countdown Timer
// --------------------------------------------------------------------------------
function SlotMachineBoard({
  status,
  targetNumber,
  countdownLabel,
  isExpired,
}: {
  status: "scheduled" | "processing" | "drawn" | "cancelled"
  targetNumber?: number
  countdownLabel: string
  isExpired: boolean
}) {
  const PROCESSING_DURATION_MS = 10_000
  const [rollingNumber, setRollingNumber] = useState(randomSixDigit())
  const [timeLeft, setTimeLeft] = useState(PROCESSING_DURATION_MS)
  
  const isProcessing = status === "processing"
  const isDrawn = status === "drawn"
  const countdownParts = countdownLabel.split(":")

  useEffect(() => {
    if (isDrawn && typeof targetNumber === "number") {
      setRollingNumber(targetNumber)
      return
    }
    if (status === "cancelled") return

    // Balanced rolling speed for smoother movement.
    const intervalMs = isProcessing ? 65 : 160
    const timer = setInterval(() => {
      setRollingNumber(randomSixDigit())
    }, intervalMs)
    
    return () => clearInterval(timer)
  }, [status, targetNumber, isProcessing, isDrawn])

  // Processing Countdown Timer Effect
  useEffect(() => {
    if (isProcessing) {
      setTimeLeft(PROCESSING_DURATION_MS)
      const start = Date.now()
      
      const countdownTimer = setInterval(() => {
        const passed = Date.now() - start
        setTimeLeft(Math.max(0, PROCESSING_DURATION_MS - passed))
      }, 30)
      
      return () => clearInterval(countdownTimer)
    }
  }, [isProcessing, PROCESSING_DURATION_MS])

  const displayNumber = isDrawn && typeof targetNumber === "number" ? targetNumber : rollingNumber
  const digits = formatChanceNumber(displayNumber).split("")
  const processingProgress = Math.max(0, Math.min(100, ((PROCESSING_DURATION_MS - timeLeft) / PROCESSING_DURATION_MS) * 100))
  const processingTimerLabel = formatProcessingTimer(timeLeft)

  return (
    <div className="flex flex-col items-center gap-8 py-8 md:py-14 relative w-full">
      {/* Soft Background Glow when drawn */}
      {isDrawn && (
        <motion.div 
          className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full z-0 pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1.2 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      )}

      {/* Container with a very subtle bounce during processing instead of aggressive shake */}
      <motion.div 
        className="flex items-center justify-center gap-2 sm:gap-3 md:gap-5 relative z-20" 
        dir="ltr"
        style={{ perspective: 1200 }}
        animate={isProcessing ? {
          y: [-1, 1, -1]
        } : {}}
        transition={isProcessing ? {
          duration: 0.15,
          repeat: Infinity,
          ease: "linear"
        } : {}}
      >
        {digits.map((digit, index) => (
          <SlotDigit key={index} digit={digit} index={index} status={status} />
        ))}
      </motion.div>

      {/* Control / Status Panel Below */}
      <div className="w-full max-w-3xl mx-auto relative z-20 mt-2">
        <AnimatePresence mode="wait">
          {status === "scheduled" && (
            <motion.div 
              key="scheduled"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="rounded-3xl border border-cyan-500/35 bg-cyan-950/25 p-4 md:p-5 backdrop-blur-xl shadow-[0_0_20px_rgba(34,211,238,0.08)]"
            >
              <p className="text-center text-[11px] md:text-xs text-cyan-200/80 font-black tracking-[0.24em] mb-3">
                شمارش معکوس شروع چرخش
              </p>
              {isExpired ? (
                <div className="text-center text-sm md:text-base text-white/75 font-bold bg-black/30 rounded-2xl px-4 py-3 border border-white/10">
                  آماده‌سازی موتور قرعه‌کشی...
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {countdownParts.map((part, index) => (
                    <div key={`count-${index}`} className="rounded-2xl border border-cyan-400/30 bg-black/40 py-3 md:py-4 text-center">
                      <p className="text-2xl md:text-3xl font-black font-mono text-cyan-200 tracking-wider">{part}</p>
                      <p className="text-[10px] text-white/50 mt-1">
                        {index === 0 ? "ساعت" : index === 1 ? "دقیقه" : "ثانیه"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {status === "processing" && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
              className="rounded-3xl border border-amber-500/45 bg-amber-950/25 p-4 md:p-5 text-amber-200 shadow-[0_0_20px_-5px_rgba(251,191,36,0.3)] backdrop-blur-xl"
            >
              <div className="flex items-center justify-center gap-3 mb-3 text-sm md:text-base font-black">
                <Cpu size={20} className="animate-spin" />
                <span>در حال پردازش تصادفی</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-black/35 px-4 py-3 rounded-2xl border border-amber-500/30 font-mono text-2xl md:text-3xl tracking-widest mb-3">
                <span>{processingTimerLabel}</span>
                <span className="text-xs text-amber-200/70 font-sans">ثانیه</span>
              </div>
              <div className="h-2 w-full rounded-full bg-black/40 border border-amber-500/20 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-300 to-amber-500"
                  animate={{ width: `${processingProgress}%` }}
                  transition={{ duration: 0.1, ease: "linear" }}
                />
              </div>
            </motion.div>
          )}

          {status === "drawn" && (
            <motion.div 
              key="drawn"
              initial={{ opacity: 0, scale: 0.8, filter: "blur(5px)" }} 
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ type: "spring", damping: 15, delay: 0.8 }} // Shows up shortly after numbers lock
              className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-cyan-600/80 to-blue-600/80 border border-cyan-400/40 text-white shadow-[0_0_30px_rgba(34,211,238,0.4)] backdrop-blur-xl"
            >
              <Trophy size={22} className="text-yellow-300" />
              <span className="font-black text-lg md:text-xl tracking-widest drop-shadow-md">شماره برنده قفل شد!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function SlotDigit({ digit, index, status }: { digit: string; index: number; status: string }) {
  const isDrawn = status === "drawn"
  const isProcessing = status === "processing"
  const upperDigit = shiftFaDigit(digit, -1)
  const lowerDigit = shiftFaDigit(digit, 1)

  return (
    <div 
      className={`relative w-14 h-20 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-2xl md:rounded-3xl border flex items-center justify-center font-mono text-4xl sm:text-6xl md:text-7xl font-black z-10 overflow-hidden transition-colors duration-500
      ${isDrawn 
        ? 'border-cyan-400/80 bg-cyan-950/80 shadow-[0_0_30px_rgba(34,211,238,0.4)] text-white' 
        : isProcessing 
          ? 'border-amber-500/40 bg-black shadow-[0_0_15px_rgba(251,191,36,0.2)] text-amber-400' 
          : 'border-white/15 bg-white/[0.03] shadow-xl text-white/70'}
    `}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      <motion.div
        key={isDrawn ? `drawn-${index}-${digit}` : `roll-${index}-${digit}`}
        className="relative z-20"
        initial={isDrawn ? { 
          rotateX: -90, // Milder rotation
          scale: 1.2, 
          y: -40, 
          opacity: 0,
          filter: "blur(4px)",
        } : false}
        animate={{ 
          rotateX: 0, 
          scale: 1, 
          y: 0, 
          opacity: 1,
          filter: "blur(0px)",
          color: isDrawn ? "#a5f3fc" : undefined
        }}
        transition={
          isDrawn 
            ? { 
                type: "spring", 
                stiffness: 200, 
                damping: 15, 
                delay: index * 0.1 // Faster, smoother cascade
              } 
            : { duration: isProcessing ? 0.12 : 0.18, ease: "easeOut" }
        }
      >
        <span className="relative drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{digit}</span>
      </motion.div>

      {!isDrawn && (
        <>
          <span className="absolute top-2 md:top-3 text-base md:text-xl text-white/20 font-mono">{upperDigit}</span>
          <span className="absolute bottom-2 md:bottom-3 text-base md:text-xl text-white/20 font-mono">{lowerDigit}</span>
        </>
      )}
      
      {/* 3D Glass Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/60 pointer-events-none rounded-2xl md:rounded-3xl mix-blend-overlay z-30" />
      <div className="absolute top-0 inset-x-0 h-1/4 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-2xl md:rounded-t-3xl z-30" />

      {/* Gentle scanner line during processing */}
      {isProcessing && (
        <motion.div
          className="absolute left-0 right-0 h-[2px] bg-amber-400/60 shadow-[0_0_8px_#fbbf24] z-40"
          animate={{ top: ["-10%", "110%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: index * 0.2 }}
        />
      )}

      {/* Subtle Flash when the digit locks in */}
      {isDrawn && (
        <motion.div
          className="absolute inset-0 bg-cyan-200/40 z-50 rounded-2xl md:rounded-3xl"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
        />
      )}
    </div>
  )
}
// --------------------------------------------------------------------------------

function BackgroundStageLight({ status }: { status: "scheduled" | "processing" | "drawn" | "cancelled" }) {
  const isProcessing = status === "processing"
  const isDrawn = status === "drawn"

  return (
    <motion.div
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-[150px] rounded-full pointer-events-none transition-colors duration-1000
        ${isDrawn ? "bg-cyan-500/20" : isProcessing ? "bg-amber-600/15" : "bg-cyan-600/10"}
      `}
      animate={isProcessing ? {
        scale: [1, 1.05, 1],
        opacity: [0.5, 0.7, 0.5]
      } : isDrawn ? {
        scale: [0.9, 1.1, 1],
        opacity: [0.5, 0.8, 0.6]
      } : {}}
      transition={{ duration: isProcessing ? 1 : 2, repeat: isProcessing ? Infinity : 0 }}
    />
  )
}

function StatusBadge({ status }: { status: "scheduled" | "processing" | "drawn" | "cancelled" }) {
  const tone =
    status === "scheduled"
      ? "bg-cyan-500 shadow-[0_0_10px_#06b6d4]"
      : status === "processing"
        ? "bg-amber-500 shadow-[0_0_15px_#fbbf24] animate-pulse"
        : status === "drawn"
          ? "bg-cyan-400 shadow-[0_0_15px_#22d3ee]"
          : "bg-rose-500"
          
  const label =
    status === "scheduled"
      ? "ثبت‌نام باز است"
      : status === "processing"
        ? "در حال پردازش..."
        : status === "drawn"
          ? "نتایج نهایی"
          : "لغو شده"

  return (
    <div className="inline-flex items-center gap-2 md:gap-3 bg-black/60 px-4 md:px-5 py-2 rounded-full border border-white/10 backdrop-blur-xl">
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 md:h-3 md:w-3 ${tone}`} />
      <span className="text-[10px] md:text-xs font-black tracking-widest text-white/90 uppercase">{label}</span>
    </div>
  )
}

function ParticipantsList({ participants }: { participants: Participant[] }) {
  return (
    <div className="col-span-12 lg:col-span-7">
      <div className="bg-black/40 border border-white/10 rounded-[2rem] p-6 md:p-8 h-[560px] flex flex-col relative overflow-hidden backdrop-blur-md shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 rounded-xl text-cyan-400 border border-cyan-500/30">
              <Users size={20} />
            </div>
            لیدربورد شانس
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {participants.map((participant, index) => (
            <div
              key={participant.userId}
              className="p-4 bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-white/5 rounded-2xl flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center font-black text-white/40 text-sm group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors">
                  {(index + 1).toLocaleString("fa-IR")}
                </div>
                <div>
                  <p className="font-bold text-base text-white/90">{participant.fullName}</p>
                  <p className="text-[11px] text-white/40 font-mono mt-0.5">{participant.email.split("@")[0]}***</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">شانس ثبت شده</p>
                <p className="text-xl font-black text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.4)]">{participant.chances.toLocaleString("fa-IR")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PrizesList({ status, prizes, winners }: { status: string; prizes: Prize[]; winners?: Winner[] }) {
  return (
    <div className="col-span-12 lg:col-span-5">
      <div className="bg-gradient-to-br from-amber-500/10 via-black/40 to-black/60 border border-amber-500/20 rounded-[2rem] p-6 md:p-8 h-full relative overflow-hidden backdrop-blur-md shadow-[inset_0_0_30px_rgba(251,191,36,0.05)]">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-8 relative z-10">
          <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
            <Trophy size={20} />
          </div>
          <h3 className="text-xl font-black text-white">جوایز تعیین شده</h3>
        </div>

        <div className="space-y-4 relative z-10">
          {status === "drawn" && winners
            ? winners.map((winner) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  key={winner.rank} 
                  className="p-5 bg-gradient-to-l from-amber-500/20 to-black/60 border border-amber-500/50 rounded-2xl shadow-[0_0_20px_rgba(251,191,36,0.1)]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-black text-lg text-white drop-shadow-md">{winner.fullName}</p>
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-black rounded border border-amber-500/30">رتبه {winner.rank.toLocaleString("fa-IR")}</span>
                  </div>
                  <p className="text-sm text-amber-200/90 font-medium">
                    {winner.prize.title}
                  </p>
                  {winner.prize.amount && (
                    <p className="text-lg font-black text-amber-400 mt-2">{formatToman(winner.prize.amount)}</p>
                  )}
                  <div className="mt-3 inline-block font-mono text-xs px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-cyan-300">
                    شماره: {formatChanceNumber(winner.winningNumber)}
                  </div>
                </motion.div>
              ))
            : prizes.map((prize, index) => (
                <div key={index} className="p-5 bg-black/40 hover:bg-black/60 transition-colors border border-white/10 rounded-2xl flex flex-col justify-between gap-2 group">
                  <span className="text-base font-bold text-white/80 group-hover:text-white transition-colors">{prize.title}</span>
                  {prize.amount && <span className="text-xl font-black text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">{formatToman(prize.amount)}</span>}
                </div>
              ))}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, color = "text-white" }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center text-center shadow-inner hover:bg-white/[0.02] transition-colors">
      <div className="text-white/30 mb-3">{icon}</div>
      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">{label}</p>
      <p className={`text-xl md:text-2xl font-black drop-shadow-md ${color}`}>{value}</p>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-cyan-500/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Cpu className="text-cyan-400 animate-pulse" size={24} />
          </div>
        </div>
        <p className="text-cyan-400 text-sm font-black tracking-[0.3em] uppercase animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">Initializing System</p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-40 text-center rounded-[2.5rem] bg-black/40 border border-white/10 backdrop-blur-md">
      <div className="inline-flex p-6 rounded-full bg-white/5 mb-8">
        <History size={48} className="text-white/20" />
      </div>
      <h2 className="text-3xl font-black text-white/30 uppercase tracking-widest italic drop-shadow-sm">در انتظار تخصیص رویداد</h2>
    </motion.div>
  )
}

function BackgroundEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-cyan-600/10 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '10s', animationDirection: 'reverse' }} />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-[#020202]/50" />
    </div>
  )
}

function GlobalStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.2); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34,211,238,0.4); }
        `,
      }}
    />
  )
}
