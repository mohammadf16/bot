"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { formatToman } from "@/lib/money"
import { Car, ImageIcon } from "lucide-react"

type VehicleItem = {
  id: string
  status: "available" | "reserved" | "sold" | "archived"
  listedPriceIrr?: number
  vehicle: {
    title: string
    imageUrl: string
    model: string
    year: number
    city: string
    raffle: {
      cashbackPercent: number
      cashbackToGoldPercent: number
      tomanPerGoldSot: number
      mainPrizeTitle: string
      mainPrizeValueIrr: number
    }
  }
}

type Raffle = {
  id: string
  title: string
  linkedVehicleId?: string
  linkedVehicle?: {
    id: string
    title: string
    imageUrl: string
    model: string
    year: number
    city: string
    status: string
    listedPriceIrr?: number
  }
  maxTickets: number
  ticketsSold: number
  participantsCount: number
  status: "draft" | "open" | "closed" | "drawn"
  dynamicPricing: { basePrice: number; minPrice: number; decayFactor: number }
  rewardConfig: {
    cashbackPercent: number
    cashbackToGoldPercent: number
    tomanPerGoldSot: number
    mainPrizeTitle: string
    mainPrizeValueIrr: number
  }
}

type RaffleDraft = {
  vehicleId: string
  title: string
  maxTickets: string
  basePrice: string
  minPrice: string
  decayFactor: string
  cashbackPercent: string
  cashbackToGoldPercent: string
  tomanPerGoldSot: string
  mainPrizeTitle: string
  mainPrizeValueIrr: string
}

function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
}

function digitsOnly(value: string): string {
  const normalized = toEnglishDigits(value).replace(/[^\d]/g, "")
  return normalized.replace(/^0+(?=\d)/, "")
}

function decimalOnly(value: string): string {
  const normalized = toEnglishDigits(value).replace(/[^\d.]/g, "")
  const dot = normalized.indexOf(".")
  if (dot < 0) return normalized
  return normalized.slice(0, dot + 1) + normalized.slice(dot + 1).replace(/\./g, "")
}

function formatGrouped(value: string): string {
  if (!value) return ""
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  return n.toLocaleString("fa-IR")
}

function emptyDraft(): RaffleDraft {
  return {
    vehicleId: "",
    title: "",
    maxTickets: "1000",
    basePrice: "50000",
    minPrice: "30000",
    decayFactor: "0.98",
    cashbackPercent: "20",
    cashbackToGoldPercent: "30",
    tomanPerGoldSot: "100000",
    mainPrizeTitle: "",
    mainPrizeValueIrr: "",
  }
}

function toDraft(item: Raffle): RaffleDraft {
  return {
    vehicleId: item.linkedVehicleId ?? "",
    title: item.title,
    maxTickets: String(item.maxTickets),
    basePrice: String(item.dynamicPricing.basePrice),
    minPrice: String(item.dynamicPricing.minPrice),
    decayFactor: String(item.dynamicPricing.decayFactor),
    cashbackPercent: String(item.rewardConfig.cashbackPercent),
    cashbackToGoldPercent: String(item.rewardConfig.cashbackToGoldPercent),
    tomanPerGoldSot: String(item.rewardConfig.tomanPerGoldSot),
    mainPrizeTitle: item.rewardConfig.mainPrizeTitle,
    mainPrizeValueIrr: String(item.rewardConfig.mainPrizeValueIrr),
  }
}

