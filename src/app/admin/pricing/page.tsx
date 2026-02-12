"use client"

export default function AdminPricingPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-12">سیاست‌های قیمت‌گذاری</h1>

      <div className="card glass p-8">
        <h2 className="text-2xl font-bold mb-6">پلکان تخفیفی</h2>

        <div className="space-y-4">
          {[
            { tier: 1, price: 1000000, discount: 0 },
            { tier: 2, price: 800000, discount: 20 },
            { tier: 3, price: 650000, discount: 35 },
            { tier: 4, price: 550000, discount: 45 },
          ].map((item) => (
            <div
              key={item.tier}
              className="flex justify-between items-center p-4 bg-dark-bg/50 rounded-lg"
            >
              <span>بلیط {item.tier}</span>
              <div className="text-right">
                <p className="font-bold text-accent-gold">
                  {item.price.toLocaleString("fa-IR")}
                </p>
                <p className="text-sm text-dark-text/60">{item.discount}% تخفیف</p>
              </div>
            </div>
          ))}
        </div>

        <button className="btn-primary mt-8">ذخیره تغییرات</button>
      </div>
    </div>
  )
}
