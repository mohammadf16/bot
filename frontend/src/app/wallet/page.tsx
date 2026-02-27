"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest, randomIdempotencyKey } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { uploadUserImage } from "@/lib/image-upload"
import { formatMoneyInput, formatToman, parseBoundedIntInput, parseTomanInput } from "@/lib/money"

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
    enabled?: boolean
    requiredVipLevelId?: number
    minLoanIrr?: number
    maxLoanIrr?: number
    monthlyInterestRatePercent?: number
    minInstallments?: number
    maxInstallments?: number
    defaultInstallments?: number
  }
  rates: {
    goldSellRateIrr: number
    microToChanceThresholdIrr: number
    microToChanceRateIrr: number
  }
  cardToCard?: {
    destinationCard: string
  }
  transactions: WalletTx[]
}

export default function WalletPage() {
  const { isAuthenticated } = useAuth()
  const [amount, setAmount] = useState("")
  const [cardToCardAmount, setCardToCardAmount] = useState("")
  const [fromCardLast4, setFromCardLast4] = useState("")
  const [trackingCode, setTrackingCode] = useState("")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [cardToCardSubmitting, setCardToCardSubmitting] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [loanAmount, setLoanAmount] = useState(formatMoneyInput("5000000"))
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
    if (!receiptFile) return toast.error("تصویر رسید را انتخاب کنید")
    setCardToCardSubmitting(true)
    try {
      const receiptImageUrl = await uploadUserImage(receiptFile)
      await apiRequest<{ ok: boolean; status: string }>("/wallet/deposit/card-to-card", {
        method: "POST",
        body: JSON.stringify({
          amount: parsed,
          fromCardLast4,
          trackingCode: trackingCode.trim(),
          receiptImageUrl,
        }),
      })
      setCardToCardAmount("")
      setFromCardLast4("")
      setTrackingCode("")
      setReceiptFile(null)
      toast.success("درخواست واریز کارت به کارت ثبت شد (در انتظار تایید)")
      await loadWallet()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت کارت به کارت ناموفق بود")
    } finally {
      setCardToCardSubmitting(false)
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
    const goldSot = parseBoundedIntInput(goldToSell, { min: 1 })
    if (!goldSot) return toast.error("مقدار سوت معتبر نیست")
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

    const loanConfig = wallet?.loan
    const vipLevelId = wallet?.vip?.id ?? 1
    if (loanConfig?.enabled === false) return toast.error("ثبت وام در حال حاضر غیرفعال است")
    if (loanConfig?.requiredVipLevelId && vipLevelId < loanConfig.requiredVipLevelId) {
      return toast.error(`حداقل سطح VIP برای وام: ${loanConfig.requiredVipLevelId.toLocaleString("fa-IR")}`)
    }
    if (loanConfig?.minLoanIrr && loanConfig?.maxLoanIrr) {
      if (amount < loanConfig.minLoanIrr || amount > loanConfig.maxLoanIrr) {
        return toast.error(`مبلغ وام باید بین ${formatToman(loanConfig.minLoanIrr)} تا ${formatToman(loanConfig.maxLoanIrr)} تومان باشد`)
      }
    }

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

  const inputClass = "w-full bg-slate-800/40 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:border-accent-gold/70 focus:outline-none focus:ring-1 focus:ring-accent-gold/30 transition-all"

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 text-right" dir="rtl">
        <h1 className="text-4xl md:text-5xl font-black mb-2">کیف پول چنددارایی</h1>
        <p className="text-white/50 mb-8 text-sm md:text-base">مدیریت دارایی‌های خود را از اینجا شروع کنید</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-8">
          <div className="card glass p-5 md:p-6">
            <p className="text-white/50 text-xs md:text-sm font-semibold">اعتبار نقدی</p>
            <p className="text-2xl md:text-3xl font-black text-accent-gold mt-2">{formatToman(summary.irr)}</p>
            <p className="text-xs text-white/40 mt-1">تومان</p>
          </div>
          <div className="card glass p-5 md:p-6">
            <p className="text-white/50 text-xs md:text-sm font-semibold">طلای آب شده</p>
            <p className="text-2xl md:text-3xl font-black text-accent-cyan mt-2">{summary.goldSot.toLocaleString("fa-IR")}</p>
            <p className="text-xs text-white/40 mt-1">سوت</p>
          </div>
          <div className="card glass p-5 md:p-6">
            <p className="text-white/50 text-xs md:text-sm font-semibold">شانس</p>
            <p className="text-2xl md:text-3xl font-black text-emerald-400 mt-2">{summary.chances.toLocaleString("fa-IR")}</p>
            <p className="text-xs text-white/40 mt-1">شانس</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-8">
          <div className="card glass p-5 md:p-6">
            <p className="text-white/50 text-xs md:text-sm font-semibold">سطح VIP</p>
            <p className="text-xl md:text-2xl font-black mt-2">{summary.vip}</p>
            <p className="text-xs text-accent-gold mt-1">کش بک: {summary.cashback}%</p>
          </div>
          <div className="card glass p-5 md:p-6">
            <p className="text-white/50 text-xs md:text-sm font-semibold">قفل وام</p>
            <p className="text-xl md:text-2xl font-black mt-2">{formatToman(summary.locked)}</p>
            <p className="text-xs text-white/40 mt-1">تومان</p>
          </div>
          <div className="card glass p-5 md:p-6">
            <p className="text-white/50 text-xs md:text-sm font-semibold">پول خرد</p>
            <p className="text-xs text-white/60 mt-2">تا {formatToman(summary.threshold)}</p>
            <button onClick={handleMicroToChance} className="btn-secondary w-full mt-3 text-xs md:text-sm py-2">تبدیل</button>
          </div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/90 backdrop-blur-lg p-6 md:p-8">
          <h3 className="text-lg md:text-xl font-black mb-5 flex items-center gap-2 text-white">📱 درگاه آنلاين</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/70 mb-2 block">مبلغ شارژ (تومان)</label>
                <input value={amount} onChange={(e) => setAmount(formatMoneyInput(e.target.value))} placeholder="مثال: ۱۰۰،۰۰۰" className={inputClass} />
              </div>
              <button onClick={handleDeposit} className="btn-primary w-full">شارژ فوری</button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/90 backdrop-blur-lg p-6 md:p-8">
            <h3 className="text-lg md:text-xl font-black mb-5 flex items-center gap-2 text-white">💳 کارت به کارت</h3>
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-xs text-white/70">کارت مقصد:</p>
                <p className="text-sm font-mono mt-1 text-white">{wallet?.cardToCard?.destinationCard ?? "6037-9979-0000-1234"}</p>
              </div>
              <div>
                <label className="text-xs text-white/70 mb-2 block">مبلغ واریز (تومان)</label>
                <input value={cardToCardAmount} onChange={(e) => setCardToCardAmount(formatMoneyInput(e.target.value))} placeholder="مثال: ۵۰۰،۰۰۰" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/70 mb-2 block">۴ رقم آخر</label>
                  <input value={fromCardLast4} onChange={(e) => setFromCardLast4(e.target.value)} placeholder="مثال: ۱۲۳۴" className={inputClass} maxLength={4} />
                </div>
                <div>
                  <label className="text-xs text-white/70 mb-2 block">کد پیگیری</label>
                  <input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="کد پیگیری" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/70 mb-2 block">فیش پیگیری</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs text-white/50 file:mr-3 file:rounded-lg file:border-0 file:bg-accent-gold/20 file:px-3 file:py-2 file:text-accent-gold file:cursor-pointer hover:file:bg-accent-gold/30 transition-colors"
                />
              </div>
              <button onClick={handleCardToCardDeposit} disabled={cardToCardSubmitting} className="btn-secondary w-full disabled:opacity-60 disabled:cursor-not-allowed">
                {cardToCardSubmitting ? "⏱ ارسال در حال انجام..." : "✓ ثبت فیش"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/90 backdrop-blur-lg p-6 md:p-8 lg:col-span-2">
            <h3 className="text-lg md:text-xl font-black mb-5 flex items-center gap-2 text-white">💰 برداشت</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/70 mb-2 block">مبلغ برداشت (تومان)</label>
                <input value={withdrawAmount} onChange={(e) => setWithdrawAmount(formatMoneyInput(e.target.value))} placeholder="مثال: ۲۰۰۰۰۰۰۰" className={inputClass} />
              </div>
              <button onClick={handleWithdraw} className="btn-secondary w-full">درخواست برداشت</button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/90 backdrop-blur-lg p-6 md:p-8">
            <h3 className="text-lg md:text-xl font-black mb-5 flex items-center gap-2 text-white">✨ طلا به تومان</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/70 mb-2 block">مقدار سوت</label>
                <input
                  value={formatMoneyInput(goldToSell)}
                  onChange={(e) => {
                    const parsed = parseBoundedIntInput(e.target.value, { min: 0 })
                    setGoldToSell(parsed === null ? "" : String(parsed))
                  }}
                  placeholder="مثال: ۱۰"
                  inputMode="numeric"
                  className={inputClass}
                />
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs text-white/60">نرخ روز</p>
                <p className="text-sm font-black text-amber-300 mt-1">{formatToman(wallet?.rates?.goldSellRateIrr ?? 0)} /سوت</p>
              </div>
              <button onClick={handleGoldToCash} className="btn-primary w-full">تبدیل</button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/90 backdrop-blur-lg p-6 md:p-8 lg:col-span-2">
            <h3 className="text-lg md:text-xl font-black mb-5 flex items-center gap-2 text-white">🚗 وام خودرو</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/70 mb-2 block">مبلغ درخواستی (تومان)</label>
                <input value={loanAmount} onChange={(e) => setLoanAmount(formatMoneyInput(e.target.value))} placeholder="مثال: ۵۰۰۰۰۰۰" className={inputClass} />
              </div>
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  {wallet?.loan?.enabled === false
                    ? "سرویس وام غیرفعال است."
                    : `بازه وام: ${formatToman(wallet?.loan?.minLoanIrr ?? 0)} تا ${formatToman(wallet?.loan?.maxLoanIrr ?? 0)} تومان | کارمزد ماهانه: ${(wallet?.loan?.monthlyInterestRatePercent ?? 0).toLocaleString("fa-IR")}% | حداقل VIP: ${(wallet?.loan?.requiredVipLevelId ?? 1).toLocaleString("fa-IR")}`}
                </p>
              </div>
              <button onClick={handleLoan} className="btn-secondary w-full">درخواست وام</button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/90 backdrop-blur-lg p-6 md:p-8">
          <h3 className="text-lg md:text-2xl font-black mb-5 text-white">📜 تاریخچه تراکنش‌ها</h3>
          {loading ? (
            <div className="py-8 text-center text-white/50">در حال بارگذاری...</div>
          ) : wallet?.transactions.length === 0 ? (
            <div className="py-8 text-center text-white/50">تراکنشی موجود نیست</div>
          ) : (
            <div className="space-y-3">
              {wallet?.transactions.map((tx) => (
                <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 transition-colors">
                  <div className="flex-1">
                    <p className="text-xs text-white/60 mb-1">{new Date(tx.createdAt).toLocaleString("fa-IR")}</p>
                    <p className="font-semibold text-white">{tx.type}</p>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3">
                    <span className="font-black text-accent-gold">{formatToman(tx.amount)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full border ${tx.status === "completed" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" : tx.status === "pending" ? "bg-amber-500/10 text-amber-300 border-amber-500/30" : "bg-rose-500/10 text-rose-300 border-rose-500/30"}`}>
                      {tx.status === "completed" ? "✓ تایید شده" : tx.status === "pending" ? "⏱ در انتظار" : "✗ ناموفق"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
