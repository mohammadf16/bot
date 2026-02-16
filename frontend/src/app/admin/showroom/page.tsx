"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest, getAccessToken } from "@/lib/api"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/api/v1/live"

type Vehicle = {
  id: string
  sourceType: "lottery_winback" | "external_purchase"
  status: "available" | "reserved" | "sold" | "archived"
  vehicle: Record<string, unknown>
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
    sourceType: "external_purchase" as "lottery_winback" | "external_purchase",
    listedPriceIrr: "",
    listedPriceGoldSot: "",
    acquisitionCostIrr: "",
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
      toast.error(err instanceof Error ? err.message : "خطا در دریافت نمایشگاه")
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    const socket = new WebSocket(token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL)
    socket.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as { type: string; payload: { type?: string } }
        if (msg.type !== "event") return
        const evtType = msg.payload?.type
        if (evtType === "showroom.vehicle" || evtType === "showroom.order") {
          void loadAll()
        }
      } catch {
        // noop
      }
    }
    return () => socket.close()
  }, [])

  const summary = useMemo(() => ({
    available: vehicles.filter((v) => v.status === "available").length,
    sold: vehicles.filter((v) => v.status === "sold").length,
    ordersPaid: orders.filter((o) => o.status === "paid").length,
  }), [vehicles, orders])

  async function createVehicle() {
    if (!form.title.trim() || !form.imageUrl.trim()) return toast.error("عنوان و عکس لازم است")
    try {
      await apiRequest("/admin/showroom/vehicles", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          imageUrl: form.imageUrl.trim(),
          sourceType: form.sourceType,
          listedPriceIrr: form.listedPriceIrr ? Number(form.listedPriceIrr) : undefined,
          listedPriceGoldSot: form.listedPriceGoldSot ? Number(form.listedPriceGoldSot) : undefined,
          acquisitionCostIrr: form.acquisitionCostIrr ? Number(form.acquisitionCostIrr) : undefined,
        }),
      })
      setForm({ title: "", imageUrl: "", sourceType: "external_purchase", listedPriceIrr: "", listedPriceGoldSot: "", acquisitionCostIrr: "" })
      toast.success("خودرو به نمایشگاه اضافه شد")
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

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-3xl font-black">مدیریت نمایشگاه و حواله خودرو</h1>

      <section className="grid md:grid-cols-3 gap-3">
        <div className="card glass p-4">خودرو قابل خرید: {summary.available.toLocaleString("fa-IR")}</div>
        <div className="card glass p-4">خودرو فروخته شده: {summary.sold.toLocaleString("fa-IR")}</div>
        <div className="card glass p-4">سفارش پرداخت شده: {summary.ordersPaid.toLocaleString("fa-IR")}</div>
      </section>

      <section className="card glass p-6 space-y-3">
        <h2 className="text-xl font-black">افزودن خودرو</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="bg-black/30 border border-white/15 rounded-xl px-3 py-2" placeholder="عنوان خودرو" />
          <input value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} className="bg-black/30 border border-white/15 rounded-xl px-3 py-2" placeholder="آدرس عکس" />
          <select value={form.sourceType} onChange={(e) => setForm((p) => ({ ...p, sourceType: e.target.value as Vehicle["sourceType"] }))} className="bg-black/30 border border-white/15 rounded-xl px-3 py-2">
            <option value="external_purchase">خرید مستقیم سایت</option>
            <option value="lottery_winback">بازخرید از برنده</option>
          </select>
          <input value={form.listedPriceIrr} onChange={(e) => setForm((p) => ({ ...p, listedPriceIrr: e.target.value }))} className="bg-black/30 border border-white/15 rounded-xl px-3 py-2" placeholder="قیمت تومان" />
          <input value={form.listedPriceGoldSot} onChange={(e) => setForm((p) => ({ ...p, listedPriceGoldSot: e.target.value }))} className="bg-black/30 border border-white/15 rounded-xl px-3 py-2" placeholder="قیمت سوت" />
          <input value={form.acquisitionCostIrr} onChange={(e) => setForm((p) => ({ ...p, acquisitionCostIrr: e.target.value }))} className="bg-black/30 border border-white/15 rounded-xl px-3 py-2" placeholder="هزینه تملک" />
        </div>
        <button onClick={createVehicle} className="btn-primary">ثبت خودرو</button>
      </section>

      <section className="card glass p-6">
        <h2 className="text-xl font-black mb-3">خودروها</h2>
        <div className="space-y-2">
          {vehicles.map((v) => (
            <div key={v.id} className="p-3 rounded-xl border border-white/10 bg-black/20 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">{String(v.vehicle?.["title"] ?? v.id)}</p>
                <p className="text-xs text-white/60">{v.status} | IRR: {v.listedPriceIrr ?? "-"} | SOT: {v.listedPriceGoldSot ?? "-"}</p>
              </div>
              <div className="flex gap-2">
                {(["available", "reserved", "sold", "archived"] as Vehicle["status"][]).map((st) => (
                  <button key={st} onClick={() => void changeVehicleStatus(v.id, st)} className={`px-3 py-1 rounded-lg text-xs border ${v.status === st ? "border-accent-gold text-accent-gold" : "border-white/20 text-white/70"}`}>
                    {st}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!vehicles.length ? <p className="text-sm text-white/50">خودرویی ثبت نشده است.</p> : null}
        </div>
      </section>

      <section className="card glass p-6">
        <h2 className="text-xl font-black mb-3">سفارش‌ها</h2>
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="p-3 rounded-xl border border-white/10 bg-black/20 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">{o.vehicleTitle}</p>
                <p className="text-xs text-white/60">{o.buyerEmail} | {o.paymentAsset} | {o.paymentAmount.toLocaleString("fa-IR")} | {o.status}</p>
              </div>
              <div className="flex gap-2">
                {(["pending", "paid", "completed", "cancelled"] as Order["status"][]).map((st) => (
                  <button key={st} onClick={() => void changeOrderStatus(o.id, st)} className={`px-3 py-1 rounded-lg text-xs border ${o.status === st ? "border-accent-gold text-accent-gold" : "border-white/20 text-white/70"}`}>
                    {st}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!orders.length ? <p className="text-sm text-white/50">سفارشی وجود ندارد.</p> : null}
        </div>
      </section>
    </div>
  )
}
