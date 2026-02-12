"use client"

import { motion } from "framer-motion"
import { Ticket, Clock, CheckCircle2, XCircle } from "lucide-react"

export default function TicketsPage() {
  const tickets = [
    { car: "Mercedes-Benz G63", id: "#44219", date: "۲۴ بهمن ۱۴۰۲", status: "active", price: "۵۰۰,۰۰۰" },
    { car: "Porsche 911 Turbo S", id: "#38920", date: "۲۸ بهمن ۱۴۰۲", status: "active", price: "۷۵۰,۰۰۰" },
    { car: "BMW i8 Roadster", id: "#12903", date: "۱۰ دی ۱۴۰۲", status: "lost", price: "۴۰۰,۰۰۰" },
    { car: "Tesla Model S Plaid", id: "#99210", date: "۵ آذر ۱۴۰۲", status: "won", price: "۶۰۰,۰۰۰" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">بلیط‌های <span className="text-accent-gold">من</span></h1>
        <p className="text-white/40 text-sm">لیست تمام بلیط‌های خریداری شده و وضعیت آنها</p>
      </div>

      <div className="grid gap-4">
        {tickets.map((ticket, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-accent-gold/30 transition-all"
          >
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl
                ${ticket.status === 'won' ? 'bg-emerald-500/10 text-emerald-500' : 
                  ticket.status === 'lost' ? 'bg-rose-500/10 text-rose-500' : 
                  'bg-accent-gold/10 text-accent-gold'}
              `}>
                <Ticket className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">{ticket.car}</h3>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span className="bg-white/5 px-2 py-1 rounded-lg">کد: {ticket.id}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ticket.date}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between w-full md:w-auto gap-8">
              <div className="text-right">
                <p className="text-xs text-white/40 mb-1">مبلغ پرداختی</p>
                <p className="font-bold">{ticket.price} <span className="text-[10px] opacity-50">تومان</span></p>
              </div>
              
              <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2
                ${ticket.status === 'won' ? 'bg-emerald-500 text-black' : 
                  ticket.status === 'lost' ? 'bg-rose-500/10 text-rose-500' : 
                  'bg-accent-gold text-black'}
              `}>
                {ticket.status === 'won' ? <>برنده شده <CheckCircle2 className="w-4 h-4" /></> :
                 ticket.status === 'lost' ? <>برنده نشده <XCircle className="w-4 h-4" /></> :
                 <>در انتظار قرعه‌کشی <Clock className="w-4 h-4" /></>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
