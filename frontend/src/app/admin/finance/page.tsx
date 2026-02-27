"use client"

import { useEffect, useMemo, useState, type ComponentType } from "react"
import { CheckCircle, Clock, Copy, CreditCard, Eye, FileText, RefreshCw, Wallet, XCircle } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { formatToman } from "@/lib/money"

type Withdrawal = {
  id: string
  userId: string
  userEmail: string
  amount: number
  status: "pending" | "completed" | "rejected"
  createdAt: string
}

type CardToCardPayment = {
  id: string
  userId: string
  userEmail: string
  amount: number
  destinationCard: string
  fromCardLast4: string
  trackingCode: string
  receiptImageUrl: string
  purpose: "wallet_deposit" | "raffle_ticket_purchase" | "raffle_combo_purchase" | "showroom_order" | "other"
  status: "pending" | "approved" | "rejected"
  reviewNote?: string
  createdAt: string
  updatedAt: string
}

type Summary = {
  monthlySales: number
  activeUsers: number
  soldTickets: number
  pendingWithdrawals: number
}

type OnlineGateway = {
  id: string
  code: string
  provider: string
  displayName: string
  enabled: boolean
  sandbox: boolean
  priority: number
  checkoutUrl?: string
  verifyUrl?: string
  callbackUrl?: string
  merchantId?: string
  apiKey?: string
  apiSecret?: string
  publicKey?: string
  privateKey?: string
  webhookSecret?: string
  minAmountIrr?: number
  maxAmountIrr?: number
  feePercent?: number
  feeFixedIrr?: number
  description?: string
  createdAt: string
  updatedAt: string
}

type PaymentConfig = {
  cardToCard: {
    enabled: boolean
    destinationCard: string
  }
  onlineGateways: OnlineGateway[]
  defaultOnlineGatewayId?: string
  updatedAt: string
}

const purposeLabel: Record<string, string> = {
  wallet_deposit: "شارژ کیف پول",
  raffle_ticket_purchase: "خرید بلیط قرعه‌کشی",
  raffle_combo_purchase: "خرید پکیج قرعه‌کشی",
  showroom_order: "خرید خودرو",
  other: "سایر",
}

