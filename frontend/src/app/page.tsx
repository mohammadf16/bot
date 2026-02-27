"use client"

import { motion, AnimatePresence, useMotionTemplate } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronDown, Crown, Gift, Smartphone, Trophy, CircleDollarSign, CarFront } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { formatToman } from "@/lib/money"

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
const withBasePath = (path: string) => `${basePath}${path}`

type ShowroomVehicle = {
  id: string
  sourceType: "lottery_winback" | "external_purchase"
  status: "available" | "reserved" | "sold" | "archived"
  vehicle: {
    title: string
    imageUrl: string
    model: string
    year: number
    city: string
    mileageKm: number
    isNew: boolean
    transmission: "automatic" | "manual"
    fuelType: "gasoline" | "hybrid" | "electric" | "diesel"
    participantsCount: number
    raffleParticipantsCount: number
  }
  listedPriceIrr?: number
  listedPriceGoldSot?: number
}

type HomeRaffle = {
  id: string
  title: string
  status: "draft" | "open" | "closed" | "drawn"
  maxTickets: number
  ticketsSold: number
  rewardConfig: {
    mainPrizeTitle: string
    mainPrizeValueIrr: number
  }
}

const EMPTY_HERO_SLIDE = {
  image: withBasePath("/photo/auto.png"),
  title: "فعلا خودرویی ثبت نشده است",
  subtitle: "برای نمایش در این بخش، خودرو را از پنل ادمین اضافه کنید.",
  href: "/cars",
}

const MOBILE_QUICK_LINKS = [
  { label: "فروشگاه خودرو", href: "/cars" },
  { label: "ورود / ثبت نام", href: "/register" },
  { label: "قرعه کشی ها", href: "/raffles" },
  { label: "گردونه شانس", href: "/wheel" },
  { label: "ماشین اسلاید", href: "/slide-game" },
  { label: "مزایده خودرو", href: "/auction" },
]

const DEFAULT_MOBILE_CAR_SCENES = [
  {
    image: withBasePath("/photo/2.avif"),
    title: "ثبت نام و شروع سریع",
    subtitle: "اول ثبت نام کن تا حواله خودرو، سفارش خرید و پیگیری های بعدی داخل حساب خودت ذخیره شود.",
    href: "/register",
    cta: "ثبت نام",
  },
  {
    image: withBasePath("/photo/auto.png"),
    title: "ویترین خودروهای روز",
    subtitle: "مدل ها را یکجا ببین، مقایسه کن و مستقیم وارد صفحه خرید شو.",
    href: "/cars",
    cta: "مشاهده خودروها",
  },
  {
    image: withBasePath("/photo/spin.png"),
    title: "قرعه کشی شفاف",
    subtitle: "بلیط بخرید، وضعیت فروش را لحظه ای ببینید و نتایج را پیگیری کنید.",
    href: "/raffles",
    cta: "ورود به قرعه کشی",
  },
  {
    image: withBasePath("/photo/play.png"),
    title: "بازی و فرصت های روزانه",
    subtitle: "گردونه و اسلاید آرنا برای شانس اضافه و امتیاز بیشتر.",
    href: "/wheel",
    cta: "شروع بازی",
  },
]

type HeroSlide = {
  image: string
  title: string
  subtitle: string
  href: string
}

type MobileCarScene = {
  image: string
  title: string
  subtitle: string
  href: string
  cta: string
}

type HomeContent = {
  mobileExperienceTitle: string
  mobileExperienceDescription: string
  activeRafflesTitle: string
  activeRafflesSubtitle: string
}

const DEFAULT_HOME_CONTENT: HomeContent = {
  mobileExperienceTitle: "کل سایت را راحت تجربه کن",
  mobileExperienceDescription: "مسیر خرید خودرو، قرعه کشی، بازی و کیف پول از همین صفحه برای موبایل قابل دسترسی است.",
  activeRafflesTitle: "قرعه کشی های فعال",
  activeRafflesSubtitle: "بلیط پلکانی، کش بک ۲۰٪، شانس گردونه و جوایز متنوع",
}

const GlobalStyles = ({ isMobile }: { isMobile: boolean }) => (
  <style>{`
    html {
      overflow-y: ${isMobile ? "auto" : "hidden"};
      height: 100%;
    }

    body {
      overflow-y: ${isMobile ? "auto" : "hidden"};
      background-color: #000;
      margin: 0;
      padding: 0;
      color: white;
      min-height: 100%;
    }

    ::-webkit-scrollbar { display: none; }

    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin-slow { animation: spin-slow 20s linear infinite; }
  `}</style>
)

