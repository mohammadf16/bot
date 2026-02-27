"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Crown, ShieldCheck, Sparkles, Timer, Trophy, Users, Wallet, Zap, Star, ArrowLeft } from "lucide-react"

const values = [
  {
    icon: ShieldCheck,
    title: "شفافیت کامل",
    text: "تمام فرایندهای قرعه‌کشی و امتیازدهی با ساختار روشن و قابل بررسی عموم انجام می‌شود.",
    color: "from-green-500/20 to-emerald-600/5",
    border: "border-green-500/20",
    iconColor: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    icon: Trophy,
    title: "تجربه حرفه‌ای",
    text: "از طراحی رابط کاربری تا اجرای قرعه‌کشی‌ها، تمرکز ما روی کیفیت تجربه کاربر است.",
    color: "from-accent-gold/20 to-yellow-600/5",
    border: "border-accent-gold/20",
    iconColor: "text-accent-gold",
    bg: "bg-accent-gold/10",
  },
  {
    icon: Wallet,
    title: "مدیریت مالی دقیق",
    text: "سازوکار کیف پول و شارژ طوری طراحی شده که سریع، شفاف و کاملاً قابل پیگیری باشد.",
    color: "from-accent-cyan/20 to-blue-600/5",
    border: "border-accent-cyan/20",
    iconColor: "text-accent-cyan",
    bg: "bg-accent-cyan/10",
  },
]

const stats = [
  { label: "کاربر فعال", value: "۱۲٬۴۰۰+", icon: Users },
  { label: "قرعه‌کشی برگزار شده", value: "۸۷", icon: Trophy },
  { label: "جایزه پرداخت‌شده", value: "۴۳.۲ میلیارد", icon: Crown },
  { label: "میانگین رضایت", value: "۹۶٪", icon: Star },
]

