"use client"

import { useEffect, useMemo, useState } from "react"
import { Calculator, Plus, Save, Send, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"

type PriceTier = {
  id: number
  order: number
  price: number
  discount: number
}

export default function AdminPricingPage() {
  const [policyId, setPolicyId] = useState<string>("")
  const [version, setVersion] = useState("v2-draft")
  const [cashbackPercent, setCashbackPercent] = useState(20)
  const [drawChancePerTicket, setDrawChancePerTicket] = useState(1)
  const [wheelChancePerTicket, setWheelChancePerTicket] = useState(1)
  const [freeTicketPerN, setFreeTicketPerN] = useState(5)
  const [tiers, setTiers] = useState<PriceTier[]>([
    { id: 1, order: 1, price: 1_000_000, discount: 0 },
    { id: 2, order: 2, price: 800_000, discount: 20 },
  ])
  const [previewCount, setPreviewCount] = useState(3)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiRequest<{ current?: { id: string; version: string; tiers: Array<{ order: number; price: number; discountPercent: number }>; config: { cashbackPercent: number; wheelChancePerTicket: number; lotteryChancePerTicket: number; freeEntryEveryN: number } } }>("/admin/pricing/current")
        if (!data.current) return
        setPolicyId(data.current.id)
        setVersion(data.current.version)
        setCashbackPercent(data.current.config.cashbackPercent)
        setWheelChancePerTicket(data.current.config.wheelChancePerTicket)
        setDrawChancePerTicket(data.current.config.lotteryChancePerTicket)
        setFreeTicketPerN(data.current.config.freeEntryEveryN)
        setTiers(data.current.tiers.map((t, idx) => ({
          id: idx + 1,
          order: t.order,
          price: t.price,
          discount: t.discountPercent,
        })))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "خطا در دریافت policy")
      }
    })()
  }, [])

  const total = useMemo(() => {
    const prices = Array.from({ length: previewCount }, (_, idx) => tiers[idx]?.price ?? tiers[tiers.length - 1].price)
    return prices.reduce((sum, p) => sum + p, 0)
  }, [previewCount, tiers])

  const cashback = useMemo(() => Math.floor(total * (cashbackPercent / 100)), [cashbackPercent, total])

  const updateTier = (id: number, field: "price" | "discount", value: number) => {
    setTiers((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const addTier = () => {
    setTiers((prev) => {
      const nextOrder = prev.length + 1
      const lastPrice = prev[prev.length - 1]?.price ?? 1_000_000
      const nextPrice = Math.max(1, Math.floor(lastPrice * 0.8))
      return [...prev, { id: Date.now(), order: nextOrder, price: nextPrice, discount: 0 }]
    })
  }

  const removeTier = (id: number) => {
    setTiers((prev) => prev.filter((row) => row.id !== id).map((row, index) => ({ ...row, order: index + 1 })))
  }

  async function saveDraft() {
    try {
      const data = await apiRequest<{ policy: { id: string } }>("/admin/pricing/policies", {
        method: "POST",
        body: JSON.stringify({
          version,
          tiers: tiers.map((t) => ({ order: t.order, price: t.price, discountPercent: t.discount })),
          config: {
            cashbackPercent,
            wheelChancePerTicket,
            lotteryChancePerTicket: drawChancePerTicket,
            freeEntryEveryN: freeTicketPerN,
          },
        }),
      })
      setPolicyId(data.policy.id)
      toast.success("Draft ذخیره شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره")
    }
  }

  async function publish() {
    if (!policyId) return toast.error("اول Draft ذخیره شود")
    try {
      await apiRequest(`/admin/pricing/publish/${policyId}`, { method: "POST" })
      toast.success("Policy منتشر شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در انتشار")
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">سیاست‌های قیمت‌گذاری</h1>
          <p className="text-dark-text/60">مدیریت کامل قیمت بلیط، کش بک و نسخه‌بندی از طریق API</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={saveDraft} className="btn-secondary">
            <Save size={18} />
            ذخیره Draft
          </button>
          <button onClick={publish} className="btn-primary">
            <Send size={18} />
            انتشار نسخه
          </button>
        </div>
      </div>

      <section className="grid xl:grid-cols-[1.2fr,1fr] gap-6">
        <div className="card glass p-6">
          <h2 className="text-2xl font-bold mb-5">پلکان تخفیفی بلیط</h2>
          <div className="space-y-3">
            {tiers.map((tier) => (
              <div key={tier.id} className="grid grid-cols-[90px,1fr,140px,40px] gap-3 items-center bg-dark-bg/50 border border-dark-border/30 rounded-xl p-3">
                <span className="text-sm font-bold">بلیط {tier.order.toLocaleString("fa-IR")}</span>
                <input type="number" value={tier.price} onChange={(e) => updateTier(tier.id, "price", Number(e.target.value))} className="bg-dark-surface/70 border border-dark-border/40 rounded-lg px-3 py-2" />
                <input type="number" value={tier.discount} onChange={(e) => updateTier(tier.id, "discount", Number(e.target.value))} className="bg-dark-surface/70 border border-dark-border/40 rounded-lg px-3 py-2" />
                <button type="button" onClick={() => removeTier(tier.id)} className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 inline-flex items-center justify-center hover:bg-status-danger/10 hover:border-status-danger/30 transition-colors">
                  <Trash2 size={16} className="text-status-danger" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addTier} className="btn-secondary mt-4">
            <Plus size={16} />
            افزودن پلکان جدید
          </button>
        </div>

        <div className="card glass p-6">
          <h2 className="text-2xl font-bold mb-5">قوانین امتیاز و کش بک</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark-bg/50 border border-dark-border/30 rounded-xl p-3">
              <label className="text-xs text-dark-text/60">درصد کش بک</label>
              <input type="number" value={cashbackPercent} onChange={(e) => setCashbackPercent(Number(e.target.value))} className="w-full mt-2 bg-dark-surface/70 border border-dark-border/40 rounded-lg px-3 py-2" />
            </div>
            <div className="bg-dark-bg/50 border border-dark-border/30 rounded-xl p-3">
              <label className="text-xs text-dark-text/60">شانس قرعه کشی/بلیط</label>
              <input type="number" value={drawChancePerTicket} onChange={(e) => setDrawChancePerTicket(Number(e.target.value))} className="w-full mt-2 bg-dark-surface/70 border border-dark-border/40 rounded-lg px-3 py-2" />
            </div>
            <div className="bg-dark-bg/50 border border-dark-border/30 rounded-xl p-3">
              <label className="text-xs text-dark-text/60">شانس گردونه/بلیط</label>
              <input type="number" value={wheelChancePerTicket} onChange={(e) => setWheelChancePerTicket(Number(e.target.value))} className="w-full mt-2 bg-dark-surface/70 border border-dark-border/40 rounded-lg px-3 py-2" />
            </div>
            <div className="bg-dark-bg/50 border border-dark-border/30 rounded-xl p-3">
              <label className="text-xs text-dark-text/60">هر چند بلیط = ۱ رایگان</label>
              <input type="number" value={freeTicketPerN} onChange={(e) => setFreeTicketPerN(Number(e.target.value))} className="w-full mt-2 bg-dark-surface/70 border border-dark-border/40 rounded-lg px-3 py-2" />
            </div>
          </div>
        </div>
      </section>

      <section className="card glass p-6">
        <h2 className="text-2xl font-bold mb-5 inline-flex items-center gap-2">
          <Calculator size={20} />
          پیش‌نمایش محاسبات
        </h2>
        <div className="mb-4 max-w-xs">
          <label className="block text-sm text-dark-text/70 mb-2">تعداد بلیط برای پیش‌نمایش</label>
          <select value={previewCount} onChange={(e) => setPreviewCount(Number(e.target.value))} className="w-full bg-dark-bg/50 border border-dark-border/40 rounded-xl px-4 py-3">
            {Array.from({ length: 10 }, (_, idx) => idx + 1).map((n) => (
              <option key={n} value={n}>{n.toLocaleString("fa-IR")}</option>
            ))}
          </select>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-dark-text/70">جمع پرداختی</p><p className="font-black text-accent-gold">{total.toLocaleString("fa-IR")} تومان</p></div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-dark-text/70">کش بک</p><p className="font-black text-accent-cyan">{cashback.toLocaleString("fa-IR")} تومان</p></div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-dark-text/70">شانس گردونه</p><p className="font-black">{(previewCount * wheelChancePerTicket).toLocaleString("fa-IR")}</p></div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-sm text-dark-text/70">شانس قرعه کشی</p><p className="font-black">{(previewCount * drawChancePerTicket).toLocaleString("fa-IR")}</p></div>
        </div>
      </section>
    </div>
  )
}
