"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest, getAccessToken } from "@/lib/api"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/api/v1/live"

type Ticket = {
  id: string
  category: "finance" | "security" | "account" | "lottery" | "other"
  priority: "low" | "medium" | "high" | "critical"
  status: "open" | "in_progress" | "resolved" | "closed"
  subject: string
  createdAt: string
}

type Message = {
  id: string
  senderRole: "user" | "admin" | "system"
  body: string
  createdAt: string
}

export default function DashboardSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [category, setCategory] = useState<Ticket["category"]>("finance")
  const [priority, setPriority] = useState<Ticket["priority"]>("medium")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [selectedId, setSelectedId] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [replyBody, setReplyBody] = useState("")

  async function load() {
    try {
      const data = await apiRequest<{ items: Ticket[] }>("/support/tickets")
      setTickets(data.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت تیکت ها")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    const socket = new WebSocket(token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL)
    socket.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as { type: string; payload: { type?: string; data?: { ticketId?: string } } }
        if (msg.type !== "event") return
        const evtType = msg.payload?.type
        if (evtType !== "support.ticket" && evtType !== "support.reply") return
        void load()
        if (selectedId && (!msg.payload?.data?.ticketId || msg.payload.data.ticketId === selectedId)) {
          void loadMessages(selectedId)
        }
      } catch {
        // noop
      }
    }
    return () => socket.close()
  }, [selectedId])

  async function createTicket() {
    if (!subject.trim() || !body.trim()) return toast.error("عنوان و متن لازم است")
    try {
      await apiRequest("/support/tickets", {
        method: "POST",
        body: JSON.stringify({ category, priority, subject, body }),
      })
      setSubject("")
      setBody("")
      toast.success("تیکت ثبت شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت تیکت ناموفق بود")
    }
  }

  async function loadMessages(ticketId: string) {
    try {
      const data = await apiRequest<{ items: Message[] }>(`/support/tickets/${ticketId}/messages`)
      setMessages(data.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت پیام‌های تیکت")
    }
  }

  async function sendReply() {
    if (!selectedId || !replyBody.trim()) return
    try {
      await apiRequest(`/support/tickets/${selectedId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: replyBody }),
      })
      setReplyBody("")
      await loadMessages(selectedId)
      await load()
      toast.success("پیام شما ثبت شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ارسال پیام ناموفق بود")
    }
  }

  return (
    <main className="min-h-screen pt-28 pb-16" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <section className="card glass p-8">
          <h1 className="text-3xl font-black mb-3">تیکتینگ پشتیبانی</h1>
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2">
              <option value="finance">مالی</option>
              <option value="security">امنیت</option>
              <option value="account">حساب کاربری</option>
              <option value="lottery">قرعه کشی</option>
              <option value="other">سایر</option>
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2">
              <option value="low">کم</option>
              <option value="medium">متوسط</option>
              <option value="high">زیاد</option>
              <option value="critical">بحرانی</option>
            </select>
          </div>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="عنوان" className="w-full bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2 mb-3" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="شرح مشکل" className="w-full min-h-[120px] bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2 mb-3" />
          <button onClick={createTicket} className="btn-primary">ثبت تیکت</button>
        </section>

        <section className="card glass p-6">
          <h2 className="text-2xl font-black mb-3">تیکت های من</h2>
          <div className="space-y-2">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedId(t.id)
                  void loadMessages(t.id)
                }}
                className={`w-full text-right p-3 rounded-lg border text-sm ${selectedId === t.id ? "border-accent-gold bg-accent-gold/10" : "border-white/10 bg-black/20"}`}
              >
                <p>{t.subject}</p>
                <p className="text-white/60">{t.category} | {t.priority} | {t.status}</p>
              </button>
            ))}
            {!tickets.length ? <p className="text-white/60">تیکتی ثبت نشده است.</p> : null}
          </div>
        </section>

        {selectedId ? (
          <section className="card glass p-6">
            <h2 className="text-2xl font-black mb-3">گفتگو با پشتیبانی</h2>
            <div className="space-y-2 max-h-72 overflow-y-auto mb-3">
              {messages.map((m) => (
                <div key={m.id} className={`p-3 rounded-lg border text-sm ${m.senderRole === "admin" ? "border-cyan-500/25 bg-cyan-500/10" : "border-white/10 bg-black/20"}`}>
                  <p className="text-xs text-white/60 mb-1">{m.senderRole} | {new Date(m.createdAt).toLocaleString("fa-IR")}</p>
                  <p>{m.body}</p>
                </div>
              ))}
              {!messages.length ? <p className="text-white/60">هنوز پیامی ثبت نشده است.</p> : null}
            </div>
            <div className="flex gap-2">
              <input value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="پیام جدید..." className="flex-1 bg-dark-bg/50 border border-dark-border rounded-xl px-3 py-2" />
              <button onClick={sendReply} className="btn-primary">ارسال</button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
