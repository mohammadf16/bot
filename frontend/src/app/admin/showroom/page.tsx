"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest, getAccessToken } from "@/lib/api"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/api/v1/live"

type Vehicle = {
  id: string
  sourceType: "lottery_winback" | "external_purchase"
  status: "available" | "reserved" | "sold" | "archived"
  vehicle: {
    title: string
    imageUrl: string
    model: string
    year: number
    city: string
    mileageKm: number
    isNew: boolean
    transmission: "automatic" | "manual"
    fuelType: "gasoline" | "hybrid" | "electric" | "diesel"
    participantsCount: number
    raffleParticipantsCount: number
    raffle: {
      cashbackPercent: number
      cashbackToGoldPercent: number
      goldSotBack: number
      tomanPerGoldSot: number
      mainPrizeTitle: string
      mainPrizeValueIrr: number
    }
  }
  acquisitionCostIrr?: number
  listedPriceIrr?: number
  listedPriceGoldSot?: number
  createdAt: string
}

type Order = {
  id: string
  vehicleId: string
  vehicleTitle: string
  buyerUserId: string
  buyerEmail: string
  paymentAsset: "IRR" | "GOLD_SOT"
  paymentAmount: number
  status: "pending" | "paid" | "cancelled" | "completed"
  createdAt: string
}

