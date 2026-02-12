"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, LogIn, Menu, X, Trophy } from "lucide-react"
import { usePathname } from "next/navigation"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (isDashboard) return null

  const menuItems = [
    { label: "خانه", href: "/" },
    { label: "قرعه‌کشی‌ها", href: "/raffles" },
    { label: "گردونه شانس", href: "/wheel" },
    { label: "مزایده‌ها", href: "/auction" },
    { label: "درباره ما", href: "/about" },
  ]

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent py-6"
      }`}
    >
      <nav className="max-w-[1800px] mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* Left Side: Navigation Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-8 flex-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium tracking-widest uppercase transition-all duration-300 hover:text-[#D4AF37] ${
                pathname === item.href ? "text-[#D4AF37]" : "text-white/70"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Center: Branding */}
        <Link 
          href="/" 
          className="flex flex-col items-center group relative"
        >
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-black tracking-[0.2em] text-white"
          >
            LUX<span className="text-[#D4AF37]">.</span>
          </motion.div>
          <div className="h-[1px] w-0 group-hover:w-full bg-[#D4AF37] transition-all duration-500 absolute -bottom-1" />
        </Link>

        {/* Right Side: Actions */}
        <div className="flex items-center justify-end gap-4 md:gap-8 flex-1">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <span className="hidden md:block text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 group-hover:text-[#D4AF37] transition-colors">
              حساب کاربری
            </span>
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#D4AF37]/50 group-hover:bg-[#D4AF37]/5 transition-all duration-500">
              <User size={18} className="text-white/70 group-hover:text-[#D4AF37] transition-colors" />
            </div>
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[110] bg-black lg:hidden"
          >
            <div className="flex flex-col h-full p-8">
              <div className="flex justify-between items-center mb-16">
                <div className="text-2xl font-black tracking-widest">LUX<span className="text-[#D4AF37]">.</span></div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-white/5 rounded-lg">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {menuItems.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="text-4xl font-bold hover:text-[#D4AF37] transition-colors"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto pt-8 border-t border-white/10 flex flex-col gap-4">
                <Link 
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#D4AF37] text-black font-black"
                >
                  <User size={20} />
                  پنل کاربری
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
