"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Info,
  Loader2,
  TrendingDown,
  Wallet,
  XCircle,
} from "lucide-react"
import toast from "react-hot-toast"
import Link from "next/link"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { formatMoneyInput, formatToman, parseTomanInput } from "@/lib/money"

type LoanInstallment = {
  installmentNumber: number
  dueAt: string
  amountIrr: number
  principalIrr: number
  interestIrr: number
  paidAmountIrr: number
  paidAt?: string
  status: "pending" | "partial" | "paid" | "overdue"
}

type LoanItem = {
  id: string
  principalIrr: number
  outstandingIrr: number
  totalRepayableIrr?: number
  repaidIrr?: number
  installmentCount?: number
  monthlyInstallmentIrr?: number
  interestRateMonthlyPercent?: number
  paidInstallmentsCount?: number
  overdueInstallmentsCount?: number
  nextInstallmentNumber?: number
  nextDueAt?: string
  lastRepaymentAt?: string
  installments?: LoanInstallment[]
  status: "pending" | "approved" | "active" | "repaid" | "rejected" | "defaulted"
  createdAt: string
  dueAt?: string
}

type LoanSummary = {
  totalLoans: number
  activeLoans: number
  overdueLoans: number
  totalOutstandingIrr: number
  totalOverdueInstallments: number
  nextDueAt?: string
}

type LoanConfig = {
  enabled: boolean
  requiredVipLevelId: number
  minLoanIrr: number
  maxLoanIrr: number
  monthlyInterestRatePercent: number
  minInstallments: number
  maxInstallments: number
  defaultInstallments: number
}

