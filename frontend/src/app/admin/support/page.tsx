"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest, getAccessToken } from "@/lib/api"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/api/v1/live"

type SupportTicket = {
  id: string
  userId: string
  userEmail: string
  fullName: string
  category: "finance" | "security" | "account" | "lottery" | "other"
  priority: "low" | "medium" | "high" | "critical"
  status: "open" | "in_progress" | "resolved" | "closed"
  subject: string
  createdAt: string
  updatedAt: string
  messagesCount: number
}

type SupportMessage = {
  id: string
  senderRole: "user" | "admin" | "system"
  body: string
  createdAt: string
  senderEmail?: string | null
  senderName?: string | null
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [status, setStatus] = useState<SupportTicket["status"]>("open")
  const [replyBody, setReplyBody] = useState("")

  const selectedTicket = useMemo(() => tickets.find((t) => t.id === selectedId) ?? null, [tickets, selectedId])

  const loadTickets = useCallback(async () => {
    try {
      const data = await apiRequest<{ items: SupportTicket[] }>("/admin/support/tickets")
      setTickets(data.items)
      if (!selectedId && data.items[0]) setSelectedId(data.items[0].id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت تیکت‌ها")
    }
  }, [selectedId])

  async function loadMessages(ticketId: string) {
    try {
      const data = await apiRequest<{ items: SupportMessage[]; ticket: SupportTicket }>(`/admin/support/tickets/${ticketId}/messages`)
      setMessages(data.items)
      setStatus(data.ticket.status)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت پیام‌ها")
    }
  }

  useEffect(() => {
    void loadTickets()
  }, [loadTickets])

  useEffect(() => {
    if (!selectedId) return
    void loadMessages(selectedId)
  }, [selectedId])

  useEffect(() => {
    const token = getAccessToken()
    const socket = new WebSocket(token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL)
    socket.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as { type: string; payload: { type?: string; data?: { ticketId?: string } } }
        if (msg.type !== "event") return
        const evtType = msg.payload?.type
        if (evtType !== "support.ticket" && evtType !== "support.reply") return
        void loadTickets()
        if (selectedId && (!msg.payload?.data?.ticketId || msg.payload.data.ticketId === selectedId)) {
          void loadMessages(selectedId)
        }
      } catch {
        // noop
      }
    }
    return () => socket.close()
  }, [loadTickets, selectedId])

  async function sendReply() {
    if (!selectedId || !replyBody.trim()) return
    try {
      await apiRequest(`/admin/support/tickets/${selectedId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: replyBody }),
      })
      setReplyBody("")
      toast.success("پاسخ ارسال شد")
      await Promise.all([loadTickets(), loadMessages(selectedId)])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ارسال پاسخ ناموفق بود")
    }
  }

  async function updateStatus() {
    if (!selectedId) return
    try {
      await apiRequest(`/admin/support/tickets/${selectedId}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      })
      toast.success("وضعیت تیکت به‌روزرسانی شد")
      await loadTickets()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تغییر وضعیت ناموفق بود")
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-3xl font-black">مدیریت تیکت پشتیبانی</h1>

      <div className="grid lg:grid-cols-3 gap-4">
        <section className="card glass p-4 lg:col-span-1">
          <h2 className="font-black mb-3">لیست تیکت‌ها</h2>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-right p-3 rounded-xl border transition ${
                  selectedId === t.id ? "border-accent-gold bg-accent-gold/10" : "border-white/10 bg-black/20"
                }`}
              >
                <p className="font-bold text-sm">{t.subject}</p>
                <p className="text-xs text-white/60 mt-1">{t.userEmail}</p>
                <p className="text-[11px] text-white/50 mt-1">{t.category} | {t.priority} | {t.status} | پیام: {t.messagesCount}</p>
              </button>
            ))}
            {!tickets.length ? <p className="text-sm text-white/50">تیکتی وجود ندارد.</p> : null}
          </div>
        </section>

        <section className="card glass p-4 lg:col-span-2">
          {selectedTicket ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-black">{selectedTicket.subject}</p>
                  <p className="text-xs text-white/60">{selectedTicket.userEmail} | {selectedTicket.fullName || selectedTicket.userId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={status} onChange={(e) => setStatus(e.target.value as SupportTicket["status"])} className="bg-black/30 border border-white/15 rounded-lg px-3 py-2 text-sm">
                    <option value="open">open</option>
                    <option value="in_progress">in_progress</option>
                    <option value="resolved">resolved</option>
                    <option value="closed">closed</option>
                  </select>
                  <button onClick={updateStatus} className="btn-secondary">ذخیره وضعیت</button>
                </div>
              </div>

              <div className="border border-white/10 rounded-xl p-3 max-h-[45vh] overflow-y-auto space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className={`p-3 rounded-lg border ${m.senderRole === "admin" ? "border-cyan-500/30 bg-cyan-500/10" : "border-white/10 bg-black/25"}`}>
                    <p className="text-xs text-white/60 mb-1">{m.senderRole} | {new Date(m.createdAt).toLocaleString("fa-IR")}</p>
                    <p className="text-sm">{m.body}</p>
                  </div>
                ))}
                {!messages.length ? <p className="text-sm text-white/50">پیامی ثبت نشده است.</p> : null}
              </div>

              <div className="space-y-2">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  className="w-full min-h-[120px] bg-black/30 border border-white/15 rounded-xl p-3"
                  placeholder="پاسخ پشتیبانی..."
                />
                <button onClick={sendReply} className="btn-primary">ارسال پاسخ</button>
              </div>
            </div>
          ) : (
            <p className="text-white/60">یک تیکت را انتخاب کنید.</p>
          )}
        </section>
      </div>
    </div>
  )
}