function validateDraft(draft: RaffleDraft, requireVehicle = false): string | null {
  if (requireVehicle && !draft.vehicleId) return "انتخاب خودرو از نمایشگاه الزامی است"
  const maxTickets = Number(draft.maxTickets)
  const basePrice = Number(draft.basePrice)
  const minPrice = Number(draft.minPrice)
  const decayFactor = Number(draft.decayFactor)
  const cashbackPercent = Number(draft.cashbackPercent)
  const cashbackToGoldPercent = Number(draft.cashbackToGoldPercent)
  const tomanPerGoldSot = Number(draft.tomanPerGoldSot)
  const mainPrizeValueIrr = Number(draft.mainPrizeValueIrr || 0)
  if (!Number.isFinite(maxTickets) || maxTickets <= 0) return "ظرفیت بلیط معتبر نیست"
  if (!Number.isFinite(basePrice) || basePrice <= 0) return "قیمت پایه معتبر نیست"
  if (!Number.isFinite(minPrice) || minPrice <= 0) return "حداقل قیمت معتبر نیست"
  if (minPrice > basePrice) return "حداقل قیمت نباید از قیمت پایه بیشتر باشد"
  if (!Number.isFinite(decayFactor) || decayFactor <= 0 || decayFactor > 1) return "ضریب کاهش باید بین ۰ تا ۱ باشد"
  if (!Number.isFinite(cashbackPercent) || cashbackPercent < 0 || cashbackPercent > 100) return "درصد کشبک معتبر نیست"
  if (!Number.isFinite(cashbackToGoldPercent) || cashbackToGoldPercent < 0 || cashbackToGoldPercent > 100) return "درصد تبدیل به سوت معتبر نیست"
  if (!Number.isFinite(tomanPerGoldSot) || tomanPerGoldSot <= 0) return "نرخ تومان به سوت معتبر نیست"
  if (!Number.isFinite(mainPrizeValueIrr) || mainPrizeValueIrr < 0) return "ارزش جایزه اصلی معتبر نیست"
  return null
}

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-white/10 text-white/60",
  open: "bg-emerald-500/15 text-emerald-400",
  closed: "bg-amber-500/15 text-amber-400",
  drawn: "bg-[#D4AF37]/15 text-[#D4AF37]",
}
const STATUS_LABEL: Record<string, string> = { draft: "پیشنویس", open: "در حال اجرا", closed: "بسته شده", drawn: "قرعه اجرا شد" }
const VEHICLE_STATUS_LABEL: Record<string, string> = { available: "موجود", reserved: "رزرو", sold: "فروخته شده", archived: "آرشیو" }

