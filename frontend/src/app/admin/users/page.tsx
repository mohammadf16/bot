"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { formatMoneyInput, formatToman, parseBoundedIntInput } from "@/lib/money"

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

type EditForm = {
  role: "user" | "admin"
  status: "active" | "suspended"
  walletBalance: string
  chances: string
  fullName: string
  username: string
  phone: string
  city: string
  address: string
  bio: string
}

function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all")
  const [form, setForm] = useState<EditForm | null>(null)

  async function loadUsers() {
    setLoading(true)
    try {
      const data = await apiRequest<{ items: AdminUser[] }>("/admin/users")
      setUsers(data.items ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دریافت کاربران")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const normalizedQuery = useMemo(() => toEnglishDigits(query).trim().toLowerCase(), [query])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false
      if (statusFilter !== "all" && user.status !== statusFilter) return false
      if (!normalizedQuery) return true

      const fullName = user.profile?.fullName ?? ""
      const phone = user.profile?.phone ?? ""
      const haystack = [user.id, user.email, fullName, phone].join(" ").toLowerCase()
      return toEnglishDigits(haystack).includes(normalizedQuery)
    })
  }, [users, normalizedQuery, roleFilter, statusFilter])

  const summary = useMemo(() => {
    const totalWallet = users.reduce((sum, user) => sum + (Number.isFinite(user.walletBalance) ? user.walletBalance : 0), 0)
    return {
      total: users.length,
      admins: users.filter((user) => user.role === "admin").length,
      suspended: users.filter((user) => user.status === "suspended").length,
      totalWallet,
    }
  }, [users])

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedId) ?? null, [users, selectedId])

  async function openEditor(userId: string) {
    try {
      const data = await apiRequest<AdminUserDetail>(`/admin/users/${userId}`)
      setSelectedId(userId)
      setForm({
        role: data.user.role,
        status: data.user.status,
        walletBalance: String(data.user.walletBalance ?? 0),
        chances: String(data.user.chances ?? 0),
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

  function closeEditor() {
    setSelectedId(null)
    setForm(null)
  }

  function setNumberField(field: "walletBalance" | "chances", value: string) {
    setForm((prev) => {
      if (!prev) return prev
      const parsed = parseBoundedIntInput(value, { min: 0 })
      return { ...prev, [field]: parsed === null ? "" : String(parsed) }
    })
  }

  const canSave = useMemo(() => {
    if (!form) return false
    const wallet = Number(form.walletBalance || 0)
    const chances = Number(form.chances || 0)
    return Number.isFinite(wallet) && wallet >= 0 && Number.isFinite(chances) && chances >= 0
  }, [form])

  async function saveUser() {
    if (!selectedId || !form || !canSave) {
      toast.error("فرم کاربر کامل نیست")
      return
    }

    setSaving(true)
    try {
      await apiRequest(`/admin/users/${selectedId}`, {
        method: "PUT",
        body: JSON.stringify({
          role: form.role,
          status: form.status,
          walletBalance: Number(form.walletBalance || 0),
          chances: Number(form.chances || 0),
          profile: {
            fullName: form.fullName.trim() || undefined,
            username: form.username.trim() || undefined,
            phone: form.phone.trim() || undefined,
            city: form.city.trim() || undefined,
            address: form.address.trim() || undefined,
            bio: form.bio.trim() || undefined,
          },
        }),
      })
      toast.success("اطلاعات کاربر ذخیره شد")
      await loadUsers()
      closeEditor()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره اطلاعات کاربر")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-3xl md:text-4xl font-black">مدیریت کاربران</h1>

      <section className="grid md:grid-cols-4 gap-3">
        <div className="card glass p-4">کل کاربران: {summary.total.toLocaleString("fa-IR")}</div>
        <div className="card glass p-4">ادمین‌ها: {summary.admins.toLocaleString("fa-IR")}</div>
        <div className="card glass p-4">کاربران مسدود: {summary.suspended.toLocaleString("fa-IR")}</div>
        <div className="card glass p-4">جمع موجودی کیف پول: {formatToman(summary.totalWallet)} تومان</div>
      </section>

      <section className="card glass p-4 grid md:grid-cols-[1fr_auto_auto] gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو با ایمیل، نام، موبایل یا شناسه"
            className="w-full bg-black/30 border border-white/15 rounded-xl pr-9 pl-3 py-2"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="bg-black/30 border border-white/15 rounded-xl px-3 py-2"
        >
          <option value="all">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="suspended">مسدود</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="bg-black/30 border border-white/15 rounded-xl px-3 py-2"
        >
          <option value="all">همه نقش‌ها</option>
          <option value="user">کاربر</option>
          <option value="admin">ادمین</option>
        </select>
      </section>

      <div className="card glass overflow-x-auto">
        <table className="w-full text-sm min-w-[920px]">
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
            {loading ? (
              <tr>
                <td className="px-6 py-6 text-white/70" colSpan={7}>در حال بارگذاری کاربران...</td>
              </tr>
            ) : !filteredUsers.length ? (
              <tr>
                <td className="px-6 py-6 text-white/70" colSpan={7}>کاربری با فیلتر فعلی پیدا نشد.</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
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
                    <button onClick={() => void openEditor(user.id)} className="px-3 py-2 rounded-lg border border-white/20 hover:bg-white/10">
                      ویرایش
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedUser && form ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">ویرایش کاربر</h2>
              <button onClick={closeEditor} className="text-white/60 hover:text-white">بستن</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="ایمیل">
                <input value={selectedUser.email} disabled className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 opacity-70" />
              </Field>

              <Field label="نقش">
                <select value={form.role} onChange={(e) => setForm((prev) => (prev ? { ...prev, role: e.target.value as "user" | "admin" } : prev))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <option value="user">کاربر</option>
                  <option value="admin">ادمین</option>
                </select>
              </Field>

              <Field label="وضعیت">
                <select value={form.status} onChange={(e) => setForm((prev) => (prev ? { ...prev, status: e.target.value as "active" | "suspended" } : prev))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <option value="active">فعال</option>
                  <option value="suspended">مسدود</option>
                </select>
              </Field>

              <Field label="موجودی کیف پول (تومان)">
                <input
                  value={formatMoneyInput(form.walletBalance)}
                  onChange={(e) => setNumberField("walletBalance", e.target.value)}
                  inputMode="numeric"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                />
              </Field>

              <Field label="شانس">
                <input
                  value={formatMoneyInput(form.chances)}
                  onChange={(e) => setNumberField("chances", e.target.value)}
                  inputMode="numeric"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                />
              </Field>

              <Field label="نام کامل">
                <input value={form.fullName} onChange={(e) => setForm((prev) => (prev ? { ...prev, fullName: e.target.value } : prev))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" />
              </Field>

              <Field label="نام کاربری">
                <input value={form.username} onChange={(e) => setForm((prev) => (prev ? { ...prev, username: e.target.value } : prev))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" />
              </Field>

              <Field label="موبایل">
                <input value={form.phone} onChange={(e) => setForm((prev) => (prev ? { ...prev, phone: e.target.value } : prev))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" />
              </Field>

              <Field label="شهر">
                <input value={form.city} onChange={(e) => setForm((prev) => (prev ? { ...prev, city: e.target.value } : prev))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" />
              </Field>

              <Field label="آدرس">
                <input value={form.address} onChange={(e) => setForm((prev) => (prev ? { ...prev, address: e.target.value } : prev))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" />
              </Field>
            </div>

            <Field label="بیو">
              <textarea value={form.bio} onChange={(e) => setForm((prev) => (prev ? { ...prev, bio: e.target.value } : prev))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-h-24" />
            </Field>

            <button onClick={() => void saveUser()} disabled={saving || !canSave} className="btn-primary mt-6 disabled:opacity-60">
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </div>
        </div>
      ) : null}
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
