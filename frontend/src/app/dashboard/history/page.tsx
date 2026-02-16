"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, Search } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"

type Tx = {
  id: string
  type: "deposit" | "withdraw_request" | "ticket_purchase" | "cashback" | "admin_adjustment"
  amount: number
  status: "pending" | "completed" | "rejected"
  createdAt: string
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [query, setQuery] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiRequest<{ items: Tx[] }>("/me/history")
        setTransactions(data.items)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "خطا در دریافت تاریخچه")
      }
    })()
  }, [])

  const filtered = useMemo(
    () => transactions.filter((t) => t.type.includes(query) || t.id.includes(query)),
    [transactions, query],
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">تاریخچه <span className="text-accent-gold">تراکنش‌ها</span></h1>
          <p className="text-white/40 text-sm">لیست کامل واریزها، برداشت‌ها و پرداخت‌های شما</p>
        </div>
        <div className="bg-[#0A0A0A] border border-white/5 rounded-xl flex items-center px-4 py-2.5 w-full md:w-64">
          <Search className="w-4 h-4 text-white/30 ml-2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} type="text" placeholder="جستجو..." className="bg-transparent border-none outline-none text-sm w-full" />
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 text-right">
              <tr>
                <th className="p-6 text-xs text-white/40 font-bold uppercase tracking-wider">نوع تراکنش</th>
                <th className="p-6 text-xs text-white/40 font-bold uppercase tracking-wider">شناسه</th>
                <th className="p-6 text-xs text-white/40 font-bold uppercase tracking-wider">تاریخ</th>
                <th className="p-6 text-xs text-white/40 font-bold uppercase tracking-wider">مبلغ (تومان)</th>
                <th className="p-6 text-xs text-white/40 font-bold uppercase tracking-wider">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.amount >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                        {tx.amount >= 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <p className="font-bold text-sm">{tx.type}</p>
                    </div>
                  </td>
                  <td className="p-6 font-mono text-sm opacity-50">{tx.id}</td>
                  <td className="p-6 text-sm font-bold">{new Date(tx.createdAt).toLocaleString("fa-IR")}</td>
                  <td className="p-6 text-sm font-black">{tx.amount.toLocaleString("fa-IR")}</td>
                  <td className="p-6">{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
