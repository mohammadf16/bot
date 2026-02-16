"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export default function BlogPage() {
  const articles = [
    { id: 1, title: "راهنمای شرکت در قرعه کشی", excerpt: "نحوه خرید بلیط پلکانی و دریافت کش بک", date: "۱۴۰۴/۱۱/۲۲", category: "راهنما" },
    { id: 2, title: "شفافیت و عدالت قرعه کشی", excerpt: "هش قبل از اجرا، لاگ عمومی و تاییدپذیری نتایج", date: "۱۴۰۴/۱۱/۲۰", category: "شفافیت" },
    { id: 3, title: "استراتژی استفاده از شانس ها", excerpt: "بهترین مدل استفاده از شانس گردونه و زیرمجموعه", date: "۱۴۰۴/۱۱/۱۸", category: "آموزشی" },
  ]

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 text-right" dir="rtl">
        <h1 className="text-5xl font-black mb-12"><span className="text-gradient">وبلاگ</span></h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, idx) => (
            <motion.div key={article.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: idx * 0.1 }}>
              <Link href={`/blog/${article.id}`}>
                <div className="card glass h-full hover:border-accent-gold/50 transition-all cursor-pointer p-5">
                  <div className="h-40 bg-gradient-to-br from-accent-gold/10 to-accent-cyan/10 rounded-lg mb-4" />
                  <span className="text-xs bg-accent-gold/20 text-accent-gold px-3 py-1 rounded-full">{article.category}</span>
                  <h3 className="text-xl font-black mt-3 mb-2">{article.title}</h3>
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