function AmbientLight({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute -inset-[500px] opacity-20 mix-blend-screen"
        style={{
          background: useMotionTemplate`
            radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(212, 175, 55, 0.16), transparent 40%)
          `,
        }}
      />
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-purple-900/10 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[8s]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-[#D4AF37]/5 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[10s]" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
    </div>
  )
}

const GlassButton = ({
  children,
  primary = false,
  onClick,
  className = "",
}: {
  children: React.ReactNode
  primary?: boolean
  onClick?: () => void
  className?: string
}) => (
  <button
    onClick={onClick}
    type="button"
    className={`
      relative px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold text-sm md:text-[15px] transition-all duration-300 overflow-hidden group
      ${
        primary
          ? "bg-[#D4AF37] text-black shadow-[0_0_20px_-5px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_-5px_rgba(212,175,55,0.6)]"
          : "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20"
      }
      ${className}
    `}
  >
    <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    {primary && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />}
  </button>
)

const SectionWrapper = ({ children, className = "", fullWidth = false }: { children: React.ReactNode; className?: string; fullWidth?: boolean }) => (
  <section className={`min-h-[100svh] lg:h-screen w-full relative flex items-center justify-center overflow-x-hidden py-16 lg:py-0 ${className}`}>
    <div className={`w-full h-full relative z-10 flex flex-col justify-center ${fullWidth ? "" : "max-w-[1400px] px-4 md:px-12"}`}>{children}</div>
  </section>
)

const HeroSection = ({ onNext, slides }: { onNext: () => void; slides: HeroSlide[] }) => {
  const [activeSlide, setActiveSlide] = useState(0)
  const safeSlides = slides.length > 0 ? slides : [EMPTY_HERO_SLIDE]

  useEffect(() => {
    setActiveSlide(0)
  }, [safeSlides.length])

  useEffect(() => {
    const id = setInterval(() => setActiveSlide((p) => (p + 1) % safeSlides.length), 5000)
    return () => clearInterval(id)
  }, [safeSlides.length])

  return (
    <SectionWrapper className="bg-black" fullWidth>
      <div className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="sync">
          <motion.img
            key={safeSlides[activeSlide].image}
            src={safeSlides[activeSlide].image}
            alt={safeSlides[activeSlide].title}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1.02 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-l from-[#050505]/90 via-[#050505]/62 to-[#050505]/20 z-10" />
      </div>

      <div className="relative z-20 h-full w-full max-w-[1400px] mx-auto px-4 md:px-12 flex items-end lg:items-center justify-center lg:justify-end pb-14 lg:pb-0">
        <div className="w-full lg:absolute lg:right-12 lg:top-1/2 lg:-translate-y-1/2 max-w-[650px] rounded-3xl border border-white/15 bg-black/35 backdrop-blur-md p-5 md:p-10 text-right shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D4AF37]/30 bg-black/45 mb-5">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="text-[#D4AF37] text-[10px] md:text-xs font-bold tracking-widest uppercase">پلتفرم فروش خودرو + قرعه کشی</span>
          </div>

          <motion.h1
            key={`title-${activeSlide}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.18] sm:leading-[1.1] tracking-tight min-h-[90px] md:min-h-[140px]"
          >
            {safeSlides[activeSlide].title}
          </motion.h1>

          <motion.p
            key={`subtitle-${activeSlide}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-[15px] md:text-lg text-white/80 leading-7 md:leading-8 min-h-[56px] md:min-h-[64px]"
          >
            {safeSlides[activeSlide].subtitle}
          </motion.p>

          <div className="flex items-center justify-end gap-2 pt-4">
            {safeSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveSlide(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${activeSlide === i ? "w-10 bg-[#D4AF37]" : "w-2.5 bg-white/45 hover:bg-white/75"}`}
              />
            ))}
          </div>

          <div className="pt-5 flex flex-col sm:flex-row gap-3 md:gap-4 justify-end items-center">
            <Link href={safeSlides[activeSlide].href} className="w-full sm:w-auto">
              <GlassButton primary className="w-full sm:w-auto px-12">
                جزئیات این خودرو <ArrowLeft size={18} />
              </GlassButton>
            </Link>
            <GlassButton onClick={onNext} className="w-full sm:w-auto">
              بخش‌های بعدی
            </GlassButton>
          </div>
        </div>
      </div>

      <motion.div className="absolute bottom-6 md:bottom-10 z-20 hidden lg:flex flex-col items-center gap-2 text-[#D4AF37]/50" animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <ChevronDown />
      </motion.div>
    </SectionWrapper>
  )
}

const WheelPreviewSection = () => (
  <SectionWrapper className="bg-[#050505]">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <div className="relative order-2 lg:order-1">
        <div className="absolute inset-0 bg-[#D4AF37]/20 blur-[100px] rounded-full" />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="relative z-10 aspect-square max-w-[500px] mx-auto">
          <div className="w-full h-full rounded-full border-8 border-[#D4AF37]/20 flex items-center justify-center p-8">
            <div className="w-full h-full rounded-full border-4 border-[#D4AF37]/50 flex items-center justify-center relative overflow-hidden bg-black/40 backdrop-blur-sm">
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                <div className="border-r border-b border-[#D4AF37]/20" />
                <div className="border-b border-[#D4AF37]/20" />
                <div className="border-r border-[#D4AF37]/20" />
              </div>
              <Trophy size={80} className="text-[#D4AF37] animate-pulse" />
            </div>
          </div>
        </motion.div>
      </div>
      <div className="space-y-6 text-right order-1 lg:order-2">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black">گردونه <span className="text-[#D4AF37]">شانس</span></h2>
        <p className="text-white/70 text-[15px] md:text-lg leading-relaxed">هر ۲ شانس = ۱ چرخش. جوایز نقدی، شانس اضافه و کش بک آنی.</p>
        <div className="flex gap-4 justify-end">
          <Link href="/wheel"><GlassButton primary className="px-10">چرخاندن گردونه</GlassButton></Link>
        </div>
      </div>
    </div>
  </SectionWrapper>
)

const ServiceSection = () => (
  <SectionWrapper>
    <div className="grid lg:grid-cols-2 gap-10 items-center">
      <div className="space-y-8 text-right">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
          <span className="text-xs text-white/60 font-bold uppercase tracking-widest">خدمات LUX</span>
        </div>
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black">خدمات <span className="text-[#D4AF37]">خودرویی</span></h2>
        <p className="text-white/70 text-[15px] md:text-lg leading-relaxed">فروش خودرو، مزایده، وام خودرو و خرید حواله — همه در یک تجربه یکپارچه و بدون دردسر.</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/cars", label: "فروشگاه", desc: "خودروی روز", icon: "🚗" },
            { href: "/auction", label: "مزایده", desc: "قیمت بهتر", icon: "🏆" },
            { href: "/loan", label: "وام خودرو", desc: "اقساط آسان", icon: "💳" },
            { href: "/checks", label: "حواله", desc: "خریدسریع", icon: "📋" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="group p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-all duration-300 cursor-pointer">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="font-black text-sm group-hover:text-[#D4AF37] transition-colors">{item.label}</p>
                <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="relative">
        <div className="absolute inset-0 bg-[#D4AF37]/10 blur-3xl" />
        <div className="relative rounded-3xl border border-white/10 overflow-hidden bg-black/30">
          <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1400" alt="cars" className="w-full h-[260px] md:h-auto object-contain md:object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50 mb-1">موجودی شوروم</p>
              <p className="font-black text-lg">خودروهای صفر و کارکرده</p>
            </div>
            <Link href="/cars">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-black" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </SectionWrapper>
)

const ActiveRafflesSection = ({ content, raffles }: { content: HomeContent; raffles: HomeRaffle[] }) => {
  const items = raffles.slice(0, 3)
  return (
    <SectionWrapper>
      <div className="w-full flex flex-col justify-center h-full py-8 md:py-0">
        <div className="mb-6 md:mb-12 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between sm:items-end border-b border-white/10 pb-4 md:pb-6 shrink-0">
          <div>
            <h2 className="text-2xl md:text-4xl font-black mb-1 md:mb-2">{content.activeRafflesTitle}</h2>
            <p className="text-xs md:text-sm text-white/50">{content.activeRafflesSubtitle}</p>
          </div>
          <Link href="/raffles"><GlassButton>مشاهده همه</GlassButton></Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-white/50 inline-flex items-center gap-1"><CircleDollarSign size={13} /> جوایز نقدی</p>
            <p className="font-black mt-1">نفرات ۱ تا ۴</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-white/50 inline-flex items-center gap-1"><CarFront size={13} /> جایزه خودرو</p>
            <p className="font-black mt-1">نفر ۵</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-white/50 inline-flex items-center gap-1"><Gift size={13} /> کش بک ۲۰٪</p>
            <p className="font-black mt-1">سایر شرکت کنندگان</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {items.length === 0 ? (
            <div className="md:col-span-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
              قرعه کشی فعالی برای نمایش وجود ندارد.
            </div>
          ) : items.map((item, i) => (
            <motion.div key={i} initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="group relative bg-white/5 rounded-3xl overflow-hidden border border-white/10 hover:border-[#D4AF37]/50 transition-all duration-300">
              <div className="aspect-video relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200" alt={item.title} className="w-full h-full object-contain md:object-cover bg-black/40 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 right-4 left-4">
                  <h3 className="font-black text-sm md:text-base mb-1 text-right">{item.title}</h3>
                  <p className="text-[#D4AF37] font-bold text-xs md:text-sm">{item.rewardConfig.mainPrizeTitle}</p>
                </div>
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <span className="text-xs md:text-sm text-white/60">بلیط فروخته شده</span>
                  <span className="text-xs md:text-sm font-bold">{item.ticketsSold.toLocaleString()}/{item.maxTickets.toLocaleString()}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mb-4 md:mb-6">
                  <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] h-2 rounded-full" style={{ width: `${item.maxTickets > 0 ? (item.ticketsSold / item.maxTickets) * 100 : 0}%` }} />
                </div>
                <GlassButton primary className="w-full text-xs md:text-sm">خرید بلیط</GlassButton>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}

const FooterCTA = () => (
  <SectionWrapper className="bg-black overflow-hidden">
    {/* Background decorations */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 blur-[120px] rounded-full" />
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent-cyan/5 blur-[80px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 blur-[80px] rounded-full" />
    </div>

    <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} className="mb-6">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-[#D4AF37]/20 blur-2xl rounded-full" />
          <div className="relative p-5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20">
            <Crown size={48} className="text-[#D4AF37]" />
          </div>
        </div>
      </motion.div>
      <motion.h2 initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
        عضویت در <span className="text-[#D4AF37]">کلاب VIP</span>
      </motion.h2>
      <motion.p initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-[15px] md:text-lg text-white/60 mb-10 max-w-2xl leading-relaxed">
        دسترسی زودهنگام به قرعه‌کشی‌های ویژه، مزایای انحصاری، گزارش شفاف نتایج و پنل مدیریت حرفه‌ای
      </motion.p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-10">
        {[
          { icon: Gift, title: "هدایای ویژه", desc: "جوایز نقدی و کش‌بک اختصاصی", color: "text-accent-gold" },
          { icon: Crown, title: "سطح VIP", desc: "امتیاز بیشتر در قرعه‌کشی‌ها", color: "text-accent-gold" },
          { icon: Smartphone, title: "پنل حرفه‌ای", desc: "مدیریت ساده کیف پول و بازی", color: "text-accent-cyan" },
        ].map((feature, i) => (
          <motion.div key={i} initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }} className="p-6 rounded-2xl bg-white/3 border border-white/8 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/3 transition-all duration-300 group backdrop-blur-sm">
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
              <feature.icon className={`${feature.color} w-5 h-5`} />
            </div>
            <h4 className="font-black text-base text-white mb-1.5">{feature.title}</h4>
            <p className="text-sm text-white/45 leading-6">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link href="/dashboard" className="w-full sm:w-auto"><GlassButton primary className="w-full px-10 py-4 text-base">ورود به پنل</GlassButton></Link>
        <Link href="/fairness" className="w-full sm:w-auto"><GlassButton className="w-full px-10 py-4 text-base">شفافیت سیستم</GlassButton></Link>
      </div>
    </div>
  </SectionWrapper>
)

const MobileHomeExperience = ({ slides, scenes, content }: { slides: HeroSlide[]; scenes: MobileCarScene[]; content: HomeContent }) => {
  const [activeSlide, setActiveSlide] = useState(0)
  const safeSlides = slides.length > 0 ? slides : [EMPTY_HERO_SLIDE]
  const safeScenes = scenes.length > 0 ? scenes : DEFAULT_MOBILE_CAR_SCENES

  useEffect(() => {
    setActiveSlide(0)
  }, [safeSlides.length])

  useEffect(() => {
    const id = setInterval(() => setActiveSlide((p) => (p + 1) % safeSlides.length), 4500)
    return () => clearInterval(id)
  }, [safeSlides.length])

  return (
    <div className="relative z-10 w-full">
      <section className="relative min-h-[100svh] overflow-hidden">
        <AnimatePresence mode="sync">
          <motion.img
            key={`mobile-hero-${safeSlides[activeSlide].image}`}
            src={safeSlides[activeSlide].image}
            alt={safeSlides[activeSlide].title}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1.02 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(212,175,55,0.18),transparent_42%)]" />

        <div className="relative z-20 min-h-[100svh] px-4 pt-28 pb-[calc(env(safe-area-inset-bottom)+5rem)] flex flex-col justify-end">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-black/40 px-3 py-1 text-[11px] font-bold text-[#D4AF37]">
            تجربه خودرو محور
          </span>
          <h1 className="mt-4 text-[32px] leading-[1.2] font-black text-white">
            {safeSlides[activeSlide].title}
          </h1>
          <p className="mt-3 max-w-[32ch] text-[15px] leading-7 text-white/85">
            {safeSlides[activeSlide].subtitle}
          </p>

          <div className="mt-4 flex items-center gap-2">
            {safeSlides.map((_, i) => (
              <button
                key={`mobile-dot-${i}`}
                type="button"
                onClick={() => setActiveSlide(i)}
                className={`h-2 rounded-full transition-all ${activeSlide === i ? "w-8 bg-[#D4AF37]" : "w-2 bg-white/45"}`}
              />
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link href={safeSlides[activeSlide].href}>
              <GlassButton primary className="w-full">جزئیات خودرو</GlassButton>
            </Link>
            <Link href="/cars">
              <GlassButton className="w-full">همه خودروها</GlassButton>
            </Link>
          </div>

          <div className="mt-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
            {MOBILE_QUICK_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full border border-white/20 bg-black/45 px-4 py-2 text-[13px] font-bold text-white/90"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 pb-24 space-y-5">
        <div className="relative min-h-[38svh] overflow-hidden rounded-[28px] border border-white/15">
          <img
            src="https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=1600"
            alt="car night drive"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/25" />
          <div className="relative z-10 flex min-h-[38svh] flex-col justify-end p-6">
            <h3 className="text-[28px] leading-[1.2] font-black text-white">{content.mobileExperienceTitle}</h3>
            <p className="mt-2 text-[15px] leading-7 text-white/85">
              {content.mobileExperienceDescription}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link href="/register">
                <GlassButton primary className="w-full">ثبت نام</GlassButton>
              </Link>
              <Link href="/login">
                <GlassButton className="w-full">ورود</GlassButton>
              </Link>
            </div>
          </div>
        </div>

        {safeScenes.map((scene, index) => (
          <motion.article
            key={scene.href}
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ delay: index * 0.08, duration: 0.45 }}
            className="relative min-h-[56svh] overflow-hidden rounded-[28px] border border-white/15"
          >
            <img src={scene.image} alt={scene.title} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-xs font-bold tracking-wide text-[#D4AF37]">بخش کلیدی سایت</p>
              <h2 className="mt-1 text-[28px] leading-[1.2] font-black text-white">{scene.title}</h2>
              <p className="mt-2 text-[15px] leading-7 text-white/90">{scene.subtitle}</p>
              <Link href={scene.href} className="mt-4 inline-flex items-center gap-2 text-[15px] font-bold text-[#D4AF37]">
                {scene.cta}
                <ArrowLeft size={16} />
              </Link>
            </div>
          </motion.article>
        ))}
      </section>

    </div>
  )
}

export default function HomePage() {
  const [activeSection, setActiveSection] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const [showroomVehicles, setShowroomVehicles] = useState<ShowroomVehicle[]>([])
  const [homeRaffles, setHomeRaffles] = useState<HomeRaffle[]>([])
  const [homeContent, setHomeContent] = useState<HomeContent>(DEFAULT_HOME_CONTENT)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)
  const sectionsCount = 5

  useEffect(() => {
    let isMounted = true

    async function loadHomeData() {
      try {
        const [vehiclesData, contentData, rafflesData] = await Promise.all([
          apiRequest<{ items: ShowroomVehicle[] }>("/showroom/vehicles", { method: "GET" }, { auth: false }),
          apiRequest<{ content: HomeContent }>("/content/home", { method: "GET" }, { auth: false }),
          apiRequest<{ items: HomeRaffle[] }>("/raffles", { method: "GET" }, { auth: false }),
        ])

        if (!isMounted) return
        setShowroomVehicles(vehiclesData.items ?? [])
        if (contentData.content) setHomeContent(contentData.content)
        setHomeRaffles(rafflesData.items ?? [])
      } catch (error) {
        console.error("Failed to load home data", error)
      }
    }

    void loadHomeData()

    return () => {
      isMounted = false
    }
  }, [])

  const heroSlides = useMemo<HeroSlide[]>(() => {
    return showroomVehicles.slice(0, 5).map((item) => {
      const mileage = item.vehicle.isNew ? "صفر کیلومتر" : `${item.vehicle.mileageKm.toLocaleString("fa-IR")} کیلومتر`
      const price = item.listedPriceIrr ? `${formatToman(item.listedPriceIrr)} تومان` : "قیمت تماس"
      return {
        image: item.vehicle.imageUrl || withBasePath("/photo/auto.png"),
        title: item.vehicle.title,
        subtitle: `${item.vehicle.model} | سال ${item.vehicle.year.toLocaleString("fa-IR")} | ${item.vehicle.city} | ${mileage} | ${price}`,
        href: `/cars/${item.id}`,
      }
    })
  }, [showroomVehicles])

  const mobileScenes = useMemo<MobileCarScene[]>(() => {
    const dynamicScenes = showroomVehicles.slice(0, 3).map((item) => ({
      image: item.vehicle.imageUrl || withBasePath("/photo/auto.png"),
      title: item.vehicle.title,
      subtitle: `${item.vehicle.model} | ${item.vehicle.city} | سال ${item.vehicle.year.toLocaleString("fa-IR")}`,
      href: `/cars/${item.id}`,
      cta: "مشاهده خودرو",
    }))

    return dynamicScenes.length > 0
      ? [DEFAULT_MOBILE_CAR_SCENES[0], ...dynamicScenes]
      : DEFAULT_MOBILE_CAR_SCENES
  }, [showroomVehicles])

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)")
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (isMobile) return
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [isMobile])

  useEffect(() => {
    if (isMobile) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (scrollTimeout.current) return
      if (Math.abs(e.deltaY) > 30) {
        const direction = e.deltaY > 0 ? 1 : -1
        setActiveSection((prev) => {
          const next = prev + direction
          if (next >= 0 && next < sectionsCount) return next
          return prev
        })
        scrollTimeout.current = setTimeout(() => {
          scrollTimeout.current = null
        }, 900)
      }
    }
    window.addEventListener("wheel", handleWheel, { passive: false })
    return () => window.removeEventListener("wheel", handleWheel)
  }, [isMobile])

  return (
    <div dir="rtl" className={`bg-black w-full text-white ${isMobile ? "min-h-screen overflow-x-hidden" : "h-screen overflow-hidden"}`}>
      <GlobalStyles isMobile={isMobile} />
      {!isMobile ? <AmbientLight mouseX={mousePos.x} mouseY={mousePos.y} /> : null}

      {isMobile ? (
        <MobileHomeExperience slides={heroSlides} scenes={mobileScenes} content={homeContent} />
      ) : (
        <motion.div className="w-full h-full" animate={{ y: `-${activeSection * 100}%` }} transition={{ duration: 0.8, ease: [0.6, 0.05, -0.01, 0.9] }}>
          <div className="h-full w-full"><HeroSection onNext={() => setActiveSection(1)} slides={heroSlides} /></div>
          <div className="h-full w-full"><WheelPreviewSection /></div>
          <div className="h-full w-full"><ServiceSection /></div>
          <div className="h-full w-full"><ActiveRafflesSection content={homeContent} raffles={homeRaffles} /></div>
          <div className="h-full w-full"><FooterCTA /></div>
        </motion.div>
      )}

      <div className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 flex-col gap-3 md:gap-4 hidden md:flex">
        {[...Array(5)].map((_, i) => (
          <button key={i} onClick={() => setActiveSection(i)} className={`w-1 rounded-full transition-all duration-300 ${activeSection === i ? "h-6 md:h-8 bg-[#D4AF37]" : "h-2 bg-white/20 hover:bg-white/50"}`} />
        ))}
      </div>
    </div>
  )
}
