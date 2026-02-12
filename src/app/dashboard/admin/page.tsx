"use client"

import { motion } from "framer-motion"
import { Users, Car, DollarSign, TrendingUp, Eye, Settings, PlusCircle, BarChart3 } from "lucide-react"
import Link from "next/link"

const StatCard = ({ title, value, icon: Icon, trend, color = "#D4AF37" }: {
  title: string;
  value: string;
  icon: any;
  trend?: number;
  color?: string;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-xl bg-white/5" style={{ backgroundColor: `${color}20` }}>
        <Icon size={24} style={{ color }} />
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-green-400 text-sm">
          <TrendingUp size={16} />
          <span>+{trend}%</span>
        </div>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-white/60 text-sm">{title}</p>
    </div>
  </motion.div>
)

const QuickAction = ({ title, icon: Icon, href, description, color = "#D4AF37" }: {
  title: string;
  icon: any;
  href: string;
  description: string;
  color?: string;
}) => (
  <Link href={href}>
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-4 mb-3">
        <div className="p-3 rounded-xl bg-white/5" style={{ backgroundColor: `${color}20` }}>
          <Icon size={24} style={{ color: color }} />
        </div>
        <div>
          <h3 className="font-bold text-white group-hover:text-[#D4AF37] transition-colors">{title}</h3>
          <p className="text-white/60 text-sm">{description}</p>
        </div>
      </div>
    </motion.div>
  </Link>
)

export default function AdminDashboard() {
  const stats = [
    { title: "کاربران کل", value: "2,847", icon: Users, trend: 12, color: "#3B82F6" },
    { title: "قرعه‌کشی‌ها", value: "15", icon: Car, trend: 8, color: "#10B981" },
    { title: "درآمد امروز", value: "۱۵.۲ میلیون تومان", icon: DollarSign, trend: 15, color: "#D4AF37" },
    { title: "بازدید سایت", value: "12,543", icon: Eye, trend: 22, color: "#8B5CF6" }
  ]

  const quickActions = [
    { title: "مدیریت کاربران", icon: Users, href: "/dashboard/admin/users", description: "مشاهده و ویرایش کاربران", color: "#3B82F6" },
    { title: "مدیریت قرعه‌کشی‌ها", icon: Car, href: "/dashboard/admin/raffles", description: "ایجاد و مدیریت قرعه‌کشی‌ها", color: "#10B981" },
    { title: "گزارش مالی", icon: BarChart3, href: "/dashboard/admin/financial", description: "بررسی درآمد و هزینه‌ها", color: "#D4AF37" },
    { title: "تنظیمات سایت", icon: Settings, href: "/dashboard/admin/settings", description: "تنظیمات کلی سایت", color: "#8B5CF6" },
    { title: "ایجاد قرعه‌کشی جدید", icon: PlusCircle, href: "/dashboard/admin/raffles/new", description: "افزودن قرعه‌کشی جدید", color: "#F59E0B" }
  ]

  return (
    <div dir="rtl" className="min-h-screen bg-[#050505] text-white p-6">
      {/* هدر */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-2"
        >
          <h1 className="text-3xl font-black">داشبورد مدیریت</h1>
          <div className="text-sm text-white/60">
            آخرین بروزرسانی: {new Date().toLocaleTimeString('fa-IR')}
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-white/60"
        >
          خوش آمدید، ادمین گرامی
        </motion.p>
      </div>

      {/* آمار کلی */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* دسترسی سریع */}
      <div className="mb-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-black mb-6"
        >
          دسترسی سریع
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <QuickAction key={index} {...action} />
          ))}
        </div>
      </div>

      {/* فعالیت‌های اخیر */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-xl font-black mb-4">فعالیت‌های اخیر</h2>
        <div className="space-y-4">
          {[
            { user: "علی محمدی", action: "در قرعه‌کشی لامبورگینی شرکت کرد", time: "۲ دقیقه پیش", color: "#10B981" },
            { user: "زهرا احمدی", action: "برنده جایزه سوم شد", time: "۱۵ دقیقه پیش", color: "#D4AF37" },
            { user: "رضا کریمی", action: "حساب کاربری خود را ارتقا داد", time: "۱ ساعت پیش", color: "#3B82F6" }
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activity.color }} />
              <div className="flex-1">
                <p className="font-bold text-white">{activity.user}</p>
                <p className="text-white/60 text-sm">{activity.action}</p>
              </div>
              <div className="text-white/40 text-sm">{activity.time}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}