"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Plus, Save, Trash2, Users, Play } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { formatToman } from "@/lib/money"

type Prize = {
  rankFrom: number
  rankTo: number
  title: string
  amount?: number
}

type Winner = {
  rank: number
  winningNumber: number
  userId: string
  chancesAtDraw: number
  prize: Prize
}

type Draw = {
  id: string
  title: string
  scheduledAt: string
  status: "scheduled" | "drawn" | "cancelled"
  seedCommitHash: string
  targetNumber?: number
  proof?: {
    algorithm: string
    seedCommitHash: string
    revealedServerSeed: string
    externalEntropy: string
    participantsHash: string
    generatedAt: string
  }
  entries?: Array<{ entryNumber: number; userId: string; createdAt: string }>
  participants: Array<{ userId: string; chances: number }>
  prizes: Prize[]
  winners: Winner[]
}

type DrawLog = {
  draw: {
    id: string
    title: string
    status: string
    scheduledAt: string
    createdAt: string
    updatedAt: string
    createdBy: string
    seedCommitHash: string
    targetNumber?: number
    prizes: Prize[]
    proof: {
      algorithm: string
      seedCommitHash: string
      revealedServerSeed: string
      externalEntropy: string
      participantsHash: string
      generatedAt: string
    } | null
  }
  summary: {
    totalEntries: number
    totalParticipants: number
    totalWinners: number
  }
  participants: Array<{
    userId: string
    userEmail: string
    fullName: string
    chances: number
  }>
  entries: Array<{
    entryNumber: number
    userId: string
    userEmail: string
    fullName: string
    createdAt: string
  }>
  winners: Array<{
    rank: number
    winningNumber: number
    userId: string
    userEmail: string
    fullName: string
    chancesAtDraw: number
    prize: Prize
  }>
}

type Preview = {
  totalParticipants: number
  totalChances: number
  topParticipants: Array<{
    userId: string
    email: string
    fullName: string
    chances: number
  }>
}

function toLocalInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const mm = String(date.getMinutes()).padStart(2, "0")
  return `${y}-${m}-${d}T${hh}:${mm}`
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function AdminSlidePage() {
  const [items, setItems] = useState<Draw[]>([])
  const [preview, setPreview] = useState<Preview | null>(null)
  const [saving, setSaving] = useState(false)
  const [runningId, setRunningId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [openLogId, setOpenLogId] = useState<string | null>(null)
  const [logsByDraw, setLogsByDraw] = useState<Record<string, DrawLog>>({})

  const [title, setTitle] = useState("قرعه کشي اسلايد خودرو")
  const [scheduledAt, setScheduledAt] = useState("")
  const [prizes, setPrizes] = useState<Prize[]>([
    { rankFrom: 1, rankTo: 1, title: "خودرو", amount: 0 },
    { rankFrom: 2, rankTo: 3, title: "جايزه نقدي", amount: 200_000_000 },
    { rankFrom: 4, rankTo: 1000, title: "کش بک", amount: 500_000 },
  ])
  const [difficulty, setDifficulty] = useState(50)
  const [dailyTargetDate, setDailyTargetDate] = useState(new Date().toISOString().slice(0, 10))
  const [dailyTargetNumber, setDailyTargetNumber] = useState(42)

  async function loadAll() {
    try {
      const [drawsData, previewData] = await Promise.all([
        apiRequest<{ items: Draw[] }>("/admin/slide/draws"),
        apiRequest<Preview>("/admin/slide/preview"),
      ])
      setItems(drawsData.items)
      setPreview(previewData)
      try {
        const difficultyData = await apiRequest<{ difficulty: number }>("/admin/game/difficulty")
        setDifficulty(difficultyData.difficulty)
      } catch {
        // noop
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دريافت اطلاعات")
    }
  }

  async function saveDifficulty() {
    try {
      await apiRequest("/admin/game/difficulty", {
        method: "PUT",
        body: JSON.stringify({ difficulty }),
      })
      toast.success("درجه سختی بازی ذخیره شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ذخیره سختی ناموفق بود")
    }
  }

  async function saveDailyTarget() {
    try {
      await apiRequest("/admin/slide/single/target", {
        method: "POST",
        body: JSON.stringify({
          targetDate: dailyTargetDate,
          winningNumber: dailyTargetNumber,
        }),
      })
      toast.success("عدد برنده روزانه ثبت شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت عدد روزانه ناموفق بود")
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  const nextDraw = useMemo(() => items.find((d) => d.status === "scheduled"), [items])

  useEffect(() => {
    if (!nextDraw) return
    setTitle(nextDraw.title)
    setScheduledAt(toLocalInputValue(new Date(nextDraw.scheduledAt)))
    setPrizes(nextDraw.prizes)
  }, [nextDraw])

  const hasInvalidPrize = prizes.some((p) => !p.title.trim() || p.rankFrom < 1 || p.rankTo < p.rankFrom)
  const expandedRanks = useMemo(() => {
    const out: number[] = []
    for (const p of prizes) {
      for (let r = p.rankFrom; r <= p.rankTo; r += 1) out.push(r)
    }
    return out
  }, [prizes])
  const hasOverlap = useMemo(() => new Set(expandedRanks).size !== expandedRanks.length, [expandedRanks])
  const totalWinners = useMemo(() => expandedRanks.length, [expandedRanks])

  const canCreate = Boolean(scheduledAt) && title.trim().length >= 3 && !hasOverlap && !hasInvalidPrize && !saving && !nextDraw
  const canUpdate = Boolean(nextDraw) && Boolean(scheduledAt) && title.trim().length >= 3 && !hasOverlap && !hasInvalidPrize && !saving

  function addPrize() {
    const maxRank = prizes.length ? Math.max(...prizes.map((p) => p.rankTo)) : 0
    setPrizes((prev) => [...prev, { rankFrom: maxRank + 1, rankTo: maxRank + 1, title: "جايزه جديد", amount: 0 }])
  }

  function removePrize(index: number) {
    setPrizes((prev) => prev.filter((_, i) => i !== index))
  }

  async function createDraw() {
    if (!canCreate) {
      toast.error("فرم قرعه کشي کامل و معتبر نيست")
      return
    }
    setSaving(true)
    try {
      await apiRequest("/admin/slide/draws", {
        method: "POST",
        body: JSON.stringify({
          title,
          scheduledAt: new Date(scheduledAt).toISOString(),
          prizes: prizes.map((p) => ({ ...p, title: p.title.trim(), amount: p.amount && p.amount > 0 ? p.amount : undefined })),
        }),
      })
      toast.success("قرعه کشي اسلايد زمان بندي شد")
      await loadAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ايجاد قرعه کشي")
    } finally {
      setSaving(false)
    }
  }

  async function updateDraw() {
    if (!nextDraw || !canUpdate) {
      toast.error("تنظيمات قابل ذخيره نيست")
      return
    }
    setSaving(true)
    try {
      await apiRequest(`/admin/slide/draws/${nextDraw.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          scheduledAt: new Date(scheduledAt).toISOString(),
          prizes: prizes.map((p) => ({ ...p, title: p.title.trim(), amount: p.amount && p.amount > 0 ? p.amount : undefined })),
        }),
      })
      toast.success("تنظيمات قرعه کشي بروزرساني شد")
      await loadAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در بروزرساني قرعه کشي")
    } finally {
      setSaving(false)
    }
  }

  async function deleteDraw(drawId: string) {
    setDeletingId(drawId)
    try {
      const res = await apiRequest<{ refundedUsers: number; refundedChances: number }>(`/admin/slide/draws/${drawId}`, {
        method: "DELETE",
      })
      toast.success(`قرعه حذف شد (بازگشت شانس: ${res.refundedChances.toLocaleString("fa-IR")})`)
      await loadAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حذف قرعه انجام نشد")
    } finally {
      setDeletingId(null)
    }
  }

  async function runDraw(drawId: string) {
    setRunningId(drawId)
    try {
      await apiRequest(`/admin/slide/draws/${drawId}/run`, { method: "POST" })
      toast.success("قرعه کشي اجرا شد")
      await loadAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در اجراي قرعه کشي")
    } finally {
      setRunningId(null)
    }
  }

  async function fetchLog(drawId: string): Promise<DrawLog> {
    const cached = logsByDraw[drawId]
    if (cached) return cached
    const log = await apiRequest<DrawLog>(`/admin/slide/draws/${drawId}/log`, { method: "GET" })
    setLogsByDraw((prev) => ({ ...prev, [drawId]: log }))
    return log
  }

  async function toggleLog(drawId: string) {
    if (openLogId === drawId) {
      setOpenLogId(null)
      return
    }
    try {
      await fetchLog(drawId)
      setOpenLogId(drawId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دريافت لاگ")
    }
  }

  async function downloadLog(drawId: string) {
    setDownloadingId(drawId)
    try {
      const log = await fetchLog(drawId)
      const ts = new Date().toISOString().replace(/[:.]/g, "-")
      downloadJson(`slide-draw-log-${drawId}-${ts}.json`, log)
      toast.success("لاگ کامل دانلود شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "دانلود لاگ انجام نشد")
    } finally {
      setDownloadingId(null)
    }
  }

  function setQuick(minutes: number) {
    const d = new Date(Date.now() + minutes * 60 * 1000)
    setScheduledAt(toLocalInputValue(d))
  }

  const completedItems = useMemo(() => items.filter((d) => d.status === "drawn"), [items])

  return (
    <div className="space-y-8" dir="rtl">
      <h1 className="text-3xl font-black">قرعه کشي اسلايد (امن و قابل راستي آزمايي)</h1>

      <section className="card glass p-6 space-y-4">
        <h2 className="text-xl font-black">کنترل لحظه ای بازی</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-white/60 block">درجه سختی ماشین اسلاید (0 تا 100)</label>
            <input
              type="range"
              min={0}
              max={100}
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-white/70">مقدار فعلی: {difficulty}</p>
            <button onClick={saveDifficulty} className="btn-secondary">ذخیره سختی</button>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/60 block">عدد برنده روزانه (1 تا 100)</label>
            <input type="date" value={dailyTargetDate} onChange={(e) => setDailyTargetDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" />
            <input type="number" min={1} max={100} value={dailyTargetNumber} onChange={(e) => setDailyTargetNumber(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" />
            <button onClick={saveDailyTarget} className="btn-primary">ثبت عدد روزانه</button>
          </div>
        </div>
      </section>

      <section className="card glass p-6 space-y-4">
        <h2 className="text-xl font-black">{nextDraw ? "ويرايش قرعه کشي زمان بندي شده" : "تنظيم قرعه کشي جديد"}</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/60 mb-1 block">عنوان</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">زمان اجرا</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" />
            <div className="flex gap-2 mt-2">
              <button onClick={() => setQuick(10)} className="px-2 py-1 rounded bg-white/10 text-xs">+10 دقيقه</button>
              <button onClick={() => setQuick(30)} className="px-2 py-1 rounded bg-white/10 text-xs">+30 دقيقه</button>
              <button onClick={() => setQuick(60)} className="px-2 py-1 rounded bg-white/10 text-xs">+1 ساعت</button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <h3 className="font-bold">جوايز (پشتيباني از بازه رتبه)</h3>
          <button onClick={addPrize} className="btn-secondary">
            <Plus className="w-4 h-4" />
            افزودن جايزه
          </button>
        </div>
        <div className="space-y-2">
          {prizes.map((p, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2">
              <input type="number" min={1} value={p.rankFrom} onChange={(e) => setPrizes((prev) => prev.map((x, i) => (i === idx ? { ...x, rankFrom: Number(e.target.value) } : x)))} className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-2 py-2" />
              <input type="number" min={1} value={p.rankTo} onChange={(e) => setPrizes((prev) => prev.map((x, i) => (i === idx ? { ...x, rankTo: Number(e.target.value) } : x)))} className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-2 py-2" />
              <input value={p.title} onChange={(e) => setPrizes((prev) => prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))} className="col-span-4 bg-white/5 border border-white/10 rounded-lg px-2 py-2" />
              <input type="number" value={p.amount ?? 0} onChange={(e) => setPrizes((prev) => prev.map((x, i) => (i === idx ? { ...x, amount: Number(e.target.value) } : x)))} className="col-span-3 bg-white/5 border border-white/10 rounded-lg px-2 py-2" />
              <button onClick={() => removePrize(idx)} className="col-span-1 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                <Trash2 className="w-4 h-4 mx-auto" />
              </button>
            </div>
          ))}
        </div>

        <div className="text-xs text-white/60 space-y-1">
          <p>تعداد کل برنده ها براساس بازه ها: <span className="font-bold text-accent-gold">{totalWinners.toLocaleString("fa-IR")}</span></p>
          {hasOverlap ? <p className="text-rose-400">بازه رتبه ها با هم تداخل دارند.</p> : null}
          {hasInvalidPrize ? <p className="text-rose-400">عنوان جايزه يا بازه رتبه معتبر نيست.</p> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          {!nextDraw ? (
            <button onClick={createDraw} disabled={!canCreate} className="btn-primary disabled:opacity-60">
              {saving ? "در حال ثبت..." : "ثبت زمان قرعه کشي"}
            </button>
          ) : (
            <>
              <button onClick={updateDraw} disabled={!canUpdate} className="btn-primary disabled:opacity-60">
                <Save className="w-4 h-4" />
                {saving ? "در حال ذخيره..." : "ذخيره تغييرات قرعه"}
              </button>
              <button
                onClick={() => void deleteDraw(nextDraw.id)}
                disabled={deletingId === nextDraw.id}
                className="btn-secondary border-rose-500/30 text-rose-300 hover:bg-rose-500/10 disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
                {deletingId === nextDraw.id ? "در حال حذف..." : "حذف قرعه جاري"}
              </button>
            </>
          )}
        </div>
      </section>

      <section className="card glass p-6">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
          <Users className="text-accent-gold" />
          پيش نمايش مشارکت
        </h2>
        <div className="grid md:grid-cols-3 gap-3 mb-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-xs text-white/50">تعداد شرکت کنندگان</p>
            <p className="font-black">{(preview?.totalParticipants ?? 0).toLocaleString("fa-IR")}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-xs text-white/50">جمع شانس ها</p>
            <p className="font-black">{(preview?.totalChances ?? 0).toLocaleString("fa-IR")}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-xs text-white/50">کاربران قابل انتخاب</p>
            <p className="font-black">{(preview?.topParticipants.length ?? 0).toLocaleString("fa-IR")}+</p>
          </div>
        </div>
      </section>

      {nextDraw ? (
        <section className="card glass p-6">
          <h2 className="text-xl font-black mb-2">قرعه کشي فعال بعدي</h2>
          <p className="text-sm text-white/70">{nextDraw.title}</p>
          <p className="text-sm text-white/70 mt-1">زمان: {new Date(nextDraw.scheduledAt).toLocaleString("fa-IR")}</p>
          <button onClick={() => runDraw(nextDraw.id)} disabled={runningId === nextDraw.id} className="btn-secondary mt-4 disabled:opacity-60">
            <Play className="w-4 h-4" />
            {runningId === nextDraw.id ? "در حال اجرا..." : "اجراي قرعه (پس از رسيدن زمان)"}
          </button>
        </section>
      ) : null}

      <section className="card glass p-6">
        <h2 className="text-xl font-black mb-4">تاريخچه قرعه کشي اسلايد و لاگ قابل ذخيره</h2>
        <div className="space-y-4">
          {completedItems.map((draw) => {
            const open = openLogId === draw.id
            const log = logsByDraw[draw.id]
            return (
              <div key={draw.id} className="p-4 border border-white/10 rounded-xl bg-black/20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{draw.title}</p>
                    <p className="text-xs text-white/60 mt-1">{new Date(draw.scheduledAt).toLocaleString("fa-IR")}</p>
                    {draw.targetNumber !== undefined ? (
                      <p className="text-sm mt-2">شماره هدف: <span className="text-accent-gold font-black">{draw.targetNumber.toLocaleString("fa-IR")}</span></p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => void toggleLog(draw.id)} className="btn-secondary text-xs px-4 py-2">
                      {open ? "بستن جزئيات" : "مشاهده جزئيات"}
                    </button>
                    <button
                      onClick={() => void downloadLog(draw.id)}
                      disabled={downloadingId === draw.id}
                      className="btn-secondary text-xs px-4 py-2 disabled:opacity-60"
                    >
                      <Download className="w-4 h-4" />
                      {downloadingId === draw.id ? "در حال دانلود..." : "دانلود لاگ کامل"}
                    </button>
                  </div>
                </div>

                {open && log ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-xs text-white/50">تعداد شماره هاي ثبت شده</p>
                        <p className="font-black">{log.summary.totalEntries.toLocaleString("fa-IR")}</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-xs text-white/50">تعداد شرکت کنندگان</p>
                        <p className="font-black">{log.summary.totalParticipants.toLocaleString("fa-IR")}</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-xs text-white/50">تعداد برندگان</p>
                        <p className="font-black">{log.summary.totalWinners.toLocaleString("fa-IR")}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-white/10 rounded-lg">
                      <table className="min-w-full text-sm">
                        <thead className="bg-white/5 text-white/60">
                          <tr>
                            <th className="px-3 py-2 text-right">رتبه</th>
                            <th className="px-3 py-2 text-right">شماره برنده</th>
                            <th className="px-3 py-2 text-right">برنده</th>
                            <th className="px-3 py-2 text-right">جايزه</th>
                          </tr>
                        </thead>
                        <tbody>
                          {log.winners.map((w) => (
                            <tr key={`${draw.id}-${w.rank}`} className="border-t border-white/10">
                              <td className="px-3 py-2 font-bold">{w.rank.toLocaleString("fa-IR")}</td>
                              <td className="px-3 py-2 font-mono text-cyan-300">{w.winningNumber.toLocaleString("fa-IR")}</td>
                              <td className="px-3 py-2">{w.fullName || w.userEmail}</td>
                              <td className="px-3 py-2">{w.prize.title}{w.prize.amount ? ` - ${formatToman(w.prize.amount)}` : ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="text-xs text-white/60 space-y-1">
                      <p>الگوريتم: <span className="font-mono">{log.draw.proof?.algorithm ?? "n/a"}</span></p>
                      <p>هش شرکت کنندگان: <span className="font-mono break-all">{log.draw.proof?.participantsHash ?? "n/a"}</span></p>
                      <p>Entropy: <span className="font-mono break-all">{log.draw.proof?.externalEntropy ?? "n/a"}</span></p>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
          {!completedItems.length ? <p className="text-sm text-white/50">هنوز قرعه کشي انجام شده اي وجود ندارد.</p> : null}
        </div>
      </section>
    </div>
  )
}

