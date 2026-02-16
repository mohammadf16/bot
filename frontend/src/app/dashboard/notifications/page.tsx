"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"

type NotificationItem = {
  id: string
  title: string
  body?: string
  kind: "info" | "success" | "warning"
  readAt?: string
  createdAt: string
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const data = await apiRequest<{ items: NotificationItem[]; unreadCount: number }>("/me/notifications", { method: "GET" })
      setItems(data.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت اعلان ها")
    } finally {
      setLoading(false)
    }
  }

  async function markOneRead(notificationId: string) {
    try {
      await apiRequest(`/me/notifications/${notificationId}/read`, { method: "POST" })
      setItems((prev) => prev.map((n) => (n.id === notificationId ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در بروزرسانی اعلان")
    }
  }

  async function markAllRead() {
    try {
      await apiRequest("/me/notifications/read-all", { method: "POST" })
      const now = new Date().toISOString()
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در خواندن همه اعلان ها")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black">اعلان ها</h1>
        <button onClick={() => void markAllRead()} className="btn-secondary text-xs px-4 py-2">
          خواندن همه
        </button>
      </div>

      {loading ? (
        <p className="text-white/50 text-sm">در حال بارگذاری...</p>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                if (!n.readAt) void markOneRead(n.id)
              }}
              className={`w-full text-right p-4 rounded-2xl border transition ${
                n.readAt ? "bg-white/5 border-white/10" : "bg-[#D4AF37]/10 border-[#D4AF37]/30"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold">{n.title}</p>
                <span className="text-[10px] text-white/40">{new Date(n.createdAt).toLocaleString("fa-IR")}</span>
              </div>
              {n.body ? <p className="text-xs text-white/65 mt-2">{n.body}</p> : null}
            </button>
          ))}
          {!items.length ? <p className="text-sm text-white/50">اعلانی ندارید.</p> : null}
        </div>
      )}
    </div>
  )
}
