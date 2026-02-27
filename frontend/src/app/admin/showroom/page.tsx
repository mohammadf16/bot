"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest, getAccessToken, LIVE_WS_URL } from "@/lib/api"
import { formatToman } from "@/lib/money"

const WS_URL = LIVE_WS_URL

type Vehicle = {
  id: string
  sourceType: "lottery_winback" | "external_purchase"
  status: "available" | "reserved" | "sold" | "archived"
  vehicle: {
    title: string
    imageUrl: string
    imageUrls?: string[]
    primaryImageIndex?: number
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
  directPurchaseEnabled?: boolean
  directPurchaseGroupSize?: number
  directPurchaseCurrentParticipants?: number
  directPurchaseTotalCostPerParticipant?: number
  createdAt: string
}

type Order = {
  id: string
  vehicleId: string
  vehicleTitle: string
  buyerUserId: string
  buyerEmail: string
  paymentAsset: "IRR" | "GOLD_SOT" | "LOAN" | "CARD_TO_CARD"
  paymentAmount: number
  status: "pending" | "paid" | "cancelled" | "completed"
  createdAt: string
}

function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
}

function digitsOnly(value: string): string {
  const normalized = toEnglishDigits(value).replace(/[^\d]/g, "")
  return normalized.replace(/^0+(?=\d)/, "")
}

function getDefaultVehicleYear(): number {
  try {
    const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" }).formatToParts(new Date())
    const yearPart = parts.find((part) => part.type === "year")?.value ?? ""
    const numericYear = Number(toEnglishDigits(yearPart))
    if (Number.isFinite(numericYear) && numericYear >= 1300 && numericYear <= 2100) return numericYear
  } catch {
    // Fall back to Gregorian year.
  }
  return new Date().getFullYear()
}

function decimalOnly(value: string): string {
  const normalized = toEnglishDigits(value).replace(/[^\d.]/g, "")
  const firstDot = normalized.indexOf(".")
  if (firstDot < 0) return normalized
  return normalized.slice(0, firstDot + 1) + normalized.slice(firstDot + 1).replace(/\./g, "")
}

function formatGrouped(value: string): string {
  if (!value) return ""
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  return n.toLocaleString("fa-IR")
}

