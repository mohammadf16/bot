"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { formatToman, parseTomanInput } from "@/lib/money"

type LoanItem = {
  id: string
  principalIrr: number
  outstandingIrr: number
  installmentCount?: number
  monthlyInstallmentIrr?: number
  interestRateMonthlyPercent?: number
  totalRepayableIrr?: number
  status: "pending" | "approved" | "active" | "repaid" | "rejected" | "defaulted"
  dueAt?: string
  createdAt: string
}

const INSTALLMENT_OPTIONS = [6, 12, 18, 24, 36]

export default function LoanPage() {
  const [amount, setAmount] = useState("5000000")
  const [installments, setInstallments] = useState(12)
  const [repayAmountByLoan, setRepayAmountByLoan] = useState<Record<string, string>>({})
  const [items, setItems] = useState<LoanItem[]>([])
  const { user } = useAuth()

  const isProUser = useMemo(() => Number(user?.vipLevelId ?? 1) >= 3, [user?.vipLevelId])

  const simulation = useMemo(() => {
    const principal = parseTomanInput(amount) ?? 0
    const monthlyRate = 0.015
    const total = Math.round(principal * (1 + monthlyRate * installments))
    const monthly = installments > 0 ? Math.ceil(total / installments) : 0
    return {
      principal,
      monthlyRatePercent: monthlyRate * 100,
      total,
      monthly,
    }
  }, [amount, installments])

  async function load() {
    try {
      const data = await apiRequest<{ items: LoanItem[] }>("/loans/me")
      setItems(data.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت وام ها")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function requestLoan() {
    const n = parseTomanInput(amount)
    if (!n) return toast.error("مبلغ معتبر نیست")
    if (!isProUser) return toast.error("درخواست وام فقط برای کاربران پرو فعال است")
    try {
      await apiRequest("/loans/request", {
        method: "POST",
        body: JSON.stringify({ amount: n, dueDays: installments * 30 }),
      })
      toast.success("درخواست وام ثبت شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت وام")
    }
  }

  async function repay(loanId: string) {
    const n = parseTomanInput(repayAmountByLoan[loanId] ?? "")
    if (!n) return toast.error("مبلغ بازپرداخت معتبر نیست")
    try {
      await apiRequest(`/loans/${loanId}/repay`, {
        method: "POST",
        body: JSON.stringify({ amount: n }),
      })
      toast.success("بازپرداخت ثبت شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "بازپرداخت ناموفق بود")
    }
  }

  return (
    <main className="min-h-screen pt-32 pb-20" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 space-y-8">
        <section className="card glass p-8">
          <h1 className="text-4xl font-black mb-3">صفحه وام خودرو</h1>
          <p className="text-white/70 mb-4">
            درخواست وام، انتخاب تعداد اقساط و مشاهده مبلغ هر قسط. دسترسی وام فقط برای VIP طلایی به بالا.
          </p>
          {!isProUser ? (
            <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              حساب شما پرو نیست. برای استفاده از وام، سطح VIP را به طلایی یا بالاتر ارتقا دهید.
            </div>
          ) : null}
          <div className="grid md:grid-cols-3 gap-3">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-dark-bg/50 rounded-xl px-4 py-3 border border-dark-border"
              placeholder="مبلغ وام"
            />
            <select
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
              className="bg-dark-bg/50 rounded-xl px-4 py-3 border border-dark-border"
            >
              {INSTALLMENT_OPTIONS.map((month) => (
                <option key={month} value={month}>{month.toLocaleString("fa-IR")} قسط</option>
              ))}
            </select>
            <button onClick={requestLoan} disabled={!isProUser} className="btn-primary disabled:opacity-50">درخواست وام</button>
          </div>
          <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm space-y-1">
            <p>مبلغ درخواستی: <b>{formatToman(simulation.principal)} تومان</b></p>
            <p>تعداد اقساط: <b>{simulation.principal > 0 ? installments.toLocaleString("fa-IR") : 0} قسط</b></p>
            <p>کارمزد ماهانه: <b>{simulation.monthlyRatePercent.toLocaleString("fa-IR")}٪</b></p>
            <p>مبلغ هر قسط: <b>{formatToman(simulation.monthly)} تومان</b></p>
            <p>جمع بازپرداخت: <b>{formatToman(simulation.total)} تومان</b></p>
          </div>
        </section>

        <section className="card glass p-8">
          <h2 className="text-2xl font-black mb-4">وام های من</h2>
          <div className="space-y-3">
            {items.map((loan) => (
              <div key={loan.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p>شناسه: {loan.id}</p>
                <p>وضعیت: <b>{loan.status}</b></p>
                <p>اصل وام: {formatToman(loan.principalIrr)} تومان</p>
                <p>باقیمانده: {formatToman(loan.outstandingIrr)} تومان</p>
                <p>تعداد اقساط: {(loan.installmentCount ?? 0).toLocaleString("fa-IR")}</p>
                <p>قسط ماهانه: {formatToman(loan.monthlyInstallmentIrr ?? 0)} تومان</p>
                <p>جمع بازپرداخت: {formatToman(loan.totalRepayableIrr ?? loan.outstandingIrr)} تومان</p>
                <p>سررسید: {loan.dueAt ? new Date(loan.dueAt).toLocaleString("fa-IR") : "-"}</p>
                {(loan.status === "active" || loan.status === "approved") ? (
                  <div className="flex gap-2 mt-3">
                    <input
                      value={repayAmountByLoan[loan.id] ?? ""}
                      onChange={(e) => setRepayAmountByLoan((prev) => ({ ...prev, [loan.id]: e.target.value }))}
                      className="flex-1 bg-dark-bg/50 rounded-lg px-3 py-2 border border-dark-border"
                      placeholder="مبلغ بازپرداخت"
                    />
                    <button onClick={() => repay(loan.id)} className="btn-secondary">بازپرداخت</button>
                  </div>
                ) : null}
              </div>
            ))}
            {!items.length ? <p className="text-white/60">هنوز وامی ثبت نشده است.</p> : null}
          </div>
        </section>
      </div>
    </main>
  )
}

