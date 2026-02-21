"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence, useSpring, useTransform, cubicBezier } from "framer-motion"
import { ShieldCheck, Trophy, Users, Zap, Cpu, Activity, History, Sparkles } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { formatToman } from "@/lib/money"
import { useAuth } from "@/lib/auth-context"
import toast from "react-hot-toast"

type UrgencyLevel = "calm" | "warning" | "critical"
interface Participant { userId: string; fullName: string; email: string; chances: number }
interface Prize { title: string; rankFrom: number; rankTo: number; amount?: number }
interface Winner { rank: number; fullName: string; winningNumber: number; prize: { title: string; amount?: number } }
interface DrawData {
  id: string
  status: "scheduled" | "processing" | "drawn"
  title: string
  scheduledAt: string
  participants: Participant[]
  prizes: Prize[]
  totalEntries: number
  winningLogs?: Array<{ rank: number; winningNumber: number; fullName: string; userId: string; prize: Prize }>
  winners?: Winner[]
  targetNumber?: number
}
interface MyEntriesData {
  drawId: string
  status: "scheduled" | "processing" | "drawn"
  myEntryNumbers: number[]
  myEntriesCount: number
  availableChances: number
}

const getUrgencyState = (totalSeconds: number): { level: UrgencyLevel; color: string } => {
  if (totalSeconds <= 10) return { level: "critical", color: "#ef4444" }
  if (totalSeconds <= 60) return { level: "warning", color: "#f59e0b" }
  return { level: "calm", color: "#06b6d4" }
}

