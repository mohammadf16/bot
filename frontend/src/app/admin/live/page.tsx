"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Wifi,
  WifiOff,
  RefreshCw,
  ShieldAlert,
  Zap,
  Users,
  Ticket,
  Trophy,
  Wallet,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
} from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest, getAccessToken, LIVE_WS_URL } from "@/lib/api"

const WS_URL = LIVE_WS_URL

type LiveEvent = {
  id: string
  type: string
  level: "info" | "warning" | "success"
  message: string
  createdAt: string
}

type RiskSignal = {
  id: string
  signalType: string
  severity: "low" | "medium" | "high" | "critical"
  score: number
  details?: Record<string, unknown>
  createdAt: string
}

type Metrics = {
  users: number
  tickets: number
  openRaffles: number
  closedRaffles: number
  pendingWithdrawals: number
  slideSingleMode?: string
  risk?: {
    suspiciousUsers?: Array<{ userId: string; score: number }>
  }
  recentEvents: LiveEvent[]
}

const severityConfig = {
  low: { label: "کم", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30", dot: "bg-blue-400" },
  medium: { label: "متوسط", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  high: { label: "بالا", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30", dot: "bg-orange-400" },
  critical: { label: "بحرانی", cls: "bg-red-500/15 text-red-400 border-red-500/30", dot: "bg-red-400" },
}

const eventLevelConfig = {
  info: { icon: Info, cls: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/5" },
  warning: { icon: AlertTriangle, cls: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/5" },
  success: { icon: CheckCircle, cls: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
}

type Tab = "overview" | "risk" | "events"

export default function AdminLivePage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [signals, setSignals] = useState<RiskSignal[]>([])
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [eventFilter, setEventFilter] = useState<"all" | "info" | "warning" | "success">("all")
  const [severityFilter, setSeverityFilter] = useState<"all" | "low" | "medium" | "high" | "critical">("all")

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [m, rs] = await Promise.all([
        apiRequest<Metrics>("/admin/live/metrics"),
        apiRequest<{ items: RiskSignal[] }>("/admin/risk/signals"),
      ])
      setMetrics(m)
      setSignals(rs.items ?? [])
      setEvents(m.recentEvents ?? [])
      setLastRefresh(new Date())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در مانیتورینگ")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAll()
    const interval = setInterval(() => void loadAll(), 30_000)
    return () => clearInterval(interval)
  }, [loadAll])

  useEffect(() => {
    const token = getAccessToken()
    const socket = new WebSocket(token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL)
    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)
    socket.onerror = () => setConnected(false)
    socket.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as { type: string; payload: unknown }
        if (msg.type === "event") {
          setEvents((prev) => [msg.payload as LiveEvent, ...prev].slice(0, 300))
        }
      } catch {
        // noop
      }
    }
    return () => socket.close()
  }, [])

  async function runRiskScan() {
    setScanning(true)
    try {
      await apiRequest("/admin/risk/scan", { method: "POST" })
      toast.success("اسکن ضدتقلب اجرا شد")
      await loadAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "اسکن ناموفق بود")
    } finally {
      setScanning(false)
    }
  }

  const criticalSignals = signals.filter((s) => s.severity === "critical" || s.severity === "high")
  const filteredSignals = severityFilter === "all" ? signals : signals.filter((s) => s.severity === severityFilter)
  const filteredEvents = eventFilter === "all" ? events : events.filter((e) => e.level === eventFilter)

  const kpis = [
    { label: "کاربران کل", value: (metrics?.users ?? 0).toLocaleString("fa-IR"), icon: Users, color: "text-white" },
    { label: "بلیط صادر شده", value: (metrics?.tickets ?? 0).toLocaleString("fa-IR"), icon: Ticket, color: "text-[#D4AF37]" },
    { label: "قرعه باز", value: (metrics?.openRaffles ?? 0).toLocaleString("fa-IR"), icon: Trophy, color: "text-emerald-400" },
    { label: "قرعه بسته", value: (metrics?.closedRaffles ?? 0).toLocaleString("fa-IR"), icon: Trophy, color: "text-white/40" },
    { label: "برداشت انتظار", value: (metrics?.pendingWithdrawals ?? 0).toLocaleString("fa-IR"), icon: Wallet, color: "text-amber-400" },
    { label: "سیگنال بحرانی", value: criticalSignals.length.toLocaleString("fa-IR"), icon: ShieldAlert, color: criticalSignals.length > 0 ? "text-red-400" : "text-white/40" },
  ]

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "overview", label: "نمای کلی" },
    { id: "risk", label: "سیگنال ریسک", badge: criticalSignals.length },
    { id: "events", label: "رویدادهای زنده", badge: events.filter((e) => e.level === "warning").length },
  ]

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black">مانیتورینگ و مدیریت ریسک</h1>
          <p className="text-white/40 text-sm mt-1">پایش لحظه‌ای سایت، رویدادها و سیگنال‌های تقلب</p>
        </div>
        <div className="flex items-center gap-3">
          {/* WS Indicator */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${connected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connected ? "متصل" : "قطع شده"}
            {connected ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> : null}
          </div>
          <button onClick={() => void loadAll()} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            بروزرسانی
          </button>
        </div>
      </div>

      {lastRefresh ? (
        <p className="text-xs text-white/30">آخرین بروزرسانی: {lastRefresh.toLocaleTimeString("fa-IR")}</p>
      ) : null}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5 text-white/30" />
                <p className="text-[11px] text-white/40">{k.label}</p>
              </div>
              <p className={`font-black text-xl ${k.color}`}>{k.value}</p>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3 flex-wrap">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? "bg-[#D4AF37] text-black" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}>
            {tab.label}
            {tab.badge ? (
              <span className={`mr-2 px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === tab.id ? "bg-black/30 text-black" : "bg-red-500/20 text-red-400"}`}>
                {tab.badge.toLocaleString("fa-IR")}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Slide Mode */}
            <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-4">
              <p className="text-xs text-white/40 mb-2 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" />
                حالت اسلاید
              </p>
              <p className="font-black text-lg">{metrics?.slideSingleMode ?? "fully_random"}</p>
            </div>

            {/* Event summary by level */}
            <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-4">
              <p className="text-xs text-white/40 mb-3 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" />
                خلاصه رویدادها
              </p>
              <div className="space-y-2 text-sm">
                {(["success", "info", "warning"] as const).map((level) => {
                  const count = events.filter((e) => e.level === level).length
                  const cfg = eventLevelConfig[level]
                  const Icon = cfg.icon
                  const labels = { success: "موفق", info: "اطلاعاتی", warning: "هشدار" }
                  return (
                    <div key={level} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${cfg.cls}`} />
                        <span className="text-white/60">{labels[level]}</span>
                      </div>
                      <span className={`font-black ${cfg.cls}`}>{count.toLocaleString("fa-IR")}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Signal summary */}
            <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-4">
              <p className="text-xs text-white/40 mb-3 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                خلاصه سیگنال ریسک
              </p>
              <div className="space-y-2 text-sm">
                {(["critical", "high", "medium", "low"] as const).map((sev) => {
                  const count = signals.filter((s) => s.severity === sev).length
                  const cfg = severityConfig[sev]
                  return (
                    <div key={sev} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <span className="text-white/60">{cfg.label}</span>
                      </div>
                      <span className="font-black">{count.toLocaleString("fa-IR")}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Suspicious users if any */}
          {(metrics?.risk?.suspiciousUsers?.length ?? 0) > 0 ? (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
              <p className="text-sm font-black text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                کاربران مشکوک ({metrics!.risk!.suspiciousUsers!.length.toLocaleString("fa-IR")})
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {metrics!.risk!.suspiciousUsers!.map((u) => (
                  <div key={u.userId} className="flex items-center justify-between bg-black/30 rounded-xl p-3 text-sm">
                    <span className="font-mono text-white/60 truncate max-w-[180px]">{u.userId}</span>
                    <span className="font-black text-red-400">{u.score}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Recent events preview */}
          <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-black text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                آخرین رویدادها
              </p>
              <button onClick={() => setActiveTab("events")} className="text-xs text-[#D4AF37] hover:underline">مشاهده همه</button>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {events.slice(0, 6).map((e) => {
                const cfg = eventLevelConfig[e.level] ?? eventLevelConfig.info
                const Icon = cfg.icon
                return (
                  <div key={e.id} className={`flex items-start gap-3 p-2.5 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                    <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${cfg.cls}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{e.message}</p>
                      <p className="text-[10px] text-white/30">{e.type} · {new Date(e.createdAt).toLocaleTimeString("fa-IR")}</p>
                    </div>
                  </div>
                )
              })}
              {!events.length ? <p className="text-white/40 text-sm p-2">رویدادی ثبت نشده است.</p> : null}
            </div>
          </div>
        </div>
      )}

      {/* Risk Signals Tab */}
      {activeTab === "risk" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {(["all", "critical", "high", "medium", "low"] as const).map((f) => (
                <button key={f} onClick={() => setSeverityFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${severityFilter === f ? "bg-[#D4AF37] text-black" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
                  {f === "all" ? "همه" : severityConfig[f].label}
                  <span className="mr-1 opacity-70">({(f === "all" ? signals : signals.filter((s) => s.severity === f)).length.toLocaleString("fa-IR")})</span>
                </button>
              ))}
            </div>
            <button onClick={() => void runRiskScan()} disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-sm font-bold disabled:opacity-60">
              <ShieldAlert className={`w-4 h-4 ${scanning ? "animate-pulse" : ""}`} />
              {scanning ? "در حال اسکن..." : "اجرای اسکن"}
            </button>
          </div>

          <div className="space-y-3">
            {!filteredSignals.length ? <p className="text-white/40 text-sm py-4">سیگنال ریسکی در این دسته‌بندی ثبت نشده است.</p> : null}
            {filteredSignals.map((s) => {
              const cfg = severityConfig[s.severity] ?? severityConfig.low
              return (
                <div key={s.id} className={`bg-[#0C0C0C] border rounded-2xl p-4 ${cfg.cls} border-opacity-40`}>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                      <p className="font-black text-sm">{s.signalType}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${cfg.cls}`}>{cfg.label}</span>
                    <span className="text-xs text-white/40 mr-auto">امتیاز: {s.score}</span>
                  </div>
                  {s.details && Object.keys(s.details).length > 0 ? (
                    <div className="bg-black/20 rounded-xl p-2 mt-2">
                      <pre className="text-[11px] text-white/50 overflow-x-auto">{JSON.stringify(s.details, null, 2)}</pre>
                    </div>
                  ) : null}
                  <p className="text-[11px] text-white/30 mt-2">{new Date(s.createdAt).toLocaleString("fa-IR")}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Live Events Tab */}
      {activeTab === "events" && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {(["all", "success", "info", "warning"] as const).map((f) => (
              <button key={f} onClick={() => setEventFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${eventFilter === f ? "bg-[#D4AF37] text-black" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
                {f === "all" ? "همه" : f === "success" ? "موفق" : f === "info" ? "اطلاعاتی" : "هشدار"}
                <span className="mr-1 opacity-70">({(f === "all" ? events : events.filter((e) => e.level === f)).length.toLocaleString("fa-IR")})</span>
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {!filteredEvents.length ? <p className="text-white/40 text-sm py-4">رویدادی ثبت نشده است.</p> : null}
            {filteredEvents.map((e) => {
              const cfg = eventLevelConfig[e.level] ?? eventLevelConfig.info
              const Icon = cfg.icon
              return (
                <div key={e.id} className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.cls}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{e.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-white/40 font-mono">{e.type}</span>
                      <span className="text-[11px] text-white/25">·</span>
                      <span className="text-[11px] text-white/30">{new Date(e.createdAt).toLocaleString("fa-IR")}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
