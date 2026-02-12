"use client"

import { motion } from "framer-motion"

export default function AuctionPage() {
  const auctions = [
    {
      id: 1,
      title: "ساعت لوکس اومگا",
      currentBid: 50000000,
      timeLeft: "2 ساعت",
      bids: 24,
    },
    {
      id: 2,
      title: "طلای سکه",
      currentBid: 100000000,
      timeLeft: "5 ساعت",
      bids: 45,
    },
  ]

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-5xl font-bold mb-12">
          <span className="text-gradient">مزایده</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {auctions.map((auction, idx) => (
            <motion.div
              key={auction.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="card glass"
            >
              <div className="h-48 bg-gradient-to-br from-accent-gold/10 to-accent-cyan/10 rounded-lg mb-6" />
              <h3 className="text-xl font-bold mb-4">{auction.title}</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-dark-text/60">قیمت فعلی</span>
                  <span className="font-bold text-accent-gold">
                    {auction.currentBid.toLocaleString("fa-IR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-text/60">زمان باقی</span>
                  <span className="font-bold text-accent-cyan">{auction.timeLeft}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-text/60">تعداد پیشنهادها</span>
                  <span className="font-bold">{auction.bids}</span>
                </div>
              </div>
              <button className="btn-primary w-full">ثبت پیشنهاد</button>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  )
}