export default function SlideGamePage() {
  const { user } = useAuth()
  const [draw, setDraw] = useState<DrawData | null>(null)
  const [myEntries, setMyEntries] = useState<MyEntriesData | null>(null)
  const [chancesToUse, setChancesToUse] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const isDrawingRef = useRef(false)

  async function load() {
    if (isDrawingRef.current) return
    try {
      const data: { draw: DrawData } = await apiRequest("/slide/draw/current", { method: "GET" }, { auth: false })
      const incomingDraw = data?.draw
      if (!incomingDraw) {
        setDraw(null)
        setMyEntries(null)
        return
      }
      const normalizedDraw: DrawData = {
        ...incomingDraw,
        participants: Array.isArray(incomingDraw.participants) ? incomingDraw.participants : [],
        prizes: Array.isArray(incomingDraw.prizes) ? incomingDraw.prizes : [],
        totalEntries: typeof incomingDraw.totalEntries === "number" ? incomingDraw.totalEntries : 0,
        winningLogs: Array.isArray(incomingDraw.winningLogs) ? incomingDraw.winningLogs : [],
        winners: Array.isArray(incomingDraw.winners) ? incomingDraw.winners : [],
      }
      if (draw && draw.status !== "drawn" && normalizedDraw.status === "drawn") {
        isDrawingRef.current = true
        setTimeout(() => { isDrawingRef.current = false }, 8000)
      }
      setDraw(normalizedDraw)
      if (user && normalizedDraw.id) {
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
      } else setMyEntries(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const t = setInterval(() => setNow(Date.now()), 1000)
    const r = setInterval(() => void load(), 3000)
    return () => { clearInterval(t); clearInterval(r) }
  }, [user])

  async function submitChances() {
    if (!draw) return
    if (!user) return toast.error("برای ثبت شانس ابتدا وارد شوید")
    if (draw.status !== "scheduled") return toast.error("قرعه کشی باز نیست")
    if (!Number.isInteger(chancesToUse) || chancesToUse < 1) return toast.error("تعداد شانس نامعتبر است")
    setIsSubmitting(true)
    try {
      const res = await apiRequest<{ assignedNumbers: number[]; chancesUsed: number; availableChances: number; myEntriesCount: number }>(`/slide/draw/${draw.id}/entries`, {
        method: "POST", body: JSON.stringify({ chancesToUse }),
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ثبت شانس انجام نشد")
    } finally { setIsSubmitting(false) }
  }

  const countdownState = useMemo(() => {
    if (!draw || draw.status !== "scheduled") return null
    const diff = new Date(draw.scheduledAt).getTime() - now
    if (diff <= 0) return { h: "00", m: "00", s: "00", totalSeconds: 0, expired: true, urgency: { level: "critical" as UrgencyLevel, color: "#ef4444" } }
    const sec = Math.floor(diff / 1000)
    return { h: String(Math.floor(sec / 3600)).padStart(2, "0"), m: String(Math.floor((sec % 3600) / 60)).padStart(2, "0"), s: String(sec % 60).padStart(2, "0"), totalSeconds: sec, expired: false, urgency: getUrgencyState(sec) }
  }, [draw, now])

  const progressMetrics = useMemo(() => {
    if (!countdownState || countdownState.expired) return { percent: 100, color: "#ef4444", isCritical: true }
    const maxSeconds = 3600
    const percent = 100 - (Math.min(maxSeconds, countdownState.totalSeconds) / maxSeconds) * 100
    return { percent, color: countdownState.urgency.color, isCritical: countdownState.urgency.level === "critical" }
  }, [countdownState])
  const mySortedNumbers = useMemo(() => [...(myEntries?.myEntryNumbers ?? [])].sort((a, b) => a - b), [myEntries?.myEntryNumbers])

  if (loading) return <LoadingScreen />

  return (
    <main className="min-h-screen bg-[#020202] text-white pt-24 pb-20 px-4 selection:bg-cyan-500/30 relative overflow-x-hidden" dir="rtl">
      <BackgroundEffects />
      <TopProgressBar progress={progressMetrics.percent} color={progressMetrics.color} isCritical={progressMetrics.isCritical} />
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="text-center mb-16 relative z-30">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/5 border border-cyan-500/20 text-[10px] font-black tracking-[0.3em] text-cyan-400 mb-6 uppercase backdrop-blur-md"><ShieldCheck size={12} />Secure & Provably Fair</motion.div>
          <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-[clamp(2rem,8vw,4.5rem)] md:text-[clamp(3rem,7vw,6.5rem)] font-[900] leading-[1.05] tracking-tight mb-4 bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent drop-shadow-2xl relative px-2 py-2">ماشین اسلاید</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-white/40 text-sm md:text-xl max-w-3xl mx-auto font-medium leading-relaxed">سیستم هوشمند انتخاب برنده با الگوریتم‌های رمزنگاری غیرقابل تغییر.</motion.p>
        </header>

        {draw ? (
          <div className="space-y-12 relative z-20">
            <motion.div layout className="relative rounded-[3.5rem] p-[1px] bg-gradient-to-b from-white/10 via-white/5 to-transparent shadow-[0_20px_100px_-20px_rgba(0,0,0,0.7)]">
              <div className="bg-[#050505]/90 backdrop-blur-2xl rounded-[3.4rem] p-10 md:p-16 relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center">
                <BackgroundStageLight status={draw.status} urgencyLevel={countdownState?.urgency.level} />
                <StatusBadge status={draw.status} urgency={countdownState?.urgency.level} />
                <h2 className="text-3xl md:text-5xl font-black text-center mb-12 max-w-4xl leading-tight relative z-10 drop-shadow-lg">{draw.title}</h2>

                {draw.status === "scheduled" && (
                  <div className="w-full max-w-3xl mb-10 p-4 md:p-5 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 relative z-10">
                    <div className="grid md:grid-cols-3 gap-3 items-end">
                      <div><p className="text-[11px] text-white/50 mb-1">شانس باقی مانده</p><p className="text-xl font-black text-cyan-300">{(myEntries?.availableChances ?? user?.chances ?? 0).toLocaleString("fa-IR")}</p></div>
                      <div><label className="text-[11px] text-white/50 mb-1 block">تعداد شانس برای این قرعه</label><input type="number" min={1} value={chancesToUse} onChange={(e) => setChancesToUse(Math.max(1, Number(e.target.value || 1)))} className="w-full rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-sm outline-none focus:border-cyan-400" /></div>
                      <button onClick={() => void submitChances()} disabled={isSubmitting} className="h-[42px] rounded-xl bg-cyan-500/80 hover:bg-cyan-400 text-black font-black text-sm disabled:opacity-60">{isSubmitting ? "در حال ثبت..." : "ثبت شانس و دریافت شماره یونیک"}</button>
                    </div>
                    <div className="mt-3 text-xs text-white/65">تعداد شماره های ثبت شده شما: <span className="text-cyan-300 font-bold">{(myEntries?.myEntriesCount ?? 0).toLocaleString("fa-IR")} عدد</span></div>
                    <div className="mt-2 text-[11px] text-white/45">این شماره‌ها فقط برای شما نمایش داده می‌شوند.</div>
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                      <p className="text-[11px] text-white/60 mb-2">شماره های شانس من</p>
                      {mySortedNumbers.length ? (
                        <div className="max-h-24 overflow-y-auto custom-scrollbar flex flex-wrap gap-1.5">
                          {mySortedNumbers.map((n) => (
                            <span key={n} className="font-mono text-[11px] px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                              {n.toLocaleString("fa-IR")}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-white/50">هنوز شماره‌ای ثبت نشده است.</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="w-full flex justify-center relative z-10">
                  <AnimatePresence mode="wait">
                    {draw.status === "scheduled" && countdownState && !countdownState.expired && (
                      <motion.div key="countdown" exit={{ opacity: 0, scale: 0.8, filter: "blur(20px)", transition: { duration: 0.3 } }} className="flex flex-wrap justify-center items-center gap-4 md:gap-10 select-none">
                        <TimerBox value={countdownState.h} label="ساعت" urgency={countdownState.urgency.level} />
                        <Separator urgency={countdownState.urgency.level} />
                        <TimerBox value={countdownState.m} label="دقیقه" urgency={countdownState.urgency.level} />
                        <Separator urgency={countdownState.urgency.level} />
                        <TimerBox value={countdownState.s} label="ثانیه" urgency={countdownState.urgency.level} isSeconds />
                      </motion.div>
                    )}
                    {(draw.status === "processing" || (countdownState?.expired && draw.status === "scheduled")) && <ProcessingState key="processing" />}
                    {draw.status === "drawn" && draw.targetNumber !== undefined && <ResultReveal key="result" targetNumber={draw.targetNumber} />}
                  </AnimatePresence>
                </div>

                {draw.status === "drawn" && (draw.winningLogs?.length ?? 0) > 1 && (
                  <div className="absolute left-6 top-6 z-20 w-64 max-w-[70vw] rounded-2xl border border-white/15 bg-black/55 backdrop-blur p-3">
                    <p className="text-[11px] text-white/60 mb-2">سایر شماره های برنده</p>
                    <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-1">
                      {draw.winningLogs?.filter((w) => w.rank !== 1).slice(0, 30).map((w) => (
                        <div key={`${w.rank}-${w.winningNumber}`} className="flex items-center justify-between text-xs border-b border-white/10 pb-1"><span className="text-white/75">رتبه {w.rank.toLocaleString("fa-IR")}</span><span className="font-mono text-cyan-300">{w.winningNumber.toLocaleString("fa-IR")}</span></div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full max-w-5xl mt-16 border-t border-white/5 pt-8 relative z-10">
                  <MetricCard icon={<Users size={20} />} label="شرکت‌کننده" value={(draw.participants?.length ?? 0).toLocaleString("fa-IR")} />
                  <MetricCard icon={<Sparkles size={20} />} label="شماره ثبت شده" value={(draw.totalEntries ?? 0).toLocaleString("fa-IR")} />
                  <MetricCard icon={<Zap size={20} />} label="شانس کل" value={(draw.participants ?? []).reduce((a, b) => a + b.chances, 0).toLocaleString("fa-IR")} />
                  <MetricCard icon={<ShieldCheck size={20} />} label="Secure Check" value="SHA-512" />
                  <MetricCard icon={<Activity size={20} />} label="Network" value="Stable" color="text-emerald-500" />
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-12 gap-6 md:gap-8 relative z-10">
              <ParticipantsList participants={draw.participants ?? []} />
              <PrizesList status={draw.status} prizes={draw.prizes ?? []} winners={draw.winners ?? []} />
            </div>

            {draw.winningLogs?.length && (
              <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-lg font-black mb-4">لاگ شفاف برندگان</h3>
                <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="text-white/50 border-b border-white/10"><th className="py-2 px-3 text-right">رتبه</th><th className="py-2 px-3 text-right">شماره برنده</th><th className="py-2 px-3 text-right">برنده</th><th className="py-2 px-3 text-right">جایزه</th></tr></thead><tbody>{draw.winningLogs.map((log) => (<tr key={`${log.rank}-${log.winningNumber}`} className="border-b border-white/5"><td className="py-2 px-3 font-bold">{log.rank.toLocaleString("fa-IR")}</td><td className="py-2 px-3 font-mono text-cyan-300">{log.winningNumber.toLocaleString("fa-IR")}</td><td className="py-2 px-3">{log.fullName || log.userId}</td><td className="py-2 px-3">{log.prize.title}{log.prize.amount ? ` - ${formatToman(log.prize.amount)}` : ""}</td></tr>))}</tbody></table></div>
              </section>
            )}
          </div>
        ) : <EmptyState />}
      </div>
      <GlobalStyles />
    </main>
  )
}

function TimerBox({ value, label, urgency, isSeconds = false }: { value: string; label: string; urgency: UrgencyLevel; isSeconds?: boolean }) {
  const isCritical = urgency === "critical"
  const isWarning = urgency === "warning"
  const shakeVariant = isCritical ? { x: [-1, 1, -1, 1, 0], y: [1, -1, 1, -1, 0], transition: { duration: 0.1, repeat: Infinity, repeatType: "mirror" as const } } : {}
  const textColor = isCritical ? "text-red-500" : isWarning ? "text-amber-400" : "text-white"
  const glowColor = isCritical ? "rgba(239,68,68,0.4)" : isWarning ? "rgba(245,158,11,0.3)" : "rgba(6,182,212,0.2)"
  return <div className="flex flex-col items-center group relative">{(isCritical || isWarning) && <motion.div animate={{ opacity: [0.1, 0.4, 0.1], scale: [0.9, 1.1, 0.9] }} transition={{ duration: isCritical ? 0.4 : 1, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 blur-3xl rounded-full z-0" style={{ backgroundColor: glowColor }} />}<motion.div animate={shakeVariant} className="relative z-10 bg-white/[0.04] border border-white/10 rounded-[2.5rem] w-28 h-32 md:w-40 md:h-48 flex items-center justify-center shadow-2xl backdrop-blur-md overflow-hidden" style={{ boxShadow: isCritical ? `0 0 30px ${glowColor}` : "", borderColor: isCritical ? "rgba(239,68,68,0.3)" : "" }}><div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent opacity-50" /><AnimatePresence mode="popLayout"><motion.div key={value} initial={{ y: 40, opacity: 0, filter: "blur(8px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)", scale: (isSeconds && (isWarning || isCritical)) ? 1.1 : 1 }} exit={{ y: -40, opacity: 0, filter: "blur(8px)" }} transition={{ type: "spring", stiffness: 400, damping: 20 }} className={`text-6xl md:text-8xl font-[900] tabular-nums tracking-tighter drop-shadow-2xl ${textColor} relative`}>{value}</motion.div></AnimatePresence></motion.div><span className={`text-[10px] font-black uppercase tracking-[0.4em] mt-5 transition-colors ${isCritical ? "text-red-500 animate-pulse" : isWarning ? "text-amber-400" : "text-white/30"}`}>{label}</span></div>
}
function Separator({ urgency }: { urgency: UrgencyLevel }) { const color = urgency === "critical" ? "text-red-500" : urgency === "warning" ? "text-amber-400" : "text-white/10"; return <span className={`text-4xl md:text-7xl font-[200] mt-[-30px] hidden md:block ${color} transition-colors duration-300`}>:</span> }
function TopProgressBar({ progress, color, isCritical }: { progress: number; color: string; isCritical: boolean }) { const barShake = isCritical ? { y: [-1, 1, 0], transition: { duration: 0.1, repeat: Infinity } } : {}; return <motion.div animate={barShake} className="fixed top-0 left-0 w-full h-2 bg-white/5 z-[100] overflow-hidden"><motion.div className="h-full relative" style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}` }} animate={{ width: `${progress}%` }} transition={{ ease: cubicBezier(0.4, 0, 0.2, 1), duration: 0.5 }}><div className="absolute inset-0 w-full h-full animate-[shimmer_1.5s_infinite] skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent" /></motion.div></motion.div> }
function BackgroundStageLight({ status, urgencyLevel }: { status: string; urgencyLevel?: UrgencyLevel }) { let bgColor = "bg-cyan-500/5"; if (status === "drawn") bgColor = "bg-amber-500/10"; else if (urgencyLevel === "critical") bgColor = "bg-red-600/20 animate-pulse"; else if (urgencyLevel === "warning") bgColor = "bg-amber-500/10"; return <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] blur-[150px] rounded-full pointer-events-none transition-all duration-700 ${bgColor}`} /> }
function StatusBadge({ status, urgency }: { status: string; urgency?: UrgencyLevel }) { const isLive = status === "scheduled"; const colorClass = isLive ? (urgency === "critical" ? "bg-red-500" : urgency === "warning" ? "bg-amber-500" : "bg-emerald-500") : "bg-amber-600"; const text = isLive ? (urgency === "critical" ? "لحظات پایانی" : "پخش زنده") : status === "processing" ? "در حال قرعه‌کشی" : "پایان یافته"; return <div className="flex items-center gap-3 mb-10 bg-white/5 px-5 py-2 rounded-full border border-white/5 backdrop-blur-md relative z-10"><span className="relative flex h-3 w-3">{isLive && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorClass}`} />}<span className={`relative inline-flex rounded-full h-3 w-3 ${colorClass}`} /></span><span className="text-xs font-black uppercase tracking-widest text-white/70">{text}</span></div> }
function ProcessingState() { return <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6 py-10"><div className="relative w-28 h-28"><div className="absolute inset-0 border-4 border-amber-500/20 rounded-full animate-ping" /><div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /><Cpu className="absolute inset-0 m-auto text-amber-500 animate-pulse" size={40} /></div><div className="text-center"><h3 className="text-3xl font-black text-amber-500 mb-2 animate-pulse">در حال استخراج برنده...</h3><p className="text-white/50 font-mono text-sm tracking-wider">Verifying Blockchain Integrity</p></div></motion.div> }
function ResultReveal({ targetNumber }: { targetNumber: number }) { const springValue = useSpring(0, { stiffness: 60, damping: 12 }); const displayValue = useTransform(springValue, (current) => Math.round(current)); useEffect(() => { springValue.set(targetNumber) }, [targetNumber, springValue]); return <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center"><motion.div className="text-[12px] text-amber-400 font-black uppercase tracking-[0.5em] mb-6 animate-pulse">Winning Number</motion.div><div className="relative px-16 py-8 bg-gradient-to-b from-amber-500/20 to-transparent border-2 border-amber-500/30 rounded-[3rem] overflow-hidden"><motion.div className="text-8xl md:text-[10rem] font-black font-mono tracking-widest text-white"><motion.span>{displayValue}</motion.span></motion.div></div><motion.div className="mt-10 flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-8 py-3 rounded-full border border-emerald-500/20"><Sparkles size={20} /><span className="text-base font-bold">تایید شده توسط بلاکچین</span></motion.div></motion.div> }
function ParticipantsList({ participants }: { participants: Participant[] }) { return <div className="col-span-12 lg:col-span-7"><div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 md:p-10 h-[600px] flex flex-col relative overflow-hidden backdrop-blur-sm"><div className="flex items-center justify-between mb-8"><h3 className="text-2xl font-black flex items-center gap-4"><div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-500"><Users size={24} /></div>تابلوی شانس</h3></div><div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-3">{participants.map((p, idx) => <div key={p.userId} className="p-4 bg-white/[0.03] border border-white/5 rounded-3xl flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center font-black text-white/30 text-lg">{idx + 1}</div><div><p className="font-bold text-lg text-white">{p.fullName}</p><p className="text-[10px] text-white/30">{p.email.split("@")[0]}***</p></div></div><div className="text-right"><p className="text-[10px] text-white/45 mb-1">تعداد شانس</p><p className="text-lg font-black">{p.chances.toLocaleString("fa-IR")}</p></div></div>)}</div></div></div> }
function PrizesList({ status, prizes, winners }: { status: string; prizes: Prize[]; winners?: Winner[] }) { return <div className="col-span-12 lg:col-span-5"><div className="bg-gradient-to-b from-amber-500/[0.05] to-transparent border border-amber-500/10 rounded-[3rem] p-8 md:p-10 h-full relative overflow-hidden backdrop-blur-sm"><div className="flex items-center gap-4 mb-10"><div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/10"><Trophy size={24} /></div><div><h3 className="text-2xl font-black text-white">جوایز رویداد</h3></div></div><div className="space-y-4">{status === "drawn" && winners ? winners.map((w) => <div key={w.rank} className="p-5 bg-gradient-to-r from-amber-500/20 to-black/40 border border-amber-500/40 rounded-3xl"><p className="font-bold text-lg text-white">{w.fullName}</p><p className="text-xs text-amber-200">{w.prize.title}{w.prize.amount ? ` - ${formatToman(w.prize.amount)}` : ""}</p></div>) : prizes.map((p, i) => <div key={i} className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl flex items-center justify-between"><span className="text-sm font-bold text-white/80">{p.title}</span>{p.amount && <span className="text-sm font-black text-amber-500">{formatToman(p.amount)}</span>}</div>)}</div></div></div> }
function MetricCard({ icon, label, value, color = "text-white" }: { icon: any; label: string; value: string; color?: string }) { return <div className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/5 flex flex-col items-center text-center"><div className="text-white/20 mb-3">{icon}</div><p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">{label}</p><p className={`text-xl md:text-2xl font-black ${color}`}>{value}</p></div> }
function LoadingScreen() { return <div className="min-h-screen bg-[#020202] flex items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="relative w-20 h-20"><div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" /><div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div><p className="text-cyan-500/50 text-xs font-black tracking-widest uppercase animate-pulse">System Loading</p></div></div> }
function EmptyState() { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-40 text-center rounded-[3rem] bg-white/[0.02] border border-white/5"><History size={64} className="mx-auto text-white/5 mb-8" /><h2 className="text-3xl font-black text-white/20 uppercase tracking-widest italic">در انتظار تخصیص رویداد</h2></motion.div> }
function BackgroundEffects() { return <div className="fixed inset-0 pointer-events-none z-0"><div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-cyan-600/5 blur-[120px] rounded-full animate-pulse" /><div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-purple-600/5 blur-[120px] rounded-full animate-pulse" /><div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-transparent" /></div> }
function GlobalStyles() { return <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar{width:4px}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,255,255,.05);border-radius:20px}@keyframes shimmer{from{transform:translateX(-100%)}to{transform:translateX(100%)}}` }} /> }
