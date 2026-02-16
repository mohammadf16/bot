"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest, randomIdempotencyKey } from "@/lib/api"
import { formatToman, parseTomanInput } from "@/lib/money"

type WalletTx = {
  id: string
  type: string
  amount: number
  status: string
  createdAt: string
}

type WalletPayload = {
  balance: number
  chances: number
  transactions: WalletTx[]
}

export default function DashboardWalletPage() {
  const [wallet, setWallet] = useState<WalletPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [depositValue, setDepositValue] = useState("")
  const [withdrawValue, setWithdrawValue] = useState("")

  async function load() {
    setLoading(true)
    try {
      const data = await apiRequest<WalletPayload>("/wallet", { method: "GET" })
      setWallet(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت اطلاعات کیف پول")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleDeposit() {
    const amount = parseTomanInput(depositValue)
    if (!amount) return toast.error("مبلغ شارژ معتبر نیست")
    try {
      await apiRequest("/wallet/deposit", {
        method: "POST",
        headers: { "Idempotency-Key": randomIdempotencyKey() },
        body: JSON.stringify({ amount }),
      })
      setDepositValue("")
      toast.success("شارژ کیف پول انجام شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در شارژ کیف پول")
    }
  }

  async function handleWithdraw() {
    const amount = parseTomanInput(withdrawValue)
    if (!amount) return toast.error("مبلغ برداشت معتبر نیست")
    try {
      await apiRequest("/wallet/withdraw", {
        method: "POST",
        headers: { "Idempotency-Key": randomIdempotencyKey() },
        body: JSON.stringify({ amount, iban: "IR000000000000000000000000" }),
      })
      setWithdrawValue("")
      toast.success("درخواست برداشت ثبت شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در برداشت وجه")
    }
  }

  const transactions = useMemo(() => wallet?.transactions.slice(0, 8) ?? [], [wallet])

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-accent-gold to-yellow-600 rounded-[2.5rem] p-8 md:p-12 text-black relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold opacity-60 mb-1">موجودی فعلی</p>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                  {formatToman(wallet?.balance ?? 0)} <span className="text-lg opacity-60 font-bold">تومان</span>
                </h2>
              </div>
              <div className="bg-black/10 p-3 rounded-2xl backdrop-blur-sm">
                <Wallet className="w-8 h-8" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <input
                  value={depositValue}
                  onChange={(e) => setDepositValue(e.target.value)}
                  placeholder="مبلغ شارژ (تومان)"
                  className="w-full bg-white/35 border border-black/15 rounded-2xl px-4 py-3 placeholder:text-black/50"
                />
                <button onClick={handleDeposit} className="mt-3 w-full bg-black text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2">
                  <ArrowDownLeft className="w-5 h-5" />
                  افزایش موجودی
                </button>
              </div>
              <div>
                <input
                  value={withdrawValue}
                  onChange={(e) => setWithdrawValue(e.target.value)}
                  placeholder="مبلغ برداشت (تومان)"
                  className="w-full bg-white/35 border border-black/15 rounded-2xl px-4 py-3 placeholder:text-black/50"
                />
                <button onClick={handleWithdraw} className="mt-3 w-full bg-black/80 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2">
                  <ArrowUpRight className="w-5 h-5" />
                  برداشت وجه
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[2.5rem] h-full flex flex-col justify-center gap-4">
          <h3 className="text-xl font-bold">خلاصه حساب</h3>
          <div className="flex items-center justify-between border-b border-white/10 py-2">
            <span className="text-white/60">شانس‌ها</span>
            <span className="font-black">{(wallet?.chances ?? 0).toLocaleString("fa-IR")}</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 py-2">
            <span className="text-white/60">تراکنش‌ها</span>
            <span className="font-black">{(wallet?.transactions.length ?? 0).toLocaleString("fa-IR")}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-white/60">وضعیت</span>
            <span className="font-black text-emerald-400">{loading ? "در حال بارگذاری" : "فعال"}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-black mb-6">تراکنش‌های اخیر</h3>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    tx.amount < 0 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                  }`}
                >
                  {tx.amount < 0 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-bold">{tx.type}</p>
                  <p className="text-xs text-white/30">{new Date(tx.createdAt).toLocaleString("fa-IR")}</p>
                </div>
              </div>
              <p className={`font-black text-lg ${tx.amount < 0 ? "text-white" : "text-emerald-500"}`}>
                {tx.amount < 0 ? "-" : "+"} {formatToman(Math.abs(tx.amount))}
              </p>
            </div>
          ))}
          {!transactions.length && !loading ? (
            <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl text-white/60 text-sm">تراکنشی ثبت نشده است.</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

