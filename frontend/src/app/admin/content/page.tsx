"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"

export default function AdminContentPage() {
  const [rules, setRules] = useState("")
  const [terms, setTerms] = useState("")
  const [disclaimer, setDisclaimer] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const [rulesData, legalData] = await Promise.all([
          apiRequest<{ rules: string }>("/admin/content/rules"),
          apiRequest<{ terms: string; disclaimer: string }>("/admin/content/legal"),
        ])
        setRules(rulesData.rules)
        setTerms(legalData.terms)
        setDisclaimer(legalData.disclaimer)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "خطا در دریافت محتوا")
      }
    })()
  }, [])

  const saveRules = async () => {
    try {
      await apiRequest("/admin/content/rules", { method: "PUT", body: JSON.stringify({ rules }) })
      toast.success("قوانین ذخیره شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا")
    }
  }

  const saveLegal = async () => {
    try {
      await apiRequest("/admin/content/legal", { method: "PUT", body: JSON.stringify({ terms, disclaimer }) })
      toast.success("Terms و Disclaimer ذخیره شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا")
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      <h1 className="text-4xl font-bold">مدیریت قوانین، شرایط و سلب مسئولیت</h1>

      <section className="card glass p-8">
        <h2 className="text-2xl font-black mb-4">قوانین پلتفرم</h2>
        <textarea value={rules} onChange={(e) => setRules(e.target.value)} className="w-full min-h-[180px] bg-dark-bg/50 border border-dark-border rounded-xl p-4" />
        <button onClick={saveRules} className="btn-primary mt-3">ذخیره قوانین</button>
      </section>

      <section className="card glass p-8">
        <h2 className="text-2xl font-black mb-4">Terms & Conditions</h2>
        <textarea value={terms} onChange={(e) => setTerms(e.target.value)} className="w-full min-h-[220px] bg-dark-bg/50 border border-dark-border rounded-xl p-4" />
        <h2 className="text-2xl font-black mb-4 mt-6">Disclaimer</h2>
        <textarea value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} className="w-full min-h-[160px] bg-dark-bg/50 border border-dark-border rounded-xl p-4" />
        <button onClick={saveLegal} className="btn-secondary mt-3">ذخیره متن حقوقی</button>
      </section>
    </div>
  )
}
