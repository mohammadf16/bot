"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { formatJalaliDate, formatJalaliDateTime } from "@/lib/date"
import { formatToman } from "@/lib/money"

type CheckListing = {
  id: string
  ownerUserId: string
  ownerEmail: string
  ownerName: string
  ownerPhone?: string
  vehicleModel: string
  vehicleYear?: number
  city: string
  suggestedPriceIrr: number
  deliveryDate: string
  notes?: string
  status: "pending_review" | "approved" | "rejected" | "completed"
  createdAt: string
  updatedAt: string
}

const STATUS_LABEL: Record<CheckListing["status"], string> = {
  pending_review: "در انتظار بررسی",
  approved: "تایید شده",
  rejected: "رد شده",
  completed: "نهایی شده",
}

const STATUS_CLASS: Record<CheckListing["status"], string> = {
  pending_review: "border-amber-400/40 text-amber-200",
  approved: "border-emerald-400/40 text-emerald-200",
  rejected: "border-rose-400/40 text-rose-200",
  completed: "border-sky-400/40 text-sky-200",
}

export default function AdminChecksPage() {
  const [items, setItems] = useState<CheckListing[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | CheckListing["status"]>("all")

  async function loadItems() {
    setLoading(true)
    try {
      const data = await apiRequest<{ items: CheckListing[] }>("/admin/checks/listings", { method: "GET" })
      setItems(data.items ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "دریافت لیست حواله‌ها ناموفق بود")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadItems()
  }, [])

  const summary = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((item) => item.status === "pending_review").length,
      approved: items.filter((item) => item.status === "approved").length,
      rejected: items.filter((item) => item.status === "rejected").length,
    }),
    [items],
  )

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      if (!normalized) return true
      return `${item.id} ${item.ownerEmail} ${item.ownerName} ${item.ownerPhone ?? ""} ${item.vehicleModel} ${item.city}`.toLowerCase().includes(normalized)
    })
  }, [items, query, statusFilter])

  async function updateStatus(id: string, status: CheckListing["status"]) {
    setUpdatingId(id)
    try {
      await apiRequest(`/admin/checks/listings/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      })
      await loadItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تغییر وضعیت حواله ناموفق بود")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-3xl md:text-4xl font-black">مدیریت حواله خودرو</h1>
      <p className="text-white/60">
        همه حواله‌های ثبت‌شده کاربران در این بخش فقط برای ادمین قابل مشاهده و مدیریت است.
      </p>

      <section className="grid md:grid-cols-4 gap-3">
        <div className="card glass p-4">کل حواله‌ها: {summary.total.toLocaleString("fa-IR")}</div>
        <div className="card glass p-4">در انتظار بررسی: {summary.pending.toLocaleString("fa-IR")}</div>
        <div className="card glass p-4">تایید شده: {summary.approved.toLocaleString("fa-IR")}</div>
        <div className="card glass p-4">رد شده: {summary.rejected.toLocaleString("fa-IR")}</div>
      </section>

      <section className="card glass p-4 grid md:grid-cols-[1fr_auto] gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2"
          placeholder="جستجو با مدل خودرو، نام، ایمیل، موبایل یا شناسه"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="bg-black/30 border border-white/15 rounded-xl px-3 py-2"
        >
          <option value="all">همه وضعیت‌ها</option>
          <option value="pending_review">در انتظار بررسی</option>
          <option value="approved">تایید شده</option>
          <option value="rejected">رد شده</option>
          <option value="completed">نهایی شده</option>
        </select>
      </section>

      <section className="card glass p-6">
        {loading ? (
          <p className="text-white/70">در حال دریافت لیست حواله‌ها...</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-white/70">موردی با فیلتر فعلی پیدا نشد.</p>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-lg">{item.vehicleModel}</p>
                    <p className="text-xs text-white/60">
                      {item.vehicleYear ? `${item.vehicleYear.toLocaleString("fa-IR")} | ` : ""}
                      {item.city} | ثبت: {formatJalaliDateTime(item.createdAt)}
                    </p>
                  </div>
                  <span className={`text-xs rounded-full border px-3 py-1 ${STATUS_CLASS[item.status]}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-2 text-sm">
                  <p>قیمت پیشنهادی: <b className="text-accent-gold">{formatToman(item.suggestedPriceIrr)} تومان</b></p>
                  <p>زمان تحویل: <b>{formatJalaliDate(item.deliveryDate)}</b></p>
                  <p>ثبت‌کننده: <b>{item.ownerName || "-"}</b></p>
                  <p>ایمیل کاربر: <b>{item.ownerEmail}</b></p>
                  <p>شماره تماس: <b>{item.ownerPhone || "-"}</b></p>
                  <p>کد کاربر: <b>{item.ownerUserId}</b></p>
                </div>

                {item.notes ? <p className="text-sm text-white/80 border-t border-white/10 pt-2">{item.notes}</p> : null}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => void updateStatus(item.id, "pending_review")}
                    disabled={updatingId === item.id}
                    className="btn-secondary disabled:opacity-60"
                  >
                    بازگشت به انتظار
                  </button>
                  <button
                    onClick={() => void updateStatus(item.id, "approved")}
                    disabled={updatingId === item.id}
                    className="btn-secondary disabled:opacity-60"
                  >
                    تایید
                  </button>
                  <button
                    onClick={() => void updateStatus(item.id, "rejected")}
                    disabled={updatingId === item.id}
                    className="btn-secondary disabled:opacity-60"
                  >
                    رد
                  </button>
                  <button
                    onClick={() => void updateStatus(item.id, "completed")}
                    disabled={updatingId === item.id}
                    className="btn-secondary disabled:opacity-60"
                  >
                    نهایی شد
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