const statusConfig = {
  pending: { label: "در انتظار", cls: "bg-amber-500/15 text-amber-400 border border-amber-500/30", icon: Clock },
  completed: { label: "تکمیل شده", cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", icon: CheckCircle },
  approved: { label: "تایید شده", cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", icon: CheckCircle },
  rejected: { label: "رد شده", cls: "bg-red-500/15 text-red-400 border border-red-500/30", icon: XCircle },
}

type Tab = "overview" | "withdrawals" | "card-to-card" | "settings"

export default function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [payments, setPayments] = useState<CardToCardPayment[]>([])
  const [destinationCard, setDestinationCard] = useState("")
  const [summary, setSummary] = useState<Summary | null>(null)
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null)

  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [receiptModal, setReceiptModal] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState("")
  const [reviewTarget, setReviewTarget] = useState<{ id: string; action: "approve" | "reject" } | null>(null)

  const [paymentFilter, setPaymentFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [withdrawalFilter, setWithdrawalFilter] = useState<"all" | "pending" | "completed" | "rejected">("all")

  const [cardDestinationInput, setCardDestinationInput] = useState("")
  const [cardEnabled, setCardEnabled] = useState(true)
  const [savingCardSettings, setSavingCardSettings] = useState(false)

  const [gatewayBusyId, setGatewayBusyId] = useState<string | null>(null)
  const [creatingGateway, setCreatingGateway] = useState(false)
  const [newGateway, setNewGateway] = useState({
    code: "",
    provider: "",
    displayName: "",
    enabled: true,
    sandbox: true,
    priority: 100,
    checkoutUrl: "",
    verifyUrl: "",
    callbackUrl: "",
    merchantId: "",
    apiKey: "",
    apiSecret: "",
  })

  async function loadAll() {
    setLoading(true)
    try {
      const [w, c, s, p] = await Promise.all([
        apiRequest<{ items: Withdrawal[] }>("/admin/finance/withdrawals"),
        apiRequest<{ items: CardToCardPayment[]; destinationCard: string }>("/admin/finance/card-to-card-payments"),
        apiRequest<Summary>("/admin/dashboard/summary"),
        apiRequest<{ paymentConfig: PaymentConfig }>("/admin/finance/payment-settings"),
      ])
      setWithdrawals(w.items ?? [])
      setPayments(c.items ?? [])
      setDestinationCard(c.destinationCard ?? "")
      setSummary(s)
      setPaymentConfig(p.paymentConfig)
      setCardDestinationInput(p.paymentConfig.cardToCard.destinationCard)
      setCardEnabled(p.paymentConfig.cardToCard.enabled)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت اطلاعات مالی")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  async function doWithdrawalAction(id: string, action: "approve" | "reject") {
    setActionId(id)
    try {
      await apiRequest(`/admin/finance/withdrawals/${id}/${action === "approve" ? "approve" : "reject"}`, { method: "POST" })
      toast.success(action === "approve" ? "برداشت تایید شد" : "برداشت رد شد")
      await loadAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "عملیات ناموفق بود")
    } finally {
      setActionId(null)
    }
  }

  async function doCardAction(id: string, action: "approve" | "reject") {
    setActionId(id)
    try {
      await apiRequest(`/admin/finance/card-to-card-payments/${id}/${action === "approve" ? "approve" : "reject"}`, {
        method: "POST",
        body: JSON.stringify({ note: reviewNote.trim() || undefined }),
      })
      toast.success(action === "approve" ? "پرداخت تایید شد" : "پرداخت رد شد")
      setReviewTarget(null)
      setReviewNote("")
      await loadAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "عملیات ناموفق بود")
    } finally {
      setActionId(null)
    }
  }

  async function saveCardToCardSettings() {
    setSavingCardSettings(true)
    try {
      const data = await apiRequest<{ paymentConfig: PaymentConfig }>("/admin/finance/payment-settings/card-to-card", {
        method: "PUT",
        body: JSON.stringify({ destinationCard: cardDestinationInput.trim(), enabled: cardEnabled }),
      })
      setPaymentConfig(data.paymentConfig)
      setDestinationCard(data.paymentConfig.cardToCard.destinationCard)
      toast.success("تنظیمات کارت‌به‌کارت ذخیره شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ذخیره تنظیمات ناموفق بود")
    } finally {
      setSavingCardSettings(false)
    }
  }

  async function addGateway() {
    if (!newGateway.code.trim() || !newGateway.provider.trim() || !newGateway.displayName.trim()) {
      toast.error("کد، ارائه‌دهنده و نام نمایشی الزامی است")
      return
    }
    setCreatingGateway(true)
    try {
      const data = await apiRequest<{ paymentConfig: PaymentConfig }>("/admin/finance/payment-settings/gateways", {
        method: "POST",
        body: JSON.stringify({
          code: newGateway.code.trim(),
          provider: newGateway.provider.trim(),
          displayName: newGateway.displayName.trim(),
          enabled: newGateway.enabled,
          sandbox: newGateway.sandbox,
          priority: Number(newGateway.priority || 100),
          checkoutUrl: newGateway.checkoutUrl.trim() || undefined,
          verifyUrl: newGateway.verifyUrl.trim() || undefined,
          callbackUrl: newGateway.callbackUrl.trim() || undefined,
          merchantId: newGateway.merchantId.trim() || undefined,
          apiKey: newGateway.apiKey.trim() || undefined,
          apiSecret: newGateway.apiSecret.trim() || undefined,
        }),
      })
      setPaymentConfig(data.paymentConfig)
      setNewGateway({
        code: "",
        provider: "",
        displayName: "",
        enabled: true,
        sandbox: true,
        priority: 100,
        checkoutUrl: "",
        verifyUrl: "",
        callbackUrl: "",
        merchantId: "",
        apiKey: "",
        apiSecret: "",
      })
      toast.success("درگاه جدید اضافه شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "افزودن درگاه ناموفق بود")
    } finally {
      setCreatingGateway(false)
    }
  }

  function updateGatewayLocal(id: string, patch: Partial<OnlineGateway>) {
    setPaymentConfig((prev) => {
      if (!prev) return prev
      return { ...prev, onlineGateways: prev.onlineGateways.map((g) => (g.id === id ? { ...g, ...patch } : g)) }
    })
  }

  async function saveGateway(id: string) {
    if (!paymentConfig) return
    const g = paymentConfig.onlineGateways.find((item) => item.id === id)
    if (!g) return
    setGatewayBusyId(id)
    try {
      const data = await apiRequest<{ paymentConfig: PaymentConfig }>(`/admin/finance/payment-settings/gateways/${id}`, {
        method: "PUT",
        body: JSON.stringify(g),
      })
      setPaymentConfig(data.paymentConfig)
      toast.success("درگاه به‌روزرسانی شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ذخیره درگاه ناموفق بود")
    } finally {
      setGatewayBusyId(null)
    }
  }

  async function deleteGateway(id: string) {
    setGatewayBusyId(id)
    try {
      const data = await apiRequest<{ paymentConfig: PaymentConfig }>(`/admin/finance/payment-settings/gateways/${id}`, { method: "DELETE" })
      setPaymentConfig(data.paymentConfig)
      toast.success("درگاه حذف شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حذف درگاه ناموفق بود")
    } finally {
      setGatewayBusyId(null)
    }
  }

  async function setDefaultGateway(gatewayId?: string) {
    setGatewayBusyId(gatewayId ?? "none")
    try {
      const data = await apiRequest<{ paymentConfig: PaymentConfig }>("/admin/finance/payment-settings/default-gateway", {
        method: "PUT",
        body: JSON.stringify({ gatewayId }),
      })
      setPaymentConfig(data.paymentConfig)
      toast.success("درگاه پیش‌فرض به‌روزرسانی شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعیین درگاه پیش‌فرض ناموفق بود")
    } finally {
      setGatewayBusyId(null)
    }
  }

  const stats = useMemo(() => {
    const pendingW = withdrawals.filter((w) => w.status === "pending")
    const pendingC = payments.filter((p) => p.status === "pending")
    const totalWithdrawalVolume = withdrawals.filter((w) => w.status === "completed").reduce((sum, w) => sum + Math.abs(w.amount), 0)
    const totalCardVolumeApproved = payments.filter((p) => p.status === "approved").reduce((sum, p) => sum + p.amount, 0)
    return { pendingW, pendingC, totalWithdrawalVolume, totalCardVolumeApproved }
  }, [withdrawals, payments])

  const filteredWithdrawals = useMemo(
    () => (withdrawalFilter === "all" ? withdrawals : withdrawals.filter((w) => w.status === withdrawalFilter)),
    [withdrawals, withdrawalFilter],
  )

  const filteredPayments = useMemo(
    () => (paymentFilter === "all" ? payments : payments.filter((p) => p.status === paymentFilter)),
    [payments, paymentFilter],
  )

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "نمای کلی" },
    { id: "withdrawals", label: "برداشت‌ها", count: stats.pendingW.length },
    { id: "card-to-card", label: "کارت‌به‌کارت", count: stats.pendingC.length },
    { id: "settings", label: "تنظیمات پرداخت" },
  ]

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black">مدیریت مالی و درگاه پرداخت</h1>
          <p className="text-white/40 text-sm mt-1">مدیریت برداشت، پرداخت‌های کارت‌به‌کارت و تنظیمات درگاه آنلاین</p>
        </div>
        <button onClick={() => void loadAll()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          بروزرسانی
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="فروش ماه" value={`${formatToman(summary?.monthlySales ?? 0)} ت`} icon={FileText} />
        <Kpi label="برداشت در انتظار" value={`${stats.pendingW.length.toLocaleString("fa-IR")} مورد`} icon={Clock} />
        <Kpi label="کارت‌به‌کارت در انتظار" value={`${stats.pendingC.length.toLocaleString("fa-IR")} مورد`} icon={CreditCard} />
        <Kpi label="کاربران فعال" value={`${(summary?.activeUsers ?? 0).toLocaleString("fa-IR")} نفر`} icon={Wallet} />
      </div>

      <div className="flex gap-2 border-b border-white/10 pb-3 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === tab.id ? "bg-[#D4AF37] text-black" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
          >
            {tab.label}
            {tab.count ? <span className="mr-2 text-[10px] opacity-70">({tab.count.toLocaleString("fa-IR")})</span> : null}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="bg-[#0C0C0C] border border-[#D4AF37]/20 rounded-2xl p-4">
            <p className="text-sm text-white/60 mb-1">شماره کارت مقصد کارت‌به‌کارت</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-[#D4AF37] text-lg tracking-widest">{destinationCard || "تنظیم نشده"}</p>
              {destinationCard ? (
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(destinationCard)
                    toast.success("کپی شد")
                  }}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/60"
                >
                  <Copy className="w-4 h-4" />
                </button>
              ) : null}
            </div>
            <p className="text-xs text-white/30 mt-2">برای تغییر، از تب «تنظیمات پرداخت» استفاده کنید.</p>
          </div>
        </div>
      )}

      {activeTab === "withdrawals" && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {(["all", "pending", "completed", "rejected"] as const).map((f) => (
              <button key={f} onClick={() => setWithdrawalFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${withdrawalFilter === f ? "bg-[#D4AF37] text-black" : "bg-white/5 text-white/70"}`}>
                {f === "all" ? "همه" : f === "pending" ? "در انتظار" : f === "completed" ? "تکمیل شده" : "رد شده"}
              </button>
            ))}
          </div>
          {filteredWithdrawals.map((w) => {
            const cfg = statusConfig[w.status]
            const Icon = cfg.icon
            return (
              <div key={w.id} className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[180px]">
                  <p className="font-bold">{w.userEmail}</p>
                  <p className="text-xs text-white/40">{new Date(w.createdAt).toLocaleString("fa-IR")}</p>
                </div>
                <p className="font-black text-[#D4AF37]">{formatToman(Math.abs(w.amount))} ت</p>
                <div className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${cfg.cls}`}><Icon className="w-3 h-3" /> {cfg.label}</div>
                {w.status === "pending" ? (
                  <div className="flex gap-2">
                    <button disabled={actionId === w.id} onClick={() => void doWithdrawalAction(w.id, "approve")} className="px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs">تایید</button>
                    <button disabled={actionId === w.id} onClick={() => void doWithdrawalAction(w.id, "reject")} className="px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs">رد</button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === "card-to-card" && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {(["all", "pending", "approved", "rejected"] as const).map((f) => (
              <button key={f} onClick={() => setPaymentFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${paymentFilter === f ? "bg-[#D4AF37] text-black" : "bg-white/5 text-white/70"}`}>
                {f === "all" ? "همه" : f === "pending" ? "در انتظار" : f === "approved" ? "تایید شده" : "رد شده"}
              </button>
            ))}
          </div>

          {filteredPayments.map((p) => {
            const cfg = statusConfig[p.status]
            const Icon = cfg.icon
            return (
              <div key={p.id} className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-bold">{p.userEmail}</p>
                    <p className="text-xs text-white/40">{purposeLabel[p.purpose] ?? p.purpose}</p>
                  </div>
                  <p className="font-black text-[#D4AF37]">{formatToman(p.amount)} ت</p>
                </div>
                <div className="grid sm:grid-cols-3 gap-2 text-sm">
                  <div className="bg-black/30 rounded-xl p-3"><p className="text-xs text-white/40 mb-1">۴ رقم آخر</p><p className="font-mono">{p.fromCardLast4 || "-"}</p></div>
                  <div className="bg-black/30 rounded-xl p-3"><p className="text-xs text-white/40 mb-1">کد پیگیری</p><p className="font-mono break-all">{p.trackingCode || "-"}</p></div>
                  <div className={`rounded-xl p-3 inline-flex items-center justify-center gap-1 ${cfg.cls}`}><Icon className="w-4 h-4" />{cfg.label}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {p.receiptImageUrl ? (
                    <button onClick={() => setReceiptModal(p.receiptImageUrl)} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs inline-flex items-center gap-1"><Eye className="w-3 h-3" />مشاهده رسید</button>
                  ) : null}

                  {p.status === "pending" ? (
                    reviewTarget?.id === p.id ? (
                      <>
                        <input value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="یادداشت (اختیاری)" className="flex-1 min-w-[160px] bg-black/30 border border-white/15 rounded-lg px-3 py-2 text-sm" />
                        <button disabled={actionId === p.id} onClick={() => void doCardAction(p.id, reviewTarget.action)} className="px-3 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-bold">ثبت</button>
                        <button onClick={() => { setReviewTarget(null); setReviewNote("") }} className="px-3 py-2 rounded-lg bg-white/5 text-white/70 text-xs">لغو</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setReviewTarget({ id: p.id, action: "approve" })} className="px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs">تایید</button>
                        <button onClick={() => setReviewTarget({ id: p.id, action: "reject" })} className="px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs">رد</button>
                      </>
                    )
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-4">
          <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-4 space-y-3">
            <h3 className="font-black">تنظیمات کارت‌به‌کارت</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-white/60">شماره کارت مقصد</label>
                <input value={cardDestinationInput} onChange={(e) => setCardDestinationInput(e.target.value)} className="mt-1 w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2 font-mono" />
              </div>
              <label className="inline-flex items-end gap-2 text-sm"><input type="checkbox" checked={cardEnabled} onChange={(e) => setCardEnabled(e.target.checked)} />فعال</label>
            </div>
            <button onClick={() => void saveCardToCardSettings()} disabled={savingCardSettings || !cardDestinationInput.trim()} className="px-4 py-2 rounded-lg bg-[#D4AF37] text-black text-sm font-bold disabled:opacity-60">
              {savingCardSettings ? "در حال ذخیره..." : "ذخیره"}
            </button>
          </div>

          <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-4 space-y-3">
            <h3 className="font-black">درگاه‌های آنلاین</h3>
            {(paymentConfig?.onlineGateways ?? []).map((g) => (
              <div key={g.id} className="border border-white/10 rounded-xl p-3 bg-black/20 space-y-2">
                <div className="grid md:grid-cols-4 gap-2">
                  <input value={g.displayName} onChange={(e) => updateGatewayLocal(g.id, { displayName: e.target.value })} className="bg-black/30 border border-white/15 rounded-lg px-2 py-2 text-xs" placeholder="نام نمایشی" />
                  <input value={g.code} onChange={(e) => updateGatewayLocal(g.id, { code: e.target.value })} className="bg-black/30 border border-white/15 rounded-lg px-2 py-2 text-xs" placeholder="code" />
                  <input value={g.provider} onChange={(e) => updateGatewayLocal(g.id, { provider: e.target.value })} className="bg-black/30 border border-white/15 rounded-lg px-2 py-2 text-xs" placeholder="provider" />
                  <input value={String(g.priority)} onChange={(e) => updateGatewayLocal(g.id, { priority: Number(e.target.value || 0) })} className="bg-black/30 border border-white/15 rounded-lg px-2 py-2 text-xs" placeholder="priority" />
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  <input value={g.checkoutUrl ?? ""} onChange={(e) => updateGatewayLocal(g.id, { checkoutUrl: e.target.value || undefined })} className="bg-black/30 border border-white/15 rounded-lg px-2 py-2 text-xs" placeholder="checkout url" />
                  <input value={g.verifyUrl ?? ""} onChange={(e) => updateGatewayLocal(g.id, { verifyUrl: e.target.value || undefined })} className="bg-black/30 border border-white/15 rounded-lg px-2 py-2 text-xs" placeholder="verify url" />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <label className="text-xs inline-flex items-center gap-1"><input type="checkbox" checked={g.enabled} onChange={(e) => updateGatewayLocal(g.id, { enabled: e.target.checked })} />فعال</label>
                  <label className="text-xs inline-flex items-center gap-1"><input type="checkbox" checked={g.sandbox} onChange={(e) => updateGatewayLocal(g.id, { sandbox: e.target.checked })} />sandbox</label>
                  <button onClick={() => void saveGateway(g.id)} disabled={gatewayBusyId === g.id} className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs">ذخیره</button>
                  <button onClick={() => void setDefaultGateway(g.id)} disabled={gatewayBusyId === g.id} className={`px-3 py-1.5 rounded-lg text-xs border ${paymentConfig?.defaultOnlineGatewayId === g.id ? "bg-[#D4AF37]/20 border-[#D4AF37]/30 text-[#D4AF37]" : "bg-white/5 border-white/10 text-white/70"}`}>
                    پیش‌فرض
                  </button>
                  <button onClick={() => void deleteGateway(g.id)} disabled={gatewayBusyId === g.id} className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs">حذف</button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-4 space-y-3">
            <h3 className="font-black">افزودن درگاه جدید</h3>
            <div className="grid md:grid-cols-3 gap-2">
              <input value={newGateway.displayName} onChange={(e) => setNewGateway((p) => ({ ...p, displayName: e.target.value }))} className="bg-black/30 border border-white/15 rounded-lg px-2 py-2 text-xs" placeholder="نام نمایشی" />
              <input value={newGateway.code} onChange={(e) => setNewGateway((p) => ({ ...p, code: e.target.value }))} className="bg-black/30 border border-white/15 rounded-lg px-2 py-2 text-xs" placeholder="code" />
              <input value={newGateway.provider} onChange={(e) => setNewGateway((p) => ({ ...p, provider: e.target.value }))} className="bg-black/30 border border-white/15 rounded-lg px-2 py-2 text-xs" placeholder="provider" />
            </div>
            <div className="grid md:grid-cols-3 gap-2">
              <input value={newGateway.checkoutUrl} onChange={(e) => setNewGateway((p) => ({ ...p, checkoutUrl: e.target.value }))} className="bg-black/30 border border-white/15 rounded-lg px-2 py-2 text-xs" placeholder="checkout url" />
              <input value={newGateway.verifyUrl} onChange={(e) => setNewGateway((p) => ({ ...p, verifyUrl: e.target.value }))} className="bg-black/30 border border-white/15 rounded-lg px-2 py-2 text-xs" placeholder="verify url" />
              <input value={newGateway.callbackUrl} onChange={(e) => setNewGateway((p) => ({ ...p, callbackUrl: e.target.value }))} className="bg-black/30 border border-white/15 rounded-lg px-2 py-2 text-xs" placeholder="callback url" />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-xs inline-flex items-center gap-1"><input type="checkbox" checked={newGateway.enabled} onChange={(e) => setNewGateway((p) => ({ ...p, enabled: e.target.checked }))} />فعال</label>
              <label className="text-xs inline-flex items-center gap-1"><input type="checkbox" checked={newGateway.sandbox} onChange={(e) => setNewGateway((p) => ({ ...p, sandbox: e.target.checked }))} />sandbox</label>
              <button onClick={() => void addGateway()} disabled={creatingGateway} className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-black text-xs font-bold disabled:opacity-60">
                {creatingGateway ? "در حال ثبت..." : "افزودن درگاه"}
              </button>
              <button onClick={() => void setDefaultGateway(undefined)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs">حذف پیش‌فرض</button>
            </div>
          </div>
        </div>
      )}

      {receiptModal ? (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setReceiptModal(null)}>
          <div className="max-w-lg w-full bg-[#0C0C0C] border border-white/10 rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-black">تصویر رسید</p>
              <button onClick={() => setReceiptModal(null)} className="text-sm text-white/60">بستن</button>
            </div>
            <img src={receiptModal} alt="رسید" className="w-full rounded-xl object-contain max-h-[70vh]" />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Kpi({ label, value, icon: Icon }: { label: string; value: string; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-white/30" />
        <p className="text-white/50 text-xs">{label}</p>
      </div>
      <p className="font-black text-lg text-[#D4AF37]">{value}</p>
    </div>
  )
}
