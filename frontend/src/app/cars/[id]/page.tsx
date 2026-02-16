import Link from "next/link"
import { Calendar, Fuel, GaugeCircle, Share2, Heart, ShieldCheck, BadgeDollarSign } from "lucide-react"

const carMap = {
  "audi-a8-2024": {
    title: "آئودی A8 2024",
    code: "A8-2024-001",
    price: 15_800_000_000,
    mileage: "۰ کیلومتر",
    color: "مشکی",
    gearbox: "اتوماتیک",
    fuel: "بنزینی",
    year: 2024,
    image: "/photo/1.avif",
  },
  "toyota-corolla-2023": {
    title: "تویوتا کرولا 2023",
    code: "CR-2023-012",
    price: 8_500_000_000,
    mileage: "۲۵,۰۰۰ کیلومتر",
    color: "سفید",
    gearbox: "اتوماتیک",
    fuel: "بنزینی",
    year: 2023,
    image: "/photo/2.avif",
  },
  "bmw-x5-2022": {
    title: "BMW X5 2022",
    code: "X5-2022-094",
    price: 12_600_000_000,
    mileage: "۴۰,۰۰۰ کیلومتر",
    color: "خاکستری",
    gearbox: "اتوماتیک",
    fuel: "هیبرید",
    year: 2022,
    image: "/photo/3.jpg",
  },
} as const

type CarKey = keyof typeof carMap

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

function withBasePath(path: string): string {
  return `${basePath}${path}`
}

export function generateStaticParams() {
  return Object.keys(carMap).map((id) => ({ id }))
}

export default function CarDetailPage({ params }: { params: { id: string } }) {
  const key = (params.id in carMap ? params.id : "toyota-corolla-2023") as CarKey
  const car = carMap[key]
  const carImage = withBasePath(car.image)

  return (
    <main className="min-h-screen pt-32 pb-20" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-8 text-right">
        <section>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
            <img src={carImage} alt={car.title} className="w-full h-[430px] object-cover" />
            <div className="absolute top-4 right-4 bg-accent-gold text-black text-xs font-black px-3 py-1 rounded-full">آماده تحویل</div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <img key={i} src={carImage} alt={`${car.title}-${i}`} className="h-20 w-full object-cover rounded-xl border border-white/10" />
            ))}
          </div>
        </section>

        <section className="card glass p-8">
          <h1 className="text-4xl font-black mb-2">{car.title}</h1>
          <p className="text-2xl font-black text-accent-gold mb-2">{car.price.toLocaleString("fa-IR")} تومان</p>
          <p className="text-dark-text/60 text-sm mb-5">کد خودرو: {car.code}</p>

          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3 inline-flex items-center gap-2"><GaugeCircle size={14} /> کارکرد: {car.mileage}</div>
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3 inline-flex items-center gap-2"><Fuel size={14} /> سوخت: {car.fuel}</div>
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3 inline-flex items-center gap-2"><Calendar size={14} /> سال: {car.year}</div>
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3">گیربکس: {car.gearbox}</div>
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3">رنگ: {car.color}</div>
            <div className="bg-dark-bg/50 border border-dark-border/40 rounded-xl p-3 inline-flex items-center gap-2"><ShieldCheck size={14} /> سند: آماده انتقال</div>
          </div>

          <div className="bg-accent-gold/5 border border-accent-gold/20 rounded-2xl p-5 mb-6">
            <h2 className="font-black text-lg mb-3 inline-flex items-center gap-2"><BadgeDollarSign size={18} /> ماشین حساب وام</h2>
            <p className="text-sm text-dark-text/70">مبلغ وام: ۵,۰۰۰,۰۰۰,۰۰۰ تومان</p>
            <p className="text-sm text-dark-text/70">مدت بازپرداخت: ۲۴ ماه</p>
            <p className="text-sm text-dark-text/70">پیش پرداخت: ۳,۵۰۰,۰۰۰,۰۰۰ تومان</p>
            <p className="text-accent-gold font-black mt-2">قسط ماهانه: ۱۵۸,۰۰۰,۰۰۰ تومان</p>
            <Link href="/loan" className="btn-primary mt-4 inline-flex">درخواست وام</Link>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="btn-primary">خرید مستقیم</button>
            <button className="btn-secondary inline-flex items-center gap-2"><Heart size={16} /> افزودن به علاقه مندی ها</button>
            <button className="btn-secondary inline-flex items-center gap-2"><Share2 size={16} /> اشتراک گذاری</button>
          </div>
        </section>
      </div>
    </main>
  )
}
