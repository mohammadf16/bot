"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { formatJalaliDate, jalaliDateInputToGregorianISO, toJalaliDateInput } from "@/lib/date"
import { formatMoneyInput, formatToman, parseTomanInput } from "@/lib/money"

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

const STATUS_UI: Record<CheckListing["status"], { label: string; className: string }> = {
  pending_review: {
    label: "در انتظار بررسی",
    className: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
  },
  approved: {
    label: "تایید شده",
    className: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
  },
  rejected: {
    label: "رد شده",
    className: "bg-rose-500/10 text-rose-300 border border-rose-500/30",
  },
  completed: {
    label: "نهایی شده",
    className: "bg-sky-500/10 text-sky-300 border border-sky-500/30",
  },
}

export default function ChecksPage() {
  const { user, isAuthenticated } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingListings, setIsLoadingListings] = useState(false)
  const [myListings, setMyListings] = useState<CheckListing[]>([])
  const [form, setForm] = useState({
    ownerName: "",
    ownerPhone: "",
    vehicleModel: "",
    vehicleYear: String(new Date().getFullYear()),
    city: "تهران",
    suggestedPrice: "",
    deliveryDateJalali: "",
    notes: "",
  })

  const inputClass = "w-full bg-slate-800/40 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:border-accent-gold/70 focus:outline-none focus:ring-1 focus:ring-accent-gold/30 transition-all"

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      ownerName: prev.ownerName || user?.profile?.fullName || "",
      ownerPhone: prev.ownerPhone || user?.profile?.phone || "",
      city: prev.city || user?.profile?.city || "تهران",
      deliveryDateJalali: prev.deliveryDateJalali || toJalaliDateInput(new Date(Date.now() + 14 * 86400000)),
    }))
  }, [user])

  const loadMyListings = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoadingListings(true)
    try {
      const data = await apiRequest<{ items: CheckListing[] }>("/checks/my-listings", { method: "GET" })
      setMyListings(data.items ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "دریافت لیست حواله‌ها ناموفق بود")
    } finally {
      setIsLoadingListings(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    void loadMyListings()
  }, [loadMyListings])

  const stats = useMemo(
    () => ({
      total: myListings.length,
      pending: myListings.filter((item) => item.status === "pending_review").length,
      approved: myListings.filter((item) => item.status === "approved").length,
    }),
    [myListings],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isAuthenticated) {
      toast.error("برای ثبت حواله باید وارد حساب کاربری شوید")
      return
    }

    const suggestedPriceIrr = parseTomanInput(form.suggestedPrice)
    if (!suggestedPriceIrr) {
      toast.error("قیمت پیشنهادی معتبر وارد کنید")
      return
    }

    if (!form.vehicleModel.trim() || !form.deliveryDateJalali.trim() || !form.ownerName.trim()) {
      toast.error("مدل خودرو، زمان تحویل و نام فروشنده الزامی است")
      return
    }

    const deliveryDate = jalaliDateInputToGregorianISO(form.deliveryDateJalali)
    if (!deliveryDate) {
      toast.error("تاریخ تحویل معتبر نیست. نمونه صحیح: 1405/01/20")
      return
    }

    setIsSubmitting(true)
    try {
      await apiRequest("/checks/listings", {
        method: "POST",
        body: JSON.stringify({
          ownerName: form.ownerName.trim(),
          ownerPhone: form.ownerPhone.trim(),
          vehicleModel: form.vehicleModel.trim(),
          vehicleYear: Number(form.vehicleYear) || undefined,
          city: form.city.trim(),
          suggestedPriceIrr,
          deliveryDate,
          notes: form.notes.trim(),
        }),
      })

      toast.success("درخواست حواله با موفقیت ثبت شد")
      setForm((prev) => ({
        ...prev,
        vehicleModel: "",
        suggestedPrice: "",
        notes: "",
      }))
      await loadMyListings()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت حواله انجام نشد")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 text-right space-y-8" dir="rtl">
        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-2">حواله خودرو</h1>
          <p className="text-white/50 text-sm md:text-base">اطلاعات حواله خودرو خود را ثبت کنید</p>
        </div>

        {!isAuthenticated ? (
          <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-slate-900/80 backdrop-blur-lg p-6 md:p-8">
            <div className="flex items-start gap-4">
              <span className="text-2xl">🔐</span>
              <div>
                <p className="font-black text-white mb-2">نیاز به ورود</p>
                <p className="text-white/80 text-sm mb-4">برای ثبت حواله باید ابتدا وارد حساب کاربری شوید</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/login" className="btn-primary">ورود</Link>
                  <Link href="/register" className="btn-secondary">ثبت نام</Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/90 backdrop-blur-lg p-6 md:p-8">
          <h2 className="text-lg md:text-2xl font-black mb-6 flex items-center gap-2 text-white">📋 ثبت درخواست حواله جدید</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/70 mb-2 block font-semibold">مدل خودرو</label>
                <input
                  value={form.vehicleModel}
                  onChange={(e) => setForm((prev) => ({ ...prev, vehicleModel: e.target.value }))}
                  className={inputClass}
                  placeholder="مثال: دنا پلاس اتومات"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 mb-2 block font-semibold">سال تولید</label>
                <input
                  value={form.vehicleYear}
                  onChange={(e) => setForm((prev) => ({ ...prev, vehicleYear: e.target.value }))}
                  className={inputClass}
                  placeholder="مثال: ۱۴۰۲"
                  type="number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/70 mb-2 block font-semibold">قیمت پیشنهادی (تومان)</label>
                <input
                  value={form.suggestedPrice}
                  onChange={(e) => setForm((prev) => ({ ...prev, suggestedPrice: formatMoneyInput(e.target.value) }))}
                  className={inputClass}
                  placeholder="مثال: ۵۰۰۰۰۰۰۰"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 mb-2 block font-semibold">تاریخ تحویل (شمسی)</label>
                <input
                  value={form.deliveryDateJalali}
                  onChange={(e) => setForm((prev) => ({ ...prev, deliveryDateJalali: e.target.value }))}
                  className={inputClass}
                  placeholder="مثال: ۱۴۰۵/۰۱/۲۰"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/70 mb-2 block font-semibold">شهر تحویل</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  className={inputClass}
                  placeholder="مثال: تهران"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 mb-2 block font-semibold">نام فروشنده</label>
                <input
                  value={form.ownerName}
                  onChange={(e) => setForm((prev) => ({ ...prev, ownerName: e.target.value }))}
                  className={inputClass}
                  placeholder="نام کامل"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/70 mb-2 block font-semibold">شماره تماس</label>
              <input
                value={form.ownerPhone}
                onChange={(e) => setForm((prev) => ({ ...prev, ownerPhone: e.target.value }))}
                className={inputClass}
                placeholder="۰۹۱۲۱۲۳۴۵۶۷"
              />
            </div>

            <div>
              <label className="text-xs text-white/70 mb-2 block font-semibold">توضیحات تکمیلی</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className={`${inputClass} min-h-24`}
                placeholder="توضیحات اضافی درباره حواله، شرایط انتقال، مشکلات و..."
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-base md:text-lg">
              {isSubmitting ? "⏱ درحال ثبت..." : "✓ ثبت درخواست حواله"}
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card glass p-4 md:p-6 text-center">
              <p className="text-white/50 text-xs md:text-sm mb-1">کل ثبت‌ها</p>
              <p className="text-xl md:text-3xl font-black text-accent-gold">{stats.total.toLocaleString("fa-IR")}</p>
            </div>
            <div className="card glass p-4 md:p-6 text-center">
              <p className="text-white/50 text-xs md:text-sm mb-1">درانتظار بررسی</p>
              <p className="text-xl md:text-3xl font-black text-amber-300">{stats.pending.toLocaleString("fa-IR")}</p>
            </div>
            <div className="card glass p-4 md:p-6 text-center">
              <p className="text-white/50 text-xs md:text-sm mb-1">تایید شده</p>
              <p className="text-xl md:text-3xl font-black text-emerald-300">{stats.approved.toLocaleString("fa-IR")}</p>
            </div>
          </div>

          {isLoadingListings ? (
            <div className="card glass p-8 text-center">
              <p className="text-white/50">⏳ درحال دریافت اطلاعات...</p>
            </div>
          ) : myListings.length === 0 ? (
            <div className="card glass p-12 text-center">
              <p className="text-white/50 mb-2">هنوز حواله‌ای ثبت نکرده‌اید</p>
              <p className="text-white/40 text-xs">اولین حواله خود را ثبت کنید</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg md:text-xl font-black">📊 حواله‌های من</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {myListings.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.05 }}
                    className="card glass p-5 md:p-6 border border-white/10 hover:border-accent-gold/30 transition-all hover:shadow-lg hover:shadow-accent-gold/10"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h4 className="text-base md:text-lg font-black">{item.vehicleModel}</h4>
                        <p className="text-xs text-white/50 mt-1">شناسه: {item.id.slice(0, 8)}...</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_UI[item.status].className}`}>
                        {STATUS_UI[item.status].label}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-xs text-white/60">قیمت پیشنهادی</span>
                        <span className="font-black text-accent-gold text-sm">{formatToman(item.suggestedPriceIrr)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-white/5 rounded-lg">
                          <p className="text-xs text-white/60 mb-1">سال</p>
                          <p className="font-black text-sm">{item.vehicleYear ?? "-"}</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                          <p className="text-xs text-white/60 mb-1">شهر</p>
                          <p className="font-black text-sm">{item.city}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-xs text-white/60 mb-1">زمان تحویل</p>
                        <p className="font-black text-sm">{formatJalaliDate(item.deliveryDate)}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-xs text-white/60 mb-1">فروشنده</p>
                        <p className="font-black text-sm">{item.ownerName || user?.email}</p>
                      </div>
                      {item.notes ? (
                        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-xs text-white/70 mb-2">توضیحات</p>
                          <p className="text-xs text-white/80 leading-relaxed">{item.notes}</p>
                        </div>
                      ) : null}
                      <p className="text-xs text-white/50 pt-2 border-t border-white/10">
                        ثبت‌شده: {new Date(item.createdAt).toLocaleString("fa-IR")}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
