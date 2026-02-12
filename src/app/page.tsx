"use client"
import { motion, useMotionTemplate } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { ShieldCheck, ArrowLeft, ChevronDown, Zap, Trophy, Smartphone, Gift, Crown } from "lucide-react"
import Link from "next/link"

// --- 1. تنظیمات و استایل‌های گلوبال ---
const GlobalStyles = () => (
  <style>{`
    body {
      overflow: hidden;
      background-color: #000000;
      margin: 0;
      padding: 0;
      color: white;
    }

    ::-webkit-scrollbar { display: none; }

    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin-slow {
      animation: spin-slow 20s linear infinite;
    }
  `}</style>
)

// --- 2. کامپوننت‌های ویژوال ---
function AmbientLight({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute -inset-[500px] opacity-20 mix-blend-screen"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              circle at ${mouseX}px ${mouseY}px,
              rgba(212, 175, 55, 0.15),
              transparent 40%
            )
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
    className={`
      relative px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all duration-300 overflow-hidden group whitespace-nowrap
      ${
        primary
          ? "bg-[#D4AF37] text-black shadow-[0_0_20px_-5px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_-5px_rgba(212,175,55,0.6)]"
          : "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20"
      }
      ${className}
    `}
    type="button"
  >
    <span className="relative z-10 flex items-center justify-center gap-2">
      {children}
    </span>
    {primary && (
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
    )}
  </button>
)

const SectionWrapper = ({
  children,
  className = "",
  fullWidth = false,
}: {
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
}) => (
  <section
    className={`h-screen w-full relative flex items-center justify-center overflow-hidden ${className}`}
  >
    <div className={`w-full h-full relative z-10 flex flex-col justify-center ${fullWidth ? "" : "max-w-[1400px] px-4 md:px-12"}`}>
      {children}
    </div>
  </section>
)

// --- 3. سکشن‌های محتوا ---
const HeroSection = ({ onNext }: { onNext: () => void }) => (
  <SectionWrapper className="bg-black" fullWidth>
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black z-10" />
      <motion.img
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
        src="https://images.unsplash.com/photo-1603584173870-7f3ca99a9141?auto=format&fit=crop&q=80&w=2070"
        className="w-full h-full object-cover opacity-60"
        alt="Hero Background"
      />
    </div>

    <div className="relative z-20 flex flex-col items-center text-center max-w-4xl mx-auto px-4">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="space-y-4 md:space-y-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D4AF37]/30 bg-black/40 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          <span className="text-[#D4AF37] text-[10px] md:text-xs font-bold tracking-widest uppercase">
            لوکس‌ترین پلتفرم قرعه‌کشی خودرو
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white leading-[0.95] tracking-tighter">
          تجربه بخت‌آزمایی <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FCEEAC] to-[#D4AF37]">
            در تراز جهانی
          </span>
        </h1>

        <p className="text-sm md:text-xl text-white/60 font-light max-w-xl mx-auto leading-relaxed px-4">
          به جمع برندگان خوش‌شانس بپیوندید. ما تنها خودرو تحویل نمی‌دهیم؛ <br className="hidden md:block" />
          ما کلید رویاهای شما را تقدیم می‌کنیم.
        </p>

        <div className="pt-6 md:pt-8 flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center w-full sm:w-auto">
          <GlassButton primary onClick={onNext} className="w-full sm:w-auto px-12">
            مشاهده فرصت‌ها <ArrowLeft size={18} />
          </GlassButton>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <GlassButton className="w-full sm:w-auto">ورود به پنل</GlassButton>
          </Link>
        </div>
      </motion.div>
    </div>

    <motion.div
      className="absolute bottom-6 md:bottom-10 z-20 flex flex-col items-center gap-2 text-[#D4AF37]/50"
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
      <ChevronDown />
    </motion.div>
  </SectionWrapper>
)

const WheelPreviewSection = () => (
  <SectionWrapper className="bg-[#050505]">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <div className="relative order-2 lg:order-1">
        <div className="absolute inset-0 bg-[#D4AF37]/20 blur-[100px] rounded-full" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="relative z-10 aspect-square max-w-[500px] mx-auto"
        >
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
        <h2 className="text-4xl md:text-7xl font-black">
          گردونه <span className="text-[#D4AF37]">شانس</span>
        </h2>
        <p className="text-white/60 text-lg leading-relaxed">
          هر روز یک شانس رایگان برای برنده شدن جوایز نقدی و بلیط‌های تخفیف‌دار. 
          شانس خود را همین حالا امتحان کنید و جوایز خود را در لحظه دریافت کنید.
        </p>
        <div className="flex gap-4 justify-end">
          <Link href="/wheel">
            <GlassButton primary className="px-10">چرخاندن گردونه</GlassButton>
          </Link>
        </div>
      </div>
    </div>
  </SectionWrapper>
)

const AuctionSection = () => (
  <SectionWrapper className="bg-black">
    <div className="flex flex-col lg:flex-row gap-12 items-center">
      <div className="lg:w-1/2 space-y-8 text-right">
        <div className="inline-block px-4 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold animate-pulse">
          زنده / LIVE
        </div>
        <h2 className="text-4xl md:text-7xl font-black">
          مزایده <span className="text-[#D4AF37]">داغ</span>
        </h2>
        <p className="text-white/60 text-lg leading-relaxed">
          فرصتی استثنایی برای تصاحب خودروهای خاص با قیمتی که شما تعیین می‌کنید. 
          سیستم مزایده شفاف و لحظه‌ای برای حرفه‌ای‌ها.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "آخرین پیشنهاد", value: "۴.۲ میلیارد" },
            { label: "زمان باقی‌مانده", value: "۰۲:۱۵:۴۵" },
            { label: "پیشنهاد دهندگان", value: "۲۸ نفر" },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="text-[10px] text-white/40 mb-1">{stat.label}</div>
              <div className="text-xs md:text-sm font-bold text-[#D4AF37]">{stat.value}</div>
            </div>
          ))}
        </div>
        <Link href="/auction">
          <GlassButton primary className="w-full md:w-auto px-12">ورود به مزایده</GlassButton>
        </Link>
      </div>
      <div className="lg:w-1/2 relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <img 
          src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=1000" 
          className="rounded-3xl border border-white/10 grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl"
          alt="Auction Car"
        />
      </div>
    </div>
  </SectionWrapper>
)