const FALLBACK_CONFIG: LoanConfig = {
  enabled: true,
  requiredVipLevelId: 3,
  minLoanIrr: 500_000,
  maxLoanIrr: 5_000_000,
  monthlyInterestRatePercent: 1.5,
  minInstallments: 6,
  maxInstallments: 36,
  defaultInstallments: 12,
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function loanStatusConfig(status: LoanItem["status"]) {
  switch (status) {
    case "active":
      return { label: "فعال", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle }
    case "approved":
      return { label: "تایید شده", cls: "bg-sky-500/20 text-sky-300 border-sky-500/30", icon: BadgeCheck }
    case "pending":
      return { label: "در انتظار بررسی", cls: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: Clock }
    case "repaid":
      return { label: "تسویه شده", cls: "bg-purple-500/20 text-purple-300 border-purple-500/30", icon: CheckCircle }
    case "rejected":
      return { label: "رد شده", cls: "bg-red-500/20 text-red-300 border-red-500/30", icon: XCircle }
    case "defaulted":
      return { label: "معوق", cls: "bg-orange-500/20 text-orange-300 border-orange-500/30", icon: AlertTriangle }
  }
}

function installmentStatusConfig(status: LoanInstallment["status"]) {
  switch (status) {
    case "paid": return { label: "پرداخت شده", cls: "text-emerald-400 bg-emerald-500/10" }
    case "partial": return { label: "نسبی", cls: "text-amber-400 bg-amber-500/10" }
    case "overdue": return { label: "معوق", cls: "text-red-400 bg-red-500/10" }
    default: return { label: "در انتظار", cls: "text-white/50 bg-white/5" }
  }
}

export default function LoanPage() {
  const { user, isAuthenticated } = useAuth()

  const [loans, setLoans] = useState<LoanItem[]>([])
  const [loanSummary, setLoanSummary] = useState<LoanSummary | null>(null)
  const [loanConfig, setLoanConfig] = useState<LoanConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState("")
  const [installments, setInstallments] = useState(FALLBACK_CONFIG.defaultInstallments)
  const [requesting, setRequesting] = useState(false)
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null)
  const [installmentsMap, setInstallmentsMap] = useState<Record<string, LoanInstallment[]>>({})
  const [loadingInstallmentsId, setLoadingInstallmentsId] = useState<string | null>(null)
  const [repayAmountByLoan, setRepayAmountByLoan] = useState<Record<string, string>>({})
  const [repayInstallmentNumber, setRepayInstallmentNumber] = useState<Record<string, number>>({})
  const [repayingLoanId, setRepayingLoanId] = useState<string | null>(null)

  const effectiveConfig = loanConfig ?? FALLBACK_CONFIG
  const vipLevel = Number(user?.vipLevelId ?? 1)
  const vipLevelName = user?.vipLevelName ?? "نامشخص"
  const isVipEligible = vipLevel >= effectiveConfig.requiredVipLevelId

  const normalizedInstallments = useMemo(
    () => clamp(Math.trunc(installments), effectiveConfig.minInstallments, effectiveConfig.maxInstallments),
    [installments, effectiveConfig],
  )
  const installmentOptions = useMemo(() => {
    const opts: number[] = []
    for (let m = effectiveConfig.minInstallments; m <= effectiveConfig.maxInstallments; m++) opts.push(m)
    return opts
  }, [effectiveConfig.minInstallments, effectiveConfig.maxInstallments])

  const principalAmount = useMemo(() => parseTomanInput(amount) ?? 0, [amount])
  const simulation = useMemo(() => {
    const rate = effectiveConfig.monthlyInterestRatePercent / 100
    const total = Math.round(principalAmount * (1 + rate * normalizedInstallments))
    const monthly = normalizedInstallments > 0 ? Math.ceil(total / normalizedInstallments) : 0
    return { total, monthly, totalInterest: Math.max(0, total - principalAmount) }
  }, [principalAmount, effectiveConfig.monthlyInterestRatePercent, normalizedInstallments])

  const amountError = useMemo(() => {
    if (!loanConfig || principalAmount <= 0) return null
    if (principalAmount < loanConfig.minLoanIrr || principalAmount > loanConfig.maxLoanIrr)
      return `مبلغ باید بین ${formatToman(loanConfig.minLoanIrr)} تا ${formatToman(loanConfig.maxLoanIrr)} تومان باشد`
    return null
  }, [principalAmount, loanConfig])

  const blockReason = useMemo(() => {
    if (!loanConfig) return "در حال دریافت تنظیمات..."
    if (!loanConfig.enabled) return "سرویس وام در حال حاضر غیرفعال است"
    if (!isVipEligible) return `سطح VIP ${effectiveConfig.requiredVipLevelId} لازم است. سطح شما: ${vipLevel} (${vipLevelName})`
    if (principalAmount <= 0) return "مبلغ درخواستی را وارد کنید"
    if (amountError) return amountError
    return null
  }, [loanConfig, isVipEligible, effectiveConfig.requiredVipLevelId, vipLevel, vipLevelName, principalAmount, amountError])

  const load = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return }
    setLoading(true)
    try {
      const [configRes, loansRes, summaryRes] = await Promise.all([
        apiRequest<{ config: LoanConfig }>("/loans/config", { method: "GET" }, { auth: false }),
        apiRequest<{ items: LoanItem[] }>("/loans/me"),
        apiRequest<{ summary: LoanSummary }>("/loans/summary/me"),
      ])
      const cfg = configRes.config
      setLoanConfig(cfg)
      setLoans(loansRes.items ?? [])
      setLoanSummary(summaryRes.summary)
      setInstallments((cur) => clamp(cur, cfg.minInstallments, cfg.maxInstallments))
      setAmount((cur) => {
        const parsed = parseTomanInput(cur)
        if (!parsed || parsed < cfg.minLoanIrr) return formatMoneyInput(String(cfg.minLoanIrr))
        if (parsed > cfg.maxLoanIrr) return formatMoneyInput(String(cfg.maxLoanIrr))
        return formatMoneyInput(String(parsed))
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت اطلاعات وام")
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => { void load() }, [load])

  async function loadInstallments(loanId: string) {
    if (installmentsMap[loanId]) return
    setLoadingInstallmentsId(loanId)
    try {
      const data = await apiRequest<{ installments: LoanInstallment[] }>(`/loans/${loanId}/installments`)
      setInstallmentsMap((prev) => ({ ...prev, [loanId]: data.installments ?? [] }))
    } catch { toast.error("خطا در دریافت اقساط") }
    finally { setLoadingInstallmentsId(null) }
  }

  async function toggleExpand(loanId: string) {
    if (expandedLoanId === loanId) { setExpandedLoanId(null); return }
    setExpandedLoanId(loanId)
    await loadInstallments(loanId)
  }

  async function requestLoan() {
    if (blockReason) return toast.error(blockReason)
    setRequesting(true)
    try {
      await apiRequest("/loans/request", {
        method: "POST",
        body: JSON.stringify({ amount: principalAmount, dueDays: normalizedInstallments * 30 }),
      })
      toast.success("درخواست وام با موفقیت ثبت شد")
      setAmount("")
      await load()
    } catch (err) { toast.error(err instanceof Error ? err.message : "خطا در ثبت درخواست") }
    finally { setRequesting(false) }
  }

  async function repay(loanId: string, installmentNumber?: number) {
    const amountRaw = parseTomanInput(repayAmountByLoan[loanId] ?? "")
    if (!amountRaw) return toast.error("مبلغ بازپرداخت معتبر نیست")
    setRepayingLoanId(loanId)
    try {
      await apiRequest(`/loans/${loanId}/repay`, {
        method: "POST",
        body: JSON.stringify({ amount: amountRaw, ...(installmentNumber ? { installmentNumber } : {}) }),
      })
      toast.success("بازپرداخت با موفقیت ثبت شد")
      setRepayAmountByLoan((prev) => ({ ...prev, [loanId]: "" }))
      setInstallmentsMap((prev) => { const next = { ...prev }; delete next[loanId]; return next })
      await load()
    } catch (err) { toast.error(err instanceof Error ? err.message : "بازپرداخت ناموفق بود") }
    finally { setRepayingLoanId(null) }
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen pt-32 pb-20" dir="rtl">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-800/80 p-10 text-center">
            <CreditCard className="w-14 h-14 text-accent-gold mx-auto mb-4" />
            <h1 className="text-3xl font-black mb-3">وام خودرو</h1>
            <p className="text-white/50 mb-6">برای مشاهده شرایط و ثبت درخواست وام، ابتدا وارد حساب کاربری شوید.</p>
            <Link href="/login" className="btn-primary px-8 py-3">ورود به حساب</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-32 pb-24" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 space-y-8">

        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-2">وام خودرو</h1>
          <p className="text-white/40 text-sm md:text-base">درخواست وام با شرایط منعطف، محاسبه دقیق اقساط و پیگیری آنلاین</p>
        </div>

        {loanSummary && loanSummary.activeLoans > 0 && (
          <div className="rounded-2xl border border-accent-gold/20 bg-gradient-to-l from-amber-500/10 to-transparent p-5">
            <p className="text-xs font-bold text-accent-gold mb-3">خلاصه وام‌های فعال</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "وام فعال", value: loanSummary.activeLoans.toLocaleString("fa-IR"), cls: "text-white" },
                { label: "مانده کل", value: `${formatToman(loanSummary.totalOutstandingIrr)} ت`, cls: "text-amber-300" },
                { label: "اقساط معوق", value: loanSummary.totalOverdueInstallments.toLocaleString("fa-IR"), cls: loanSummary.totalOverdueInstallments > 0 ? "text-red-400" : "text-white" },
                { label: "سررسید بعدی", value: loanSummary.nextDueAt ? new Date(loanSummary.nextDueAt).toLocaleDateString("fa-IR") : "-", cls: "text-white" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] text-white/40">{item.label}</p>
                  <p className={`text-lg font-black ${item.cls}`}>{item.value}</p>
                </div>
              ))}
            </div>
            {loanSummary.totalOverdueInstallments > 0 && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2.5 bg-red-500/15 border border-red-500/20 rounded-xl text-xs text-red-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                {loanSummary.totalOverdueInstallments.toLocaleString("fa-IR")} قسط معوق دارید - هرچه سریع‌تر پرداخت کنید
              </div>
            )}
          </div>
        )}

        <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-sm font-black mb-4 flex items-center gap-2 text-white/70">
            <Info className="w-4 h-4 text-accent-gold" />شرایط جاری وام
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-white/40 mb-1">وضعیت سرویس</p>
              <p className={`font-black ${effectiveConfig.enabled ? "text-emerald-400" : "text-red-400"}`}>
                {effectiveConfig.enabled ? "● فعال" : "○ غیرفعال"}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-white/40 mb-1">حداقل VIP</p>
              <p className="font-black">سطح {effectiveConfig.requiredVipLevelId}</p>
              <p className={`text-[10px] mt-1 ${isVipEligible ? "text-emerald-400" : "text-red-400"}`}>
                سطح شما: {vipLevel} ({vipLevelName}){isVipEligible ? " ✓" : " ✗"}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-white/40 mb-1">بازه مبلغ</p>
              <p className="font-black">{formatToman(effectiveConfig.minLoanIrr)} تا {formatToman(effectiveConfig.maxLoanIrr)}</p>
              <p className="text-[10px] text-white/30 mt-0.5">تومان</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-white/40 mb-1">کارمزد ماهانه</p>
              <p className="font-black">{effectiveConfig.monthlyInterestRatePercent}٪</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-white/40 mb-1">دوره اقساط</p>
              <p className="font-black">{effectiveConfig.minInstallments} تا {effectiveConfig.maxInstallments} ماه</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/80 backdrop-blur-lg p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-black mb-6 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-accent-gold" />درخواست وام جدید
          </h2>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/60 mb-2 block font-bold">مبلغ درخواستی (تومان)</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-accent-gold/60 focus:outline-none focus:ring-1 focus:ring-accent-gold/20 transition"
                  placeholder={loanConfig ? `${formatToman(loanConfig.minLoanIrr)} تا ${formatToman(loanConfig.maxLoanIrr)}` : "مبلغ به تومان"}
                />
                {amountError && <p className="text-xs text-red-400 mt-1.5">{amountError}</p>}
              </div>
              <div>
                <label className="text-xs text-white/60 mb-2 block font-bold">تعداد اقساط (ماه)</label>
                <select
                  value={normalizedInstallments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-gold/60 focus:outline-none focus:ring-1 focus:ring-accent-gold/20 transition"
                >
                  {installmentOptions.map((m) => (
                    <option key={m} value={m}>{m} قسط ماهانه</option>
                  ))}
                </select>
              </div>
            </div>

            {principalAmount > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-[10px] text-white/50 mb-1.5">مبلغ درخواستی</p>
                  <p className="text-sm font-black text-amber-300">{formatToman(principalAmount)} ت</p>
                </div>
                <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4">
                  <p className="text-[10px] text-white/50 mb-1.5">قسط ماهانه</p>
                  <p className="text-sm font-black text-sky-300">{formatToman(simulation.monthly)} ت</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-[10px] text-white/50 mb-1.5">کارمزد کل</p>
                  <p className="text-sm font-black text-red-300">{formatToman(simulation.totalInterest)} ت</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-[10px] text-white/50 mb-1.5">کل بازپرداخت</p>
                  <p className="text-sm font-black text-emerald-300">{formatToman(simulation.total)} ت</p>
                </div>
              </div>
            )}

            {blockReason && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{blockReason}</span>
              </div>
            )}

            <button
              onClick={requestLoan}
              disabled={Boolean(blockReason) || requesting}
              className="w-full py-4 bg-accent-gold hover:bg-amber-400 text-black font-black rounded-xl text-base transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {requesting ? <><Loader2 className="w-5 h-5 animate-spin" />در حال ثبت...</> : "ثبت درخواست وام"}
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-accent-gold" />وام‌های من
            {loans.length > 0 && <span className="text-sm font-normal text-white/40">({loans.length} مورد)</span>}
          </h2>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-white/30 mx-auto mb-3" />
              <p className="text-white/40 text-sm">در حال بارگذاری...</p>
            </div>
          ) : loans.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-white/10">
              <CreditCard className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">هنوز وامی ثبت نشده است</p>
            </div>
          ) : (
            loans.map((loan) => {
              const sc = loanStatusConfig(loan.status)
              const StatusIcon = sc.icon
              const repaidPct = loan.totalRepayableIrr && loan.totalRepayableIrr > 0
                ? Math.min(100, Math.round(((loan.repaidIrr ?? 0) / loan.totalRepayableIrr) * 100))
                : 0
              const isExpanded = expandedLoanId === loan.id
              const installmentData = installmentsMap[loan.id]
              const isRepayable = loan.status === "active" || loan.status === "approved"

              return (
                <div key={loan.id} className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-800/70 overflow-hidden">
                  <div className="p-5 md:p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-1">
                        <p className="text-xl font-black">{formatToman(loan.principalIrr)} تومان</p>
                        <p className="text-xs text-white/30 font-mono mt-0.5">#{loan.id.slice(0, 12)}...</p>
                        <p className="text-xs text-white/30 mt-0.5">{new Date(loan.createdAt).toLocaleDateString("fa-IR")}</p>
                      </div>
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${sc.cls} shrink-0`}>
                        <StatusIcon className="w-3.5 h-3.5" />{sc.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                      {[
                        { label: "اصل وام", value: `${formatToman(loan.principalIrr)} ت`, cls: "" },
                        { label: "کل بازپرداخت", value: `${formatToman(loan.totalRepayableIrr ?? 0)} ت`, cls: "" },
                        { label: "پرداخت شده", value: `${formatToman(loan.repaidIrr ?? 0)} ت`, cls: "text-emerald-400" },
                        { label: "مانده", value: `${formatToman(loan.outstandingIrr)} ت`, cls: "text-amber-400" },
                        { label: "اقساط", value: `${(loan.paidInstallmentsCount ?? 0)} / ${(loan.installmentCount ?? 0)}`, cls: "" },
                        { label: "سررسید بعدی", value: loan.nextDueAt ? new Date(loan.nextDueAt).toLocaleDateString("fa-IR") : (loan.status === "repaid" ? "تسویه ✓" : "-"), cls: (loan.overdueInstallmentsCount ?? 0) > 0 ? "text-red-400" : "" },
                      ].map((item) => (
                        <div key={item.label} className="bg-white/5 rounded-lg p-3">
                          <p className="text-[10px] text-white/40 mb-1">{item.label}</p>
                          <p className={`font-black ${item.cls}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {loan.status !== "pending" && loan.status !== "rejected" && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-white/30 mb-1">
                          <span>پیشرفت بازپرداخت</span>
                          <span>{repaidPct}٪</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${loan.status === "repaid" ? "bg-purple-500" : "bg-gradient-to-l from-emerald-400 to-emerald-600"}`}
                            style={{ width: `${repaidPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {(loan.overdueInstallmentsCount ?? 0) > 0 && (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {(loan.overdueInstallmentsCount ?? 0)} قسط معوق - هرچه سریع‌تر پرداخت کنید
                      </div>
                    )}

                    {isRepayable && loan.outstandingIrr > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs font-bold text-white/50 mb-3">بازپرداخت وام</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1 space-y-2">
                            <input
                              value={repayAmountByLoan[loan.id] ?? ""}
                              onChange={(e) => setRepayAmountByLoan((prev) => ({ ...prev, [loan.id]: formatMoneyInput(e.target.value) }))}
                              className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-accent-gold/60 focus:outline-none transition"
                              placeholder="مبلغ بازپرداخت (تومان)"
                            />
                            <div className="flex gap-2 flex-wrap">
                              {loan.monthlyInstallmentIrr != null && loan.monthlyInstallmentIrr > 0 && (
                                <button
                                  onClick={() => setRepayAmountByLoan((prev) => ({ ...prev, [loan.id]: formatMoneyInput(String(loan.monthlyInstallmentIrr)) }))}
                                  className="text-[10px] px-2.5 py-1 bg-sky-500/15 border border-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/25 transition"
                                >
                                  یک قسط ({formatToman(loan.monthlyInstallmentIrr)} ت)
                                </button>
                              )}
                              <button
                                onClick={() => setRepayAmountByLoan((prev) => ({ ...prev, [loan.id]: formatMoneyInput(String(loan.outstandingIrr)) }))}
                                className="text-[10px] px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/25 transition"
                              >
                                تسویه کامل ({formatToman(loan.outstandingIrr)} ت)
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => repay(loan.id, repayInstallmentNumber[loan.id] || undefined)}
                            disabled={repayingLoanId === loan.id}
                            className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-sm font-bold transition disabled:opacity-50"
                          >
                            {repayingLoanId === loan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            {repayingLoanId === loan.id ? "در حال ثبت..." : "بازپرداخت"}
                          </button>
                        </div>
                        {repayInstallmentNumber[loan.id] > 0 && (
                          <p className="text-[10px] text-accent-gold mt-2">
                            قسط {repayInstallmentNumber[loan.id]} انتخاب شده - برای بازگشت به حالت عمومی روی قسط دیگری کلیک کنید
                          </p>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => void toggleExpand(loan.id)}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs text-white/40 hover:text-white/60 hover:bg-white/5 rounded-lg transition"
                    >
                      {loadingInstallmentsId === loan.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : isExpanded
                          ? <><ChevronUp className="w-3.5 h-3.5" />بستن جدول اقساط</>
                          : <><ChevronDown className="w-3.5 h-3.5" />مشاهده جدول اقساط ({loan.installmentCount ?? 0} قسط)</>
                      }
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-white/10 bg-black/20 p-5">
                      <h3 className="text-sm font-black mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent-gold" />جدول اقساط
                      </h3>
                      {!installmentData ? (
                        <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-white/30 mx-auto mb-2" /><p className="text-xs text-white/30">در حال دریافت...</p></div>
                      ) : installmentData.length === 0 ? (
                        <p className="text-xs text-white/30 text-center py-6">اطلاعات اقساط موجود نیست</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-white/10 text-white/40">
                                <th className="text-right pb-2 pr-1">شماره</th>
                                <th className="text-right pb-2">سررسید</th>
                                <th className="text-right pb-2">مبلغ قسط</th>
                                <th className="text-right pb-2 hidden sm:table-cell">اصل</th>
                                <th className="text-right pb-2 hidden sm:table-cell">بهره</th>
                                <th className="text-right pb-2">پرداخت شده</th>
                                <th className="text-right pb-2">وضعیت</th>
                                {isRepayable && <th className="text-right pb-2">انتخاب</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {installmentData.map((inst) => {
                                const isc = installmentStatusConfig(inst.status)
                                const isSelected = repayInstallmentNumber[loan.id] === inst.installmentNumber
                                return (
                                  <tr key={inst.installmentNumber} className={`transition ${isSelected ? "bg-accent-gold/5" : "hover:bg-white/3"}`}>
                                    <td className="py-2.5 pr-1 font-mono font-bold">{inst.installmentNumber}</td>
                                    <td className={`py-2.5 ${inst.status === "overdue" ? "text-red-400 font-bold" : ""}`}>
                                      {new Date(inst.dueAt).toLocaleDateString("fa-IR")}
                                    </td>
                                    <td className="py-2.5 font-mono">{formatToman(inst.amountIrr)}</td>
                                    <td className="py-2.5 font-mono text-white/50 hidden sm:table-cell">{formatToman(inst.principalIrr)}</td>
                                    <td className="py-2.5 font-mono text-white/50 hidden sm:table-cell">{formatToman(inst.interestIrr)}</td>
                                    <td className="py-2.5 font-mono text-emerald-400">{formatToman(inst.paidAmountIrr)}</td>
                                    <td className="py-2.5">
                                      <div className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${isc.cls}`}>{isc.label}</div>
                                      {inst.paidAt && <p className="text-[9px] text-white/25 mt-0.5">{new Date(inst.paidAt).toLocaleDateString("fa-IR")}</p>}
                                    </td>
                                    {isRepayable && (
                                      <td className="py-2.5">
                                        {inst.status !== "paid" && (
                                          <button
                                            onClick={() => {
                                              const newNum = isSelected ? 0 : inst.installmentNumber
                                              setRepayInstallmentNumber((prev) => ({ ...prev, [loan.id]: newNum }))
                                              if (!isSelected) {
                                                const rem = Math.max(0, inst.amountIrr - inst.paidAmountIrr)
                                                setRepayAmountByLoan((prev) => ({ ...prev, [loan.id]: formatMoneyInput(String(rem)) }))
                                              }
                                            }}
                                            className={`text-[10px] px-2.5 py-1 rounded-lg border transition ${
                                              isSelected
                                                ? "bg-accent-gold/20 border-accent-gold/40 text-accent-gold"
                                                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                                            }`}
                                          >
                                            {isSelected ? "✓ انتخاب" : "پرداخت"}
                                          </button>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                )
                              })}
                            </tbody>
                            <tfoot className="border-t border-white/15">
                              <tr className="font-bold text-white/60">
                                <td colSpan={2} className="pt-3 pr-1 font-black text-white/70">جمع</td>
                                <td className="pt-3 font-black font-mono text-white">{formatToman(loan.totalRepayableIrr ?? 0)}</td>
                                <td className="pt-3 font-mono hidden sm:table-cell">{formatToman(loan.principalIrr)}</td>
                                <td className="pt-3 font-mono hidden sm:table-cell">{formatToman((loan.totalRepayableIrr ?? 0) - loan.principalIrr)}</td>
                                <td className="pt-3 font-black font-mono text-emerald-400">{formatToman(loan.repaidIrr ?? 0)}</td>
                                <td colSpan={isRepayable ? 2 : 1} />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </section>
      </div>
    </main>
  )
}
