"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Ticket, Clock, ChevronDown, Layers, Zap, Trophy, Hash } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { formatToman } from "@/lib/money"

type TicketRow = {
  id: string
  source?: "raffle_ticket" | "slide_draw_ticket"
  raffleTitle: string
  raffleId?: string
  index: number
  slideNumber?: number
  pricePaid: number
  raffleStatus: string
  createdAt: string
}

type TicketGroup = {
  key: string
  source: "raffle_ticket" | "slide_draw_ticket"
  raffleId: string
  raffleTitle: string
  raffleStatus: string
  tickets: TicketRow[]
  totalPaid: number
  createdAt: string
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  open:       { label: "باز",          color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  closed:     { label: "بسته شده",     color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  drawn:      { label: "قرعه زده شده", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  draft:      { label: "پیش‌نویس",     color: "bg-white/10 text-white/50 border-white/10" },
  scheduled:  { label: "زمان‌بندی",    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  processing: { label: "در حال قرعه",  color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  cancelled:  { label: "لغو شده",      color: "bg-red-500/20 text-red-300 border-red-500/30" },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: "bg-white/10 text-white/60 border-white/10" }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${s.color}`}>
      {s.label}
    </span>
  )
}

function GroupCard({ group, index }: { group: TicketGroup; index: number }) {
  const [open, setOpen] = useState(false)
  const isRaffle = group.source === "raffle_ticket"
  const slideNumbers = group.tickets.map((t) => t.slideNumber).filter(Boolean) as number[]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`rounded-[1.6rem] border overflow-hidden transition-colors ${
        isRaffle
          ? "border-amber-500/20 bg-gradient-to-b from-[#0f0c00] to-[#0A0A0A]"
          : "border-cyan-500/20 bg-gradient-to-b from-[#000d12] to-[#0A0A0A]"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-right p-5 md:p-6 flex items-start gap-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
          isRaffle ? "bg-amber-500/10 text-amber-400" : "bg-cyan-500/10 text-cyan-400"
        }`}>
          {isRaffle ? <Ticket className="w-7 h-7" /> : <Zap className="w-7 h-7" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="text-base md:text-lg font-black text-white truncate">{group.raffleTitle}</h3>
            <StatusBadge status={group.raffleStatus} />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-white/50">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold ${
              isRaffle ? "bg-amber-500/10 text-amber-300" : "bg-cyan-500/10 text-cyan-300"
            }`}>
              <Layers size={12} />
              {group.tickets.length.toLocaleString("fa-IR")} بلیط
            </span>
            {group.totalPaid > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5">
                {formatToman(group.totalPaid)} تومان
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5">
              <Clock size={11} />
              {new Date(group.createdAt).toLocaleDateString("fa-IR")}
            </span>
          </div>
          {isRaffle && slideNumbers.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {slideNumbers.slice(0, 6).map((n) => (
                <span key={n} className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-200">
                  {n.toLocaleString("fa-IR")}
                </span>
              ))}
              {slideNumbers.length > 6 && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-white/40">
                  +{(slideNumbers.length - 6).toLocaleString("fa-IR")} بیشتر
                </span>
              )}
            </div>
          )}
        </div>

        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 transition-colors ${
          open ? "bg-white/10" : "bg-white/5"
        }`}>
          <ChevronDown size={16} className={`text-white/60 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 md:px-6 pb-5 border-t border-white/5 pt-4">
              <p className="text-[11px] text-white/30 uppercase tracking-widest mb-3">جزئیات بلیط‌ها</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {group.tickets.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 rounded-xl p-3 border ${
                      isRaffle
                        ? "bg-amber-500/5 border-amber-500/10"
                        : "bg-cyan-500/5 border-cyan-500/10"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                      isRaffle ? "bg-amber-500/15 text-amber-400" : "bg-cyan-500/15 text-cyan-400"
                    }`}>
                      {t.index.toLocaleString("fa-IR")}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-white/70 font-bold">بلیط #{t.index.toLocaleString("fa-IR")}</div>
                      {isRaffle && t.slideNumber && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Hash size={10} className="text-amber-400 shrink-0" />
                          <span className="font-mono text-[11px] text-amber-300 font-bold">
                            {t.slideNumber.toLocaleString("fa-IR")}
                          </span>
                        </div>
                      )}
                      {t.pricePaid > 0 && (
                        <div className="text-[10px] text-white/30">{formatToman(t.pricePaid)} ت</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [activeTab, setActiveTab] = useState<"raffle_ticket" | "slide_draw_ticket">("raffle_ticket")

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

  const groups = useMemo<TicketGroup[]>(() => {
    const map = new Map<string, TicketGroup>()
    for (const t of tickets) {
      const src = t.source ?? "raffle_ticket"
      const rid = t.raffleId ?? t.id
      const key = `${src}::${rid}`
      if (!map.has(key)) {
        map.set(key, {
          key,
          source: src as "raffle_ticket" | "slide_draw_ticket",
          raffleId: rid,
          raffleTitle: t.raffleTitle,
          raffleStatus: t.raffleStatus,
          tickets: [],
          totalPaid: 0,
          createdAt: t.createdAt,
        })
      }
      const g = map.get(key)!
      g.tickets.push(t)
      g.totalPaid += t.pricePaid
      if (t.createdAt > g.createdAt) g.createdAt = t.createdAt
    }
    return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [tickets])

  const raffleGroups = groups.filter((g) => g.source === "raffle_ticket")
  const slideGroups  = groups.filter((g) => g.source === "slide_draw_ticket")
  const shown = activeTab === "raffle_ticket" ? raffleGroups : slideGroups

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">
          بلیط‌های <span className="text-accent-gold">من</span>
        </h1>
        <p className="text-white/40 text-sm">تمام بلیط‌های خریداری شده — دسته‌بندی بر اساس قرعه‌کشی</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "بلیط قرعه‌کشی",  value: raffleGroups.reduce((s, g) => s + g.tickets.length, 0), color: "text-amber-400" },
          { label: "قرعه‌کشی‌ها",     value: raffleGroups.length,  color: "text-amber-400" },
          { label: "بلیط ماشین اسلاید", value: slideGroups.reduce((s, g)  => s + g.tickets.length, 0), color: "text-cyan-400" },
          { label: "قرعه‌های اسلاید", value: slideGroups.length,   color: "text-cyan-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value.toLocaleString("fa-IR")}</p>
            <p className="text-[11px] text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit">
        {(["raffle_ticket", "slide_draw_ticket"] as const).map((tab) => {
          const count = (tab === "raffle_ticket" ? raffleGroups : slideGroups).reduce((s, g) => s + g.tickets.length, 0)
          const label = tab === "raffle_ticket" ? "قرعه‌کشی" : "ماشین اسلاید"
          const active = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                active
                  ? tab === "raffle_ticket"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {tab === "raffle_ticket" ? <Ticket size={15} /> : <Zap size={15} />}
              {label}
              {count > 0 && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  active
                    ? tab === "raffle_ticket" ? "bg-amber-500/30" : "bg-cyan-500/30"
                    : "bg-white/10"
                }`}>
                  {count.toLocaleString("fa-IR")}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      {shown.length === 0 ? (
        <div className="text-center py-20 text-white/30 space-y-3">
          <Trophy size={48} className="mx-auto opacity-20" />
          <p className="text-lg font-bold">هنوز بلیطی در این بخش ندارید</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map((group, i) => (
            <GroupCard key={group.key} group={group} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
