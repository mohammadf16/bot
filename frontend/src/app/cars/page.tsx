"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"

type Vehicle = {
  id: string
  sourceType: "lottery_winback" | "external_purchase"
  status: "available" | "reserved" | "sold" | "archived"
  vehicle: Record<string, unknown>
  listedPriceIrr?: number
  listedPriceGoldSot?: number
}

export default function CarsPage() {
  const [items, setItems] = useState<Vehicle[]>([])

  async function load() {
    try {
      const data = await apiRequest<{ items: Vehicle[] }>("/showroom/vehicles", { method: "GET" }, { auth: false })
      setItems(data.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت خودروها")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function buy(vehicleId: string, paymentAsset: "IRR" | "GOLD_SOT") {
    try {
      await apiRequest(`/showroom/vehicles/${vehicleId}/orders`, {
        method: "POST",
        body: JSON.stringify({ paymentAsset }),
      })
      toast.success("سفارش خودرو ثبت شد")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت سفارش ناموفق بود")
    }
  }

  return (
    <main className="min-h-screen pt-24 md:pt-28 pb-16" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <section className="card glass p-5 md:p-8">
          <h1 className="text-2xl md:text-4xl font-black mb-2">نمایشگاه خودرو (Showroom)</h1>
          <p className="text-white/70">خرید با تومان یا طلای آب شده؛ خودروهای برد شده دوباره در نمایشگاه قابل خرید هستند.</p>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          {items.map((v) => {
            const title = String(v.vehicle["title"] ?? `خودرو ${v.id}`)
            const imageUrl = String(v.vehicle["imageUrl"] ?? "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200")
            return (
              <div key={v.id} className="card glass p-4 md:p-5 space-y-3">
                <div className="w-full h-52 md:h-48 rounded-xl bg-black/35 border border-white/10 overflow-hidden">
                  <img src={imageUrl} alt={title} className="w-full h-full object-contain md:object-cover" />
                </div>
                <h3 className="text-xl md:text-2xl font-black">{title}</h3>
                <p className="text-sm text-white/60">نوع منبع: {v.sourceType === "lottery_winback" ? "بازخرید از برنده" : "خرید مستقیم سایت"}</p>
                <p className="text-sm">قیمت تومان: {v.listedPriceIrr?.toLocaleString("fa-IR") ?? "-"}</p>
                <p className="text-sm">قیمت سوت: {v.listedPriceGoldSot?.toLocaleString("fa-IR") ?? "-"}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button disabled={!v.listedPriceIrr} onClick={() => buy(v.id, "IRR")} className="btn-primary disabled:opacity-60 w-full sm:w-auto">خرید با تومان</button>
                  <button disabled={!v.listedPriceGoldSot} onClick={() => buy(v.id, "GOLD_SOT")} className="btn-secondary disabled:opacity-60 w-full sm:w-auto">خرید با سوت</button>
                </div>
              </div>
            )
          })}
          {!items.length ? <p className="text-white/60">خودروی فعال در نمایشگاه وجود ندارد.</p> : null}
        </section>
      </div>
    </main>
  )
}
