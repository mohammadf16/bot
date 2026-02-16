"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Ticket, Clock } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"

type TicketRow = {
  id: string
  raffleTitle: string
  index: number
  pricePaid: number
  raffleStatus: string
  createdAt: string
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiRequest<{ items: TicketRow[] }>("/me/tickets")
        setTickets(data.items)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "خطا در دریافت بلیط‌ها")
      }
    })()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">بلیط‌های <span className="text-accent-gold">من</span></h1>
        <p className="text-white/40 text-sm">لیست تمام بلیط‌های خریداری شده و وضعیت آنها</p>
      </div>

      <div className="grid gap-4">
        {tickets.map((ticket, i) => (
          <motion.div key={ticket.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl bg-accent-gold/10 text-accent-gold">
                <Ticket className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">{ticket.raffleTitle}</h3>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span className="bg-white/5 px-2 py-1 rounded-lg">کد: {ticket.id}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleString("fa-IR")}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between w-full md:w-auto gap-8">
              <div className="text-right">
                <p className="text-xs text-white/40 mb-1">مبلغ پرداختی</p>
                <p className="font-bold">{ticket.pricePaid.toLocaleString("fa-IR")} <span className="text-[10px] opacity-50">تومان</span></p>
              </div>
              <div className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 text-white">{ticket.raffleStatus}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
