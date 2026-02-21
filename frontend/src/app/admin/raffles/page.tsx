"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"

type Raffle = {
  id: string
  title: string
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
  title: string
  maxTickets: string
  participantsCount: string
  basePrice: string
  minPrice: string
  decayFactor: string
  cashbackPercent: string
  cashbackToGoldPercent: string
  tomanPerGoldSot: string
  mainPrizeTitle: string
  mainPrizeValueIrr: string
}

function toDraft(item: Raffle): RaffleDraft {
  return {
    title: item.title,
    maxTickets: String(item.maxTickets),
    participantsCount: String(item.participantsCount),
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

export default function AdminRafflesPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([])
  const [create, setCreate] = useState<RaffleDraft>({
    title: "",
    maxTickets: "1000",
    participantsCount: "0",
    basePrice: "50000",
    minPrice: "30000",
    decayFactor: "0.98",
    cashbackPercent: "20",
    cashbackToGoldPercent: "30",
    tomanPerGoldSot: "100000",
    mainPrizeTitle: "جایزه اصلی خودرو",
    mainPrizeValueIrr: "8500000000",
  })
  const [drafts, setDrafts] = useState<Record<string, RaffleDraft>>({})

  const load = async () => {
    try {
      const data = await apiRequest<{ items: Raffle[] }>("/admin/raffles")
      setRaffles(data.items)
      setDrafts(Object.fromEntries(data.items.map((item) => [item.id, toDraft(item)])))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت قرعه‌کشی‌ها")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const inputClass = "w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2"

  async function handleCreate() {
    if (!create.title.trim()) return toast.error("عنوان قرعه‌کشی الزامی است")
    try {
      await apiRequest("/admin/raffles", {
        method: "POST",
        body: JSON.stringify({
          title: create.title.trim(),
          maxTickets: Number(create.maxTickets),
          participantsCount: Number(create.participantsCount),
          basePrice: Number(create.basePrice),
          minPrice: Number(create.minPrice),
          decayFactor: Number(create.decayFactor),
          cashbackPercent: Number(create.cashbackPercent),
          cashbackToGoldPercent: Number(create.cashbackToGoldPercent),
          tomanPerGoldSot: Number(create.tomanPerGoldSot),
          mainPrizeTitle: create.mainPrizeTitle.trim(),
          mainPrizeValueIrr: Number(create.mainPrizeValueIrr),
        }),
      })
      toast.success("قرعه‌کشی جدید ساخته شد")
      setCreate((prev) => ({ ...prev, title: "" }))
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ایجاد قرعه‌کشی ناموفق بود")
    }
  }

  async function saveRaffle(id: string) {
    const draft = drafts[id]
    if (!draft) return
    try {
      await apiRequest(`/admin/raffles/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: draft.title.trim(),
          maxTickets: Number(draft.maxTickets),
          participantsCount: Number(draft.participantsCount),
          basePrice: Number(draft.basePrice),
          minPrice: Number(draft.minPrice),
          decayFactor: Number(draft.decayFactor),
          cashbackPercent: Number(draft.cashbackPercent),
          cashbackToGoldPercent: Number(draft.cashbackToGoldPercent),
          tomanPerGoldSot: Number(draft.tomanPerGoldSot),
          mainPrizeTitle: draft.mainPrizeTitle.trim(),
          mainPrizeValueIrr: Number(draft.mainPrizeValueIrr),
        }),
      })
      toast.success("تنظیمات قرعه‌کشی ذخیره شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ذخیره تنظیمات ناموفق بود")
    }
  }

  async function changeStatus(id: string, action: "open" | "close") {
    try {
      await apiRequest(`/admin/raffles/${id}/${action}`, { method: "POST" })
      toast.success("وضعیت به‌روزرسانی شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تغییر وضعیت ناموفق بود")
    }
  }

  async function runDraw(id: string) {
    try {
      await apiRequest(`/admin/raffles/${id}/draw`, { method: "POST" })
      toast.success("قرعه‌کشی اجرا شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "اجرای قرعه‌کشی ناموفق بود")
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      <h1 className="text-4xl font-bold">مدیریت قرعه‌کشی و جوایز</h1>

      <section className="card glass p-6 space-y-3">
        <h2 className="text-xl font-black">ایجاد قرعه‌کشی جدید</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <input value={create.title} onChange={(e) => setCreate((p) => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="عنوان قرعه‌کشی" />
          <input value={create.maxTickets} onChange={(e) => setCreate((p) => ({ ...p, maxTickets: e.target.value }))} className={inputClass} placeholder="ظرفیت بلیط" />
          <input value={create.participantsCount} onChange={(e) => setCreate((p) => ({ ...p, participantsCount: e.target.value }))} className={inputClass} placeholder="تعداد شرکت‌کننده" />
          <input value={create.basePrice} onChange={(e) => setCreate((p) => ({ ...p, basePrice: e.target.value }))} className={inputClass} placeholder="قیمت پایه" />
          <input value={create.minPrice} onChange={(e) => setCreate((p) => ({ ...p, minPrice: e.target.value }))} className={inputClass} placeholder="حداقل قیمت" />
          <input value={create.decayFactor} onChange={(e) => setCreate((p) => ({ ...p, decayFactor: e.target.value }))} className={inputClass} placeholder="ضریب کاهش قیمت" />
          <input value={create.cashbackPercent} onChange={(e) => setCreate((p) => ({ ...p, cashbackPercent: e.target.value }))} className={inputClass} placeholder="درصد کش‌بک" />
          <input value={create.cashbackToGoldPercent} onChange={(e) => setCreate((p) => ({ ...p, cashbackToGoldPercent: e.target.value }))} className={inputClass} placeholder="درصد تبدیل به سوت" />
          <input value={create.tomanPerGoldSot} onChange={(e) => setCreate((p) => ({ ...p, tomanPerGoldSot: e.target.value }))} className={inputClass} placeholder="نرخ تومان به سوت" />
          <input value={create.mainPrizeTitle} onChange={(e) => setCreate((p) => ({ ...p, mainPrizeTitle: e.target.value }))} className={inputClass} placeholder="عنوان جایزه اصلی" />
          <input value={create.mainPrizeValueIrr} onChange={(e) => setCreate((p) => ({ ...p, mainPrizeValueIrr: e.target.value }))} className={inputClass} placeholder="ارزش جایزه اصلی" />
        </div>
        <button onClick={handleCreate} className="btn-primary">ثبت قرعه‌کشی</button>
      </section>

      <section className="space-y-4">
        {raffles.map((raffle) => {
          const draft = drafts[raffle.id]
          if (!draft) return null
          return (
            <div key={raffle.id} className="card glass p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-black">{raffle.title}</h3>
                <div className="text-sm px-3 py-1 rounded-full border border-white/20 bg-black/20">{raffle.status}</div>
              </div>

              <div className="grid md:grid-cols-4 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-black/25 p-3">فروخته‌شده: {raffle.ticketsSold.toLocaleString("fa-IR")} / {raffle.maxTickets.toLocaleString("fa-IR")}</div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-3">شرکت‌کننده: {raffle.participantsCount.toLocaleString("fa-IR")}</div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-3">کش‌بک: {raffle.rewardConfig.cashbackPercent.toLocaleString("fa-IR")}٪</div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-3">تبدیل به سوت: {raffle.rewardConfig.cashbackToGoldPercent.toLocaleString("fa-IR")}٪</div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <input value={draft.title} onChange={(e) => setDrafts((p) => ({ ...p, [raffle.id]: { ...draft, title: e.target.value } }))} className={inputClass} placeholder="عنوان" />
                <input value={draft.maxTickets} onChange={(e) => setDrafts((p) => ({ ...p, [raffle.id]: { ...draft, maxTickets: e.target.value } }))} className={inputClass} placeholder="ظرفیت" />
                <input value={draft.participantsCount} onChange={(e) => setDrafts((p) => ({ ...p, [raffle.id]: { ...draft, participantsCount: e.target.value } }))} className={inputClass} placeholder="شرکت‌کننده" />
                <input value={draft.basePrice} onChange={(e) => setDrafts((p) => ({ ...p, [raffle.id]: { ...draft, basePrice: e.target.value } }))} className={inputClass} placeholder="قیمت پایه" />
                <input value={draft.minPrice} onChange={(e) => setDrafts((p) => ({ ...p, [raffle.id]: { ...draft, minPrice: e.target.value } }))} className={inputClass} placeholder="حداقل قیمت" />
                <input value={draft.decayFactor} onChange={(e) => setDrafts((p) => ({ ...p, [raffle.id]: { ...draft, decayFactor: e.target.value } }))} className={inputClass} placeholder="ضریب کاهش" />
                <input value={draft.cashbackPercent} onChange={(e) => setDrafts((p) => ({ ...p, [raffle.id]: { ...draft, cashbackPercent: e.target.value } }))} className={inputClass} placeholder="درصد کش‌بک" />
                <input value={draft.cashbackToGoldPercent} onChange={(e) => setDrafts((p) => ({ ...p, [raffle.id]: { ...draft, cashbackToGoldPercent: e.target.value } }))} className={inputClass} placeholder="درصد تبدیل به سوت" />
                <input value={draft.tomanPerGoldSot} onChange={(e) => setDrafts((p) => ({ ...p, [raffle.id]: { ...draft, tomanPerGoldSot: e.target.value } }))} className={inputClass} placeholder="نرخ تومان به سوت" />
                <input value={draft.mainPrizeTitle} onChange={(e) => setDrafts((p) => ({ ...p, [raffle.id]: { ...draft, mainPrizeTitle: e.target.value } }))} className={inputClass} placeholder="عنوان جایزه اصلی" />
                <input value={draft.mainPrizeValueIrr} onChange={(e) => setDrafts((p) => ({ ...p, [raffle.id]: { ...draft, mainPrizeValueIrr: e.target.value } }))} className={inputClass} placeholder="ارزش جایزه اصلی" />
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => void saveRaffle(raffle.id)} className="btn-primary">ذخیره تنظیمات</button>
                {raffle.status === "draft" && <button onClick={() => void changeStatus(raffle.id, "open")} className="btn-secondary">باز کردن</button>}
                {raffle.status === "open" && <button onClick={() => void changeStatus(raffle.id, "close")} className="btn-secondary">بستن</button>}
                {raffle.status === "closed" && <button onClick={() => void runDraw(raffle.id)} className="btn-secondary">اجرای قرعه</button>}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
