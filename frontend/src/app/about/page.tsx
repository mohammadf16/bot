"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Crown, ShieldCheck, Sparkles, Timer, Trophy, Users, Wallet } from "lucide-react"

const values = [
  {
    icon: ShieldCheck,
    title: "شفافیت کامل",
    text: "تمام فرایندهای قرعه‌کشی و امتیازدهی با ساختار روشن و قابل بررسی انجام می‌شود.",
  },
  {
    icon: Trophy,
    title: "تجربه حرفه‌ای",
    text: "از طراحی رابط تا اجرای قرعه‌کشی‌ها، تمرکز ما روی کیفیت تجربه کاربر است.",
  },
  {
    icon: Wallet,
    title: "مدیریت مالی دقیق",
    text: "سازوکار کیف پول و شارژ طوری طراحی شده که سریع، شفاف و قابل پیگیری باشد.",
  },
]

const stats = [
  { label: "کاربر فعال", value: "۱۲٬۴۰۰+" },
  { label: "قرعه‌کشی برگزار شده", value: "۸۷" },
  { label: "جایزه پرداخت‌شده", value: "۴۳.۲ میلیارد" },
  { label: "میانگین رضایت", value: "۹۶٪" },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
        <section className="glass-card p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-24 -left-20 w-72 h-72 bg-accent-gold/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-24 -right-20 w-72 h-72 bg-accent-cyan/10 blur-3xl rounded-full" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 text-right"
            >
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                <Sparkles className="w-4 h-4 text-accent-gold" />
                <span className="text-xs text-white/70 font-bold">درباره LUX</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                ما اینجاییم تا
                <span className="text-accent-gold"> شانس </span>
                را به یک تجربه
                <span className="text-accent-cyan"> حرفه‌ای </span>
                تبدیل کنیم
              </h1>
              <p className="text-white/65 leading-8">
                LUX یک پلتفرم سرگرمی و قرعه‌کشی آنلاین با تمرکز بر طراحی مدرن، شفافیت
                فرایندها و تجربه کاربری روان است. هدف ما ساختن محیطی قابل اعتماد و
                هیجان‌انگیز برای کاربران فارسی‌زبان است.
              </p>
              <div className="flex flex-wrap gap-3 justify-end">
                <Link href="/raffles" className="btn-primary">
                  مشاهده قرعه‌کشی‌ها
                </Link>
                <Link href="/fairness" className="btn-secondary">
                  شفافیت و عدالت
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center"
                >
                  <p className="text-2xl md:text-3xl font-black text-accent-gold mb-2">{item.value}</p>
                  <p className="text-xs md:text-sm text-white/60">{item.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6">
          {values.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="glass-card p-6"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center mb-5">
                  <Icon className="text-accent-gold w-6 h-6" />
                </div>
                <h2 className="text-xl font-black mb-3">{item.title}</h2>
                <p className="text-white/65 leading-7">{item.text}</p>
              </motion.article>
            )
          })}
        </section>

        <section className="glass-card p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-accent-cyan w-6 h-6" />
            <h2 className="text-2xl md:text-3xl font-black">مسیر رشد ما</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: Crown,
                title: "شروع با تمرکز روی قرعه‌کشی‌های تخصصی",
                text: "از ابتدا تمرکز روی تجربه یکپارچه، طراحی باکیفیت و ساختار فنی پایدار بود.",
              },
              {
                icon: Timer,
                title: "افزودن بازی‌های تعاملی و سیستم شانس",
                text: "گردونه شانس، اسلاید آرنا و مسیرهای پاداش برای افزایش مشارکت کاربران اضافه شد.",
              },
              {
                icon: Trophy,
                title: "توسعه اکوسیستم پنل و ابزارهای کاربر",
                text: "داشبورد، کیف پول، تاریخچه و ابزارهای مدیریتی برای تجربه کامل‌تر پیاده‌سازی شد.",
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="bg-black/20 border border-white/10 rounded-2xl p-5 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-accent-gold" />
                  </div>
                  <div>
                    <h3 className="font-black mb-2">{item.title}</h3>
                    <p className="text-white/65 text-sm leading-7">{item.text}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
