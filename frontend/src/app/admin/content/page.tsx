"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminContentRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin/settings")
  }, [router])
  return (
    <div className="flex items-center justify-center h-64 text-white/40 text-sm" dir="rtl">
      در حال انتقال به پنل مدیریت سایت و محتوا...
    </div>
  )
}
