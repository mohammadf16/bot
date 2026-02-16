"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { formatToman, parseTomanInput } from "@/lib/money"

type LoanItem = {
  id: string
  principalIrr: number
  outstandingIrr: number
  status: "pending" | "approved" | "active" | "repaid" | "rejected" | "defaulted"
  dueAt?: string
  createdAt: string
}

export default function LoanPage() {
  const [amount, setAmount] = useState("5000000")
  const [repayAmountByLoan, setRepayAmountByLoan] = useState<Record<string, string>>({})
  const [items, setItems] = useState<LoanItem[]>([])

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
    try {
      await apiRequest("/loans/request", {
        method: "POST",
        body: JSON.stringify({ amount: n, dueDays: 60 }),
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
          <h1 className="text-4xl font-black mb-3">وام خودرو (VIP طلایی به بالا)</h1>
          <p className="text-white/70 mb-4">حداکثر ۵ میلیون تومان؛ اعتبار وام تا تسویه، برداشت‌پذیر نیست.</p>
          <div className="flex gap-3">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1 bg-dark-bg/50 rounded-xl px-4 py-3 border border-dark-border" placeholder="مبلغ وام" />
            <button onClick={requestLoan} className="btn-primary">درخواست وام</button>
          </div>
        </section>

        <section className="card glass p-8">
          <h2 className="text-2xl font-black mb-4">وام های من</h2>
          <div className="space-y-3">
            {items.map((loan) => (
              <div key={loan.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p>شناسه: {loan.id}</p>
                <p>وضعیت: <b>{loan.status}</b></p>
                <p>اصل: {formatToman(loan.principalIrr)} تومان</p>
                <p>باقیمانده: {formatToman(loan.outstandingIrr)} تومان</p>
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
