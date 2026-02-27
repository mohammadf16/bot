"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import {
  Trophy, 
  Calendar, 
  Hash, 
  Play, 
  History, 
  PlusCircle, 
  Trash2, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  CheckCircle2
} from "lucide-react"
import { apiRequest } from "@/lib/api"

// --- Types ---
type Prize = {
  rank: number
  title: string
  amount?: number
}

type Draw = {
  id: string
  title: string
  scheduledAt: string
  status: "scheduled" | "drawn" | "cancelled"
  seedCommitHash: string
  targetNumber?: number
  prizes: Prize[]
  winners: Array<{
    rank: number
    userId: string
    chancesAtDraw: number
    prize: Prize
  }>
}

export default function AdminSlidePage() {
  const [items, setItems] = useState<Draw[]>([])
  const [loading, setLoading] = useState(false)
  
  // Form State
  const [title, setTitle] = useState("قرعه کشی بزرگ اسلاید")
  const [scheduledAt, setScheduledAt] = useState("")
  const [prizes, setPrizes] = useState<Prize[]>([
    { rank: 1, title: "خودرو 206", amount: 0 },
    { rank: 2, title: "کمک هزینه سفر", amount: 200_000_000 },
    { rank: 3, title: "سکه طلا", amount: 100_000_000 },
  ])

  // --- Actions ---
  async function load() {
    setLoading(true)
    try {
      const data = await apiRequest<{ items: Draw[] }>("/admin/slide/draws")
      setItems(data.items || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت اطلاعات")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const nextDraw = useMemo(() => items.find((d) => d.status === "scheduled"), [items])

  async function createDraw() {
    if (!scheduledAt) {
      toast.error("لطفا زمان قرعه کشی را مشخص کنید")
      return
    }
    if (!title) {
        toast.error("عنوان قرعه کشی الزامی است")
        return
    }

    const toastId = toast.loading("در حال ثبت...")
    try {
      await apiRequest("/admin/slide/draws", {
        method: "POST",
        body: JSON.stringify({
          title,
          scheduledAt: new Date(scheduledAt).toISOString(),
          prizes,
        }),
      })
      toast.success("قرعه کشی با موفقیت زمان‌بندی شد", { id: toastId })
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ایجاد", { id: toastId })
    }
  }

  async function runDraw(drawId: string) {
    if(!confirm("آیا از اجرای قرعه کشی اطمینان دارید؟ این عملیات غیرقابل بازگشت است.")) return;

    const toastId = toast.loading("در حال اجرای الگوریتم انتخاب رندوم...")
    try {
      await apiRequest(`/admin/slide/draws/${drawId}/run`, { method: "POST" })
      toast.success("قرعه کشی با موفقیت اجرا شد", { id: toastId })
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در اجرا", { id: toastId })
    }
  }

  // --- Handlers for Prize Form ---
  const handlePrizeChange = (index: number, field: keyof Prize, value: string | number) => {
    const newPrizes = [...prizes]
    newPrizes[index] = { ...newPrizes[index], [field]: value }
    setPrizes(newPrizes)
  }

  const addPrizeRow = () => {
    setPrizes([...prizes, { rank: prizes.length + 1, title: "", amount: 0 }])
  }

  const removePrizeRow = (index: number) => {
    setPrizes(prizes.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen p-4 md:p-8 text-white space-y-8 max-w-7xl mx-auto" dir="rtl">
      
      {/* --- Header --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-l from-white to-white/60 bg-clip-text text-transparent flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            پنل مدیریت قرعه‌کشی
          </h1>
          <p className="text-white/50 text-sm mt-2 max-w-xl">
            مدیریت قرعه‌کشی‌های سیستمی با الگوریتم اثبات‌پذیر (Provably Fair). تمام قرعه‌کشی‌ها بر اساس هش‌های از پیش تولید شده اجرا می‌شوند.
          </p>
        </div>
        <button 
            onClick={() => load()} 
            className="btn px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
            <History className="w-4 h-4" />
            بروزرسانی لیست
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- Left Column: Create New Draw --- */}
        <div className="lg:col-span-7 space-y-6">
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-black/40 backdrop-blur-xl shadow-2xl p-6 md:p-8">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-50" />
            
            <div className="flex items-center gap-2 mb-6 text-emerald-400">
                <PlusCircle className="w-5 h-5" />
                <h2 className="text-lg font-bold">تعریف رویداد جدید</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/70">عنوان قرعه‌کشی</label>
                <div className="relative">
                    <Trophy className="absolute right-3 top-3 w-4 h-4 text-white/40" />
                    <input 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        className="w-full bg-black/40 border border-white/10 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all"
                        placeholder="مثال: قرعه کشی یلدا"
                    />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/70">زمان اجرا</label>
                <div className="relative">
                    <Calendar className="absolute right-3 top-3 w-4 h-4 text-white/40" />
                    <input 
                        type="datetime-local" 
                        value={scheduledAt} 
                        onChange={(e) => setScheduledAt(e.target.value)} 
                        className="w-full bg-black/40 border border-white/10 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all ltr-input text-right" 
                        style={{ colorScheme: 'dark' }}
                    />
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white/70">لیست جوایز و رتبه‌ها</label>
                <button onClick={addPrizeRow} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                    <PlusCircle className="w-3 h-3" /> افزودن ردیف
                </button>
              </div>
              
              <div className="bg-black/30 rounded-xl border border-white/5 overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-3 border-b border-white/5 bg-white/5 text-xs text-white/50 font-medium text-center">
                    <div className="col-span-2">رتبه</div>
                    <div className="col-span-6">عنوان جایزه</div>
                    <div className="col-span-3">ارزش (تومان)</div>
                    <div className="col-span-1"></div>
                </div>
                <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                    {prizes.map((p, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 p-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors items-center">
                        <div className="col-span-2">
                            <input 
                                type="number" 
                                value={p.rank} 
                                onChange={(e) => handlePrizeChange(idx, 'rank', Number(e.target.value))}
                                className="w-full bg-transparent text-center text-sm outline-none text-emerald-400 font-bold"
                            />
                        </div>
                        <div className="col-span-6">
                            <input 
                                value={p.title} 
                                onChange={(e) => handlePrizeChange(idx, 'title', e.target.value)}
                                className="w-full bg-transparent text-right text-sm outline-none px-2"
                                placeholder="عنوان جایزه"
                            />
                        </div>
                        <div className="col-span-3">
                            <input 
                                type="number" 
                                value={p.amount} 
                                onChange={(e) => handlePrizeChange(idx, 'amount', Number(e.target.value))}
                                className="w-full bg-transparent text-center text-sm outline-none text-white/70"
                                placeholder="0"
                            />
                        </div>
                        <div className="col-span-1 flex justify-center">
                            <button onClick={() => removePrizeRow(idx)} className="text-red-500/50 hover:text-red-400 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        </div>
                    ))}
                </div>
              </div>
            </div>

            <button 
                onClick={createDraw} 
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <Clock className="w-5 h-5" />
                ثبت و زمان‌بندی قرعه‌کشی
            </button>
          </section>
        </div>

        {/* --- Right Column: Status & History --- */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Draw Card */}
          {nextDraw ? (
            <div className="relative rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-black/60 p-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-[60px] rounded-full pointer-events-none" />
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <span className="bg-amber-500/20 text-amber-300 text-xs px-3 py-1 rounded-full border border-amber-500/20 animate-pulse">
                            در انتظار اجرا
                        </span>
                        <Hash className="w-5 h-5 text-amber-500/50" />
                    </div>
                    
                    <h3 className="text-xl font-black text-white mb-2">{nextDraw.title}</h3>
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-6">
                        <Calendar className="w-4 h-4" />
                        {new Date(nextDraw.scheduledAt).toLocaleString("fa-IR")}
                    </div>

                    <div className="bg-black/40 rounded-lg p-3 border border-white/5 mb-6">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-white/40 uppercase tracking-widest">Seed Commit Hash</span>
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        </div>
                        <code className="text-[10px] md:text-xs text-emerald-400 break-all font-mono leading-relaxed opacity-80">
                            {nextDraw.seedCommitHash}
                        </code>
                    </div>

                    <button 
                        onClick={() => runDraw(nextDraw.id)}
                        className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <Play className="w-4 h-4 fill-black" />
                        اجرای دستی قرعه‌کشی
                    </button>
                </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 flex flex-col items-center justify-center text-center text-white/30 h-[280px]">
                <Calendar className="w-12 h-12 mb-3 opacity-50" />
                <p>هیچ قرعه‌کشی فعالی وجود ندارد</p>
            </div>
          )}

          {/* History List */}
          <div className="bg-black/20 rounded-3xl border border-white/10 p-5 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                تاریخچه رویدادها
            </h3>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {items.length === 0 && !loading && (
                    <p className="text-sm text-white/30 text-center py-4">موردی یافت نشد.</p>
                )}
                
                {items.map((draw) => (
                    <div key={draw.id} className="group p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-white/90">{draw.title}</span>
                            {draw.status === 'drawn' ? (
                                <span className="bg-emerald-500/10 text-emerald-400 p-1 rounded-full"><CheckCircle2 className="w-4 h-4" /></span>
                            ) : draw.status === 'scheduled' ? (
                                <span className="bg-amber-500/10 text-amber-400 p-1 rounded-full"><Clock className="w-4 h-4" /></span>
                            ) : (
                                <span className="bg-red-500/10 text-red-400 p-1 rounded-full"><AlertCircle className="w-4 h-4" /></span>
                            )}
                        </div>
                        
                        <div className="flex justify-between items-end">
                            <div className="text-xs text-white/50">
                                {new Date(draw.scheduledAt).toLocaleDateString("fa-IR")}
                            </div>
                            {draw.targetNumber !== undefined && (
                                <div className="text-xs font-mono bg-black/40 px-2 py-1 rounded text-purple-300">
                                    Target: {draw.targetNumber}
                                </div>
                            )}
                        </div>

                        {/* Winners Mini List */}
                        {draw.winners.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                                {draw.winners.slice(0, 2).map((w, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs text-white/70">
                                        <div className="flex items-center gap-1">
                                            <span className="w-4 h-4 rounded-full bg-gold/20 text-gold flex items-center justify-center text-[9px] border border-gold/30">
                                                {w.rank}
                                            </span>
                                            <span className="truncate max-w-[100px]">{w.prize.title}</span>
                                        </div>
                                        <span className="font-mono opacity-50 text-[10px]">{w.userId.substring(0, 8)}...</span>
                                    </div>
                                ))}
                                {draw.winners.length > 2 && (
                                    <p className="text-[10px] text-white/30 text-center">+ {draw.winners.length - 2} برنده دیگر</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
