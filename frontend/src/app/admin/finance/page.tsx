"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"

type Withdrawal = {
  id: string
  userId: string
  userEmail: string
  amount: number
  status: "pending" | "completed" | "rejected"
  createdAt: string
}

type Loan = {
  id: string
  userId: string
  principalIrr: number
  outstandingIrr: number
  status: string
  createdAt: string
}

type BackupJob = {
  id: string
  startedAt: string
  finishedAt?: string
  status: "running" | "success" | "failed"
  checksumSha256?: string
  storageUri?: string
}

export default function AdminFinancePage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [backups, setBackups] = useState<BackupJob[]>([])

  const load = async () => {
    try {
      const [wd, ln, bk] = await Promise.all([
        apiRequest<{ items: Withdrawal[] }>("/admin/finance/withdrawals"),
        apiRequest<{ items: Loan[] }>("/admin/loans"),
        apiRequest<{ items: BackupJob[] }>("/admin/system/backups"),
      ])
      setWithdrawals(wd.items)
      setLoans(ln.items)
      setBackups(bk.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت اطلاعات مالی")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const summary = useMemo(() => {
    const pendingW = withdrawals.filter((w) => w.status === "pending")
    const pendingL = loans.filter((l) => l.status === "pending")
    return {
      pendingWCount: pendingW.length,
      pendingWAmount: pendingW.reduce((a, b) => a + b.amount, 0),
      pendingLCount: pendingL.length,
      pendingLAmount: pendingL.reduce((a, b) => a + b.principalIrr, 0),
    }
  }, [withdrawals, loans])

  async function approveWithdrawal(id: string) {
    try {
      await apiRequest(`/admin/finance/withdrawals/${id}/approve`, { method: "POST" })
      toast.success("برداشت تایید شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا")
    }
  }

  async function rejectWithdrawal(id: string) {
    try {
      await apiRequest(`/admin/finance/withdrawals/${id}/reject`, { method: "POST" })
      toast.success("برداشت رد شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا")
    }
  }

  async function approveLoan(id: string) {
    try {
      await apiRequest(`/admin/loans/${id}/approve`, { method: "POST" })
      toast.success("وام تایید شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا")
    }
  }

  async function rejectLoan(id: string) {
    try {
      await apiRequest(`/admin/loans/${id}/reject`, { method: "POST" })
      toast.success("وام رد شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا")
    }
  }

  async function runBackup() {
    try {
      await apiRequest("/admin/system/backups/run", { method: "POST" })
      toast.success("بکاپ دستی اجرا شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در بکاپ")
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      <h1 className="text-4xl font-bold">مالی، وام و بکاپ</h1>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="card glass p-4">برداشت در انتظار: {summary.pendingWCount.toLocaleString("fa-IR")}</div>
        <div className="card glass p-4">مبلغ برداشت در انتظار: {summary.pendingWAmount.toLocaleString("fa-IR")}</div>
        <div className="card glass p-4">وام در انتظار: {summary.pendingLCount.toLocaleString("fa-IR")}</div>
        <div className="card glass p-4">مبلغ وام در انتظار: {summary.pendingLAmount.toLocaleString("fa-IR")}</div>
      </div>

      <section className="card glass p-6">
        <h2 className="text-2xl font-black mb-3">درخواست های برداشت</h2>
        <div className="space-y-2">
          {withdrawals.map((w) => (
            <div key={w.id} className="p-3 rounded-lg border border-white/10 bg-black/20 flex justify-between items-center">
              <div>
                <p>{w.userEmail}</p>
                <p className="text-xs text-white/60">{w.amount.toLocaleString("fa-IR")} - {w.status}</p>
              </div>
              {w.status === "pending" ? (
                <div className="flex gap-2">
                  <button onClick={() => approveWithdrawal(w.id)} className="btn-secondary">تایید</button>
                  <button onClick={() => rejectWithdrawal(w.id)} className="btn-secondary">رد</button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="card glass p-6">
        <h2 className="text-2xl font-black mb-3">درخواست های وام</h2>
        <div className="space-y-2">
          {loans.map((l) => (
            <div key={l.id} className="p-3 rounded-lg border border-white/10 bg-black/20 flex justify-between items-center">
              <div>
                <p>{l.id} - {l.userId}</p>
                <p className="text-xs text-white/60">{l.principalIrr.toLocaleString("fa-IR")} - {l.status}</p>
              </div>
              {l.status === "pending" ? (
                <div className="flex gap-2">
                  <button onClick={() => approveLoan(l.id)} className="btn-secondary">تایید</button>
                  <button onClick={() => rejectLoan(l.id)} className="btn-secondary">رد</button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="card glass p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-black">بکاپ های روزانه</h2>
          <button onClick={runBackup} className="btn-primary">اجرای بکاپ</button>
        </div>
        <div className="space-y-2">
          {backups.map((b) => (
            <div key={b.id} className="p-3 rounded-lg border border-white/10 bg-black/20 text-sm">
              <p>{b.id} - {b.status}</p>
              <p className="text-white/60">{new Date(b.startedAt).toLocaleString("fa-IR")}</p>
              <p className="text-white/60">{b.storageUri ?? "-"}</p>
            </div>
          ))}
          {!backups.length ? <p className="text-white/60">بکاپی وجود ندارد.</p> : null}
        </div>
      </section>
    </div>
  )
}
