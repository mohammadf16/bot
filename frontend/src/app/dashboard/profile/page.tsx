"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import { User, Mail, Phone, MapPin, Save, Bell, Shield, Image as ImageIcon } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

type NotificationPrefs = {
  email: boolean
  sms: boolean
  push: boolean
}

type ProfilePayload = {
  email: string
  role: "user" | "admin"
  profile: {
    fullName?: string
    username?: string
    phone?: string
    city?: string
    address?: string
    bio?: string
    avatarUrl?: string
  }
  notificationPrefs: NotificationPrefs
  createdAt: string
}

export default function ProfilePage() {
  const { user, refreshMe } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    phone: "",
    city: "",
    address: "",
    bio: "",
    avatarUrl: "",
    notificationPrefs: {
      email: true,
      sms: false,
      push: true,
    } as NotificationPrefs,
  })

  async function loadProfile() {
    setLoading(true)
    try {
      const data = await apiRequest<ProfilePayload>("/me/profile", { method: "GET" })
      setForm({
        fullName: data.profile.fullName ?? "",
        username: data.profile.username ?? "",
        phone: data.profile.phone ?? "",
        city: data.profile.city ?? "",
        address: data.profile.address ?? "",
        bio: data.profile.bio ?? "",
        avatarUrl: data.profile.avatarUrl ?? "",
        notificationPrefs: data.notificationPrefs ?? { email: true, sms: false, push: true },
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت اطلاعات پروفایل")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProfile()
  }, [])

  const initials = useMemo(() => {
    const source = form.fullName || user?.email || "کاربر"
    return source.slice(0, 1).toUpperCase()
  }, [form.fullName, user?.email])

  async function saveProfile() {
    setSaving(true)
    try {
      await apiRequest("/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: form.fullName || undefined,
          username: form.username || undefined,
          phone: form.phone || undefined,
          city: form.city || undefined,
          address: form.address || undefined,
          bio: form.bio || undefined,
          avatarUrl: form.avatarUrl || undefined,
          notificationPrefs: form.notificationPrefs,
        }),
      })
      await refreshMe()
      toast.success("پروفایل با موفقیت ذخیره شد")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره پروفایل")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">پروفایل کاربری</h1>
          <p className="text-white/40 text-sm mt-1">اطلاعات حساب، هویت و اعلان‌ها را مدیریت کنید.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[320px,1fr] gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-3xl font-black text-accent-gold">
              {initials}
            </div>
            <p className="mt-4 font-black">{form.fullName || "بدون نام"}</p>
            <p className="text-xs text-white/40 mt-1">{user?.email}</p>
            <div className="mt-4 w-full bg-white/5 rounded-xl p-3 border border-white/10 text-xs text-white/70">
              سطح دسترسی: {user?.role === "admin" ? "مدیر" : "کاربر"}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-6">
          <section className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-6">
            <h2 className="text-xl font-black mb-5 flex items-center gap-2">
              <User className="w-5 h-5 text-accent-gold" /> اطلاعات پایه
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field icon={<User className="w-4 h-4 text-white/40" />} label="نام و نام خانوادگی">
                <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} className="input" placeholder="مثال: علی محمدی" />
              </Field>
              <Field icon={<User className="w-4 h-4 text-white/40" />} label="نام کاربری">
                <input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} className="input" placeholder="مثال: ali_m" />
              </Field>
              <Field icon={<Phone className="w-4 h-4 text-white/40" />} label="شماره موبایل">
                <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="input" placeholder="0912..." />
              </Field>
              <Field icon={<MapPin className="w-4 h-4 text-white/40" />} label="شهر">
                <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className="input" placeholder="تهران" />
              </Field>
              <Field icon={<ImageIcon className="w-4 h-4 text-white/40" />} label="لینک آواتار">
                <input value={form.avatarUrl} onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))} className="input" placeholder="https://..." />
              </Field>
              <Field icon={<Mail className="w-4 h-4 text-white/40" />} label="ایمیل">
                <input value={user?.email ?? ""} className="input opacity-60" disabled />
              </Field>
            </div>
            <div className="mt-4">
              <label className="text-xs text-white/50 mb-2 block">آدرس</label>
              <input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className="input w-full" placeholder="آدرس کامل" />
            </div>
            <div className="mt-4">
              <label className="text-xs text-white/50 mb-2 block">بیو</label>
              <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} className="input w-full min-h-24" placeholder="توضیح کوتاه درباره خودتان" />
            </div>
          </section>

          <section className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-6">
            <h2 className="text-xl font-black mb-5 flex items-center gap-2">
              <Bell className="w-5 h-5 text-accent-cyan" /> تنظیمات اعلان
            </h2>
            <div className="grid md:grid-cols-3 gap-3">
              <Toggle
                label="ایمیل"
                checked={form.notificationPrefs.email}
                onChange={(v) => setForm((p) => ({ ...p, notificationPrefs: { ...p.notificationPrefs, email: v } }))}
              />
              <Toggle
                label="پیامک"
                checked={form.notificationPrefs.sms}
                onChange={(v) => setForm((p) => ({ ...p, notificationPrefs: { ...p.notificationPrefs, sms: v } }))}
              />
              <Toggle
                label="Push"
                checked={form.notificationPrefs.push}
                onChange={(v) => setForm((p) => ({ ...p, notificationPrefs: { ...p.notificationPrefs, push: v } }))}
              />
            </div>
          </section>

          <section className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-6">
            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-400" /> امنیت
            </h2>
            <p className="text-sm text-white/50 mb-4">در نسخه بعدی: تغییر رمز عبور، خروج از همه دستگاه‌ها و تایید دو مرحله‌ای.</p>
            <button onClick={saveProfile} disabled={saving || loading} className="btn-primary w-full md:w-auto disabled:opacity-60">
              <Save className="w-4 h-4" />
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </section>
        </motion.div>
      </div>
    </div>
  )
}

function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <label className="text-xs text-white/50 mb-2 block">{label}</label>
      <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
        {icon}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`p-4 rounded-xl border text-right transition ${checked ? "border-accent-gold bg-accent-gold/10" : "border-white/10 bg-white/5"}`}
    >
      <p className="font-bold">{label}</p>
      <p className="text-xs text-white/50 mt-1">{checked ? "فعال" : "غیرفعال"}</p>
    </button>
  )
}
