"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  FileText,
  RefreshCw,
  Save,
  Settings,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { formatMoneyInput, formatToman, parseTomanInput } from "@/lib/money"

// ─── Types ───────────────────────────────────────────────────────────────────

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

type AdminLoan = {
  id: string
  userId: string
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
  approvedBy?: string
  createdAt: string
  updatedAt: string
  dueAt?: string
}

type AdminLoanSummary = {
  totalLoans: number
  pendingLoans: number
  activeLoans: number
  overdueLoans: number
  defaultedLoans: number
  totalOutstandingIrr: number
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

type AdminUser = {
  id: string
  email: string
  profile?: { fullName?: string; phone?: string }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loanStatusConfig(status: AdminLoan["status"]) {
  switch (status) {
    case "active":
      return { label: "فعال", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: CheckCircle }
    case "approved":
      return { label: "تایید شده", cls: "bg-sky-500/15 text-sky-400 border-sky-500/30", icon: CheckCircle }
    case "pending":
      return { label: "در انتظار", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Clock }
    case "repaid":
      return { label: "تسویه شده", cls: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: CheckCircle }
    case "rejected":
      return { label: "رد شده", cls: "bg-red-500/15 text-red-400 border-red-500/30", icon: XCircle }
    case "defaulted":
      return { label: "معوق", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30", icon: AlertTriangle }
  }
}

function installmentStatusConfig(status: LoanInstallment["status"]) {
  switch (status) {
    case "paid":
      return { label: "پرداخت شده", cls: "text-emerald-400" }
    case "partial":
      return { label: "نسبی", cls: "text-amber-400" }
    case "overdue":
      return { label: "معوق", cls: "text-red-400" }
    default:
      return { label: "در انتظار", cls: "text-white/50" }
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<AdminLoan[]>([])
  const [summary, setSummary] = useState<AdminLoanSummary | null>(null)
  const [config, setConfig] = useState<LoanConfig | null>(null)
  const [users, setUsers] = useState<Map<string, AdminUser>>(new Map())
  const [loading, setLoading] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"loans" | "config">("loans")
  const [statusFilter, setStatusFilter] = useState<"all" | AdminLoan["status"]>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Config form state
  const [configForm, setConfigForm] = useState<{
    enabled: boolean
    requiredVipLevelId: string
    minLoanIrr: string
    maxLoanIrr: string
    monthlyInterestRatePercent: string
    minInstallments: string
    maxInstallments: string
    defaultInstallments: string
  } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [loansData, configData, usersData] = await Promise.all([
        apiRequest<{ summary: AdminLoanSummary; items: AdminLoan[] }>("/admin/loans"),
        apiRequest<{ config: LoanConfig }>("/admin/loans/config"),
        apiRequest<{ items: AdminUser[] }>("/admin/users"),
      ])
      setLoans(loansData.items ?? [])
      setSummary(loansData.summary)
      setConfig(configData.config)
      setConfigForm({
        enabled: configData.config.enabled,
        requiredVipLevelId: String(configData.config.requiredVipLevelId),
        minLoanIrr: formatMoneyInput(String(configData.config.minLoanIrr)),
        maxLoanIrr: formatMoneyInput(String(configData.config.maxLoanIrr)),
        monthlyInterestRatePercent: String(configData.config.monthlyInterestRatePercent),
        minInstallments: String(configData.config.minInstallments),
        maxInstallments: String(configData.config.maxInstallments),
        defaultInstallments: String(configData.config.defaultInstallments),
      })
      const userMap = new Map<string, AdminUser>()
      for (const u of usersData.items ?? []) userMap.set(u.id, u)
      setUsers(userMap)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت داده‌ها")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function approveLoan(loanId: string) {
    setActionId(loanId)
    try {
      await apiRequest(`/admin/loans/${loanId}/approve`, { method: "POST" })
      toast.success("وام تایید و واریز شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در تایید")
    } finally {
      setActionId(null)
    }
  }

  async function rejectLoan(loanId: string) {
    if (!confirm("آیا از رد این درخواست وام مطمئن هستید؟")) return
    setActionId(loanId)
    try {
      await apiRequest(`/admin/loans/${loanId}/reject`, { method: "POST" })
      toast.success("وام رد شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در رد درخواست")
    } finally {
      setActionId(null)
    }
  }

  async function defaultLoan(loanId: string) {
    if (!confirm("آیا از معوق کردن این وام مطمئن هستید؟")) return
    setActionId(loanId)
    try {
      await apiRequest(`/admin/loans/${loanId}/default`, { method: "POST" })
      toast.success("وام معوق شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در اعمال معوق")
    } finally {
      setActionId(null)
    }
  }

  async function saveConfig() {
    if (!configForm) return
    setSavingConfig(true)
    try {
      const minLoanIrr = parseTomanInput(configForm.minLoanIrr) ?? 0
      const maxLoanIrr = parseTomanInput(configForm.maxLoanIrr) ?? 0
      const payload: LoanConfig = {
        enabled: configForm.enabled,
        requiredVipLevelId: Math.trunc(Number(configForm.requiredVipLevelId)),
        minLoanIrr,
        maxLoanIrr,
        monthlyInterestRatePercent: Number(configForm.monthlyInterestRatePercent),
        minInstallments: Math.trunc(Number(configForm.minInstallments)),
        maxInstallments: Math.trunc(Number(configForm.maxInstallments)),
        defaultInstallments: Math.trunc(Number(configForm.defaultInstallments)),
      }
      const data = await apiRequest<{ config: LoanConfig }>("/admin/loans/config", {
        method: "PUT",
        body: JSON.stringify(payload),
      })
      setConfig(data.config)
      setConfigForm({
        enabled: data.config.enabled,
        requiredVipLevelId: String(data.config.requiredVipLevelId),
        minLoanIrr: formatMoneyInput(String(data.config.minLoanIrr)),
        maxLoanIrr: formatMoneyInput(String(data.config.maxLoanIrr)),
        monthlyInterestRatePercent: String(data.config.monthlyInterestRatePercent),
        minInstallments: String(data.config.minInstallments),
        maxInstallments: String(data.config.maxInstallments),
        defaultInstallments: String(data.config.defaultInstallments),
      })
      toast.success("تنظیمات وام ذخیره شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره تنظیمات")
    } finally {
      setSavingConfig(false)
    }
  }

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      if (statusFilter !== "all" && loan.status !== statusFilter) return false
      if (!searchQuery.trim()) return true
      const user = users.get(loan.userId)
      const haystack = [loan.id, loan.userId, user?.email ?? "", user?.profile?.fullName ?? ""].join(" ").toLowerCase()
      return haystack.includes(searchQuery.trim().toLowerCase())
    })
  }, [loans, statusFilter, searchQuery, users])

  const statCards = useMemo(() => {
    if (!summary) return []
    return [
      { label: "کل درخواست‌ها", value: summary.totalLoans, cls: "from-white/5 to-white/10", icon: FileText, iconCls: "text-white/50" },
      { label: "در انتظار تایید", value: summary.pendingLoans, cls: "from-amber-500/10 to-amber-500/5", icon: Clock, iconCls: "text-amber-400" },
      { label: "وام فعال", value: summary.activeLoans, cls: "from-emerald-500/10 to-emerald-500/5", icon: TrendingUp, iconCls: "text-emerald-400" },
      { label: "اقساط معوق", value: summary.overdueLoans, cls: "from-red-500/10 to-red-500/5", icon: AlertTriangle, iconCls: "text-red-400" },
      { label: "معوق شده", value: summary.defaultedLoans, cls: "from-orange-500/10 to-orange-500/5", icon: Ban, iconCls: "text-orange-400" },
      {
        label: "مانده کل (تومان)",
        value: formatToman(summary.totalOutstandingIrr),
        cls: "from-sky-500/10 to-sky-500/5",
        icon: CreditCard,
        iconCls: "text-sky-400",
      },
    ]
  }, [summary])

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">مدیریت وام</h1>
          <p className="text-white/40 text-sm mt-1">بررسی، تایید و مدیریت کامل درخواست‌های وام کاربران</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          بروزرسانی
        </button>
      </div>

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className={`rounded-2xl border border-white/8 bg-gradient-to-br ${card.cls} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/50">{card.label}</p>
                  <Icon className={`w-4 h-4 ${card.iconCls}`} />
                </div>
                <p className="text-lg font-black">{typeof card.value === "number" ? card.value.toLocaleString("fa-IR") : card.value}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-1">
        {(["loans", "config"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm font-bold transition ${activeTab === tab ? "bg-accent-gold text-black" : "text-white/50 hover:text-white"}`}
          >
            {tab === "loans" ? <><Users className="w-4 h-4" />لیست وام‌ها</> : <><Settings className="w-4 h-4" />تنظیمات وام</>}
          </button>
        ))}
      </div>

      {/* ─── Loans List Tab ─── */}
      {activeTab === "loans" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس شناسه، ایمیل یا نام..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder-white/30 focus:border-accent-gold/60 focus:outline-none transition"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-accent-gold/60 focus:outline-none transition"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="pending">در انتظار</option>
              <option value="active">فعال</option>
              <option value="approved">تایید شده</option>
              <option value="repaid">تسویه شده</option>
              <option value="rejected">رد شده</option>
              <option value="defaulted">معوق</option>
            </select>
          </div>

          {loading ? (
            <div className="py-20 text-center text-white/40">در حال بارگذاری...</div>
          ) : filteredLoans.length === 0 ? (
            <div className="py-20 text-center text-white/40 text-sm">وامی یافت نشد</div>
          ) : (
            <div className="space-y-3">
              {filteredLoans.map((loan) => {
                const sc = loanStatusConfig(loan.status)
                const StatusIcon = sc.icon
                const user = users.get(loan.userId)
                const isExpanded = expandedLoanId === loan.id
                const repaidPct = loan.totalRepayableIrr && loan.totalRepayableIrr > 0
                  ? Math.round(((loan.repaidIrr ?? 0) / loan.totalRepayableIrr) * 100)
                  : 0

                return (
                  <div key={loan.id} className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 overflow-hidden">
                    {/* Loan Header */}
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        {/* User & ID */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="min-w-0">
                              <p className="font-black text-base">{user?.profile?.fullName ?? user?.email ?? loan.userId}</p>
                              {user?.email && user.profile?.fullName && (
                                <p className="text-xs text-white/40 mt-0.5">{user.email}</p>
                              )}
                              <p className="text-xs text-white/30 font-mono mt-1">#{loan.id.slice(0, 12)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Status + Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${sc.cls}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {sc.label}
                          </span>
                          {loan.status === "pending" && (
                            <>
                              <button
                                onClick={() => void approveLoan(loan.id)}
                                disabled={actionId === loan.id}
                                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition disabled:opacity-50"
                              >
                                {actionId === loan.id ? "..." : "تایید و واریز"}
                              </button>
                              <button
                                onClick={() => void rejectLoan(loan.id)}
                                disabled={actionId === loan.id}
                                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition disabled:opacity-50"
                              >
                                رد
                              </button>
                            </>
                          )}
                          {(loan.status === "active" || loan.status === "approved") && (loan.overdueInstallmentsCount ?? 0) > 0 && (
                            <button
                              onClick={() => void defaultLoan(loan.id)}
                              disabled={actionId === loan.id}
                              className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 rounded-xl text-xs font-bold transition disabled:opacity-50"
                            >
                              معوق کردن
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Loan Figures */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-4">
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-[10px] text-white/40 mb-1">مبلغ اصل</p>
                          <p className="text-xs font-black">{formatToman(loan.principalIrr)} ت</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-[10px] text-white/40 mb-1">کل بازپرداخت</p>
                          <p className="text-xs font-black">{formatToman(loan.totalRepayableIrr ?? 0)} ت</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-[10px] text-white/40 mb-1">پرداخت شده</p>
                          <p className="text-xs font-black text-emerald-400">{formatToman(loan.repaidIrr ?? 0)} ت</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-[10px] text-white/40 mb-1">مانده</p>
                          <p className="text-xs font-black text-amber-400">{formatToman(loan.outstandingIrr)} ت</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-[10px] text-white/40 mb-1">اقساط</p>
                          <p className="text-xs font-black">
                            {(loan.paidInstallmentsCount ?? 0).toLocaleString("fa-IR")} از {(loan.installmentCount ?? 0).toLocaleString("fa-IR")}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-[10px] text-white/40 mb-1">سررسید بعدی</p>
                          <p className={`text-xs font-black ${(loan.overdueInstallmentsCount ?? 0) > 0 ? "text-red-400" : "text-white"}`}>
                            {loan.nextDueAt ? new Date(loan.nextDueAt).toLocaleDateString("fa-IR") : "-"}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {(loan.status === "active" || loan.status === "approved" || loan.status === "repaid") && (
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-white/40 mb-1">
                            <span>پیشرفت بازپرداخت</span>
                            <span>{repaidPct.toLocaleString("fa-IR")}%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-l from-emerald-400 to-emerald-600 rounded-full transition-all"
                              style={{ width: `${repaidPct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Overdue warning */}
                      {(loan.overdueInstallmentsCount ?? 0) > 0 && (
                        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <p className="text-xs text-red-300">
                            {(loan.overdueInstallmentsCount ?? 0).toLocaleString("fa-IR")} قسط معوق
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Expanded Installments */}
                    {isExpanded && (
                      <div className="border-t border-white/10 p-5">
                        <h3 className="text-sm font-black mb-4 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-accent-gold" />
                          جدول اقساط
                        </h3>
                        {!loan.installments || loan.installments.length === 0 ? (
                          <p className="text-xs text-white/40 py-4 text-center">اطلاعات اقساط موجود نیست</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-white/10">
                                  <th className="text-right text-white/40 pb-2 pr-2">قسط</th>
                                  <th className="text-right text-white/40 pb-2">سررسید</th>
                                  <th className="text-right text-white/40 pb-2">مبلغ (ت)</th>
                                  <th className="text-right text-white/40 pb-2">اصل (ت)</th>
                                  <th className="text-right text-white/40 pb-2">بهره (ت)</th>
                                  <th className="text-right text-white/40 pb-2">پرداخت شده (ت)</th>
                                  <th className="text-right text-white/40 pb-2">وضعیت</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {loan.installments.map((inst) => {
                                  const isc = installmentStatusConfig(inst.status)
                                  return (
                                    <tr key={inst.installmentNumber} className="hover:bg-white/3">
                                      <td className="py-2 pr-2 font-mono">{inst.installmentNumber.toLocaleString("fa-IR")}</td>
                                      <td className="py-2">{new Date(inst.dueAt).toLocaleDateString("fa-IR")}</td>
                                      <td className="py-2 font-mono">{formatToman(inst.amountIrr)}</td>
                                      <td className="py-2 font-mono text-white/60">{formatToman(inst.principalIrr)}</td>
                                      <td className="py-2 font-mono text-white/60">{formatToman(inst.interestIrr)}</td>
                                      <td className="py-2 font-mono text-emerald-400">{formatToman(inst.paidAmountIrr)}</td>
                                      <td className={`py-2 font-bold ${isc.cls}`}>{isc.label}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                              <tfoot className="border-t border-white/20">
                                <tr>
                                  <td colSpan={2} className="pt-3 pr-2 font-black text-white/70">جمع کل</td>
                                  <td className="pt-3 font-black font-mono">{formatToman(loan.totalRepayableIrr ?? 0)}</td>
                                  <td className="pt-3 font-mono text-white/50">{formatToman(loan.principalIrr)}</td>
                                  <td className="pt-3 font-mono text-white/50">{formatToman((loan.totalRepayableIrr ?? 0) - loan.principalIrr)}</td>
                                  <td className="pt-3 font-black font-mono text-emerald-400">{formatToman(loan.repaidIrr ?? 0)}</td>
                                  <td />
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}

                        {/* Meta info */}
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-white/40">
                          <div><span className="text-white/20">ثبت شده: </span>{new Date(loan.createdAt).toLocaleDateString("fa-IR")}</div>
                          <div><span className="text-white/20">بروز شده: </span>{new Date(loan.updatedAt).toLocaleDateString("fa-IR")}</div>
                          {loan.lastRepaymentAt && (
                            <div><span className="text-white/20">آخرین پرداخت: </span>{new Date(loan.lastRepaymentAt).toLocaleDateString("fa-IR")}</div>
                          )}
                          {loan.approvedBy && (
                            <div><span className="text-white/20">تایید کننده: </span><span className="font-mono">{loan.approvedBy.slice(0, 8)}</span></div>
                          )}
                          <div><span className="text-white/20">کارمزد ماهانه: </span>{loan.interestRateMonthlyPercent ?? "-"}%</div>
                          <div><span className="text-white/20">قسط ماهانه: </span>{formatToman(loan.monthlyInstallmentIrr ?? 0)} ت</div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Config Tab ─── */}
      {activeTab === "config" && configForm && (
        <div className="space-y-6">
          {/* Service Toggle */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="font-black text-lg mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-accent-gold" />
              تنظیمات سرویس وام
            </h2>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <p className="font-bold">فعال/غیرفعال کردن سرویس وام</p>
                <p className="text-xs text-white/40 mt-1">در صورت غیرفعال بودن، هیچ کاربری نمی‌تواند درخواست وام ثبت کند</p>
              </div>
              <button
                onClick={() => setConfigForm((prev) => prev ? { ...prev, enabled: !prev.enabled } : prev)}
                className={`relative w-14 h-7 rounded-full transition-all ${configForm.enabled ? "bg-emerald-500" : "bg-white/20"}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${configForm.enabled ? "right-1" : "left-1"}`} />
              </button>
            </div>
          </div>

          {/* Config Form */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="font-black text-lg mb-6">پارامترهای وام</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <div>
                <label className="text-xs text-white/60 mb-2 block font-semibold">حداقل سطح VIP</label>
                <select
                  value={configForm.requiredVipLevelId}
                  onChange={(e) => setConfigForm((prev) => prev ? { ...prev, requiredVipLevelId: e.target.value } : prev)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/60 focus:outline-none transition"
                >
                  {[1, 2, 3, 4, 5].map((level) => (
                    <option key={level} value={level}>سطح {level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/60 mb-2 block font-semibold">حداقل مبلغ وام (تومان)</label>
                <input
                  value={configForm.minLoanIrr}
                  onChange={(e) => setConfigForm((prev) => prev ? { ...prev, minLoanIrr: formatMoneyInput(e.target.value) } : prev)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/60 focus:outline-none transition"
                  placeholder="مثال: ۵۰۰,۰۰۰"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 mb-2 block font-semibold">حداکثر مبلغ وام (تومان)</label>
                <input
                  value={configForm.maxLoanIrr}
                  onChange={(e) => setConfigForm((prev) => prev ? { ...prev, maxLoanIrr: formatMoneyInput(e.target.value) } : prev)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/60 focus:outline-none transition"
                  placeholder="مثال: ۵,۰۰۰,۰۰۰"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 mb-2 block font-semibold">کارمزد ماهانه (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={configForm.monthlyInterestRatePercent}
                  onChange={(e) => setConfigForm((prev) => prev ? { ...prev, monthlyInterestRatePercent: e.target.value } : prev)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/60 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 mb-2 block font-semibold">حداقل تعداد اقساط (ماه)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  value={configForm.minInstallments}
                  onChange={(e) => setConfigForm((prev) => prev ? { ...prev, minInstallments: e.target.value } : prev)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/60 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 mb-2 block font-semibold">حداکثر تعداد اقساط (ماه)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  value={configForm.maxInstallments}
                  onChange={(e) => setConfigForm((prev) => prev ? { ...prev, maxInstallments: e.target.value } : prev)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/60 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 mb-2 block font-semibold">تعداد اقساط پیش‌فرض (ماه)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  value={configForm.defaultInstallments}
                  onChange={(e) => setConfigForm((prev) => prev ? { ...prev, defaultInstallments: e.target.value } : prev)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/60 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Preview */}
            {config && (
              <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <p className="text-xs font-black text-amber-400 mb-3">پیش‌نمایش محاسبه (مثال: ۱,۰۰۰,۰۰۰ تومان، {configForm.defaultInstallments} قسط)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {(() => {
                    const principal = 1_000_000
                    const rate = Number(configForm.monthlyInterestRatePercent) / 100
                    const n = Number(configForm.defaultInstallments)
                    const total = Math.round(principal * (1 + rate * n))
                    const monthly = n > 0 ? Math.ceil(total / n) : 0
                    return (
                      <>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/40 mb-1">اصل وام</p>
                          <p className="font-black">{formatToman(principal)} ت</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/40 mb-1">قسط ماهانه</p>
                          <p className="font-black text-sky-300">{formatToman(monthly)} ت</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/40 mb-1">کل بازپرداخت</p>
                          <p className="font-black text-emerald-300">{formatToman(total)} ت</p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}

            <button
              onClick={saveConfig}
              disabled={savingConfig}
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-accent-gold hover:bg-amber-400 text-black font-black rounded-xl transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingConfig ? "در حال ذخیره..." : "ذخیره تنظیمات"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
