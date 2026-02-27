"use client"

import Link from "next/link"
import { Instagram, Mail, Phone, Send, Twitter, Youtube, MessageCircle, MapPin, Clock, Car, ChevronLeft } from "lucide-react"
import { useSiteSettings } from "@/lib/site-settings-context"

const DEFAULT_QUICK_LINKS = [
  { label: "فروشگاه خودرو", href: "/cars" },
  { label: "قرعه‌کشی‌ها", href: "/raffles" },
  { label: "مزایده خودرو", href: "/auction" },
  { label: "حواله خودرو", href: "/checks" },
  { label: "کیف پول", href: "/wallet" },
]

const DEFAULT_INFO_LINKS = [
  { label: "درباره ما", href: "/about" },
  { label: "وبلاگ", href: "/blog" },
  { label: "قوانین", href: "/rules" },
  { label: "شفافیت", href: "/fairness" },
  { label: "تماس با ما", href: "/contact" },
]

function SocialIcon({ platform, url }: { platform: string; url: string }) {
  if (!url) return null
  const iconMap: Record<string, React.ReactNode> = {
    instagram: <Instagram className="w-5 h-5" />,
    telegram: <Send className="w-5 h-5" />,
    twitter: <Twitter className="w-5 h-5" />,
    youtube: <Youtube className="w-5 h-5" />,
    whatsapp: <MessageCircle className="w-5 h-5" />,
  }
  const icon = iconMap[platform.toLowerCase()] ?? <span className="text-xs font-bold">{platform[0]?.toUpperCase()}</span>
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent-gold hover:border-accent-gold hover:text-dark-bg transition-all"
      title={platform}
    >
      {icon}
    </a>
  )
}

