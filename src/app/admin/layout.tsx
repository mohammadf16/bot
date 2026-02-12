"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Trophy, 
  PieChart, 
  Gift, 
  Radio, 
  FileText, 
  ShieldAlert,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
} from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const adminMenu = [
    { label: "داشبورد", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "کاربران", href: "/admin/users", icon: Users },
    { label: "تراکنش‌های مالی", href: "/admin/finance", icon: CreditCard },
    { label: "مدیریت قرعه‌کشی", href: "/admin/raffles", icon: Trophy },
    { label: "تعرفه‌ها و قیمت", href: "/admin/pricing", icon: PieChart },
    { label: "تنظیمات گردونه", href: "/admin/wheel", icon: Gift },
    { label: "جوایز و هدایا", href: "/admin/rewards", icon: Bell },
    { label: "مانیتورینگ لایو", href: "/admin/live", icon: Radio },
    { label: "مدیریت محتوا", href: "/admin/content", icon: FileText },
    { label: "گزارشات سیستم", href: "/admin/audit", icon: ShieldAlert },
  ]

  return (
    <div className="min-h-screen bg-[#080808] text-white flex">
      {/* Sidebar - Desktop */}
      <aside className={`
        fixed lg:sticky top-0 h-screen z-50 bg-[#0C0C0C] border-l border-white/5 transition-all duration-300
        ${isMenuOpen ? 'w-72 right-0' : 'w-72 -right-72 lg:right-0'}
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-4 mb-12 px-2">
            <div className="w-10 h-10 bg-accent-gold rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-xl font-black tracking-tighter">پنل <span className="text-accent-gold">مدیریت</span></h1>
          </div>

          <nav className="flex-1 space-y-2">
            {adminMenu.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group
                    ${isActive 
                      ? 'bg-accent-gold text-black font-bold shadow-[0_0_20px_rgba(255,215,0,0.2)]' 
                      : 'hover:bg-white/5 text-white/50 hover:text-white'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <button className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors w-full">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-bold">خروج از پنل</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 bg-[#080808]/80 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-colors"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
            <div className="hidden md:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5 w-64 lg:w-96">
              <Search className="w-4 h-4 text-white/30" />
              <input 
                type="text" 
                placeholder="جستجو در پنل..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-white/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button className="relative p-2 hover:bg-white/5 rounded-xl transition-colors group">
              <Bell className="w-5 h-5 text-white/50 group-hover:text-white" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent-gold rounded-full" />
            </button>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">مدیر سیستم</p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Super Admin</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-gold to-yellow-600 p-px">
                <div className="w-full h-full rounded-[11px] bg-[#0C0C0C] flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent-gold" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
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
