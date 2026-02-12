"use client"

import { motion } from "framer-motion"

export default function FairnessPage() {
  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-5xl font-bold mb-12">
          <span className="text-gradient">شفافیت و عدالت</span>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="card glass p-8">
            <h2 className="text-2xl font-bold mb-6">چگونه کش‌بک آزاد می‌شود؟</h2>
            <p className="text-dark-text/70 leading-relaxed mb-4">
              هر بلیط خریداری شده ۲۰ درصد کش‌بک برای شما تجمیع می‌کند. این کش‌بک پس از هر ۵ بار شرکت در قرعه‌کشی‌ها، برای برداشت فعال می‌شود.
            </p>
            <div className="bg-dark-bg/50 rounded-lg p-4 mt-4">
              <p className="text-accent-gold font-semibold">مثال: ۱۰ بلیط × ۲۰% = ۲٬۰۰۰٬۰۰۰ تومان کش‌بک</p>
            </div>
          </div>

          <div className="card glass p-8">
            <h2 className="text-2xl font-bold mb-6">شانس‌ها چگونه محاسبه می‌شوند؟</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-dark-bg/50 rounded-lg">
                <span className="text-3xl">🎰</span>
                <div>
                  <p className="font-semibold">هر بلیط = ۱ شانس</p>
                  <p className="text-sm text-dark-text/60">۵ شانس = ۱ ورود قرعه‌کشی</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-dark-bg/50 rounded-lg">
                <span className="text-3xl">🎡</span>
                <div>
                  <p className="font-semibold">هر ۲ شانس = ۱ چرخش گردونه</p>
                  <p className="text-sm text-dark-text/60">مستقل از قرعه‌کشی</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-dark-bg/50 rounded-lg">
                <span className="text-3xl">👥</span>
                <div>
                  <p className="font-semibold">هر زیرمجموعه = ۱ شانس</p>
                  <p className="text-sm text-dark-text/60">شخص دعوت شده باید بلیط بخرد</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card glass p-8">
            <h2 className="text-2xl font-bold mb-6">سیستم اثبات عدالت</h2>
            <p className="text-dark-text/70 leading-relaxed mb-6">
              تمام نتایج قرعه‌کشی و بازی‌ها با استفاده از رمزنگاری تایید می‌شوند. شما می‌توانید نتیجه هر چرخش یا بازی را با استفاده از server seed، client seed و nonce تایید کنید.
            </p>

            <div className="space-y-4">
              <div className="border border-accent-gold/30 rounded-lg p-4">
                <p className="text-dark-text/60 text-sm mb-2">Server Seed (از سمت سرور)</p>
                <code className="text-xs break-all font-mono text-accent-gold">
                  5f4d3c2b1a0e9d8c7f6e5d4c3b2a1f0e9d8c7f6e5d4c
                </code>
              </div>

              <div className="border border-accent-cyan/30 rounded-lg p-4">
                <p className="text-dark-text/60 text-sm mb-2">Client Seed (از سمت کاربر)</p>
                <code className="text-xs break-all font-mono text-accent-cyan">
                  abc123xyz789
                </code>
              </div>

              <div className="border border-accent-gold/30 rounded-lg p-4">
                <p className="text-dark-text/60 text-sm mb-2">Nonce</p>
                <code className="text-xs break-all font-mono text-accent-gold">
                  42
                </code>
              </div>
            </div>

            <a href="#" className="btn-primary block text-center mt-6">
              تایید یک نتیجه
            </a>
          </div>

          <div className="card glass p-8">
            <h2 className="text-2xl font-bold mb-6">جوایز و توزیع</h2>
            <p className="text-dark-text/70 mb-6">
              جوایز هر قرعه‌کشی به صورت کامل از قبل تعیین شده و برای تمام کاربران برابر و عادلانه است.
            </p>

            <div className="space-y-2">
              {[
                { rank: "نفر ۱–۴", prize: "جایزه نقدی" },
                { rank: "نفر ۵", prize: "ماشین" },
                { rank: "نفر ۶–۱۰", prize: "۹ ثوت طلا" },
                { rank: "نفر ۱۰–۱۰۰", prize: "۲ ثوت طلا" },
                { rank: "نفر ۱۰۰–۱۰۰۰", prize: "۲ شانس گردونه" },
                { rank: "بقیه", prize: "۲۰٪ کش‌بک رایگان" },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between p-3 bg-dark-bg/50 rounded-lg">
                  <span>{item.rank}</span>
                  <span className="font-bold text-accent-gold">{item.prize}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