export function Footer() {
  const { settings } = useSiteSettings()
  const { general, footer, contact } = settings
  const siteName = general.siteName || "LUX"
  const description = footer.companyDescription || `${siteName} پیشرو در قرعه‌کشی شفاف و هوشمند خودرو در ایران`
  const copyright = general.copyrightText || `© ۱۴۰۵ ${siteName} — تمامی حقوق محفوظ است`
  const socialLinks = footer.socialLinks?.filter((s) => s.url) ?? []
  const footerColumns = footer.columns && footer.columns.length > 0 ? footer.columns : null

  return (
    <footer className="bg-dark-bg border-t border-white/5 pt-12 md:pt-16 pb-28 md:pb-10" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10 md:mb-12">

          {/* ── Brand & Description ── */}
          <section className="space-y-5">
            <Link href="/" className="flex items-center gap-3 font-black text-2xl tracking-tighter w-fit">
              <div className="w-10 h-10 bg-accent-gold rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-dark-bg" />
              </div>
              <span className="text-white">{siteName}<span className="text-accent-gold">.</span></span>
            </Link>
            <p className="text-dark-text/65 leading-7 text-sm">{description}</p>
            {socialLinks.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((s) => (
                  <SocialIcon key={s.platform} platform={s.platform} url={s.url} />
                ))}
              </div>
            ) : (
              <div className="flex gap-3">
                {[Instagram, Send, Twitter].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent-gold hover:text-dark-bg transition-all">
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* ── Footer Columns (dynamic) or defaults ── */}
          {footerColumns ? (
            footerColumns.slice(0, 2).map((col, i) => (
              <section key={i}>
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <div className={`w-1.5 h-6 ${i % 2 === 0 ? "bg-accent-gold" : "bg-accent-cyan"} rounded-full`} />
                  {col.title}
                </h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-dark-text/65 hover:text-accent-gold transition-colors flex items-center gap-2 group text-sm">
                        <ChevronLeft className="w-4 h-4 text-dark-text/40 group-hover:text-accent-gold transition-colors" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <>
              <section>
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-accent-gold rounded-full" />
                  دسترسی سریع
                </h3>
                <ul className="space-y-3">
                  {DEFAULT_QUICK_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-dark-text/65 hover:text-accent-gold transition-colors flex items-center gap-2 group text-sm">
                        <ChevronLeft className="w-4 h-4 text-dark-text/40 group-hover:text-accent-gold transition-colors" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-accent-cyan rounded-full" />
                  اطلاعات
                </h3>
                <ul className="space-y-3">
                  {DEFAULT_INFO_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-dark-text/65 hover:text-accent-gold transition-colors flex items-center gap-2 group text-sm">
                        <ChevronLeft className="w-4 h-4 text-dark-text/40 group-hover:text-accent-gold transition-colors" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          {/* ── Contact Info ── */}
          <section>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-accent-gold rounded-full" />
              تماس با ما
            </h3>
            <div className="space-y-3">
              {(contact.emailSupport || contact.email) && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 mb-1.5">
                    <Mail className="w-4 h-4 text-accent-gold flex-shrink-0" />
                    <span className="text-sm text-white font-bold">ایمیل پشتیبانی</span>
                  </div>
                  <p className="text-dark-text/65 text-sm pr-7">{contact.emailSupport || contact.email}</p>
                </div>
              )}
              {(contact.phone || contact.phone2) && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 mb-1.5">
                    <Phone className="w-4 h-4 text-accent-cyan flex-shrink-0" />
                    <span className="text-sm text-white font-bold">مرکز تماس</span>
                  </div>
                  <p className="text-dark-text/65 text-sm pr-7 font-mono" dir="ltr">{contact.phone}</p>
                  {contact.phone2 && <p className="text-dark-text/65 text-sm pr-7 font-mono" dir="ltr">{contact.phone2}</p>}
                </div>
              )}
              {contact.address && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 mb-1.5">
                    <MapPin className="w-4 h-4 text-accent-gold flex-shrink-0" />
                    <span className="text-sm text-white font-bold">آدرس</span>
                  </div>
                  <p className="text-dark-text/65 text-sm pr-7">{contact.address}</p>
                </div>
              )}
              {contact.supportHours && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 mb-1.5">
                    <Clock className="w-4 h-4 text-accent-cyan flex-shrink-0" />
                    <span className="text-sm text-white font-bold">ساعات پشتیبانی</span>
                  </div>
                  <p className="text-dark-text/65 text-sm pr-7">{contact.supportHours}</p>
                </div>
              )}
              {/* Fallback */}
              {!contact.email && !contact.emailSupport && !contact.phone && !contact.address && (
                <>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3 mb-1.5">
                      <Mail className="w-4 h-4 text-accent-gold" />
                      <span className="text-sm text-white font-bold">ایمیل پشتیبانی</span>
                    </div>
                    <p className="text-dark-text/65 text-sm">support@{siteName.toLowerCase()}.ir</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3 mb-1.5">
                      <Phone className="w-4 h-4 text-accent-cyan" />
                      <span className="text-sm text-white font-bold">مرکز تماس</span>
                    </div>
                    <p className="text-dark-text/65 text-sm">۰۲۱-۹۱۰۰۱۲۳۴</p>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          <p className="text-dark-text/45 text-xs text-center md:text-right">{copyright}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {footer.bottomLinks && footer.bottomLinks.length > 0
              ? footer.bottomLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="text-dark-text/45 hover:text-white text-xs transition-colors">
                    {link.label}
                  </Link>
                ))
              : (
                <>
                  <Link href="/fairness" className="text-dark-text/45 hover:text-white text-xs transition-colors">شفافیت سیستم</Link>
                  <Link href="/about" className="text-dark-text/45 hover:text-white text-xs transition-colors">درباره ما</Link>
                  <Link href="/raffles" className="text-dark-text/45 hover:text-white text-xs transition-colors">قرعه‌کشی‌ها</Link>
                </>
              )
            }
          </div>
        </div>
      </div>
    </footer>
  )
}
