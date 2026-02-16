"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest, getAccessToken } from "@/lib/api"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/api/v1/live"

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
  gameDifficulty?: number
  risk?: {
    suspiciousUsers?: Array<{ userId: string; score: number }>
  }
  recentEvents: LiveEvent[]
}

export default function AdminLivePage() {
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [signals, setSignals] = useState<RiskSignal[]>([])

  async function loadAll() {
    try {
      const [m, rs] = await Promise.all([
        apiRequest<Metrics>("/admin/live/metrics"),
        apiRequest<{ items: RiskSignal[] }>("/admin/risk/signals"),
      ])
      setMetrics(m)
      setSignals(rs.items)
      setEvents(m.recentEvents ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در مانیتورینگ")
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    const socket = new WebSocket(token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL)
    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)
    socket.onerror = () => setConnected(false)
    socket.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as { type: string; payload: unknown }
        if (msg.type === "event") setEvents((prev) => [msg.payload as LiveEvent, ...prev].slice(0, 200))
      } catch {
        // noop
      }
    }
    return () => socket.close()
  }, [])

  async function runRiskScan() {
    try {
      await apiRequest("/admin/risk/scan", { method: "POST" })
      toast.success("اسکن تقلب انجام شد")
      await loadAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "اسکن ناموفق بود")
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      <h1 className="text-4xl font-bold">مانیتورینگ و مدیریت ریسک</h1>

      <section className="grid md:grid-cols-4 gap-4">
        <div className="card glass p-4">وب سوکت: {connected ? "متصل" : "قطع"}</div>
        <div className="card glass p-4">کاربران: {metrics?.users ?? 0}</div>
        <div className="card glass p-4">برداشت در انتظار: {metrics?.pendingWithdrawals ?? 0}</div>
        <div className="card glass p-4">سختی بازی: {metrics?.gameDifficulty ?? "-"}</div>
      </section>

      <section className="card glass p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-black">سیگنال های ضدتقلب</h2>
          <button onClick={runRiskScan} className="btn-primary">اجرای اسکن</button>
        </div>
        <div className="space-y-2">
          {signals.map((s) => (
            <div key={s.id} className="p-3 rounded-lg border border-white/10 bg-black/20 text-sm">
              <p>{s.signalType} - {s.severity} - score:{s.score}</p>
              <p className="text-white/60">{new Date(s.createdAt).toLocaleString("fa-IR")}</p>
            </div>
          ))}
          {!signals.length ? <p className="text-white/60">سیگنال ریسکی ثبت نشده است.</p> : null}
        </div>
      </section>

      <section className="card glass p-6">
        <h2 className="text-2xl font-black mb-3">رویدادهای لحظه ای</h2>
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {events.map((e) => (
            <div key={e.id} className="p-3 rounded-lg border border-white/10 bg-black/20 text-sm">
              <p>{e.type} - {e.message}</p>
              <p className="text-white/60">{new Date(e.createdAt).toLocaleString("fa-IR")}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
