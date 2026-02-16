"use client"

import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import toast from "react-hot-toast"

type LegalPayload = {
  terms: string
  disclaimer: string
  rules: string
}

export default function FairnessPage() {
  const [legal, setLegal] = useState<LegalPayload | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiRequest<LegalPayload>("/legal", { method: "GET" }, { auth: false })
        setLegal(data)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "خطا در دریافت متن حقوقی")
      }
    })()
  }, [])

  return (
    <main className="min-h-screen pt-28 pb-16" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <section className="card glass p-8">
          <h1 className="text-4xl font-black mb-3">شفافیت، قوانین و سلب مسئولیت</h1>
          <p className="text-white/70">الگوریتم عادلانه + چارچوب حقوقی + عدم وعده سود قطعی</p>
        </section>

        <section className="card glass p-8">
          <h2 className="text-2xl font-black mb-3">Terms & Conditions</h2>
          <pre className="whitespace-pre-wrap text-sm text-white/80 leading-7">{legal?.terms || "-"}</pre>
        </section>

        <section className="card glass p-8 border border-amber-500/40">
          <h2 className="text-2xl font-black mb-3">Disclaimer</h2>
          <p className="text-sm text-amber-200 leading-7">{legal?.disclaimer || "این سایت یک پلتفرم سرگرمی است و هیچ سود قطعی وعده داده نمی شود."}</p>
        </section>

        <section className="card glass p-8">
          <h2 className="text-2xl font-black mb-3">قوانین عملیاتی</h2>
          <pre className="whitespace-pre-wrap text-sm text-white/80 leading-7">{legal?.rules || "-"}</pre>
        </section>
      </div>
    </main>
  )
}
