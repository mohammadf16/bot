"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export default function BlogPage() {
  const articles = [
    {
      id: 1,
      title: "چگونه در قرعه‌کشی شرکت کنید",
      excerpt: "راهنمای کامل برای خریداری بلیط و شرکت در قرعه‌کشی",
      date: "۱۴۰۳/۱۱/۲۰",
      category: "راهنما",
    },
    {
      id: 2,
      title: "شفافیت و عدالت در قرعه‌کشی",
      excerpt: "درباره روش‌های اثبات عدالت و شفافیت سایت",
      date: "۱۴۰۳/۱۱/۱۸",
      category: "اطلاعات",
    },
    {
      id: 3,
      title: "بهترین استراتژی برای برد",
      excerpt: "نکات و ترفندهای برای افزایش شانس برد",
      date: "۱۴۰۳/۱۱/۱۵",
      category: "راهنما",
    },
  ]

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-5xl font-bold mb-12">
          <span className="text-gradient">وبلاگ</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, idx) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Link href={`/blog/${article.id}`}>
                <div className="card glass h-full hover:border-accent-gold/50 transition-all cursor-pointer">
                  <div className="h-40 bg-gradient-to-br from-accent-gold/10 to-accent-cyan/10 rounded-lg mb-4" />
                  <span className="text-xs bg-accent-gold/20 text-accent-gold px-3 py-1 rounded-full">
                    {article.category}
                  </span>
                  <h3 className="text-xl font-bold mt-3 mb-2">{article.title}</h3>
                  <p className="text-dark-text/60 text-sm mb-4">{article.excerpt}</p>
                  <p className="text-xs text-dark-text/40">{article.date}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  )
}
