"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  LayoutDashboard, 
  Ticket, 
  Wallet, 
  User, 
  LogOut, 
  Bell, 
  Menu, 
  X,
  ChevronLeft,
  History,
  ShieldCheck,
  Calculator
} from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const userMenu = [
    { label: "داشبورد", href: "/dashboard", icon: LayoutDashboard },
    { label: "خرید بلیط", href: "/raffles", icon: Ticket },
    { label: "ماشین‌حساب سود", href: "/dashboard/calculator", icon: Calculator },
    { label: "کیف پول و شارژ", href: "/dashboard/wallet", icon: Wallet },
    { label: "زیرمجموعه‌گیری", href: "/dashboard/referral", icon: User },
    { label: "تاریخچه جوایز", href: "/dashboard/history", icon: History },
    { label: "قوانین و مقررات", href: "/dashboard/rules", icon: ShieldCheck }
  ]

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 h-screen z-50 bg-[#0A0A0A] border-l border-white/5 transition-all duration-300 ease-in-out
        w-72 ${isMenuOpen ? 'right-0' : '-right-72 lg:right-0'}
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-12 px-2">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                <ChevronLeft className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-xl font-black tracking-tighter">LUX<span className="text-[#D4AF37]">.</span></h1>
            </Link>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {userMenu.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative
                    ${isActive 
                      ? 'bg-[#D4AF37] text-black font-bold shadow-[0_10px_20px_-5px_rgba(212,175,55,0.3)]' 
                      : 'hover:bg-white/5 text-white/40 hover:text-white'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="text-sm">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute inset-0 bg-[#D4AF37] rounded-2xl -z-10"
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <button className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-colors w-full">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-bold">خروج از حساب</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-colors text-[#D4AF37]"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
                <User size={14} className="text-[#D4AF37]" />
              </div>
              <div className="flex flex-col">
                <span className="text-white/20 text-[10px] leading-none mb-1">پنل کاربری</span>
                <span className="text-xs font-bold text-white">خوش آمدید، علیرضا عزیز</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden md:flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <div className="text-right">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none mb-1">موجودی کیف پول</p>
                <p className="text-sm font-black text-[#D4AF37]">۲۵,۴۰۰,۰۰۰ تومان</p>
              </div>
              <Link href="/dashboard/wallet" className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center hover:scale-105 transition-transform">
                <Wallet className="w-4 h-4 text-black" />
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-white/5 rounded-xl transition-colors group">
                <Bell size={20} className="text-white/40 group-hover:text-white transition-colors" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#D4AF37] rounded-full border-2 border-[#050505]" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
      
      {/* Overlay for mobile sidebar */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  )
}
