"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { UserPlus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ref = new URLSearchParams(window.location.search).get("ref")
      if (ref) setReferralCode(ref)
    }
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await register({ email, password, referralCode: referralCode || undefined })
      toast.success("ثبت نام انجام شد. حالا وارد شوید.")
      router.push("/login")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت نام")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-md mx-auto px-4" dir="rtl">
        <div className="card glass p-8">
          <h1 className="text-3xl font-black mb-2">ثبت نام</h1>
          <p className="text-sm text-dark-text/60 mb-6">عضو پلتفرم شوید و به قرعه کشی، کیف پول و بازی‌ها دسترسی بگیرید.</p>

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
              <label className="block text-sm text-dark-text/70 mb-2">رمز عبور (حداقل ۱۰ کاراکتر)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-bg/50 border border-dark-border/40 rounded-xl px-4 py-3"
                minLength={10}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-dark-text/70 mb-2">کد معرف (اختیاری)</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="w-full bg-dark-bg/50 border border-dark-border/40 rounded-xl px-4 py-3"
              />
            </div>
            <button disabled={loading} className="btn-primary w-full disabled:opacity-60">
              <UserPlus size={18} />
              {loading ? "در حال ثبت..." : "ایجاد حساب"}
            </button>
          </form>

          <p className="mt-6 text-sm text-dark-text/60">
            حساب دارید؟{" "}
            <Link href="/login" className="text-accent-gold font-bold">
              ورود
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
