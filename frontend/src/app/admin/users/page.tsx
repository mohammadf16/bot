"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { formatToman } from "@/lib/money"

type AdminUser = {
  id: string
  email: string
  role: "user" | "admin"
  walletBalance: number
  chances: number
  status: "active" | "suspended"
  profile?: {
    fullName?: string
    phone?: string
    city?: string
  }
}

type AdminUserDetail = {
  user: AdminUser & {
    referralCode: string
    profile?: {
      fullName?: string
      username?: string
      phone?: string
      city?: string
      address?: string
      bio?: string
      avatarUrl?: string
    }
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{
    role: "user" | "admin"
    status: "active" | "suspended"
    walletBalance: number
    chances: number
    fullName: string
    username: string
    phone: string
    city: string
    address: string
    bio: string
  } | null>(null)

  async function loadUsers() {
    setLoading(true)
    try {
      const data = await apiRequest<{ items: AdminUser[] }>("/admin/users")
      setUsers(data.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت کاربران")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const selectedUser = useMemo(() => users.find((u) => u.id === selectedId) ?? null, [users, selectedId])

  async function openEditor(userId: string) {
    try {
      const data = await apiRequest<AdminUserDetail>(`/admin/users/${userId}`)
      setSelectedId(userId)
      setForm({
        role: data.user.role,
        status: data.user.status,
        walletBalance: data.user.walletBalance,
        chances: data.user.chances,
        fullName: data.user.profile?.fullName ?? "",
        username: data.user.profile?.username ?? "",
        phone: data.user.profile?.phone ?? "",
        city: data.user.profile?.city ?? "",
        address: data.user.profile?.address ?? "",
        bio: data.user.profile?.bio ?? "",
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت اطلاعات کاربر")
    }
  }

  async function saveUser() {
    if (!selectedId || !form) return
    setSaving(true)
    try {
      await apiRequest(`/admin/users/${selectedId}`, {
        method: "PUT",
        body: JSON.stringify({
          role: form.role,
          status: form.status,
          walletBalance: Number(form.walletBalance),
          chances: Number(form.chances),
          profile: {
            fullName: form.fullName || undefined,
            username: form.username || undefined,
            phone: form.phone || undefined,
            city: form.city || undefined,
            address: form.address || undefined,
            bio: form.bio || undefined,
          },
        }),
      })
      toast.success("اطلاعات کاربر ذخیره شد")
      await loadUsers()
      setSelectedId(null)
      setForm(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره اطلاعات کاربر")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-4xl font-bold">مدیریت کاربران</h1>

      <div className="card glass overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-dark-bg/50 border-b border-dark-border/30">
            <tr>
              <th className="px-6 py-4 text-right font-semibold">ایمیل</th>
              <th className="px-6 py-4 text-right font-semibold">نام</th>
              <th className="px-6 py-4 text-right font-semibold">نقش</th>
              <th className="px-6 py-4 text-right font-semibold">موجودی</th>
              <th className="px-6 py-4 text-right font-semibold">شانس</th>
              <th className="px-6 py-4 text-right font-semibold">وضعیت</th>
              <th className="px-6 py-4 text-right font-semibold">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-6 py-6" colSpan={7}>در حال بارگذاری...</td>
              </tr>
            )}
            {!loading &&
              users.map((user) => (
                <tr key={user.id} className="border-b border-dark-border/10">
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.profile?.fullName || "-"}</td>
                  <td className="px-6 py-4">{user.role === "admin" ? "ادمین" : "کاربر"}</td>
                  <td className="px-6 py-4">{formatToman(user.walletBalance)} تومان</td>
                  <td className="px-6 py-4">{user.chances.toLocaleString("fa-IR")}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${user.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                      {user.status === "active" ? "فعال" : "مسدود"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => openEditor(user.id)} className="px-3 py-2 rounded-lg border border-white/20 hover:bg-white/10">
                      ویرایش
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selectedUser && form && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">ویرایش کاربر</h2>
              <button onClick={() => { setSelectedId(null); setForm(null) }} className="text-white/60 hover:text-white">بستن</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="ایمیل">
                <input value={selectedUser.email} disabled className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 opacity-70" />
              </Field>
              <Field label="نقش">
                <select value={form.role} onChange={(e) => setForm((p) => (p ? { ...p, role: e.target.value as "user" | "admin" } : p))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <option value="user">کاربر</option>
                  <option value="admin">ادمین</option>
                </select>
              </Field>
              <Field label="وضعیت">
                <select value={form.status} onChange={(e) => setForm((p) => (p ? { ...p, status: e.target.value as "active" | "suspended" } : p))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <option value="active">فعال</option>
                  <option value="suspended">مسدود</option>
                </select>
              </Field>
              <Field label="موجودی (تومان)">
                <input type="number" value={form.walletBalance} onChange={(e) => setForm((p) => (p ? { ...p, walletBalance: Number(e.target.value) } : p))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" />
              </Field>
              <Field label="شانس">
                <input type="number" value={form.chances} onChange={(e) => setForm((p) => (p ? { ...p, chances: Number(e.target.value) } : p))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" />
              </Field>
              <Field label="نام کامل">
                <input value={form.fullName} onChange={(e) => setForm((p) => (p ? { ...p, fullName: e.target.value } : p))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" />
              </Field>
              <Field label="نام کاربری">
                <input value={form.username} onChange={(e) => setForm((p) => (p ? { ...p, username: e.target.value } : p))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" />
              </Field>
              <Field label="موبایل">
                <input value={form.phone} onChange={(e) => setForm((p) => (p ? { ...p, phone: e.target.value } : p))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" />
              </Field>
              <Field label="شهر">
                <input value={form.city} onChange={(e) => setForm((p) => (p ? { ...p, city: e.target.value } : p))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" />
              </Field>
              <Field label="آدرس">
                <input value={form.address} onChange={(e) => setForm((p) => (p ? { ...p, address: e.target.value } : p))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" />
              </Field>
            </div>

            <Field label="بیو">
              <textarea value={form.bio} onChange={(e) => setForm((p) => (p ? { ...p, bio: e.target.value } : p))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-h-24" />
            </Field>

            <button onClick={saveUser} disabled={saving} className="btn-primary mt-6 disabled:opacity-60">
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs text-white/60 mb-1">{label}</label>
      {children}
    </div>
  )
}
