"use client"

import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import toast from "react-hot-toast"

type ReferralData = {
  referralCode: string
  totalReferrals: number
  activeReferrals: number
  depthBreakdown: {
    level1: number
    level2: number
    level3: number
  }
  cashbackFromReferrals: number
  referralTree: Array<{ userId: string; email: string; depth: number }>
}

export default function ReferralLandingPage() {
  const [data, setData] = useState<ReferralData | null>(null)

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

  return (
    <main className="min-h-screen pt-32 pb-20" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 text-right space-y-6">
        <h1 className="text-5xl font-black"><span className="text-gradient">زیرمجموعه گیری هوشمند 3 سطحی</span></h1>
        <div className="card glass p-8 space-y-4">
          <p className="text-dark-text/70">سطح ۱: ۱۰٪، سطح ۲: ۳٪، سطح ۳: ۱٪ شارژ کمیسیون</p>
          <p className="text-sm">کد معرفی شما: <b>{data?.referralCode ?? "-"}</b></p>
          <div className="grid md:grid-cols-4 gap-3 text-sm">
            <div className="p-3 rounded-lg border border-white/10 bg-black/20">کل زیرمجموعه: {data?.totalReferrals ?? 0}</div>
            <div className="p-3 rounded-lg border border-white/10 bg-black/20">مستقیم: {data?.depthBreakdown.level1 ?? 0}</div>
            <div className="p-3 rounded-lg border border-white/10 bg-black/20">سطح ۲: {data?.depthBreakdown.level2 ?? 0}</div>
            <div className="p-3 rounded-lg border border-white/10 bg-black/20">سطح ۳: {data?.depthBreakdown.level3 ?? 0}</div>
          </div>
          <p className="text-sm">درآمد کمیسیون: {data?.cashbackFromReferrals?.toLocaleString("fa-IR") ?? 0} تومان</p>
          <div className="max-h-[280px] overflow-y-auto space-y-2">
            {data?.referralTree.map((n) => (
              <div key={`${n.userId}-${n.depth}`} className="p-3 rounded-lg border border-white/10 bg-black/20 text-sm">
                <p>{n.email}</p>
                <p className="text-white/60">سطح: {n.depth}</p>
              </div>
            ))}
            {!data?.referralTree?.length ? <p className="text-white/60">زیرمجموعه ای ثبت نشده است.</p> : null}
          </div>
        </div>
      </div>
    </main>
  )
}
