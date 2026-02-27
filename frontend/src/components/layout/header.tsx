"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Menu, X, LogOut, ChevronLeft } from "lucide-react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useSiteSettings } from "@/lib/site-settings-context"
import toast from "react-hot-toast"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()
  const { settings } = useSiteSettings()
  const isDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")
  const siteName = settings.general.siteName || "LUX"
  const announcement = settings.header.announcementBarActive ? settings.header : null

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

  const defaultMenuItems = [
    { label: "خانه", href: "/" },
    { label: "خودرو", href: "/cars" },
    { label: "حواله خودرو", href: "/checks" },
    { label: "ماشین اسلاید", href: "/slide-game" },
    { label: "مزایده", href: "/auction" },
    { label: "وام", href: "/loan" },
    { label: "کیف پول", href: "/wallet" },
    { label: "قرعه کشی ها", href: "/raffles" },
    { label: "درباره ما", href: "/about" },
  ]
  const menuItems = (settings.header.navLinks && settings.header.navLinks.length > 0)
    ? settings.header.navLinks
    : defaultMenuItems

  return (
    <>
    {announcement && (
      <div
        style={{ background: announcement.announcementColor }}
        className="w-full text-center py-2 text-xs font-bold text-black z-[101] relative"
      >
        {announcement.announcementLink
          ? <a href={announcement.announcementLink}>{announcement.announcementText}</a>
          : <span>{announcement.announcementText}</span>
        }
      </div>
    )}
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled ? "bg-black/80 backdrop-blur-md border-b border-white/10 py-2.5" : "bg-transparent py-4"
      }`}
    >
      <nav className="max-w-[1800px] mx-auto px-3 sm:px-6 md:px-8 xl:px-12 flex items-center justify-between gap-3">
        <div className="hidden md:flex items-center gap-2 lg:gap-3 xl:gap-4 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 text-xs lg:text-sm font-semibold whitespace-nowrap transition-all duration-300 hover:text-[#D4AF37] ${
                pathname === item.href ? "text-[#D4AF37]" : "text-white/70"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <Link href="/" className="shrink-0 flex flex-col items-center group relative">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-[0.18em] text-white">
            {siteName}<span className="text-[#D4AF37]">.</span>
          </motion.div>
          <div className="h-[1px] w-0 group-hover:w-full bg-[#D4AF37] transition-all duration-500 absolute -bottom-1" />
        </Link>

        <div className="flex items-center justify-end gap-2 sm:gap-3 md:gap-4 lg:gap-5 flex-1 shrink-0">
          <Link href={isAuthenticated ? (user?.role === "admin" ? "/admin/dashboard" : "/dashboard") : "/login"} className="flex items-center gap-2 group">
            <span className="hidden xl:block text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 group-hover:text-[#D4AF37] transition-colors">
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
              className="hidden xl:inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-rose-400/40 text-xs"
            >
              <LogOut size={14} />
              خروج
            </button>
          )}

          <button
            className="md:hidden h-11 px-3.5 flex items-center justify-center gap-2 rounded-xl bg-black/80 border border-[#D4AF37]/45 text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "بستن منو" : "باز کردن منو"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu-drawer"
            type="button"
          >
            {isMenuOpen ? <X size={19} /> : <Menu size={19} />}
            <span className="text-[11px] font-black tracking-wide">{isMenuOpen ? "بستن" : "منو"}</span>
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
            className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div
              id="mobile-menu-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="ml-auto h-full w-[92%] max-w-[380px] border-l border-white/10 bg-[#0B0B0B] px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-5 flex flex-col"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="text-xl font-black tracking-[0.2em]">
                    {siteName}<span className="text-[#D4AF37]">.</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">منوی سایت</p>
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
    </>
  )
}