export default function AdminRafflesPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([])
  const [vehicles, setVehicles] = useState<VehicleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [savingCreate, setSavingCreate] = useState(false)
  const [savingRaffleId, setSavingRaffleId] = useState<string | null>(null)
  const [actionRaffleId, setActionRaffleId] = useState<string | null>(null)
  const [deletingRaffleId, setDeletingRaffleId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [create, setCreate] = useState<RaffleDraft>(emptyDraft())
  const [drafts, setDrafts] = useState<Record<string, RaffleDraft>>({})

  const inputClass = "w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2.5 text-sm"
  const labelClass = "text-xs text-white/50 mb-1 block"

  const selectedCreateVehicle = useMemo(
    () => vehicles.find((v) => v.id === create.vehicleId) ?? null,
    [vehicles, create.vehicleId],
  )

  async function load() {
    setLoading(true)
    try {
      const [raffleData, vehicleData] = await Promise.all([
        apiRequest<{ items: Raffle[] }>("/admin/raffles"),
        apiRequest<{ items: VehicleItem[] }>("/admin/showroom/vehicles"),
      ])
      const items = raffleData.items ?? []
      setRaffles(items)
      setDrafts(Object.fromEntries(items.map((item) => [item.id, toDraft(item)])))
      setVehicles(vehicleData.items ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت داده‌ها")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const summary = useMemo(() => ({
    total: raffles.length,
    draft: raffles.filter((r) => r.status === "draft").length,
    open: raffles.filter((r) => r.status === "open").length,
    closed: raffles.filter((r) => r.status === "closed").length,
  }), [raffles])

  const filteredRaffles = useMemo(() => {
    const normalized = toEnglishDigits(query).trim().toLowerCase()
    if (!normalized) return raffles
    return raffles.filter((r) => toEnglishDigits(r.title).toLowerCase().includes(normalized) || r.id.toLowerCase().includes(normalized))
  }, [raffles, query])

  function handleCreateVehicleChange(vehicleId: string) {
    const v = vehicles.find((item) => item.id === vehicleId)
    if (!v) { setCreate((prev) => ({ ...prev, vehicleId })); return }
    setCreate((prev) => ({
      ...prev,
      vehicleId,
      title: `قرعه‌کشی ${v.vehicle.title}`,
      mainPrizeTitle: v.vehicle.title,
      mainPrizeValueIrr: v.listedPriceIrr ? String(v.listedPriceIrr) : prev.mainPrizeValueIrr,
      cashbackPercent: String(v.vehicle.raffle.cashbackPercent),
      cashbackToGoldPercent: String(v.vehicle.raffle.cashbackToGoldPercent),
      tomanPerGoldSot: String(v.vehicle.raffle.tomanPerGoldSot),
    }))
  }

  function setCreateText(field: "title" | "mainPrizeTitle", value: string) {
    setCreate((prev) => ({ ...prev, [field]: value }))
  }

  function setCreateInt(field: "maxTickets" | "basePrice" | "minPrice" | "cashbackPercent" | "cashbackToGoldPercent" | "tomanPerGoldSot" | "mainPrizeValueIrr", value: string) {
    setCreate((prev) => ({ ...prev, [field]: digitsOnly(value) }))
  }

  function setCreateDecayFactor(value: string) {
    setCreate((prev) => ({ ...prev, decayFactor: decimalOnly(value) }))
  }

  function setDraftText(raffleId: string, field: "title" | "mainPrizeTitle", value: string) {
    setDrafts((prev) => ({ ...prev, [raffleId]: { ...prev[raffleId]!, [field]: value } }))
  }

  function setDraftInt(raffleId: string, field: "maxTickets" | "basePrice" | "minPrice" | "cashbackPercent" | "cashbackToGoldPercent" | "tomanPerGoldSot" | "mainPrizeValueIrr", value: string) {
    setDrafts((prev) => ({ ...prev, [raffleId]: { ...prev[raffleId]!, [field]: digitsOnly(value) } }))
  }

  function setDraftDecayFactor(raffleId: string, value: string) {
    setDrafts((prev) => ({ ...prev, [raffleId]: { ...prev[raffleId]!, decayFactor: decimalOnly(value) } }))
  }

  async function handleCreate() {
    const error = validateDraft(create, true)
    if (error) { toast.error(error); return }
    setSavingCreate(true)
    try {
      await apiRequest("/admin/raffles", {
        method: "POST",
        body: JSON.stringify({
          vehicleId: create.vehicleId,
          title: create.title.trim() || undefined,
          maxTickets: Number(create.maxTickets),
          basePrice: Number(create.basePrice),
          minPrice: Number(create.minPrice),
          decayFactor: Number(create.decayFactor),
          cashbackPercent: Number(create.cashbackPercent),
          cashbackToGoldPercent: Number(create.cashbackToGoldPercent),
          tomanPerGoldSot: Number(create.tomanPerGoldSot),
          mainPrizeTitle: create.mainPrizeTitle.trim() || undefined,
          mainPrizeValueIrr: Number(create.mainPrizeValueIrr || 0),
        }),
      })
      toast.success("قرعه‌کشی جدید ساخته شد")
      setCreate(emptyDraft())
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ایجاد قرعه‌کشی ناموفق بود")
    } finally {
      setSavingCreate(false)
    }
  }

  async function saveRaffle(id: string) {
    const draft = drafts[id]
    if (!draft) return
    const error = validateDraft(draft, false)
    if (error) { toast.error(error); return }
    setSavingRaffleId(id)
    try {
      await apiRequest(`/admin/raffles/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          vehicleId: draft.vehicleId || undefined,
          title: draft.title.trim(),
          maxTickets: Number(draft.maxTickets),
          basePrice: Number(draft.basePrice),
          minPrice: Number(draft.minPrice),
          decayFactor: Number(draft.decayFactor),
          cashbackPercent: Number(draft.cashbackPercent),
          cashbackToGoldPercent: Number(draft.cashbackToGoldPercent),
          tomanPerGoldSot: Number(draft.tomanPerGoldSot),
          mainPrizeTitle: draft.mainPrizeTitle.trim(),
          mainPrizeValueIrr: Number(draft.mainPrizeValueIrr || 0),
        }),
      })
      toast.success("تنظیمات قرعه‌کشی ذخیره شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ذخیره تنظیمات ناموفق بود")
    } finally {
      setSavingRaffleId(null)
    }
  }

  async function changeStatus(id: string, action: "open" | "close") {
    setActionRaffleId(id)
    try {
      await apiRequest(`/admin/raffles/${id}/${action}`, { method: "POST" })
      toast.success("وضعیت بهروزرسانی شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تغییر وضعیت ناموفق بود")
    } finally {
      setActionRaffleId(null)
    }
  }

  async function runDraw(id: string) {
    setActionRaffleId(id)
    try {
      await apiRequest(`/admin/raffles/${id}/draw`, { method: "POST" })
      toast.success("قرعه‌کشی اجرا شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "اجرای قرعه‌کشی ناموفق بود")
    } finally {
      setActionRaffleId(null)
    }
  }

  async function deleteRaffle(id: string) {
    if (!confirm("آیا مطمئنید می‌خواهید این قرعه‌کشی را حذف کنید؟")) return
    setDeletingRaffleId(id)
    try {
      await apiRequest(`/admin/raffles/${id}`, { method: "DELETE" })
      toast.success("قرعه‌کشی حذف شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حذف قرعه‌کشی ناموفق بود")
    } finally {
      setDeletingRaffleId(null)
    }
  }

  const availableVehicles = useMemo(() => vehicles.filter((v) => v.status === "available"), [vehicles])

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h1 className="text-3xl font-black">مدیریت قرعه‌کشی‌ها</h1>
        <p className="text-white/40 text-sm mt-1">هر قرعه‌کشی مستقیماً به یک خودرو از نمایشگاه متصل است</p>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "کل قرعه‌کشی‌ها", value: summary.total, color: "text-white" },
          { label: "پیشنویس", value: summary.draft, color: "text-white/60" },
          { label: "در حال اجرا", value: summary.open, color: "text-emerald-400" },
          { label: "بسته شده", value: summary.closed, color: "text-white/40" },
        ].map((s) => (
          <div key={s.label} className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-4">
            <p className="text-xs text-white/40 mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value.toLocaleString("fa-IR")}</p>
          </div>
        ))}
      </section>

      {/* Create Form */}
      <section className="bg-[#0C0C0C] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-5">
        <h2 className="text-xl font-black">ایجاد قرعه‌کشی جدید</h2>

        {/* Step 1 */}
        <div className="rounded-xl border border-accent-gold/30 bg-accent-gold/5 p-4 space-y-3">
          <p className="text-sm font-bold flex items-center gap-2">
            <Car size={14} className="text-accent-gold" />
            گام اول: انتخاب خودرو از نمایشگاه
          </p>
          {availableVehicles.length === 0 ? (
            <p className="text-sm text-amber-400">⚠ هیچ خودروی موجودی در نمایشگاه ثبت نشده. ابتدا خودرو اضافه کنید.</p>
          ) : (
            <select
              value={create.vehicleId}
              onChange={(e) => handleCreateVehicleChange(e.target.value)}
              className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">— خودرو را انتخاب کنید (الزامی) —</option>
              {availableVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle.title} — {v.vehicle.year} — {v.vehicle.city}
                  {v.listedPriceIrr ? ` — ${formatToman(v.listedPriceIrr)} تومان` : ""}
                </option>
              ))}
            </select>
          )}
          {selectedCreateVehicle ? (
            <div className="flex items-center gap-3 rounded-xl bg-black/30 border border-white/10 p-3">
              {selectedCreateVehicle.vehicle.imageUrl ? (
                <img src={selectedCreateVehicle.vehicle.imageUrl} alt={selectedCreateVehicle.vehicle.title} className="w-20 h-14 object-cover rounded-lg shrink-0" />
              ) : (
                <div className="w-20 h-14 rounded-lg bg-white/5 flex items-center justify-center shrink-0"><ImageIcon size={20} className="text-white/30" /></div>
              )}
              <div className="text-sm">
                <p className="font-bold">{selectedCreateVehicle.vehicle.title}</p>
                <p className="text-white/50 text-xs">{selectedCreateVehicle.vehicle.model} · {selectedCreateVehicle.vehicle.year} · {selectedCreateVehicle.vehicle.city}</p>
                {selectedCreateVehicle.listedPriceIrr ? (
                  <p className="text-accent-gold text-xs font-bold">{formatToman(selectedCreateVehicle.listedPriceIrr)} تومان</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Step 2 */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
          <p className="text-sm font-bold text-white/70">گام دوم: تنظیمات بلیط و قیمت‌گذاری</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>عنوان قرعه‌کشی (اختیاری — از نام خودرو پر می‌شود)</label>
              <input value={create.title} onChange={(e) => setCreateText("title", e.target.value)} className={inputClass} placeholder="قرعه‌کشی پراید ۱۴۰۴" />
            </div>
            <div>
              <label className={labelClass}>ظرفیت کل بلیط</label>
              <input value={formatGrouped(create.maxTickets)} onChange={(e) => setCreateInt("maxTickets", e.target.value)} className={inputClass} placeholder="۱۰۰۰" inputMode="numeric" />
            </div>
            <div>
              <label className={labelClass}>قیمت پایه هر بلیط (تومان)</label>
              <input value={formatGrouped(create.basePrice)} onChange={(e) => setCreateInt("basePrice", e.target.value)} className={inputClass} placeholder="۵۰,۰۰۰" inputMode="numeric" />
            </div>
            <div>
              <label className={labelClass}>حداقل قیمت بلیط (تومان)</label>
              <input value={formatGrouped(create.minPrice)} onChange={(e) => setCreateInt("minPrice", e.target.value)} className={inputClass} placeholder="۳۰,۰۰۰" inputMode="numeric" />
            </div>
            <div>
              <label className={labelClass}>ضریب کاهش قیمت (۰ تا ۱)</label>
              <input value={create.decayFactor} onChange={(e) => setCreateDecayFactor(e.target.value)} className={inputClass} placeholder="0.98" inputMode="decimal" />
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
          <p className="text-sm font-bold text-white/70">گام سوم: جایزه و کش‌بک (از خودرو پر شده — قابل تغییر)</p>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className={labelClass}>عنوان جایزه اصلی</label>
              <input value={create.mainPrizeTitle} onChange={(e) => setCreateText("mainPrizeTitle", e.target.value)} className={inputClass} placeholder="از نام خودرو پر میشود" />
            </div>
            <div>
              <label className={labelClass}>ارزش جایزه (تومان)</label>
              <input value={formatGrouped(create.mainPrizeValueIrr)} onChange={(e) => setCreateInt("mainPrizeValueIrr", e.target.value)} className={inputClass} placeholder="از قیمت خودرو" inputMode="numeric" />
            </div>
            <div>
              <label className={labelClass}>درصد کش‌بک</label>
              <input value={formatGrouped(create.cashbackPercent)} onChange={(e) => setCreateInt("cashbackPercent", e.target.value)} className={inputClass} inputMode="numeric" />
            </div>
            <div>
              <label className={labelClass}>درصد تبدیل به سوت</label>
              <input value={formatGrouped(create.cashbackToGoldPercent)} onChange={(e) => setCreateInt("cashbackToGoldPercent", e.target.value)} className={inputClass} inputMode="numeric" />
            </div>
            <div>
              <label className={labelClass}>نرخ تومان به سوت</label>
              <input value={formatGrouped(create.tomanPerGoldSot)} onChange={(e) => setCreateInt("tomanPerGoldSot", e.target.value)} className={inputClass} inputMode="numeric" />
            </div>
          </div>
        </div>

        <button onClick={() => void handleCreate()} disabled={savingCreate || !create.vehicleId} className="btn-primary disabled:opacity-60">
          {savingCreate ? "در حال ثبت..." : "ثبت قرعه‌کشی"}
        </button>
      </section>

      {/* Search */}
      <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-[#0C0C0C] border border-white/10 rounded-xl px-4 py-3 text-sm" placeholder="جستجو در قرعه‌کشی‌ها..." />

      {/* List */}
      <section className="space-y-4">
        {loading ? <p className="text-white/50 text-sm py-4">در حال بارگذاری...</p> : null}
        {!loading && !filteredRaffles.length ? <p className="text-white/50 text-sm py-4">قرعه‌کشی‌ای یافت نشد.</p> : null}

        {filteredRaffles.map((raffle) => {
          const draft = drafts[raffle.id]
          if (!draft) return null
          const isSaving = savingRaffleId === raffle.id
          const isActing = actionRaffleId === raffle.id
          const fillPct = raffle.maxTickets > 0 ? Math.min(100, Math.round((raffle.ticketsSold / raffle.maxTickets) * 100)) : 0

          return (
            <div key={raffle.id} className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start gap-4">
                {raffle.linkedVehicle?.imageUrl ? (
                  <img src={raffle.linkedVehicle.imageUrl} alt={raffle.linkedVehicle.title} className="w-24 h-16 object-cover rounded-xl shrink-0" />
                ) : (
                  <div className="w-24 h-16 rounded-xl bg-white/5 flex items-center justify-center shrink-0"><Car size={20} className="text-white/20" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xl font-black">{raffle.title}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${STATUS_COLOR[raffle.status] ?? "bg-white/5 text-white/50"}`}>
                      {STATUS_LABEL[raffle.status] ?? raffle.status}
                    </span>
                  </div>
                  {raffle.linkedVehicle ? (
                    <p className="text-xs text-white/40 mt-0.5">
                      {raffle.linkedVehicle.model} · {raffle.linkedVehicle.year} · {raffle.linkedVehicle.city} ·{" "}
                      <span className={raffle.linkedVehicle.status === "available" ? "text-emerald-400" : "text-amber-400"}>
                        {VEHICLE_STATUS_LABEL[raffle.linkedVehicle.status] ?? raffle.linkedVehicle.status}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-amber-400 mt-0.5">⚠ هیچ خودرویی به این قرعه‌کشی متصل نیست</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-1">
                  <p className="text-xs text-white/40">بلیط فروخته شده</p>
                  <p className="font-black text-[#D4AF37]">{raffle.ticketsSold.toLocaleString("fa-IR")}</p>
                  <div className="h-1 rounded-full bg-white/10"><div className="h-1 rounded-full bg-[#D4AF37]" style={{ width: `${fillPct}%` }} /></div>
                  <p className="text-[10px] text-white/30">{fillPct.toLocaleString("fa-IR")}٪ از ظرفیت</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-1">
                  <p className="text-xs text-white/40">شرکت‌کنندگان</p>
                  <p className="font-black">{raffle.participantsCount.toLocaleString("fa-IR")} نفر</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-1">
                  <p className="text-xs text-white/40">قیمت پایه بلیط</p>
                  <p className="font-black">{formatToman(raffle.dynamicPricing.basePrice)} ت</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-1">
                  <p className="text-xs text-white/40">ارزش جایزه</p>
                  <p className="font-black">{formatToman(raffle.rewardConfig.mainPrizeValueIrr)} ت</p>
                </div>
              </div>

              {/* Editable */}
              <div className="rounded-xl border border-[#D4AF37]/15 bg-[#D4AF37]/5 p-4 space-y-3">
                <p className="text-xs text-[#D4AF37] font-bold">تنظیمات قابل ویرایش</p>
                <div>
                  <p className={labelClass}>تغییر خودرو متصل</p>
                  <select
                    value={draft.vehicleId}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [raffle.id]: { ...prev[raffle.id]!, vehicleId: e.target.value } }))}
                    className={inputClass}
                  >
                    <option value="">— بدون خودرو —</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.vehicle.title} · {v.vehicle.year} · {VEHICLE_STATUS_LABEL[v.status] ?? v.status}</option>
                    ))}
                  </select>
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  <div><p className={labelClass}>عنوان</p><input value={draft.title} onChange={(e) => setDraftText(raffle.id, "title", e.target.value)} className={inputClass} /></div>
                  <div><p className={labelClass}>ظرفیت کل بلیط</p><input value={formatGrouped(draft.maxTickets)} onChange={(e) => setDraftInt(raffle.id, "maxTickets", e.target.value)} className={inputClass} inputMode="numeric" /></div>
                  <div><p className={labelClass}>قیمت پایه (تومان)</p><input value={formatGrouped(draft.basePrice)} onChange={(e) => setDraftInt(raffle.id, "basePrice", e.target.value)} className={inputClass} inputMode="numeric" /></div>
                  <div><p className={labelClass}>حداقل قیمت (تومان)</p><input value={formatGrouped(draft.minPrice)} onChange={(e) => setDraftInt(raffle.id, "minPrice", e.target.value)} className={inputClass} inputMode="numeric" /></div>
                  <div><p className={labelClass}>ضریب کاهش</p><input value={draft.decayFactor} onChange={(e) => setDraftDecayFactor(raffle.id, e.target.value)} className={inputClass} inputMode="decimal" /></div>
                  <div><p className={labelClass}>عنوان جایزه</p><input value={draft.mainPrizeTitle} onChange={(e) => setDraftText(raffle.id, "mainPrizeTitle", e.target.value)} className={inputClass} /></div>
                  <div><p className={labelClass}>ارزش جایزه (تومان)</p><input value={formatGrouped(draft.mainPrizeValueIrr)} onChange={(e) => setDraftInt(raffle.id, "mainPrizeValueIrr", e.target.value)} className={inputClass} inputMode="numeric" /></div>
                  <div><p className={labelClass}>درصد کش‌بک</p><input value={formatGrouped(draft.cashbackPercent)} onChange={(e) => setDraftInt(raffle.id, "cashbackPercent", e.target.value)} className={inputClass} inputMode="numeric" /></div>
                  <div><p className={labelClass}>نرخ تومان به سوت</p><input value={formatGrouped(draft.tomanPerGoldSot)} onChange={(e) => setDraftInt(raffle.id, "tomanPerGoldSot", e.target.value)} className={inputClass} inputMode="numeric" /></div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => void saveRaffle(raffle.id)} disabled={isSaving} className="btn-primary disabled:opacity-60 text-sm">{isSaving ? "در حال ذخیره..." : "ذخیره تنظیمات"}</button>
                {raffle.status === "draft" ? <button onClick={() => void changeStatus(raffle.id, "open")} disabled={isActing} className="btn-secondary disabled:opacity-60 text-sm">شروع قرعه‌کشی</button> : null}
                {raffle.status === "open" ? <button onClick={() => void changeStatus(raffle.id, "close")} disabled={isActing} className="btn-secondary disabled:opacity-60 text-sm">بستن قرعه‌کشی</button> : null}
                {raffle.status === "closed" ? <button onClick={() => void runDraw(raffle.id)} disabled={isActing} className="btn-secondary disabled:opacity-60 text-sm">اجرای قرعه‌کشی (اسلاید)</button> : null}
                {raffle.status !== "open" && raffle.ticketsSold === 0 ? (
                  <button
                    onClick={() => void deleteRaffle(raffle.id)}
                    disabled={deletingRaffleId === raffle.id}
                    className="btn-secondary disabled:opacity-60 text-sm text-red-400 border-red-400/30 hover:bg-red-400/10"
                  >
                    {deletingRaffleId === raffle.id ? "در حال حذف..." : "حذف قرعه‌کشی"}
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
