"use client"

import { Users, Copy, Zap, Gift, Trophy } from "lucide-react"
import toast from "react-hot-toast"
import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"

type ReferralData = {
  referralCode: string
  totalReferrals: number
  activeReferrals: number
  chancesFromReferrals: number
  cashbackFromReferrals: number
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData>({
    referralCode: "",
    totalReferrals: 0,
    activeReferrals: 0,
    chancesFromReferrals: 0,
    cashbackFromReferrals: 0,
  })

  useEffect(() => {
    ;(async () => {
      try {
        const res = await apiRequest<ReferralData>("/me/referral")
        setData(res)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "خطا در دریافت اطلاعات زیرمجموعه")
      }
    })()
  }, [])

  const stats = [
    { label: "تعداد زیرمجموعه ها", value: `${data.totalReferrals.toLocaleString("fa-IR")} نفر`, icon: Users },
    { label: "شانس های دریافت شده", value: `${data.chancesFromReferrals.toLocaleString("fa-IR")} شانس`, icon: Zap },
    { label: "کش بک دریافتی", value: `${data.cashbackFromReferrals.toLocaleString("fa-IR")} تومان`, icon: Gift },
  ]

  const copyToClipboard = () => {
    const link = `${window.location.origin}/register?ref=${data.referralCode}`
    navigator.clipboard.writeText(link)
    toast.success("لینک معرفی کپی شد")
  }

  return (
    <div className="space-y-10 text-right" dir="rtl">
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">سیستم <span className="text-accent-gold">زیرمجموعه گیری</span></h1>
        <p className="text-white/40 text-sm font-bold">هر زیرمجموعه جدید = ۱ شانس</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gradient-to-br from-[#111] to-black border border-white/5 p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-6">لینک معرفی</h2>
              <p className="text-white/60 mb-8">با دعوت دوستان، شانس گردونه و امتیاز قرعه کشی می گیرید.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-xs text-white/40 font-bold">کد شما</span>
                  <span className="text-xl font-black text-white">{data.referralCode || "-"}</span>
                </div>
                <button onClick={copyToClipboard} className="bg-white text-black px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-accent-gold transition-all">
                  <Copy size={20} /> کپی لینک
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-[2rem]">
              <Trophy className="text-accent-gold w-10 h-10 mb-6" />
              <h3 className="text-xl font-bold mb-4">قوانین امتیاز</h3>
              <ul className="space-y-3 text-sm text-white/60">
                <li>هر ۵ شانس = ۱ شرکت در قرعه کشی</li>
                <li>هر ۲ شانس = ۱ چرخش گردونه</li>
                <li>۱۰ تا ۱۰۰ زیرمجموعه: هر نفر ۲ سوت طلای آب شده</li>
                <li>۱۰۰ تا ۱۰۰۰ زیرمجموعه: هر نفر ۲ شانس گردونه</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={i} className="bg-[#0A0A0A] border border-white/5 p-8 rounded-[2rem]">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6"><Icon className="text-accent-gold w-6 h-6" /></div>
                <p className="text-white/40 text-xs font-bold uppercase mb-1">{stat.label}</p>
                <span className="text-3xl font-black">{stat.value}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
