"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { LogIn } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const loggedInUser = await login({ email, password })
      toast.success("ورود با موفقیت انجام شد")
      router.push(loggedInUser.role === "admin" ? "/admin/dashboard" : "/dashboard")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ورود")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-md mx-auto px-4" dir="rtl">
        <div className="card glass p-8">
          <h1 className="text-3xl font-black mb-2">ورود</h1>
          <p className="text-sm text-dark-text/60 mb-6">برای خرید بلیط، کیف پول و پنل مدیریت وارد شوید.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-dark-text/70 mb-2">ایمیل</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-bg/50 border border-dark-border/40 rounded-xl px-4 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-dark-text/70 mb-2">رمز عبور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-bg/50 border border-dark-border/40 rounded-xl px-4 py-3"
                required
              />
            </div>
            <button disabled={loading} className="btn-primary w-full disabled:opacity-60">
              <LogIn size={18} />
              {loading ? "در حال ورود..." : "ورود به حساب"}
            </button>
          </form>

          <p className="mt-6 text-sm text-dark-text/60">
            حساب ندارید؟{" "}
            <Link href="/register" className="text-accent-gold font-bold">
              ثبت نام
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

