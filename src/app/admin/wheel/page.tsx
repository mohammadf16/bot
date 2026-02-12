"use client"

export default function AdminWheelPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-12">پیکربندی گردونه</h1>

      <div className="card glass p-8">
        <h2 className="text-2xl font-bold mb-6">بخش‌های گردونه</h2>

        <div className="space-y-4">
          {[
            { label: "۱۰ میلیون", color: "#FBB", weight: 20 },
            { label: "۵ میلیون", color: "#BBF", weight: 15 },
            { label: "شانس", color: "#BFB", weight: 25 },
            { label: "۲۰ میلیون", color: "#FFB", weight: 15 },
            { label: "طلا", color: "#FBF", weight: 10 },
            { label: "۳۰ میلیون", color: "#BFF", weight: 15 },
          ].map((segment, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-4 bg-dark-bg/50 rounded-lg"
            >
              <div className="w-8 h-8 rounded" style={{ backgroundColor: segment.color }} />
              <span className="flex-1">{segment.label}</span>
              <input
                type="number"
                value={segment.weight}
                className="w-20 bg-dark-surface rounded px-2 py-1 text-right border border-dark-border"
              />
              <span className="text-dark-text/60">وزن</span>
            </div>
          ))}
        </div>

        <button className="btn-primary mt-8">ذخیره تغییرات</button>
      </div>
    </div>
  )
}
