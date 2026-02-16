"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

type Dashboard = {
  totalWonIrr: number
  activeReferrals: number
  chancesToNextVip: number
  predictedNextChanceAt: string
  vip: { id: number; name: string; cashbackPercent: number }
}

type Mission = {
  code: "spin_wheel" | "buy_ticket" | "invite_friend"
  done: boolean
  rewardType: "chance" | "cashback_bonus" | "gold_sot"
  rewardValue: number
}

type MissionPayload = {
  mission: {
    missions: Mission[]
    grandRewardClaimed: boolean
  }
}

export default function EngagementPage() {
  const { refreshMe } = useAuth()
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [missions, setMissions] = useState<MissionPayload["mission"] | null>(null)
  const [achievements, setAchievements] = useState<string[]>([])
  const [weeklyEvents, setWeeklyEvents] = useState<Array<{ day: string; title: string; prize: string; hook: string }>>([])
  const [shockPrizes, setShockPrizes] = useState<Array<{ code: string; title: string; description: string }>>([])
  const [quickHitResult, setQuickHitResult] = useState("")

  async function load() {
    try {
      const [d, m, a, w, s] = await Promise.all([
        apiRequest<Dashboard>("/engagement/dashboard"),
        apiRequest<MissionPayload>("/engagement/missions/today"),
        apiRequest<{ unlockedNow: string[]; unlocked: string[] }>("/engagement/achievements"),
        apiRequest<{ items: Array<{ day: string; title: string; prize: string; hook: string }> }>("/engagement/events/weekly", { method: "GET" }, { auth: false }),
        apiRequest<{ items: Array<{ code: string; title: string; description: string }> }>("/engagement/shock-prizes", { method: "GET" }, { auth: false }),
      ])
      setDashboard(d)
      setMissions(m.mission)
      setAchievements(a.unlocked)
      setWeeklyEvents(w.items)
      setShockPrizes(s.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت اطلاعات کمپین")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function claimWelcome(action: "register" | "profile" | "phone" | "app") {
    try {
      await apiRequest("/engagement/welcome/claim", { method: "POST", body: JSON.stringify({ action }) })
      toast.success("جایزه خوشامدگویی ثبت شد")
      await refreshMe()
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت جایزه ناموفق بود")
    }
  }

  async function runQuickHit() {
    try {
      const res = await apiRequest<{ outcome: string[]; guaranteed: boolean; reward: { type: string; value: number } }>("/engagement/quick-hit/play", {
        method: "POST",
        body: JSON.stringify({ mode: "standard" }),
      })
      setQuickHitResult(`${res.outcome.join(" ")} | ${res.reward.type}:${res.reward.value}`)
      toast.success(res.guaranteed ? "برد تضمینی فعال شد" : "ضربه فوری اجرا شد")
      await refreshMe()
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "بازی انجام نشد")
    }
  }

  async function checkIn() {
    try {
      await apiRequest("/engagement/streak/checkin", { method: "POST" })
      toast.success("استریک روزانه ثبت شد")
      await refreshMe()
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "استریک ثبت نشد")
    }
  }

  async function completeMission(code: Mission["code"]) {
    try {
      await apiRequest("/engagement/missions/complete", { method: "POST", body: JSON.stringify({ code }) })
      toast.success("ماموریت ثبت شد")
      await refreshMe()
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ماموریت ناموفق بود")
    }
  }

  return (
    <main className="min-h-screen pt-28 pb-16" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <section className="card glass p-8">
          <h1 className="text-4xl font-black mb-2">مرکز جذب کاربر و هیجان</h1>
          <p className="text-white/70">Welcome Bomb، بازی های فوری، استریک، ماموریت روزانه، دستاوردها، VIP و رویدادهای هفتگی.</p>
        </section>

        <section className="grid md:grid-cols-4 gap-3">
          <div className="card glass p-4">مجموع برد: {dashboard?.totalWonIrr?.toLocaleString("fa-IR") ?? 0}</div>
          <div className="card glass p-4">VIP: {dashboard?.vip?.name ?? "-"}</div>
          <div className="card glass p-4">زیرمجموعه فعال: {dashboard?.activeReferrals ?? 0}</div>
          <div className="card glass p-4">تا VIP بعدی: {dashboard?.chancesToNextVip ?? 0}</div>
        </section>

        <section className="card glass p-6 space-y-3">
          <h2 className="text-2xl font-black">Welcome Bomb</h2>
          <div className="grid md:grid-cols-4 gap-2">
            <button onClick={() => claimWelcome("register")} className="btn-secondary">ثبت نام +5 شانس</button>
            <button onClick={() => claimWelcome("profile")} className="btn-secondary">تکمیل پروفایل +2 +50 سوت</button>
            <button onClick={() => claimWelcome("phone")} className="btn-secondary">تایید موبایل +1</button>
            <button onClick={() => claimWelcome("app")} className="btn-secondary">دانلود اپ +3 +بونوس</button>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="card glass p-6 space-y-3">
            <h2 className="text-2xl font-black">Quick Hit</h2>
            <button onClick={runQuickHit} className="btn-primary">اجرا با 1 شانس</button>
            <p className="text-sm text-white/70">{quickHitResult || "هر 10 بازی یک برد تضمینی"}</p>
          </div>
          <div className="card glass p-6 space-y-3">
            <h2 className="text-2xl font-black">Daily Streak</h2>
            <button onClick={checkIn} className="btn-primary">ثبت امروز</button>
            <p className="text-sm text-white/70">روز 1 تا 7 جایزه پلکانی، روز از دست برود ریست می شود.</p>
          </div>
        </section>

        <section className="card glass p-6">
          <h2 className="text-2xl font-black mb-3">ماموریت های روزانه</h2>
          <div className="grid md:grid-cols-3 gap-2">
            {(missions?.missions ?? []).map((m) => (
              <button key={m.code} onClick={() => completeMission(m.code)} className="btn-secondary disabled:opacity-60" disabled={m.done}>
                {m.code} | پاداش {m.rewardValue}
              </button>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="card glass p-6">
            <h2 className="text-2xl font-black mb-3">دستاوردها</h2>
            <div className="space-y-2 text-sm">
              {achievements.map((a) => <p key={a}>{a}</p>)}
              {!achievements.length ? <p className="text-white/60">هنوز دستاوردی باز نشده است.</p> : null}
            </div>
          </div>
          <div className="card glass p-6">
            <h2 className="text-2xl font-black mb-3">جایزه های شوکه کننده</h2>
            <div className="space-y-2 text-sm">
              {shockPrizes.map((s) => (
                <p key={s.code}><b>{s.title}:</b> {s.description}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="card glass p-6">
          <h2 className="text-2xl font-black mb-3">رویداد هفتگی</h2>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            {weeklyEvents.map((e) => (
              <div key={`${e.day}-${e.title}`} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p><b>{e.day}</b> - {e.title}</p>
                <p className="text-white/70">{e.prize}</p>
                <p className="text-white/60">{e.hook}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
