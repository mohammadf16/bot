"use client"

import { Car, Mail, Phone, Instagram, Send, Twitter, ShieldCheck, Zap, Award } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-dark-bg border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Company Info */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 font-black text-2xl tracking-tighter">
              <div className="w-10 h-10 bg-accent-gold rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-dark-bg" />
              </div>
              <span className="text-white">CAR<span className="text-accent-gold">RAFFLE</span></span>
            </Link>
            <p className="text-dark-text/60 leading-relaxed text-sm">
              بزرگترین و معتبرترین پلتفرم قرعه‌کشی خودرو در کشور با استفاده از تکنولوژی بلاک‌چین برای تضمین شفافیت ۱۰۰ درصدی نتایج.
            </p>
            <div className="flex gap-4">
              {[Instagram, Send, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent-gold hover:text-dark-bg transition-all">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-accent-gold rounded-full" />
              دسترسی سریع
            </h3>
            <ul className="space-y-4">
              {[
                { label: "قرعه‌کشی‌های فعال", href: "/raffles" },
                { label: "گردونه شانس روزانه", href: "/wheel" },
                { label: "مزایده‌های ویژه", href: "/auction" },
                { label: "آخرین برندگان", href: "/winners" },
                { label: "سوالات متداول", href: "/faq" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-dark-text/60 hover:text-accent-gold transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-dark-text/30 rounded-full group-hover:w-2 group-hover:bg-accent-gold transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-accent-cyan rounded-full" />
              خدمات ما
            </h3>
            <ul className="space-y-4">
              {[
                { label: "خرید اقساطی", icon: Zap },
                { label: "ضمانت بازگشت وجه", icon: ShieldCheck },
                { label: "پشتیبانی ۲۴/۷", icon: Phone },
                { label: "جوایز ویژه اعضا", icon: Award },
              ].map((service, i) => (
                <li key={i} className="flex items-center gap-3 text-dark-text/60">
                  <service.icon className="w-4 h-4 text-accent-gold" />
                  <span className="text-sm">{service.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-accent-gold rounded-full" />
              تماس با ما
            </h3>
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-5 h-5 text-accent-gold" />
                  <span className="text-sm text-white font-bold">ایمیل پشتیبانی</span>
                </div>
                <p className="text-dark-text/60 text-sm">support@carraffle.ir</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="w-5 h-5 text-accent-cyan" />
                  <span className="text-sm text-white font-bold">مرکز تماس</span>
                </div>
                <p className="text-dark-text/60 text-sm">۰۲۱-۹۱۰۰۱۲۳۴</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-dark-text/40 text-xs">
            © ۲۰۲۶ تمام حقوق این پلتفرم متعلق به شرکت کاررافل می‌باشد.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-dark-text/40 hover:text-white text-xs transition-colors">حریم خصوصی</Link>
            <Link href="/terms" className="text-dark-text/40 hover:text-white text-xs transition-colors">قوانین و مقررات</Link>
            <Link href="/sitemap" className="text-dark-text/40 hover:text-white text-xs transition-colors">نقشه سایت</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

