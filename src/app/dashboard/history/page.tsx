"use client"

import { ArrowDownLeft, ArrowUpRight, Search, Filter } from "lucide-react"

export default function HistoryPage() {
  const transactions = [
    { type: "deposit", amount: "۱۲,۰۰۰,۰۰۰", date: "۲۸ بهمن ۱۴۰۲", status: "success", id: "TRX-882910" },
    { type: "withdraw", amount: "۵,۰۰۰,۰۰۰", date: "۲۵ بهمن ۱۴۰۲", status: "pending", id: "TRX-772190" },
    { type: "payment", amount: "۱,۵۰۰,۰۰۰", date: "۲۰ بهمن ۱۴۰۲", status: "success", id: "TRX-332109", desc: "خرید بلیط Audi R8" },
    { type: "deposit", amount: "۱۰,۰۰۰,۰۰۰", date: "۱۵ بهمن ۱۴۰۲", status: "failed", id: "TRX-112903" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">تاریخچه <span className="text-accent-gold">تراکنش‌ها</span></h1>
          <p className="text-white/40 text-sm">لیست کامل واریزها، برداشت‌ها و پرداخت‌های شما</p>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-[#0A0A0A] border border-white/5 rounded-xl flex items-center px-4 py-2.5 w-full md:w-64">
            <Search className="w-4 h-4 text-white/30 ml-2" />
            <input type="text" placeholder="جستجو در تراکنش‌ها..." className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          <button className="bg-[#0A0A0A] border border-white/5 hover:bg-white/5 w-10 h-10 rounded-xl flex items-center justify-center transition-colors">
            <Filter className="w-4 h-4" />
          </button>
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
              {transactions.map((tx, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center 
                        ${tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 
                          tx.type === 'withdraw' ? 'bg-rose-500/10 text-rose-500' : 
                          'bg-accent-gold/10 text-accent-gold'}
                      `}>
                        {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : 
                         tx.type === 'withdraw' ? <ArrowUpRight className="w-5 h-5" /> :
                         <ArrowUpRight className="w-5 h-5 rotate-45" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">
                          {tx.type === 'deposit' ? 'افزایش موجودی' : 
                           tx.type === 'withdraw' ? 'برداشت وجه' : 
                           'پرداخت بابت بلیط'}
                        </p>
                        {tx.desc && <p className="text-[10px] text-white/30">{tx.desc}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-6 font-mono text-sm opacity-50">{tx.id}</td>
                  <td className="p-6 text-sm font-bold">{tx.date}</td>
                  <td className="p-6 text-sm font-black">{tx.amount}</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold
                      ${tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 
                        tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                        'bg-rose-500/10 text-rose-500'}
                    `}>
                      {tx.status === 'success' ? 'موفق' : 
                       tx.status === 'pending' ? 'در حال پردازش' : 
                       'ناموفق'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