export default function AdminShowroomPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<"vehicles" | "orders" | "add-vehicle">("vehicles")
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imageUrlInput, setImageUrlInput] = useState("")
  const [form, setForm] = useState({
    title: "",
    imageUrls: [] as string[],
    primaryImageIndex: 0,
    model: "",
    year: String(getDefaultVehicleYear()),
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
    directPurchaseEnabled: false,
    directPurchaseGroupSize: "0",
    directPurchaseCurrentParticipants: "0",
    directPurchaseTotalCostPerParticipant: "",
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

  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ""))
      reader.onerror = () => reject(new Error("IMAGE_READ_FAILED"))
      reader.readAsDataURL(file)
    })
  }

  function appendImageUrls(urls: string[]) {
    setForm((prev) => {
      const unique = Array.from(new Set([...prev.imageUrls, ...urls.map((u) => u.trim()).filter(Boolean)]))
      const primaryImageIndex = Math.min(prev.primaryImageIndex, Math.max(0, unique.length - 1))
      return { ...prev, imageUrls: unique, primaryImageIndex }
    })
  }

  function addImageFromUrl() {
    const url = imageUrlInput.trim()
    if (!url) return
    if (!/^https?:\/\//.test(url) && !url.startsWith("/")) {
      toast.error("آدرس تصویر معتبر نیست")
      return
    }
    appendImageUrls([url])
    setImageUrlInput("")
  }

  async function uploadImages(files: FileList | null) {
    if (!files || files.length === 0) return
    const selected = Array.from(files)
    if (selected.some((file) => !file.type.startsWith("image/"))) {
      toast.error("فقط فایل تصویر قابل آپلود است")
      return
    }

    setIsUploadingImage(true)
    try {
      const uploadedUrls: string[] = []
      for (const file of selected) {
        const contentBase64 = await fileToDataUrl(file)
        const data = await apiRequest<{ url: string }>("/admin/uploads/image", {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            contentBase64,
          }),
        })
        uploadedUrls.push(data.url)
      }
      appendImageUrls(uploadedUrls)
      toast.success(`${uploadedUrls.length.toLocaleString("fa-IR")} تصویر آپلود شد`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "آپلود تصویر ناموفق بود")
    } finally {
      setIsUploadingImage(false)
    }
  }

  function removeImage(index: number) {
    setForm((prev) => {
      const imageUrls = prev.imageUrls.filter((_, i) => i !== index)
      if (!imageUrls.length) {
        return { ...prev, imageUrls: [], primaryImageIndex: 0 }
      }
      let primaryImageIndex = prev.primaryImageIndex
      if (index === prev.primaryImageIndex) primaryImageIndex = 0
      else if (index < prev.primaryImageIndex) primaryImageIndex -= 1
      primaryImageIndex = Math.max(0, Math.min(primaryImageIndex, imageUrls.length - 1))
      return { ...prev, imageUrls, primaryImageIndex }
    })
  }

  function setPrimaryImage(index: number) {
    setForm((prev) => ({
      ...prev,
      primaryImageIndex: Math.max(0, Math.min(index, Math.max(0, prev.imageUrls.length - 1))),
    }))
  }

  async function createVehicle() {
    if (!form.title.trim() || !form.model.trim()) return toast.error("عنوان و مدل الزامی است")
    if (form.imageUrls.length === 0) return toast.error("حداقل یک تصویر اضافه کنید")
    try {
      await apiRequest("/admin/showroom/vehicles", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          imageUrls: form.imageUrls,
          primaryImageIndex: form.primaryImageIndex,
          model: form.model.trim(),
          year: form.year ? Number(form.year) : undefined,
          city: form.city.trim(),
          mileageKm: Number(form.mileageKm || 0),
          sourceType: form.sourceType,
          transmission: form.transmission,
          fuelType: form.fuelType,
          listedPriceIrr: form.listedPriceIrr ? Number(form.listedPriceIrr) : undefined,
          listedPriceGoldSot: form.listedPriceGoldSot ? Number(form.listedPriceGoldSot) : undefined,
          acquisitionCostIrr: form.acquisitionCostIrr ? Number(form.acquisitionCostIrr) : undefined,
          participantsCount: Number(form.participantsCount || 0),
          raffleParticipantsCount: Number(form.raffleParticipantsCount || 0),
          cashbackPercent: Number(form.cashbackPercent || 0),
          cashbackToGoldPercent: Number(form.cashbackToGoldPercent || 0),
          goldSotBack: Number(form.goldSotBack || 0),
          tomanPerGoldSot: Number(form.tomanPerGoldSot || 0),
          mainPrizeTitle: form.mainPrizeTitle.trim(),
          mainPrizeValueIrr: Number(form.mainPrizeValueIrr || 0),
          directPurchaseEnabled: form.directPurchaseEnabled,
          directPurchaseGroupSize: form.directPurchaseGroupSize ? Number(form.directPurchaseGroupSize) : undefined,
          directPurchaseCurrentParticipants: Number(form.directPurchaseCurrentParticipants || 0),
          directPurchaseTotalCostPerParticipant: form.directPurchaseTotalCostPerParticipant ? Number(form.directPurchaseTotalCostPerParticipant) : undefined,
        }),
      })
      toast.success("خودرو با تصاویر و جزئیات کامل ثبت شد")
      setImageUrlInput("")
      setForm((prev) => ({
        ...prev,
        title: "",
        imageUrls: [],
        primaryImageIndex: 0,
        model: "",
        listedPriceIrr: "",
        listedPriceGoldSot: "",
        acquisitionCostIrr: "",
        mainPrizeValueIrr: "",
        directPurchaseEnabled: false,
        directPurchaseGroupSize: "0",
        directPurchaseCurrentParticipants: "0",
        directPurchaseTotalCostPerParticipant: "",
      }))
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

  function setMoneyField(field: "listedPriceIrr" | "acquisitionCostIrr" | "tomanPerGoldSot" | "mainPrizeValueIrr" | "directPurchaseTotalCostPerParticipant", value: string) {
    setForm((prev) => ({ ...prev, [field]: digitsOnly(value) }))
  }

  const inputClass = "bg-black/30 border border-white/15 rounded-xl px-3 py-2"

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">مدیریت نمایشگاه خودرو</h1>
      </div>

      <section className="grid md:grid-cols-3 gap-3">
        <div className="card glass p-4">
          <p className="text-white/60 text-xs mb-1">خودروی قابل خرید</p>
          <p className="text-2xl font-black text-[#D4AF37]">{summary.available.toLocaleString("fa-IR")}</p>
        </div>
        <div className="card glass p-4">
          <p className="text-white/60 text-xs mb-1">خودروی فروخته‌شده</p>
          <p className="text-2xl font-black text-white">{summary.sold.toLocaleString("fa-IR")}</p>
        </div>
        <div className="card glass p-4">
          <p className="text-white/60 text-xs mb-1">سفارش پرداخت‌شده</p>
          <p className="text-2xl font-black text-white">{summary.ordersPaid.toLocaleString("fa-IR")}</p>
        </div>
      </section>

      {/* --- Tab Navigation --- */}
      <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        {[
          { id: "vehicles", label: "خودروها", count: vehicles.length },
          { id: "orders", label: "سفارش‌ها", count: orders.length },
          { id: "add-vehicle", label: "افزودن خودرو" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#D4AF37] text-black"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && <span className="ml-2 text-xs opacity-70">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* --- Add Vehicle Tab --- */}
      {activeTab === "add-vehicle" && (
        <section className="space-y-5">
          <h2 className="text-xl font-black">افزودن خودرو جدید</h2>

          {/* Basic Info */}
          <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-bold text-[#D4AF37]">اطلاعات اصلی خودرو</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">عنوان خودرو *</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="مثال: پراید ۱۳۲ مدل ۱۴۰۲" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">مدل / برند *</label>
                <input value={form.model} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} className={inputClass} placeholder="مثال: پراید" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">سال ساخت</label>
                <input value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: digitsOnly(e.target.value) }))} className={inputClass} placeholder="مثال: 1402" inputMode="numeric" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">شهر</label>
                <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className={inputClass} placeholder="مثال: تهران" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">کیلومتر کارکرد</label>
                <input value={form.mileageKm} onChange={(e) => setForm((p) => ({ ...p, mileageKm: digitsOnly(e.target.value) }))} className={inputClass} placeholder="مثال: 45000" inputMode="numeric" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">نوع ورود</label>
                <select value={form.sourceType} onChange={(e) => setForm((p) => ({ ...p, sourceType: e.target.value as Vehicle["sourceType"] }))} className={inputClass}>
                  <option value="external_purchase">خرید مستقیم</option>
                  <option value="lottery_winback">بازخرید قرعه</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">گیربکس</label>
                <select value={form.transmission} onChange={(e) => setForm((p) => ({ ...p, transmission: e.target.value as Vehicle["vehicle"]["transmission"] }))} className={inputClass}>
                  <option value="automatic">اتوماتیک</option>
                  <option value="manual">دنده‌ای</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">سوخت</label>
                <select value={form.fuelType} onChange={(e) => setForm((p) => ({ ...p, fuelType: e.target.value as Vehicle["vehicle"]["fuelType"] }))} className={inputClass}>
                  <option value="gasoline">بنزینی</option>
                  <option value="hybrid">هیبرید</option>
                  <option value="electric">برقی</option>
                  <option value="diesel">دیزلی</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-bold text-[#D4AF37]">قیمت‌گذاری</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">قیمت فروش (تومان)</label>
                <input value={formatGrouped(form.listedPriceIrr)} onChange={(e) => setMoneyField("listedPriceIrr", e.target.value)} className={inputClass} placeholder="مثال: 850,000,000" inputMode="numeric" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">قیمت فروش (سوت طلا)</label>
                <input value={form.listedPriceGoldSot} onChange={(e) => setForm((p) => ({ ...p, listedPriceGoldSot: decimalOnly(e.target.value) }))} className={inputClass} placeholder="مثال: 8500" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">هزینه تملک / خرید (تومان)</label>
                <input value={formatGrouped(form.acquisitionCostIrr)} onChange={(e) => setMoneyField("acquisitionCostIrr", e.target.value)} className={inputClass} placeholder="مثال: 700,000,000" inputMode="numeric" />
              </div>
            </div>
          </div>

          {/* Raffle Settings */}
          <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-bold text-[#D4AF37]">تنظیمات قرعه‌کشی</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">عنوان جایزه اصلی</label>
                <input value={form.mainPrizeTitle} onChange={(e) => setForm((p) => ({ ...p, mainPrizeTitle: e.target.value }))} className={inputClass} placeholder="مثال: پراید ۱۳۲ مدل ۱۴۰۲" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">ارزش جایزه اصلی (تومان)</label>
                <input value={formatGrouped(form.mainPrizeValueIrr)} onChange={(e) => setMoneyField("mainPrizeValueIrr", e.target.value)} className={inputClass} placeholder="مثال: 850,000,000" inputMode="numeric" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">درصد کش‌بک (%)</label>
                <input value={form.cashbackPercent} onChange={(e) => setForm((p) => ({ ...p, cashbackPercent: digitsOnly(e.target.value) }))} className={inputClass} placeholder="مثال: 20" inputMode="numeric" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">درصد تبدیل کش‌بک به سوت (%)</label>
                <input value={form.cashbackToGoldPercent} onChange={(e) => setForm((p) => ({ ...p, cashbackToGoldPercent: digitsOnly(e.target.value) }))} className={inputClass} placeholder="مثال: 30" inputMode="numeric" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">مقدار سوت برگشتی</label>
                <input value={form.goldSotBack} onChange={(e) => setForm((p) => ({ ...p, goldSotBack: digitsOnly(e.target.value) }))} className={inputClass} placeholder="مثال: 0" inputMode="numeric" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">نرخ تومان به سوت</label>
                <input value={formatGrouped(form.tomanPerGoldSot)} onChange={(e) => setMoneyField("tomanPerGoldSot", e.target.value)} className={inputClass} placeholder="مثال: 100,000" inputMode="numeric" />
              </div>
            </div>
          </div>

          {/* Direct Purchase Section */}
          <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm text-[#D4AF37]">خرید مستقیم گروهی</p>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.directPurchaseEnabled}
                  onChange={(e) => setForm((p) => ({ ...p, directPurchaseEnabled: e.target.checked }))}
                  className="accent-[#D4AF37] w-4 h-4"
                />
                <span className="text-sm text-white/70">فعال کردن</span>
              </label>
            </div>
            {form.directPurchaseEnabled && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">ظرفیت کل گروه (نفر)</label>
                  <input value={form.directPurchaseGroupSize} onChange={(e) => setForm((p) => ({ ...p, directPurchaseGroupSize: digitsOnly(e.target.value) }))} className={inputClass} placeholder="مثال: 10" inputMode="numeric" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">شرکت‌کنندگان فعلی (نفر)</label>
                  <input value={form.directPurchaseCurrentParticipants} onChange={(e) => setForm((p) => ({ ...p, directPurchaseCurrentParticipants: digitsOnly(e.target.value) }))} className={inputClass} placeholder="مثال: 0" inputMode="numeric" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">هزینه هر شرکت‌کننده (تومان)</label>
                  <input value={formatGrouped(form.directPurchaseTotalCostPerParticipant)} onChange={(e) => setMoneyField("directPurchaseTotalCostPerParticipant", e.target.value)} className={inputClass} placeholder="مثال: 85,000,000" inputMode="numeric" />
                </div>
                <div className="bg-black/20 border border-white/10 rounded-xl p-3">
                  <p className="text-xs text-white/50 mb-1">جای خالی باقی‌مانده</p>
                  <p className="font-black text-[#D4AF37] text-xl">
                    {Math.max(0, Number(form.directPurchaseGroupSize || 0) - Number(form.directPurchaseCurrentParticipants || 0)).toLocaleString("fa-IR")} نفر
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Gallery */}
          <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-bold text-[#D4AF37]">گالری تصاویر *</p>
            <div className="flex gap-3 flex-wrap">
              <input
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addImageFromUrl() }}
                className={`${inputClass} flex-1 min-w-[200px]`}
                placeholder="آدرس تصویر (https://... یا /uploads/...)"
              />
              <button type="button" onClick={addImageFromUrl} className="btn-secondary whitespace-nowrap">افزودن از URL</button>
              <label className="btn-secondary cursor-pointer text-center whitespace-nowrap">
                {isUploadingImage ? "در حال آپلود..." : "آپلود تصویر"}
                <input type="file" accept="image/*" multiple className="hidden" disabled={isUploadingImage}
                  onChange={(e) => { void uploadImages(e.target.files); e.currentTarget.value = "" }}
                />
              </label>
            </div>

            {form.imageUrls.length ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {form.imageUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="rounded-xl border border-white/10 bg-black/30 p-2 space-y-2">
                    <div className="relative h-28 rounded-lg overflow-hidden bg-black/40">
                      <img src={url} alt={`تصویر ${index + 1}`} className="w-full h-full object-cover" />
                      {form.primaryImageIndex === index ? (
                        <span className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-md bg-accent-gold text-black font-black">عکس اصلی</span>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPrimaryImage(index)} className={`flex-1 px-2 py-1.5 rounded-lg text-xs border ${form.primaryImageIndex === index ? "border-accent-gold text-accent-gold bg-accent-gold/10" : "border-white/20 text-white/70"}`}>
                        {form.primaryImageIndex === index ? "عکس اصلی" : "انتخاب به‌عنوان اصلی"}
                      </button>
                      <button type="button" onClick={() => removeImage(index)} className="px-2 py-1.5 rounded-lg text-xs border border-rose-400/40 text-rose-300 hover:bg-rose-400/10">حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-white/15 rounded-xl p-8 text-center">
                <p className="text-white/30 text-sm">هنوز تصویری اضافه نشده است</p>
                <p className="text-white/20 text-xs mt-1">از URL یا آپلود فایل استفاده کنید</p>
              </div>
            )}
          </div>

          <button onClick={createVehicle} className="btn-primary w-full py-3 text-base">
            ثبت خودرو در نمایشگاه
          </button>
        </section>
      )}

      {/* --- Vehicles Tab --- */}
      {activeTab === "vehicles" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">خودروهای موجود ({vehicles.length.toLocaleString("fa-IR")})</h2>
            <button onClick={() => setActiveTab("add-vehicle")} className="btn-primary text-sm">+ افزودن خودرو</button>
          </div>
          {!vehicles.length ? (
            <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-10 text-center">
              <p className="text-white/40">هنوز خودرویی ثبت نشده است</p>
            </div>
          ) : null}
          {vehicles.map((vehicle) => {
            const statusLabels: Record<Vehicle["status"], string> = { available: "موجود", reserved: "رزرو شده", sold: "فروخته شده", archived: "بایگانی" }
            const statusColors: Record<Vehicle["status"], string> = { available: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10", reserved: "border-amber-500/40 text-amber-400 bg-amber-500/10", sold: "border-white/20 text-white/40 bg-white/5", archived: "border-red-500/30 text-red-400/60 bg-red-500/5" }
            return (
              <div key={vehicle.id} className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-4 flex flex-wrap items-center gap-4">
                <div className="w-20 h-14 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                  <img src={vehicle.vehicle.imageUrl} alt={vehicle.vehicle.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{vehicle.vehicle.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{vehicle.vehicle.year} · {vehicle.vehicle.model} · {vehicle.vehicle.city} · {vehicle.vehicle.mileageKm.toLocaleString("fa-IR")} km</p>
                  {vehicle.listedPriceIrr ? <p className="text-xs text-[#D4AF37] mt-0.5">{formatToman(vehicle.listedPriceIrr)} تومان</p> : null}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(["available", "reserved", "sold", "archived"] as Vehicle["status"][]).map((status) => (
                    <button key={status} onClick={() => void changeVehicleStatus(vehicle.id, status)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs border font-medium transition-all ${vehicle.status === status ? statusColors[status] : "border-white/10 text-white/40 hover:border-white/20"}`}>
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* --- Orders Tab --- */}
      {activeTab === "orders" && (
        <section className="space-y-3">
          <h2 className="text-xl font-black">سفارش‌ها ({orders.length.toLocaleString("fa-IR")})</h2>
          {!orders.length ? (
            <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-10 text-center">
              <p className="text-white/40">سفارشی ثبت نشده است</p>
            </div>
          ) : null}
          {orders.map((order) => {
            const orderStatusLabels: Record<Order["status"], string> = { pending: "در انتظار", paid: "پرداخت شده", completed: "تکمیل شده", cancelled: "لغو شده" }
            const orderStatusColors: Record<Order["status"], string> = { pending: "border-amber-500/40 text-amber-400 bg-amber-500/10", paid: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10", completed: "border-blue-500/40 text-blue-400 bg-blue-500/10", cancelled: "border-red-500/30 text-red-400 bg-red-500/10" }
            const paymentAssetLabels: Record<string, string> = { IRR: "تومان", GOLD_SOT: "سوت طلا", LOAN: "وام", CARD_TO_CARD: "کارت‌به‌کارت" }
            return (
              <div key={order.id} className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{order.vehicleTitle}</p>
                  <p className="text-xs text-white/50 mt-0.5">{order.buyerEmail}</p>
                  <p className="text-xs text-white/40 mt-0.5">{paymentAssetLabels[order.paymentAsset] ?? order.paymentAsset} · {formatToman(order.paymentAmount)} تومان</p>
                  <p className="text-xs text-white/30 mt-0.5">{new Date(order.createdAt).toLocaleString("fa-IR")}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(["pending", "paid", "completed", "cancelled"] as Order["status"][]).map((status) => (
                    <button key={status} onClick={() => void changeOrderStatus(order.id, status)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs border font-medium transition-all ${order.status === status ? orderStatusColors[status] : "border-white/10 text-white/40 hover:border-white/20"}`}>
                      {orderStatusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