const timeline = [
  {
    icon: Zap,
    title: "شروع با تمرکز روی قرعه‌کشی تخصصی",
    text: "از ابتدا تمرکز روی تجربه یکپارچه، طراحی باکیفیت و ساختار فنی پایدار بود.",
    phase: "فاز ۱",
  },
  {
    icon: Timer,
    title: "افزودن بازی‌های تعاملی و سیستم شانس",
    text: "گردونه شانس، اسلاید آرنا و مسیرهای پاداش برای افزایش مشارکت کاربران اضافه شد.",
    phase: "فاز ۲",
  },
  {
    icon: Trophy,
    title: "توسعه اکوسیستم پنل و ابزارهای کاربر",
    text: "داشبورد، کیف پول، تاریخچه و ابزارهای مدیریتی برای تجربه کامل‌تر پیاده‌سازی شد.",
    phase: "فاز ۳",
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-28 pb-20" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-white/8">
          {/* Background glow */}
          <div className="absolute -top-32 -left-20 w-96 h-96 bg-accent-gold/8 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-accent-cyan/6 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/3 to-transparent pointer-events-none" />

          <div className="relative z-10 p-8 md:p-14 grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6 text-right">
              <div className="inline-flex items-center gap-2 bg-accent-gold/10 border border-accent-gold/20 rounded-full px-4 py-2">
                <Sparkles className="w-4 h-4 text-accent-gold" />
                <span className="text-xs text-accent-gold font-bold">درباره LUX</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                ما اینجاییم تا
                <span className="text-accent-gold"> شانس </span>
                را به یک تجربه
                <span className="text-accent-cyan"> حرفه‌ای </span>
                تبدیل کنیم
              </h1>
              <p className="text-white/60 leading-8 text-lg">
                LUX یک پلتفرم سرگرمی و قرعه‌کشی آنلاین با تمرکز بر طراحی مدرن، شفافیت
                فرایندها و تجربه کاربری روان است. هدف ما ساختن محیطی قابل اعتماد و
                هیجان‌انگیز برای کاربران فارسی‌زبان است.
              </p>
              <div className="flex flex-wrap gap-3 justify-end">
                <Link href="/raffles" className="btn-primary flex items-center gap-2">
                  مشاهده قرعه‌کشی‌ها <ArrowLeft className="w-4 h-4" />
                </Link>
                <Link href="/fairness" className="btn-secondary">
                  شفافیت و عدالت
                </Link>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="grid grid-cols-2 gap-4">
              {stats.map((item, i) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.07 }}
                    className="bg-white/4 border border-white/8 rounded-2xl p-5 text-center hover:border-accent-gold/30 hover:bg-accent-gold/4 transition-all group"
                  >
                    <Icon className="w-5 h-5 text-accent-gold/60 mx-auto mb-2 group-hover:text-accent-gold transition-colors" />
                    <p className="text-2xl md:text-3xl font-black text-accent-gold mb-1">{item.value}</p>
                    <p className="text-xs text-white/50">{item.label}</p>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>

        {/* Values Section */}
        <section>
          <div className="text-right mb-8">
            <h2 className="text-2xl md:text-3xl font-black mb-2">ارزش‌های ما</h2>
            <p className="text-white/50">اصولی که همه تصمیمات LUX را شکل می‌دهند</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {values.map((item, idx) => {
              const Icon = item.icon
              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className={`relative overflow-hidden rounded-2xl border ${item.border} bg-gradient-to-br ${item.color} p-6 hover:scale-[1.02] transition-transform duration-300`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center mb-5`}>
                    <Icon className={`${item.iconColor} w-6 h-6`} />
                  </div>
                  <h3 className="text-xl font-black mb-3">{item.title}</h3>
                  <p className="text-white/65 leading-7 text-sm">{item.text}</p>
                </motion.article>
              )
            })}
          </div>
        </section>

        {/* Mission + Vision */}
        <section className="grid md:grid-cols-2 gap-5">
          {[
            { label: "ماموریت", icon: "🎯", text: "ارائه یک پلتفرم قرعه‌کشی آنلاین که با شفافیت کامل، طراحی حرفه‌ای و تجربه کاربری استثنایی، معیار جدیدی برای صنعت بسازد." },
            { label: "چشم‌انداز", icon: "🔭", text: "تبدیل شدن به برترین پلتفرم سرگرمی و قرعه‌کشی خودرو در ایران با بیش از یک میلیون کاربر فعال و اکوسیستم کامل خدمات خودرویی." },
          ].map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card glass p-7 text-right"
            >
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-black mb-3 text-accent-gold">{item.label}</h3>
              <p className="text-white/65 leading-8">{item.text}</p>
            </motion.div>
          ))}
        </section>

        {/* Timeline */}
        <section className="card glass p-8 md:p-10">
          <div className="flex items-center gap-3 mb-8 pb-5 border-b border-white/5 text-right">
            <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
              <Users className="text-accent-cyan w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black">مسیر رشد ما</h2>
              <p className="text-white/40 text-sm mt-0.5">فازهای توسعه پلتفرم LUX</p>
            </div>
          </div>

          <div className="relative space-y-0">
            {/* Vertical line */}
            <div className="absolute right-5 top-5 bottom-5 w-px bg-gradient-to-b from-accent-gold/30 via-accent-cyan/20 to-transparent" />

            {timeline.map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="relative flex items-start gap-6 pb-8 last:pb-0 text-right"
                >
                  <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-accent-gold/20 to-accent-gold/5 border border-accent-gold/20 flex items-center justify-center z-10">
                    <Icon className="w-5 h-5 text-accent-gold" />
                  </div>
                  <div className="flex-1 bg-white/3 border border-white/8 rounded-2xl p-5 hover:border-accent-gold/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-accent-gold/60 font-bold bg-accent-gold/10 border border-accent-gold/15 px-2 py-0.5 rounded-full">{item.phase}</span>
                    </div>
                    <h3 className="font-black text-base mb-1.5">{item.title}</h3>
                    <p className="text-white/55 text-sm leading-7">{item.text}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden rounded-3xl border border-accent-gold/15 bg-gradient-to-br from-accent-gold/8 via-transparent to-accent-cyan/5 p-10 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06),transparent_70%)] pointer-events-none" />
          <div className="relative z-10">
            <Crown className="w-10 h-10 text-accent-gold mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl md:text-3xl font-black mb-3">آماده‌اید؟</h2>
            <p className="text-white/55 mb-6 max-w-md mx-auto leading-7">همین الان ثبت‌نام کنید و اولین قرعه‌کشی خود را تجربه کنید.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="btn-primary">ثبت‌نام رایگان</Link>
              <Link href="/blog" className="btn-secondary">خواندن وبلاگ</Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}
