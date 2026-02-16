"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

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

export default function SlideArenaPage() {
  const { user, refreshMe } = useAuth()
  const [today, setToday] = useState<SingleToday | null>(null)
  const [singleResult, setSingleResult] = useState<any>(null)
  const [rooms, setRooms] = useState<BattleRoom[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    try {
      const [t, r] = await Promise.all([
        apiRequest<SingleToday>("/slide/single/today", { method: "GET" }, { auth: false }),
        apiRequest<{ items: BattleRoom[] }>("/slide/battle/rooms", { method: "GET" }, { auth: false }),
      ])
      setToday(t)
      setRooms(r.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت اطلاعات")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function spinSingle(stakeType: "chance" | "irr") {
    setLoading(true)
    try {
      const result = await apiRequest<any>("/slide/single/spin", {
        method: "POST",
        body: JSON.stringify({ stakeType }),
      })
      setSingleResult(result)
      await refreshMe()
      toast.success(result.win ? "تبریک! برنده شدی" : "این بار نشد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "چرخش انجام نشد")
    } finally {
      setLoading(false)
    }
  }

  async function joinBattle(entryAsset: "CHANCE" | "IRR") {
    setLoading(true)
    try {
      await apiRequest("/slide/battle/join", {
        method: "POST",
        body: JSON.stringify({ entryAsset, entryAmount: entryAsset === "CHANCE" ? 5 : 10000, maxPlayers: 10 }),
      })
      await refreshMe()
      await load()
      toast.success("وارد اتاق شدی")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ورود به اتاق ناموفق بود")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen pt-28 pb-20" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <section className="card glass p-8">
          <h1 className="text-4xl font-black mb-3">بازی ماشین اسلاید</h1>
          <p className="text-white/70">حالت A: تک‌نفره روزانه | حالت B: اتاق گروهی Battle</p>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="card glass p-6 space-y-4">
            <h2 className="text-2xl font-black">حالت A: تک‌نفره</h2>
            <p className="text-sm text-white/70">عدد هدف امروز: {today?.hasTarget ? today?.targetNumber : "تنظیم نشده"}</p>
            <div className="flex gap-3">
              <button disabled={loading} onClick={() => spinSingle("chance")} className="btn-primary flex-1">چرخش با ۱ شانس</button>
              <button disabled={loading} onClick={() => spinSingle("irr")} className="btn-secondary flex-1">چرخش با ۱۰,۰۰۰ تومان</button>
            </div>
            {singleResult ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
                <p>عدد شما: <b>{singleResult.rolledNumber}</b></p>
                <p>عدد برنده: <b>{singleResult.targetNumber}</b></p>
                <p>وضعیت: <b>{singleResult.win ? "برنده" : "بازنده"}</b></p>
                {singleResult.reward ? <p>جایزه: {singleResult.reward.toLocaleString("fa-IR")} تومان</p> : null}
              </div>
            ) : null}
          </div>

          <div className="card glass p-6 space-y-4">
            <h2 className="text-2xl font-black">حالت B: Battle Room</h2>
            <p className="text-sm text-white/70">ورودی ۵ شانس یا ۱۰,۰۰۰ تومان، ۱۰ نفره، برنده پات را می‌گیرد.</p>
            <div className="flex gap-3">
              <button disabled={loading} onClick={() => joinBattle("CHANCE")} className="btn-primary flex-1">ورود با شانس</button>
              <button disabled={loading} onClick={() => joinBattle("IRR")} className="btn-secondary flex-1">ورود با تومان</button>
            </div>
          </div>
        </section>

        <section className="card glass p-6">
          <h3 className="text-xl font-black mb-3">اتاق‌های بازی</h3>
          <div className="space-y-2">
            {rooms.map((room) => (
              <div key={room.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
                <p>اتاق: {room.id}</p>
                <p>وضعیت: {room.status}</p>
                <p>ورودی: {room.entryAmount} {room.entryAsset}</p>
                <p>بازیکن: {room.players.length}/{room.maxPlayers}</p>
                {room.status === "finished" ? <p>برنده: {room.winnerUserId}</p> : null}
              </div>
            ))}
            {!rooms.length ? <p className="text-white/60">اتاقی وجود ندارد.</p> : null}
          </div>
        </section>

        <section className="card glass p-6 text-sm text-white/70">
          <p>موجودی تومان: {user?.walletBalance?.toLocaleString("fa-IR") ?? 0}</p>
          <p>شانس: {user?.chances?.toLocaleString("fa-IR") ?? 0}</p>
        </section>
      </div>
    </main>
  )
}
