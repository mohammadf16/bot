"use client"

import { useMemo, useState, useEffect } from "react"
import { FileJson, Filter, ShieldAlert } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"

type AuditLog = {
  id: string
  actorEmail?: string
  action: string
  target: string
  success: boolean
  ip?: string
  createdAt: string
  payload?: Record<string, unknown>
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [result, setResult] = useState("all")
  const [action, setAction] = useState("all")
  const [selectedId, setSelectedId] = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiRequest<{ items: AuditLog[] }>("/admin/audit", { method: "GET" })
        setLogs(data.items)
        if (data.items[0]) setSelectedId(data.items[0].id)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "خطا در دریافت لاگ‌ها")
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    return logs.filter((row) => {
      const resultOk = result === "all" || (result === "success" ? row.success : !row.success)
      const actionOk = action === "all" || row.action === action
      return resultOk && actionOk
    })
  }, [logs, result, action])

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0]

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h1 className="text-4xl font-bold mb-2">گزارش‌های تغییرات</h1>
        <p className="text-dark-text/60">دریافت مستقیم audit logs از بک‌اند</p>
      </div>

      <section className="card glass p-6">
        <div className="flex items-center gap-2 mb-5">
          <Filter size={18} className="text-accent-gold" />
          <h2 className="text-2xl font-bold">فیلتر لاگ‌ها</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-dark-text/70 mb-2">نتیجه</label>
            <select value={result} onChange={(e) => setResult(e.target.value)} className="w-full bg-dark-bg/50 border border-dark-border/40 rounded-xl px-4 py-3">
              <option value="all">همه</option>
              <option value="success">موفق</option>
              <option value="failed">ناموفق</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-dark-text/70 mb-2">اکشن</label>
            <select value={action} onChange={(e) => setAction(e.target.value)} className="w-full bg-dark-bg/50 border border-dark-border/40 rounded-xl px-4 py-3">
              <option value="all">همه</option>
              {[...new Set(logs.map((l) => l.action))].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid xl:grid-cols-[1.35fr,1fr] gap-6">
        <div className="card glass p-6 overflow-hidden">
          <h2 className="text-2xl font-bold mb-4">لاگ‌های ثبت‌شده</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-dark-text/50 border-b border-dark-border/40">
                  <th className="text-right py-3">شناسه</th>
                  <th className="text-right py-3">زمان</th>
                  <th className="text-right py-3">عامل</th>
                  <th className="text-right py-3">اکشن</th>
                  <th className="text-right py-3">نتیجه</th>
                  <th className="text-right py-3">آی‌پی</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b border-dark-border/20 cursor-pointer ${selected?.id === row.id ? "bg-white/5" : "hover:bg-white/5"}`}
                    onClick={() => setSelectedId(row.id)}
                  >
                    <td className="py-3 font-black">{row.id}</td>
                    <td className="py-3">{new Date(row.createdAt).toLocaleString("fa-IR")}</td>
                    <td className="py-3">{row.actorEmail ?? "-"}</td>
                    <td className="py-3">{row.action}</td>
                    <td className="py-3">{row.success ? "موفق" : "ناموفق"}</td>
                    <td className="py-3">{row.ip ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card glass p-6">
          <h2 className="text-2xl font-bold mb-4">جزئیات رکورد</h2>
          {selected ? (
            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-dark-text/60 mb-1">اکشن / تارگت</p>
                <p className="font-bold">{selected.action}</p>
                <p className="text-sm text-dark-text/70 mt-1">{selected.target}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-dark-text/60 mb-1">Payload</p>
                <pre className="text-xs leading-6 whitespace-pre-wrap break-all text-accent-cyan">{JSON.stringify(selected.payload ?? {}, null, 2)}</pre>
              </div>
              <div className="bg-status-warning/10 border border-status-warning/20 rounded-xl p-4 flex items-start gap-2">
                <ShieldAlert size={16} className="text-status-warning mt-0.5" />
                <p className="text-sm text-status-warning">این خروجی مستقیما از endpoint بک‌اند دریافت می‌شود.</p>
              </div>
            </div>
          ) : (
            <p className="text-dark-text/60">رکوردی برای نمایش وجود ندارد.</p>
          )}
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = "audit-logs.json"
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="btn-secondary mt-4 w-full"
          >
            <FileJson size={18} />
            خروجی JSON
          </button>
        </div>
      </section>
    </div>
  )
}