export default function AdminShowroomPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [form, setForm] = useState({
    title: "",
    imageUrl: "",
    model: "",
    year: String(new Date().getFullYear()),
    city: "تهران",
    mileageKm: "0",
    sourceType: "external_purchase" as "lottery_winback" | "external_purchase",
    transmission: "automatic" as "automatic" | "manual",
    fuelType: "gasoline" as "gasoline" | "hybrid" | "electric" | "diesel",
    listedPriceIrr: "",
    listedPriceGoldSot: "",
    acquisitionCostIrr: "",
    participantsCount: "0",
    raffleParticipantsCount: "0",
    cashbackPercent: "20",
    cashbackToGoldPercent: "30",
    goldSotBack: "0",
    tomanPerGoldSot: "100000",
    mainPrizeTitle: "جایزه اصلی خودرو",
    mainPrizeValueIrr: "",
  })

  async function loadAll() {
    try {
      const [v, o] = await Promise.all([
        apiRequest<{ items: Vehicle[] }>("/admin/showroom/vehicles"),
        apiRequest<{ items: Order[] }>("/admin/showroom/orders"),
      ])
      setVehicles(v.items)
      setOrders(o.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت اطلاعات نمایشگاه")
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    const socket = new WebSocket(token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL)
    socket.onmessage = () => {
      void loadAll()
    }
    return () => socket.close()
  }, [])

  const summary = useMemo(() => ({
    available: vehicles.filter((v) => v.status === "available").length,
    sold: vehicles.filter((v) => v.status === "sold").length,
    ordersPaid: orders.filter((o) => o.status === "paid" || o.status === "completed").length,
  }), [vehicles, orders])

  async function createVehicle() {
    if (!form.title.trim() || !form.imageUrl.trim() || !form.model.trim()) return toast.error("عنوان، عکس و مدل الزامی است")
    try {
      await apiRequest("/admin/showroom/vehicles", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          imageUrl: form.imageUrl.trim(),
          model: form.model.trim(),
          year: Number(form.year),
          city: form.city.trim(),
          mileageKm: Number(form.mileageKm),
          sourceType: form.sourceType,
          transmission: form.transmission,
          fuelType: form.fuelType,
          listedPriceIrr: form.listedPriceIrr ? Number(form.listedPriceIrr) : undefined,
          listedPriceGoldSot: form.listedPriceGoldSot ? Number(form.listedPriceGoldSot) : undefined,
          acquisitionCostIrr: form.acquisitionCostIrr ? Number(form.acquisitionCostIrr) : undefined,
          participantsCount: Number(form.participantsCount),
          raffleParticipantsCount: Number(form.raffleParticipantsCount),
          cashbackPercent: Number(form.cashbackPercent),
          cashbackToGoldPercent: Number(form.cashbackToGoldPercent),
          goldSotBack: Number(form.goldSotBack),
          tomanPerGoldSot: Number(form.tomanPerGoldSot),
          mainPrizeTitle: form.mainPrizeTitle.trim(),
          mainPrizeValueIrr: Number(form.mainPrizeValueIrr || 0),
        }),
      })
      toast.success("خودرو با جزئیات کامل ثبت شد")
      setForm((prev) => ({ ...prev, title: "", imageUrl: "", model: "", listedPriceIrr: "", listedPriceGoldSot: "", mainPrizeValueIrr: "" }))
      await loadAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت خودرو ناموفق بود")
    }
  }

  async function changeVehicleStatus(vehicleId: string, status: Vehicle["status"]) {
    try {
      await apiRequest(`/admin/showroom/vehicles/${vehicleId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      })
      await loadAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تغییر وضعیت خودرو ناموفق بود")
    }
  }

  async function changeOrderStatus(orderId: string, status: Order["status"]) {
    try {
      await apiRequest(`/admin/showroom/orders/${orderId}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      })
      await loadAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تغییر وضعیت سفارش ناموفق بود")
    }
  }

  const inputClass = "bg-black/30 border border-white/15 rounded-xl px-3 py-2"

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-3xl font-black">مدیریت نمایشگاه خودرو</h1>

      <section className="grid md:grid-cols-3 gap-3">
        <div className="card glass p-4">خودروی قابل خرید: {summary.available.toLocaleString("fa-IR")}</div>
        <div className="card glass p-4">خودروی فروخته‌شده: {summary.sold.toLocaleString("fa-IR")}</div>
        <div className="card glass p-4">سفارش پرداخت‌شده: {summary.ordersPaid.toLocaleString("fa-IR")}</div>
      </section>

      <section className="card glass p-6 space-y-3">
        <h2 className="text-xl font-black">افزودن خودرو با تنظیمات کامل</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="عنوان خودرو" />
          <input value={form.model} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} className={inputClass} placeholder="مدل" />
          <input value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} className={inputClass} placeholder="آدرس عکس" />
          <input value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))} className={inputClass} placeholder="سال ساخت" />
          <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className={inputClass} placeholder="شهر" />
          <input value={form.mileageKm} onChange={(e) => setForm((p) => ({ ...p, mileageKm: e.target.value }))} className={inputClass} placeholder="کیلومتر کارکرد" />
          <select value={form.sourceType} onChange={(e) => setForm((p) => ({ ...p, sourceType: e.target.value as Vehicle["sourceType"] }))} className={inputClass}><option value="external_purchase">خرید مستقیم</option><option value="lottery_winback">بازخرید</option></select>
          <select value={form.transmission} onChange={(e) => setForm((p) => ({ ...p, transmission: e.target.value as Vehicle["vehicle"]["transmission"] }))} className={inputClass}><option value="automatic">اتوماتیک</option><option value="manual">دنده‌ای</option></select>
          <select value={form.fuelType} onChange={(e) => setForm((p) => ({ ...p, fuelType: e.target.value as Vehicle["vehicle"]["fuelType"] }))} className={inputClass}><option value="gasoline">بنزینی</option><option value="hybrid">هیبرید</option><option value="electric">برقی</option><option value="diesel">دیزلی</option></select>
          <input value={form.listedPriceIrr} onChange={(e) => setForm((p) => ({ ...p, listedPriceIrr: e.target.value }))} className={inputClass} placeholder="قیمت تومان" />
          <input value={form.listedPriceGoldSot} onChange={(e) => setForm((p) => ({ ...p, listedPriceGoldSot: e.target.value }))} className={inputClass} placeholder="قیمت سوت" />
          <input value={form.acquisitionCostIrr} onChange={(e) => setForm((p) => ({ ...p, acquisitionCostIrr: e.target.value }))} className={inputClass} placeholder="هزینه تملک" />
          <input value={form.participantsCount} onChange={(e) => setForm((p) => ({ ...p, participantsCount: e.target.value }))} className={inputClass} placeholder="شرکت‌کننده ماشین" />
          <input value={form.raffleParticipantsCount} onChange={(e) => setForm((p) => ({ ...p, raffleParticipantsCount: e.target.value }))} className={inputClass} placeholder="شرکت‌کننده قرعه" />
          <input value={form.cashbackPercent} onChange={(e) => setForm((p) => ({ ...p, cashbackPercent: e.target.value }))} className={inputClass} placeholder="درصد کش‌بک" />
          <input value={form.cashbackToGoldPercent} onChange={(e) => setForm((p) => ({ ...p, cashbackToGoldPercent: e.target.value }))} className={inputClass} placeholder="درصد تبدیل به سوت" />
          <input value={form.goldSotBack} onChange={(e) => setForm((p) => ({ ...p, goldSotBack: e.target.value }))} className={inputClass} placeholder="مقدار سوت برگشتی" />
          <input value={form.tomanPerGoldSot} onChange={(e) => setForm((p) => ({ ...p, tomanPerGoldSot: e.target.value }))} className={inputClass} placeholder="نرخ تومان به سوت" />
          <input value={form.mainPrizeTitle} onChange={(e) => setForm((p) => ({ ...p, mainPrizeTitle: e.target.value }))} className={inputClass} placeholder="عنوان جایزه اصلی" />
          <input value={form.mainPrizeValueIrr} onChange={(e) => setForm((p) => ({ ...p, mainPrizeValueIrr: e.target.value }))} className={inputClass} placeholder="ارزش جایزه اصلی" />
        </div>
        <button onClick={createVehicle} className="btn-primary">ثبت خودرو</button>
      </section>

      <section className="card glass p-6">
        <h2 className="text-xl font-black mb-3">خودروها</h2>
        <div className="space-y-2">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="p-3 rounded-xl border border-white/10 bg-black/20 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">{vehicle.vehicle.title}</p>
                <p className="text-xs text-white/60">{vehicle.vehicle.year} | {vehicle.vehicle.model} | {vehicle.vehicle.city}</p>
                <p className="text-xs text-white/60">شرکت‌کننده ماشین: {vehicle.vehicle.participantsCount.toLocaleString("fa-IR")} | قرعه: {vehicle.vehicle.raffleParticipantsCount.toLocaleString("fa-IR")}</p>
              </div>
              <div className="flex gap-2">
                {(["available", "reserved", "sold", "archived"] as Vehicle["status"][]).map((status) => (
                  <button key={status} onClick={() => void changeVehicleStatus(vehicle.id, status)} className={`px-3 py-1 rounded-lg text-xs border ${vehicle.status === status ? "border-accent-gold text-accent-gold" : "border-white/20 text-white/70"}`}>
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card glass p-6">
        <h2 className="text-xl font-black mb-3">سفارش‌ها</h2>
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="p-3 rounded-xl border border-white/10 bg-black/20 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">{order.vehicleTitle}</p>
                <p className="text-xs text-white/60">{order.buyerEmail} | {order.paymentAsset} | {order.paymentAmount.toLocaleString("fa-IR")} | {order.status}</p>
              </div>
              <div className="flex gap-2">
                {(["pending", "paid", "completed", "cancelled"] as Order["status"][]).map((status) => (
                  <button key={status} onClick={() => void changeOrderStatus(order.id, status)} className={`px-3 py-1 rounded-lg text-xs border ${order.status === status ? "border-accent-gold text-accent-gold" : "border-white/20 text-white/70"}`}>
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
