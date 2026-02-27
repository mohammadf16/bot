"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import toast from "react-hot-toast"
import { apiRequest, randomIdempotencyKey } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { uploadUserImage } from "@/lib/image-upload"
import { formatToman } from "@/lib/money"
import { ArrowLeft, CheckCircle2, Copy, CreditCard, Upload } from "lucide-react"

function genRefId() {
  return `REF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function CardToCardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const type = searchParams.get("type") as "raffle" | "vehicle" | null
  const raffleId = searchParams.get("raffleId") ?? ""
  const vehicleId = searchParams.get("vehicleId") ?? ""
  const count = Number(searchParams.get("count") ?? 1)
  const amount = Number(searchParams.get("amount") ?? 0)
  const title = decodeURIComponent(searchParams.get("title") ?? "")
  const returnUrl = decodeURIComponent(searchParams.get("returnUrl") ?? "/")

  const [destinationCard, setDestinationCard] = useState("")
  const [fromCardLast4, setFromCardLast4] = useState("")
  const [trackingCode, setTrackingCode] = useState("")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const refId = useRef(genRefId()).current

  useEffect(() => {
    void apiRequest<{ destinationCard: string }>("/payments/card-to-card/config", { method: "GET" })
      .then((d) => setDestinationCard(d.destinationCard || ""))
      .catch(() => {})
  }, [])

  function copyText(text: string, label: string) {
    void navigator.clipboard.writeText(text).then(() => toast.success(`${label} کپی شد`))
  }

  async function submit() {
    if (!isAuthenticated) {
      toast.error("ابتدا وارد حساب کاربری خود شوید")
      router.push("/login")
      return
    }
    if (!/^\d{4}$/.test(fromCardLast4)) {
      toast.error("۴ رقم آخر کارت مبدأ را وارد کنید")
      return
    }
    if (trackingCode.trim().length < 4) {
      toast.error("کد پیگیری نامعتبر است")
      return
    }
    if (!receiptFile) {
      toast.error("تصویر رسید واریز را انتخاب کنید")
      return
    }

    setSubmitting(true)
    try {
      const receiptImageUrl = await uploadUserImage(receiptFile)

      if (type === "raffle") {
        await apiRequest(`/raffles/${raffleId}/buy`, {
          method: "POST",
          headers: { "Idempotency-Key": randomIdempotencyKey() },
          body: JSON.stringify({
            count,
            paymentMethod: "CARD_TO_CARD",
            fromCardLast4,
            trackingCode: trackingCode.trim(),
            receiptImageUrl,
          }),
        })
        toast.success("رسید ثبت شد — پس از تایید ادمین بلیط صادر می‌شود")
      } else if (type === "vehicle") {
        await apiRequest(`/showroom/vehicles/${vehicleId}/orders`, {
          method: "POST",
          body: JSON.stringify({
            paymentAsset: "CARD_TO_CARD",
            fromCardLast4,
            trackingCode: trackingCode.trim(),
            receiptImageUrl,
          }),
        })
        toast.success("درخواست خرید ثبت شد — پس از تایید ادمین نهایی می‌شود")
      }

      setDone(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ارسال رسید ناموفق بود")
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen pt-28 pb-16 flex items-center justify-center px-4" dir="rtl">
        <div className="max-w-sm w-full card glass p-8 text-center space-y-5">
          <CheckCircle2 size={60} className="text-emerald-400 mx-auto" />
          <h1 className="text-2xl font-black">رسید با موفقیت ثبت شد</h1>
          <p className="text-white/60 text-sm leading-relaxed">
            پس از بررسی توسط ادمین، خرید شما نهایی و از طریق پیام‌رسانی اطلاع‌رسانی می‌شود.
          </p>
          <Link href={returnUrl} className="btn-primary block w-full text-center">
            بازگشت
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-28 pb-16" dir="rtl">
      <div className="max-w-lg mx-auto px-4 space-y-5">

        {/* Header */}
        <section className="card glass p-6">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard size={24} className="text-accent-gold" />
            <h1 className="text-2xl font-black">پرداخت کارت به کارت</h1>
          </div>
          {title && (
            <p className="text-sm text-white/70">
              بابت: <span className="text-white font-bold">{title}</span>
            </p>
          )}
          {type === "raffle" && count > 1 && (
            <p className="text-sm text-white/70 mt-0.5">
              تعداد بلیط: <span className="text-white font-bold">{count.toLocaleString("fa-IR")} عدد</span>
            </p>
          )}
        </section>

        {/* Amount */}
        <section className="rounded-2xl bg-accent-gold/10 border-2 border-accent-gold/50 p-6 text-center space-y-1">
          <p className="text-white/60 text-sm">مبلغ قابل پرداخت</p>
          <p className="text-4xl font-black text-accent-gold">{formatToman(amount)} تومان</p>
          <p className="text-xs text-white/40">{amount.toLocaleString()} ریال</p>
        </section>

        {/* Destination Info */}
        <section className="card glass p-5 space-y-4">
          <p className="text-sm font-bold">مشخصات واریز</p>

          {/* Card number */}
          <div className="rounded-xl bg-black/40 border border-white/10 p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-white/50 mb-1">شماره کارت مقصد</p>
              <p className="text-xl font-mono font-black tracking-widest text-accent-gold">
                {destinationCard || "در حال دریافت..."}
              </p>
            </div>
            {destinationCard && (
              <button
                onClick={() => copyText(destinationCard, "شماره کارت")}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition shrink-0"
              >
                <Copy size={16} />
              </button>
            )}
          </div>

          {/* Reference ID */}
          <div className="rounded-xl bg-black/40 border border-amber-400/30 p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-amber-300 mb-1">شناسه مرجع — در توضیح واریز بنویسید</p>
              <p className="text-base font-mono font-bold text-white">{refId}</p>
            </div>
            <button
              onClick={() => copyText(refId, "شناسه مرجع")}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition shrink-0"
            >
              <Copy size={16} />
            </button>
          </div>

          <div className="rounded-xl bg-amber-500/10 border border-amber-400/20 px-4 py-3 text-xs text-amber-200 leading-relaxed">
            ⚠ پس از واریز مبلغ فوق، اطلاعات پرداخت را در قسمت زیر وارد کرده و تصویر رسید را ارسال کنید.
            خرید شما پس از تایید ادمین نهایی خواهد شد.
          </div>
        </section>

        {/* Form */}
        <section className="card glass p-5 space-y-4">
          <p className="text-sm font-bold">اطلاعات پرداخت انجام‌شده</p>

          <div>
            <label className="text-xs text-white/50 block mb-1.5">۴ رقم آخر کارت مبدأ (کارت خودتان)</label>
            <input
              value={fromCardLast4}
              onChange={(e) => setFromCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="۱۲۳۴"
              maxLength={4}
              inputMode="numeric"
              className="w-full bg-black/30 border border-white/15 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-[0.5em]"
            />
          </div>

          <div>
            <label className="text-xs text-white/50 block mb-1.5">کد پیگیری / شماره رسید بانکی</label>
            <input
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="کد پیگیری ۱۰ رقمی"
              inputMode="numeric"
              className="w-full bg-black/30 border border-white/15 rounded-xl px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-white/50 block mb-1.5">تصویر رسید واریز (عکس یا اسکرین‌شات)</label>
            <label className="flex items-center gap-3 w-full bg-black/30 border border-white/15 rounded-xl px-4 py-3 cursor-pointer hover:bg-black/40 transition">
              <Upload size={16} className="text-white/50 shrink-0" />
              <span className="text-sm text-white/70 truncate flex-1 min-w-0">
                {receiptFile ? receiptFile.name : "کلیک کنید — تصویر را انتخاب کنید"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {receiptFile && (
              <p className="text-xs text-emerald-400 mt-1 pr-1">✓ تصویر انتخاب شد: {receiptFile.name}</p>
            )}
          </div>

          <button
            disabled={submitting}
            onClick={() => void submit()}
            className="btn-primary w-full disabled:opacity-60 text-base py-3"
          >
            {submitting ? "در حال ارسال رسید..." : "تأیید و ارسال رسید پرداخت"}
          </button>
        </section>

        <Link
          href={returnUrl}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition py-2"
        >
          <ArrowLeft size={14} />
          بازگشت بدون ارسال رسید
        </Link>
      </div>
    </main>
  )
}

export default function CardToCardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen pt-28 flex items-center justify-center">
          <p className="text-white/50">در حال بارگذاری...</p>
        </main>
      }
    >
      <CardToCardContent />
    </Suspense>
  )
}
