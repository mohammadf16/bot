"use client"

import { motion } from "framer-motion"
import { ShieldCheck, Info, AlertCircle, CheckCircle2, Scale, Gavel } from "lucide-react"

export default function RulesPage() {
  const sections = [
    {
      title: "قوانین عمومی و عضویت",
      icon: ShieldCheck,
      rules: [
        "هر کاربر تنها مجاز به داشتن یک حساب کاربری با اطلاعات واقعی است.",
        "تمامی فعالیت‌های مشکوک منجر به مسدودسازی دائمی حساب خواهد شد.",
        "برندگان موظف به ارائه مدارک شناسایی معتبر جهت دریافت جایزه هستند."
      ]
    },
    {
      title: "سیستم خرید بلیط و تخفیف",
      icon: Scale,
      rules: [
        "قیمت بلیط‌ها به صورت پلکانی محاسبه می‌شود (بلیط‌های بعدی ارزان‌تر).",
        "۲۰٪ مبلغ هر بلیط بلافاصله به عنوان کش‌بک به کیف پول واریز می‌شود.",
        "کش‌بک‌ها بعد از ۵ بار شرکت در قرعه‌کشی قابل برداشت نقدی هستند.",
        "هر بلیط معادل یک شانس رایگان گردونه شانس است."
      ]
    },
    {
      title: "جوایز و رتبه‌بندی",
      icon: Gavel,
      rules: [
        "نفر اول تا چهارم: جوایز نقدی نفیس.",
        "نفر پنجم: برنده خودروی اصلی قرعه‌کشی.",
        "نفر ۶ تا ۱۰: نفری ۹ ثوت طلای آب شده.",
        "نفر ۱۰ تا ۱۰۰: نفری ۲ ثوت طلای آب شده.",
        "نفر ۱۰۰ تا ۱۰۰۰: نفری ۲ شانس گردونه شانس."
      ]
    }
  ]

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">قوانین و <span className="text-accent-gold">مقررات</span></h1>
          <p className="text-white/40 text-sm font-bold">شفافیت و عدالت، اولویت اصلی مجموعه‌ی لوکس است.</p>
        </div>
      </div>

      <div className="grid gap-8">
        {sections.map((section, idx) => {
          const Icon = section.icon
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-64 h-64 bg-accent-gold/5 blur-3xl -translate-x-1/2 -translate-y-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-accent-gold/10 rounded-2xl flex items-center justify-center border border-accent-gold/20">
                    <Icon className="text-accent-gold w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black">{section.title}</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {section.rules.map((rule, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-2xl flex gap-4">
                      <CheckCircle2 className="text-accent-gold w-5 h-5 shrink-0" />
                      <p className="text-sm text-white/70 leading-relaxed font-medium">{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* Warning Section */}
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-[2rem] p-8 flex items-start gap-6">
          <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle className="text-rose-500 w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-rose-500 mb-2">تذکر مهم</h3>
            <p className="text-sm text-rose-500/60 leading-relaxed">
              هرگونه تلاش برای تقلب یا دور زدن سیستم قرعه‌کشی، منجر به مسدودسازی دائم حساب و پیگرد قانونی خواهد شد. تمام تراکنش‌ها به صورت لحظه‌ای توسط سیستم هوش مصنوعی LUX رصد می‌شوند.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
