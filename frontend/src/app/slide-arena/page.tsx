"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Dice1, Users, Zap, Wallet, Lock, BarChart3 } from "lucide-react"

type SingleToday = {
  date: string
  hasTarget: boolean
  targetNumber?: number
}

type BattleRoom = {
  id: string
  status: "waiting" | "running" | "finished" | "cancelled"
  entryAsset: "CHANCE" | "IRR"
  entryAmount: number
  maxPlayers: number
  siteFeePercent: number
  potAmount: number
  winnerUserId?: string
  players: Array<{ userId: string; rolledNumber?: number; joinedAt: string }>
}

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    waiting: { label: "درانتظار", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    running: { label: "در حال بازی", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    finished: { label: "پایان یافته", color: "bg-green-500/20 text-green-400 border-green-500/30" },
    cancelled: { label: "لغو شده", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  }
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.waiting
  return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>{config.label}</span>
}

export default function SlideArenaPage() {
  const { user, refreshMe } = useAuth()
  const [today, setToday] = useState<SingleToday | null>(null)
  const [singleResult, setSingleResult] = useState<any>(null)
  const [rooms, setRooms] = useState<BattleRoom[]>([])
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"single" | "battle">("single")

  const sortedRooms = useMemo(
    () =>
      [...rooms].sort((a, b) => {
        if (a.status !== b.status) {
          const order = { waiting: 0, running: 1, finished: 2, cancelled: 3 }
          return order[a.status as keyof typeof order] - order[b.status as keyof typeof order]
        }
        return (b.players?.length ?? 0) - (a.players?.length ?? 0)
      }),
    [rooms]
  )

  const load = useCallback(async () => {
    try {
      const [t, r] = await Promise.all([
        apiRequest<SingleToday>("/slide/single/today", { method: "GET" }, { auth: false }),
        apiRequest<{ items: BattleRoom[] }>("/slide/battle/rooms", { method: "GET" }, { auth: false }),
      ])
      setToday(t)
      const safeRooms = Array.isArray(r?.items)
        ? r.items.map((room) => ({
            ...room,
            players: Array.isArray(room.players) ? room.players : [],
          }))
        : []
      setRooms(safeRooms)
      if (user?.id) {
        const myRoom = safeRooms.find((room) => room.players.some((p) => p.userId === user.id))
        setJoinedRoomId(myRoom?.id ?? null)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت اطلاعات")
    }
  }, [user?.id])

  useEffect(() => {
    void load()
    const interval = setInterval(() => void load(), 5000)
    return () => clearInterval(interval)
  }, [load])

  async function spinSingle(stakeType: "chance" | "irr") {
    if (!user) {
      toast.error("لطفا ابتدا وارد شوید")
      return
    }
    setLoading(true)
    try {
      const result = await apiRequest<any>("/slide/single/spin", {
        method: "POST",
        body: JSON.stringify({ stakeType }),
      })
      setSingleResult(result)
      await refreshMe()
      if (result.win) {
        toast.success(`🎉 تبریک! شما برنده شدید!`)
      } else {
        toast.error("این بار خوش شانس نبودی 😔")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "چرخش انجام نشد")
    } finally {
      setLoading(false)
    }
  }

  async function joinBattle(entryAsset: "CHANCE" | "IRR", roomId?: string) {
    if (!user) {
      toast.error("لطفا ابتدا وارد شوید")
      return
    }
    setLoading(true)
    try {
      const joined = await apiRequest<{ roomId: string }>("/slide/battle/join", {
        method: "POST",
        body: JSON.stringify({ roomId, entryAsset, entryAmount: entryAsset === "CHANCE" ? 5 : 10000, maxPlayers: 10 }),
      })
      setJoinedRoomId(joined.roomId)
      await refreshMe()
      await load()
      toast.success("🎮 وارد اتاق شدی!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ورود به اتاق ناموفق بود")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen pt-20 pb-24 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-accent-gold/10 via-transparent to-accent-cyan/10 p-5 sm:p-6 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(251,191,36,0.1)_0%,transparent_50%)] pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="p-2 bg-accent-gold/20 rounded-lg">
                  <Dice1 className="w-5 h-5 sm:w-6 sm:h-6 text-accent-gold" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">اسلاید آرنا</h1>
              </div>
              <p className="text-xs sm:text-sm text-white/60">بازی‌های شانس و قرعه‌کشی</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-3 mb-6 flex-wrap">
          {["single", "battle"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "single" | "battle")}
              className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab
                  ? "bg-accent-gold text-dark-bg shadow-lg shadow-accent-gold/30"
                  : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
              }`}
            >
              {tab === "single" ? <Zap className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              {tab === "single" ? "قرعه روزانه" : "تالار پنج نفر"}
            </button>
          ))}
        </div>

        {/* Single Mode Tab */}
        <AnimatePresence mode="wait">
          {activeTab === "single" && (
            <motion.div key="single" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                {/* Game Section */}
                <div className="lg:col-span-2">
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl p-5 sm:p-6">
                    <div className="mb-5 sm:mb-6">
                      <h2 className="text-lg sm:text-xl font-bold mb-1 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-accent-gold" />
                        قرعه روزانه
                      </h2>
                      <p className="text-xs sm:text-sm text-white/60">رقم هدف را حدس بزنید</p>
                    </div>

                    {/* Target Number */}
                    {today?.hasTarget && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mb-6 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-accent-gold/20 to-accent-cyan/20 border border-accent-gold/30"
                      >
                        <p className="text-white/70 text-xs font-bold mb-2">رقم امروز</p>
                        <p className="text-4xl sm:text-5xl font-black text-accent-gold">
                          {today?.targetNumber ?? "-"}
                        </p>
                      </motion.div>
                    )}

                    {/* Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={loading || !user}
                        onClick={() => spinSingle("chance")}
                        className="px-4 py-3 sm:py-4 bg-gradient-to-r from-accent-gold to-yellow-400 text-dark-bg font-bold rounded-lg shadow-lg shadow-accent-gold/30 hover:shadow-xl disabled:opacity-50 transition-all text-sm sm:text-base"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <Zap className="w-4 h-4" />
                          ۱ سهم شانس
                        </div>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={loading || !user}
                        onClick={() => spinSingle("irr")}
                        className="px-4 py-3 sm:py-4 bg-white/10 text-white font-bold rounded-lg border border-white/20 hover:border-white/40 hover:bg-white/15 disabled:opacity-50 transition-all text-sm sm:text-base"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <Wallet className="w-4 h-4" />
                          ۱۰ هزار تومان
                        </div>
                      </motion.button>
                    </div>

                    {/* Result */}
                    <AnimatePresence>
                      {singleResult && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className={`rounded-lg border p-4 text-sm ${
                            singleResult.win
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-red-500/10 border-red-500/30"
                          }`}
                        >
                          <h3 className="font-bold mb-2 text-sm">
                            {singleResult.win ? "🎉 برنده!" : "😔 باخت"}
                          </h3>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-white/60 mb-1">شما</p>
                              <p className="font-bold text-accent-gold">{singleResult.rolledNumber ?? singleResult.position ?? "-"}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-white/60 mb-1">رقم</p>
                              <p className="font-bold text-accent-cyan">{singleResult.targetNumber ?? today?.targetNumber ?? "-"}</p>
                            </div>
                          </div>

                          {singleResult.reward && (
                            <div className="mt-3 p-2 bg-accent-gold/20 rounded-lg text-xs">
                              <p className="text-white/70 mb-1">جایزه</p>
                              <p className="font-bold text-accent-gold">{Number(singleResult.reward).toLocaleString("fa-IR")} 💰</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl p-5 sm:p-6">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-accent-gold" />
                      موجودی
                    </h3>
                    <div className="space-y-2">
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <p className="text-white/60 text-xs mb-1">تومان</p>
                        <p className="text-lg sm:text-xl font-bold text-accent-gold">{user?.walletBalance?.toLocaleString("fa-IR") ?? "0"}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <p className="text-white/60 text-xs mb-1">سهم شانس</p>
                        <p className="text-lg sm:text-xl font-bold text-accent-cyan">{user?.chances?.toLocaleString("fa-IR") ?? "0"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Battle Mode Tab */}
        <AnimatePresence mode="wait">
          {activeTab === "battle" && (
            <motion.div key="battle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {/* Battle Info */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl p-5 sm:p-6 mb-6">
                <h2 className="text-lg sm:text-xl font-bold mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent-cyan" />
                  تالار پنج نفر
                </h2>
                <p className="text-xs sm:text-sm text-white/60 mb-4">
                  با هم بازی کنید، برنده همه پول را می‌برد
                </p>

                {/* Quick Join Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={loading || !user}
                    onClick={() => joinBattle("CHANCE")}
                    className="px-4 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold rounded-lg shadow-lg shadow-purple-600/30 disabled:opacity-50 transition-all text-sm"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <Zap className="w-4 h-4" />
                      ۵ سهم شانس
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={loading || !user}
                    onClick={() => joinBattle("IRR")}
                    className="px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all text-sm"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <Wallet className="w-4 h-4" />
                      ۵۰ هزار تومان
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Rooms List */}
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold">تالارهای فعال</h3>

                <AnimatePresence mode="wait">
                  {sortedRooms.length > 0 ? (
                    <motion.div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      {sortedRooms.map((room, index) => {
                        const isFull = (room.players?.length ?? 0) >= room.maxPlayers
                        const isJoined = joinedRoomId === room.id
                        const playerCount = room.players?.length ?? 0

                        return (
                          <motion.div
                            key={room.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`relative rounded-lg border p-4 backdrop-blur-xl transition-all text-sm ${
                              isJoined
                                ? "border-accent-gold/60 bg-accent-gold/10 shadow-lg shadow-accent-gold/20"
                                : "border-white/10 bg-white/[0.03] hover:border-white/20"
                            }`}
                          >
                            {isJoined && (
                              <div className="absolute -top-2 -right-2 bg-accent-gold text-dark-bg px-2 py-0.5 rounded-full text-xs font-bold">
                                شما
                              </div>
                            )}

                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="text-xs text-white/60 mb-0.5">کد</p>
                                <p className="font-mono text-xs font-bold text-white">{room.id.slice(0, 6)}</p>
                              </div>
                              <StatusBadge status={room.status} />
                            </div>

                            <div className="bg-white/5 rounded-lg p-2 mb-2.5">
                              <p className="text-xs text-white/60 mb-0.5">ورودی</p>
                              <p className="text-sm font-bold text-accent-gold">
                                {room.entryAmount} {room.entryAsset === "CHANCE" ? "⚡" : "💰"}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="bg-white/5 rounded-lg p-2">
                                <p className="text-xs text-white/60">نفر</p>
                                <p className="text-sm font-bold text-accent-cyan">{playerCount}/{room.maxPlayers}</p>
                              </div>
                              <div className="bg-white/5 rounded-lg p-2">
                                <p className="text-xs text-white/60">جام</p>
                                <p className="text-sm font-bold text-accent-gold">{room.potAmount ? `${(room.potAmount / 1000).toFixed(0)}K` : "0"}</p>
                              </div>
                            </div>

                            <button
                              disabled={loading || isFull || room.status !== "waiting" || !user}
                              onClick={() => joinBattle(room.entryAsset, room.id)}
                              className={`w-full py-2 rounded-lg font-bold text-xs transition-all ${
                                isJoined
                                  ? "bg-accent-gold/30 text-accent-gold cursor-default"
                                  : isFull || room.status !== "waiting"
                                    ? "bg-white/5 text-white/40 cursor-not-allowed"
                                    : "bg-white/10 text-white hover:bg-white/20"
                              }`}
                            >
                              {isJoined ? "✓ شما اینجا" : isFull ? "پر" : room.status !== "waiting" ? "شروع شده" : "ورود"}
                            </button>
                          </motion.div>
                        )
                      })}
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                      <Lock className="w-10 h-10 text-white/30 mx-auto mb-3" />
                      <p className="text-white/60 text-sm">تالاری باز نیست</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
