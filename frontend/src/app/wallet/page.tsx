"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest, randomIdempotencyKey } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
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
  assets: {
    irr: number
    goldSot: number
    chance: number
  }
  vip: {
    id: number
    name: string
    cashbackPercent: number
  }
  loan: {
    lockedBalance: number
  }
  rates: {
    goldSellRateIrr: number
    microToChanceThresholdIrr: number
    microToChanceRateIrr: number
  }
  transactions: WalletTx[]
}

export default function WalletPage() {
  const { isAuthenticated } = useAuth()
  const [amount, setAmount] = useState("")
  const [cardToCardAmount, setCardToCardAmount] = useState("")
  const [fromCardLast4, setFromCardLast4] = useState("")
  const [trackingCode, setTrackingCode] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [loanAmount, setLoanAmount] = useState("5000000")
  const [goldToSell, setGoldToSell] = useState("1")
  const [wallet, setWallet] = useState<WalletPayload | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadWallet() {
    setLoading(true)
    try {
      const data = await apiRequest<WalletPayload>("/wallet", { method: "GET" })
      setWallet(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت کیف پول")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    void loadWallet()
  }, [isAuthenticated])

  async function handleDeposit() {
    const parsed = parseTomanInput(amount)
    if (!parsed) return toast.error("مبلغ معتبر نیست")
    try {
      await apiRequest<{ ok: boolean }>("/wallet/deposit", {
        method: "POST",
        headers: { "Idempotency-Key": randomIdempotencyKey() },
        body: JSON.stringify({ amount: parsed }),
      })
      setAmount("")
      toast.success("شارژ کیف پول انجام شد")
      await loadWallet()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در شارژ کیف پول")
    }
  }

  async function handleCardToCardDeposit() {
    const parsed = parseTomanInput(cardToCardAmount)
    if (!parsed) return toast.error("مبلغ کارت به کارت معتبر نیست")
    if (!/^\d{4}$/.test(fromCardLast4)) return toast.error("۴ رقم آخر کارت نامعتبر است")
    if ((trackingCode ?? "").trim().length < 4) return toast.error("کد پیگیری نامعتبر است")
    try {
      await apiRequest<{ ok: boolean; status: string }>("/wallet/deposit/card-to-card", {
        method: "POST",
        body: JSON.stringify({
          amount: parsed,
          fromCardLast4,
          trackingCode: trackingCode.trim(),
        }),
      })
      setCardToCardAmount("")
      setFromCardLast4("")
      setTrackingCode("")
      toast.success("درخواست واریز کارت به کارت ثبت شد (در انتظار تایید)")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت کارت به کارت ناموفق بود")
    }
  }

  async function handleWithdraw() {
    const parsed = parseTomanInput(withdrawAmount)
    if (!parsed) return toast.error("مبلغ برداشت معتبر نیست")
    try {
      let challengeId: string | undefined
      let twoFactorCode: string | undefined
      if (parsed >= 100_000_000) {
        const challenge = await apiRequest<{ challengeId: string; debugCode: string }>("/security/2fa/challenge", {
          method: "POST",
          body: JSON.stringify({ channel: "sms" }),
        })
        challengeId = challenge.challengeId
        twoFactorCode = challenge.debugCode
      }
      await apiRequest<{ ok: boolean }>("/wallet/withdraw", {
        method: "POST",
        headers: { "Idempotency-Key": randomIdempotencyKey() },
        body: JSON.stringify({ amount: parsed, iban: "IR000000000000000000000000", challengeId, twoFactorCode }),
      })
      setWithdrawAmount("")
      toast.success("درخواست برداشت ثبت شد")
      await loadWallet()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در برداشت")
    }
  }

  async function handleGoldToCash() {
    const goldSot = Number(goldToSell)
    if (!Number.isFinite(goldSot) || goldSot <= 0) return toast.error("مقدار سوت معتبر نیست")
    try {
      await apiRequest("/wallet/convert/gold-to-cash", {
        method: "POST",
        body: JSON.stringify({ goldSot }),
      })
      toast.success("تبدیل طلا به تومان انجام شد")
      await loadWallet()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تبدیل انجام نشد")
    }
  }

  async function handleMicroToChance() {
    try {
      await apiRequest("/wallet/convert/micro-to-chance", {
        method: "POST",
        body: JSON.stringify({}),
      })
      toast.success("پول خرد به شانس تبدیل شد")
      await loadWallet()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تبدیل انجام نشد")
    }
  }

  async function handleLoan() {
    const amount = parseTomanInput(loanAmount)
    if (!amount) return toast.error("مبلغ وام معتبر نیست")
    try {
      await apiRequest("/wallet/loan/request", {
        method: "POST",
        body: JSON.stringify({ amount }),
      })
      toast.success("وام ویژه ثبت و واریز شد")
      await loadWallet()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "وام تایید نشد")
    }
  }

  const summary = useMemo(() => {
    return {
      irr: wallet?.assets.irr ?? wallet?.balance ?? 0,
      goldSot: wallet?.assets.goldSot ?? 0,
      chances: wallet?.assets.chance ?? wallet?.chances ?? 0,
      vip: wallet?.vip?.name ?? "برنزی",
      cashback: wallet?.vip?.cashbackPercent ?? 20,
      locked: wallet?.loan?.lockedBalance ?? 0,
      threshold: wallet?.rates?.microToChanceThresholdIrr ?? 50000,
    }
  }, [wallet])

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-4 text-right" dir="rtl">
          <div className="card glass p-8">
            <h1 className="text-3xl font-black mb-3">کیف پول چنددارایی</h1>
            <p className="text-dark-text/60">برای دسترسی ابتدا وارد حساب شوید.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 text-right" dir="rtl">
        <h1 className="text-5xl font-black mb-8">کیف پول چنددارایی</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card glass p-5">
            <p className="text-dark-text/60 text-sm">اعتبار نقدی</p>
            <p className="text-2xl font-black text-accent-gold mt-1">{formatToman(summary.irr)} تومان</p>
          </div>
          <div className="card glass p-5">
            <p className="text-dark-text/60 text-sm">طلای آب شده (سوت)</p>
            <p className="text-2xl font-black mt-1">{summary.goldSot.toLocaleString("fa-IR")}</p>
          </div>
          <div className="card glass p-5">
            <p className="text-dark-text/60 text-sm">شانس</p>
            <p className="text-2xl font-black text-accent-cyan mt-1">{summary.chances.toLocaleString("fa-IR")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card glass p-5">
            <p className="text-sm text-dark-text/60">سطح VIP</p>
            <p className="text-xl font-black mt-1">{summary.vip}</p>
            <p className="text-sm text-dark-text/60 mt-1">کش بک: {summary.cashback}%</p>
          </div>
          <div className="card glass p-5">
            <p className="text-sm text-dark-text/60">قفل وام</p>
            <p className="text-xl font-black mt-1">{formatToman(summary.locked)} تومان</p>
          </div>
          <div className="card glass p-5">
            <p className="text-sm text-dark-text/60">پول خردکن</p>
            <p className="text-sm mt-1">فقط مبالغ زیر {formatToman(summary.threshold)} تومان</p>
            <button onClick={handleMicroToChance} className="btn-secondary w-full mt-3">تبدیل پول خرد به شانس</button>
          </div>
        </div>

        <section className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card glass p-8">
            <h3 className="text-xl font-black mb-4">درگاه آنلاین شارژ</h3>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مبلغ شارژ (تومان)" className="w-full bg-dark-bg/50 border border-dark-border/40 rounded-xl px-4 py-3 mb-4" />
            <button onClick={handleDeposit} className="btn-primary w-full">شارژ</button>
          </div>

          <div className="card glass p-8">
            <h3 className="text-xl font-black mb-4">واریز کارت به کارت</h3>
            <p className="text-xs text-dark-text/60 mb-3">کارت مقصد: <b>6037-9979-0000-1234</b></p>
            <input value={cardToCardAmount} onChange={(e) => setCardToCardAmount(e.target.value)} placeholder="مبلغ واریز (تومان)" className="w-full bg-dark-bg/50 border border-dark-border/40 rounded-xl px-4 py-3 mb-3" />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={fromCardLast4} onChange={(e) => setFromCardLast4(e.target.value)} placeholder="۴ رقم آخر کارت" className="w-full bg-dark-bg/50 border border-dark-border/40 rounded-xl px-4 py-3" />
              <input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="کد پیگیری" className="w-full bg-dark-bg/50 border border-dark-border/40 rounded-xl px-4 py-3" />
            </div>
            <button onClick={handleCardToCardDeposit} className="btn-secondary w-full">ثبت فیش کارت به کارت</button>
          </div>

          <div className="card glass p-8 md:col-span-2">
            <h3 className="text-xl font-black mb-4">برداشت</h3>
            <input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="مبلغ برداشت (تومان)" className="w-full bg-dark-bg/50 border border-dark-border/40 rounded-xl px-4 py-3 mb-4" />
            <button onClick={handleWithdraw} className="btn-secondary w-full">ثبت درخواست برداشت</button>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card glass p-6">
            <h3 className="text-lg font-black mb-3">تبدیل طلا به تومان</h3>
            <input value={goldToSell} onChange={(e) => setGoldToSell(e.target.value)} placeholder="مقدار سوت" className="w-full bg-dark-bg/50 border border-dark-border/40 rounded-xl px-4 py-3 mb-3" />
            <p className="text-xs text-dark-text/60 mb-3">نرخ روز: {formatToman(wallet?.rates?.goldSellRateIrr ?? 0)} برای هر سوت</p>
            <button onClick={handleGoldToCash} className="btn-primary w-full">تبدیل</button>
          </div>

          <div className="card glass p-6 md:col-span-2">
            <h3 className="text-lg font-black mb-3">وام خودرو ویژه VIP طلایی به بالا</h3>
            <input value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} placeholder="مبلغ وام (تومان)" className="w-full bg-dark-bg/50 border border-dark-border/40 rounded-xl px-4 py-3 mb-3" />
            <p className="text-xs text-dark-text/60 mb-3">مبلغ وام به اعتبار اضافه می‌شود اما تا تسویه برداشت آن محدود است.</p>
            <button onClick={handleLoan} className="btn-secondary w-full">درخواست وام</button>
          </div>
        </section>

        <section className="card glass p-8 overflow-hidden">
          <h3 className="text-2xl font-black mb-4">تاریخچه تراکنش ها</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-dark-text/50 border-b border-dark-border/40">
                  <th className="text-right py-3">تاریخ</th>
                  <th className="text-right py-3">نوع</th>
                  <th className="text-right py-3">مبلغ</th>
                  <th className="text-right py-3">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="py-3" colSpan={4}>در حال بارگذاری...</td></tr>
                ) : (
                  wallet?.transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-dark-border/20">
                      <td className="py-3">{new Date(tx.createdAt).toLocaleString("fa-IR")}</td>
                      <td className="py-3">{tx.type}</td>
                      <td className="py-3 font-black">{formatToman(tx.amount)}</td>
                      <td className="py-3">{tx.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