const LuxuryCollectionSection = () => (
  <SectionWrapper>
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full h-full lg:h-auto py-12">
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="space-y-4 md:space-y-8 text-right order-2 lg:order-1 flex flex-col justify-center"
      >
        <h2 className="text-3xl md:text-6xl font-black">
          کلکسیون <span className="text-[#D4AF37]">فراری‌ها</span>
        </h2>
        <p className="text-white/60 text-sm md:text-lg leading-relaxed text-justify">
          هر خودرویی که در این پلتفرم قرار می‌گیرد، با دقت وسواس‌گونه‌ای انتخاب شده است.
          ما تنها به ارائه خودرو بسنده نمی‌کنیم؛ ما سبک زندگی برندگان را ارائه می‌دهیم.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: ShieldCheck, title: "امنیت کامل", desc: "قرارداد هوشمند" },
            { icon: Zap, title: "تحویل فوری", desc: "سند بنام ۴۸ ساعته" },
          ].map((item, i) => (
            <div
              key={i}
              className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <item.icon className="text-[#D4AF37] mb-2 md:mb-3" size={24} />
              <h4 className="font-bold text-white mb-1 text-sm md:text-base">
                {item.title}
              </h4>
              <p className="text-[10px] md:text-xs text-white/50">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative order-1 lg:order-2 h-[30vh] md:h-[40vh] lg:h-auto flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-[#D4AF37]/20 blur-[60px] md:blur-[100px] rounded-full" />
        <img
          src="https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1000"
          className="relative z-10 w-full max-h-full object-contain lg:object-cover rounded-3xl shadow-2xl border border-white/10"
          alt="Luxury Car Collection"
        />
      </motion.div>
    </div>
  </SectionWrapper>
)

const ActiveRafflesSection = () => {
  const items = [
    {
      name: "Ferrari SF90 Stradale",
      price: "۲,۰۰۰,۰۰۰ تومان",
      img: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1000",
      sold: 450,
      total: 1000,
    },
    {
      name: "Lamborghini Huracán",
      price: "۱,۸۰۰,۰۰۰ تومان",
      img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000",
      sold: 789,
      total: 1000,
    },
    {
      name: "Porsche 911 Turbo S",
      price: "۱,۵۰۰,۰۰۰ تومان",
      img: "https://images.unsplash.com/photo-1603584173870-7f3ca99a9141?q=80&w=1000",
      sold: 234,
      total: 1000,
    },
  ]

  return (
    <SectionWrapper>
      <div className="w-full flex flex-col justify-center h-full py-8 md:py-0">
        <div className="mb-6 md:mb-12 flex justify-between items-end border-b border-white/10 pb-4 md:pb-6 shrink-0">
          <div>
            <h2 className="text-2xl md:text-4xl font-black mb-1 md:mb-2">
              قرعه‌کشی‌های <span className="text-[#D4AF37]">فعال</span>
            </h2>
            <p className="text-xs md:text-sm text-white/50">
              شانس خود را برای برنده شدن امتحان کنید
            </p>
          </div>
          <Link href="/dashboard/admin/raffles">
            <GlassButton>مشاهده همه</GlassButton>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-white/5 rounded-3xl overflow-hidden border border-white/10 hover:border-[#D4AF37]/50 transition-all duration-300"
            >
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 right-4 left-4">
                  <h3 className="font-black text-sm md:text-base mb-1 text-left" dir="ltr">
                    {item.name}
                  </h3>
                  <p className="text-[#D4AF37] font-bold text-xs md:text-sm">{item.price}</p>
                </div>
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <span className="text-xs md:text-sm text-white/60">بلیط فروخته شده</span>
                  <span className="text-xs md:text-sm font-bold">
                    {item.sold.toLocaleString()}/{item.total.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mb-4 md:mb-6">
                  <div
                    className="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] h-2 rounded-full"
                    style={{ width: `${(item.sold / item.total) * 100}%` }}
                  />
                </div>
                <GlassButton primary className="w-full text-xs md:text-sm">
                  خرید بلیط
                </GlassButton>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}

const FooterCTA = () => (
  <SectionWrapper className="bg-black">
    <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="mb-8 p-4 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20"
      >
        <Crown size={48} className="text-[#D4AF37]" />
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        className="text-5xl md:text-8xl font-black text-white mb-6 md:mb-8 tracking-tighter"
      >
        عضویت در <span className="text-[#D4AF37]">کلاب</span>
      </motion.h2>
      
      <p className="text-base md:text-xl text-white/60 mb-8 md:mb-12 max-w-2xl leading-relaxed">
        با عضویت در کلاب اختصاصی، از مزایای ویژه، قرعه‌کشی‌های VIP و دسترسی زودهنگام به خودروهای خاص بهره‌مند شوید. 
        جایی که برندگان با هم ملاقات می‌کنند.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mb-12">
        {[
          { icon: Gift, title: "هدایای ویژه", desc: "بسته‌های خوش‌آمدگویی" },
          { icon: Crown, title: "سطح VIP", desc: "شانس دوبرابر در قرعه‌کشی" },
          { icon: Smartphone, title: "اپلیکیشن اختصاصی", desc: "مدیریت راحت‌تر حساب" },
        ].map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 transition-all group"
          >
            <feature.icon className="text-[#D4AF37] mx-auto mb-4 group-hover:scale-110 transition-transform" size={32} />
            <h4 className="font-bold text-white mb-2">{feature.title}</h4>
            <p className="text-xs text-white/40">{feature.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link href="/dashboard" className="w-full sm:w-auto">
          <GlassButton primary className="w-full px-12 py-5 text-lg">پیوستن به برندگان</GlassButton>
        </Link>
        <Link href="/about" className="w-full sm:w-auto">
          <GlassButton className="w-full px-12 py-5 text-lg">مشاهده مزایا</GlassButton>
        </Link>
      </div>
    </div>
  </SectionWrapper>
)

// --- 4. کامپوننت اصلی (اسکرول منیجر) ---
export default function HomePage() {
  const [activeSection, setActiveSection] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)
  const sectionsCount = 6

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
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
        }, 1000)
      }
    }

    window.addEventListener("wheel", handleWheel, { passive: true })
    return () => window.removeEventListener("wheel", handleWheel)
  }, [])

  return (
    <div dir="rtl" className="bg-black h-screen w-full overflow-hidden text-white">
      <GlobalStyles />
      {/* Ambient Light */}
      <AmbientLight mouseX={mousePos.x} mouseY={mousePos.y} />

      <motion.div
        className="w-full h-full"
        animate={{ y: `-${activeSection * 100}%` }}
        transition={{ duration: 0.8, ease: [0.6, 0.05, -0.01, 0.9] }}
      >
        <div className="h-full w-full">
          <HeroSection onNext={() => setActiveSection(1)} />
        </div>
        <div className="h-full w-full">
          <WheelPreviewSection />
        </div>
        <div className="h-full w-full">
          <LuxuryCollectionSection />
        </div>
        <div className="h-full w-full">
          <AuctionSection />
        </div>
        <div className="h-full w-full">
          <ActiveRafflesSection />
        </div>
        <div className="h-full w-full">
          <FooterCTA />
        </div>
      </motion.div>

      {/* ناوبری - 6 بخش */}
      <div className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3 md:gap-4 hidden md:flex">
        {[...Array(6)].map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveSection(i)}
            className={`w-1 rounded-full transition-all duration-300 ${
              activeSection === i ? "h-6 md:h-8 bg-[#D4AF37]" : "h-2 bg-white/20 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
