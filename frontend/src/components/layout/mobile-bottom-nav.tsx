"use client"

import type { ComponentType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CarFront, ClipboardList, Home, Tickets, UserRound } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

type NavItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
}

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuth()

  const isHidden =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/dashboard") ||
    pathname === "/login" ||
    pathname === "/register"

  if (isHidden) return null

  const accountHref = isAuthenticated ? (user?.role === "admin" ? "/admin/dashboard" : "/dashboard") : "/login"

  const items: NavItem[] = [
    { href: "/", label: "خانه", icon: Home },
    { href: "/cars", label: "خودرو", icon: CarFront },
    { href: "/checks", label: "حواله", icon: ClipboardList },
    { href: "/raffles", label: "قرعه‌کشی", icon: Tickets },
    { href: accountHref, label: isAuthenticated ? "پنل" : "ورود", icon: UserRound },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[90] md:hidden pointer-events-none">
      <div className="mx-3 mb-2 mobile-safe-bottom rounded-2xl border border-white/15 bg-black/85 backdrop-blur-xl shadow-[0_12px_35px_rgba(0,0,0,0.55)] pointer-events-auto">
        <div className="grid grid-cols-5">
          {items.map((item) => {
            const active = isItemActive(pathname ?? "", item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 px-1 py-2.5 text-[11px] font-bold transition-colors ${
                  active ? "text-[#D4AF37]" : "text-white/70"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${active ? "text-[#D4AF37]" : "text-white/70"}`} />
                <span className="truncate max-w-[100%]">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
