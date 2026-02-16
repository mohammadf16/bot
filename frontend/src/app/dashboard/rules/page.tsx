"use client"

import { useEffect, useState } from "react"
import { ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"

export default function RulesPage() {
  const [rules, setRules] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiRequest<{ rules: string }>("/rules", { method: "GET" }, { auth: false })
        setRules(data.rules)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "خطا در دریافت قوانین")
      }
    })()
  }, [])

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">قوانین و <span className="text-accent-gold">مقررات</span></h1>
        <p className="text-white/40 text-sm font-bold">متن قوانین به‌صورت مستقیم از بک‌اند بارگذاری می‌شود.</p>
      </div>

      <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 md:p-12">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="text-accent-gold" />
          <h2 className="text-xl font-black">قوانین جاری</h2>
        </div>
        <pre className="whitespace-pre-wrap text-sm leading-8 text-white/75">{rules || "در حال بارگذاری..."}</pre>
      </div>
    </div>
  )
}
