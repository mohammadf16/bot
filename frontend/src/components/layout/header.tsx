"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Menu, X, LogOut, ChevronLeft } from "lucide-react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import toast from "react-hot-toast"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()
  const isDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMenuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMenuOpen])

  if (isDashboard) return null

  const menuItems = [
    { label: "خانه", href: "/" },
    { label: "خودرو", href: "/cars" },
    { label: "مزایده", href: "/auction" },
    { label: "وام", href: "/loan" },
    { label: "کیف پول", href: "/wallet" },
    { label: "قرعه کشی ها", href: "/raffles" },
    { label: "درباره ما", href: "/about" },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled ? "bg-black/75 backdrop-blur-md border-b border-white/5 py-3" : "bg-transparent py-6"
      }`}
    >
      <nav className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-12 flex items-center justify-between gap-2">
        <div className="hidden lg:flex items-center gap-5 xl:gap-7 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xs xl:text-sm font-semibold whitespace-nowrap transition-all duration-300 hover:text-[#D4AF37] ${
                pathname === item.href ? "text-[#D4AF37]" : "text-white/70"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <Link href="/" className="flex flex-col items-center group relative">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl sm:text-3xl md:text-4xl font-black tracking-[0.18em] text-white">
            LUX<span className="text-[#D4AF37]">.</span>
          </motion.div>
          <div className="h-[1px] w-0 group-hover:w-full bg-[#D4AF37] transition-all duration-500 absolute -bottom-1" />
        </Link>

        <div className="flex items-center justify-end gap-2 sm:gap-4 md:gap-8 flex-1">
          <Link href={isAuthenticated ? (user?.role === "admin" ? "/admin/dashboard" : "/dashboard") : "/login"} className="flex items-center gap-2 group">
            <span className="hidden md:block text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 group-hover:text-[#D4AF37] transition-colors">
              {isAuthenticated ? "حساب کاربری" : "ورود / ثبت نام"}
            </span>
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#D4AF37]/50 group-hover:bg-[#D4AF37]/5 transition-all duration-500">
              <User size={18} className="text-white/70 group-hover:text-[#D4AF37] transition-colors" />
            </div>
          </Link>
          {isAuthenticated && (
            <button
              type="button"
              onClick={async () => {
                await logout()
                toast.success("از حساب خارج شدید")
              }}
              className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-rose-400/40 text-xs"
            >
              <LogOut size={14} />
              خروج
            </button>
          )}

          <button className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10" onClick={() => setIsMenuOpen(!isMenuOpen)} type="button">
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm lg:hidden"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="mr-auto h-full w-[86%] max-w-sm border-l border-white/10 bg-[#0B0B0B] p-5 flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="text-xl font-black tracking-[0.2em]">
                  LUX<span className="text-[#D4AF37]">.</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-white/5 rounded-lg border border-white/10" type="button">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
                {menuItems.map((item, i) => (
                  <motion.div key={item.href} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center justify-between w-full border-b border-white/10 px-1 py-4 text-base leading-tight font-bold transition-all ${
                        pathname === item.href
                          ? "text-[#D4AF37]"
                          : "text-white/90 hover:text-[#D4AF37]"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronLeft size={16} className="opacity-60" />
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto pt-5 border-t border-white/10 flex flex-col gap-3">
                <Link
                  href={isAuthenticated ? (user?.role === "admin" ? "/admin/dashboard" : "/dashboard") : "/login"}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-3 py-3 rounded-xl bg-[#D4AF37] text-black font-black"
                >
                  <User size={18} />
                  {isAuthenticated ? "پنل کاربری" : "ورود / ثبت نام"}
                </Link>
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={async () => {
                      await logout()
                      setIsMenuOpen(false)
                      toast.success("از حساب خارج شدید")
                    }}
                    className="flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold"
                  >
                    <LogOut size={18} />
                    خروج
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
