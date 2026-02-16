"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"

type Segment = { label: string; color: string; weight: number }
type WheelConfig = {
  wheelCostChances: number
  raffleCostChances: number
  referralChancePerUser: number
  slideGameCostChances: number
  segments: Segment[]
}

const DEFAULT_SEGMENT: Segment = {
  label: "جایزه جدید",
  color: "#60A5FA",
  weight: 10,
}

export default function AdminWheelPage() {
  const [config, setConfig] = useState<WheelConfig>({
    wheelCostChances: 2,
    raffleCostChances: 5,
    referralChancePerUser: 1,
    slideGameCostChances: 5,
    segments: [],
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiRequest<{ config: WheelConfig }>("/admin/wheel/config")
        setConfig(data.config)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "خطا در دریافت تنظیمات گردونه")
      }
    })()
  }, [])

  const totalWeight = useMemo(() => config.segments.reduce((sum, s) => sum + (Number.isFinite(s.weight) ? s.weight : 0), 0), [config.segments])
  const weightValid = totalWeight === 100
  const minSegmentsValid = config.segments.length >= 2
  const canSave = weightValid && minSegmentsValid && !saving

  const updateSegment = (idx: number, patch: Partial<Segment>) => {
    setConfig((prev) => ({
      ...prev,
      segments: prev.segments.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }))
  }

  const addSegment = () => {
    setConfig((prev) => ({
      ...prev,
      segments: [...prev.segments, { ...DEFAULT_SEGMENT }],
    }))
  }

  const removeSegment = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      segments: prev.segments.filter((_, i) => i !== idx),
    }))
  }

  const save = async () => {
    if (!minSegmentsValid) {
      toast.error("حداقل ۲ آیتم برای گردونه لازم است")
      return
    }
    if (!weightValid) {
      toast.error("جمع وزن آیتم‌ها باید دقیقاً ۱۰۰ باشد")
      return
    }
    setSaving(true)
    try {
      await apiRequest("/admin/wheel/config", {
        method: "PUT",
        body: JSON.stringify(config),
      })
      toast.success("تنظیمات گردونه ذخیره شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره تنظیمات")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      <h1 className="text-4xl font-bold">مدیریت بازی‌ها و شانس‌ها</h1>

      <div className="card glass p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold">تنظیمات گردونه شانس</h2>
          <button onClick={addSegment} className="btn-secondary">
            <Plus className="w-4 h-4" />
            افزودن آیتم
          </button>
        </div>

        <div className="mb-5 p-4 rounded-xl border border-white/10 bg-black/20 flex flex-wrap items-center gap-3">
          <span className="text-sm text-white/70">جمع وزن‌ها:</span>
          <span className={`text-lg font-black ${weightValid ? "text-emerald-400" : "text-rose-400"}`}>{totalWeight}</span>
          <span className="text-sm text-white/40">/ 100</span>
          {!weightValid && <span className="text-xs text-rose-400">برای ذخیره باید دقیقاً 100 شود.</span>}
          {!minSegmentsValid && <span className="text-xs text-rose-400">حداقل ۲ آیتم لازم است.</span>}
        </div>

        <div className="space-y-3">
          {config.segments.map((segment, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 p-4 bg-dark-bg/50 rounded-xl border border-dark-border/30">
              <div className="col-span-12 md:col-span-4">
                <label className="text-xs text-white/60">عنوان آیتم</label>
                <input
                  value={segment.label}
                  onChange={(e) => updateSegment(idx, { label: e.target.value })}
                  className="w-full mt-1 bg-dark-surface rounded px-3 py-2 border border-dark-border"
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <label className="text-xs text-white/60">رنگ</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="color"
                    value={segment.color}
                    onChange={(e) => updateSegment(idx, { color: e.target.value })}
                    className="w-12 h-10 rounded border border-dark-border bg-transparent p-1"
                  />
                  <input
                    value={segment.color}
                    onChange={(e) => updateSegment(idx, { color: e.target.value })}
                    className="flex-1 bg-dark-surface rounded px-3 py-2 border border-dark-border"
                  />
                </div>
              </div>
              <div className="col-span-4 md:col-span-3">
                <label className="text-xs text-white/60">وزن (1-100)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={segment.weight}
                  onChange={(e) => updateSegment(idx, { weight: Number(e.target.value) })}
                  className="w-full mt-1 bg-dark-surface rounded px-3 py-2 border border-dark-border"
                />
              </div>
              <div className="col-span-2 md:col-span-2 flex items-end">
                <button onClick={() => removeSegment(idx)} className="w-full h-10 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/10">
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-4 space-y-2">
            <h3 className="font-bold mb-1">تنظیم شانس‌ها</h3>
            <label className="text-sm text-dark-text/60 block">هزینه گردونه</label>
            <input type="number" className="w-full bg-dark-surface rounded px-3 py-2 border border-dark-border" value={config.wheelCostChances} onChange={(e) => setConfig({ ...config, wheelCostChances: Number(e.target.value) })} />
            <label className="text-sm text-dark-text/60 block">هزینه شرکت قرعه کشی</label>
            <input type="number" className="w-full bg-dark-surface rounded px-3 py-2 border border-dark-border" value={config.raffleCostChances} onChange={(e) => setConfig({ ...config, raffleCostChances: Number(e.target.value) })} />
            <label className="text-sm text-dark-text/60 block">شانس زیرمجموعه</label>
            <input type="number" className="w-full bg-dark-surface rounded px-3 py-2 border border-dark-border" value={config.referralChancePerUser} onChange={(e) => setConfig({ ...config, referralChancePerUser: Number(e.target.value) })} />
          </div>
          <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-4 space-y-2">
            <h3 className="font-bold mb-1">ماشین اسلاید</h3>
            <label className="text-sm text-dark-text/60 block">هزینه هر بازی</label>
            <input type="number" className="w-full bg-dark-surface rounded px-3 py-2 border border-dark-border" value={config.slideGameCostChances} onChange={(e) => setConfig({ ...config, slideGameCostChances: Number(e.target.value) })} />
          </div>
        </div>

        <button onClick={save} disabled={!canSave} className="btn-primary mt-8 disabled:opacity-60">
          {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </div>
    </div>
  )
}

