# 🚀 Quick Reference Guide

## سریع شروع

```bash
cd d:\code\car
npm install
npm run dev
# سایت در http://localhost:3000
```

## URL‌های مهم

| URL | توضیح |
|-----|--------|
| `/` | صفحه خانه (immersive) |
| `/raffles` | لیست قرعه‌کشی‌ها |
| `/raffles/:id` | جزئیات قرعه‌کشی |
| `/wallet` | کیف پول |
| `/wheel` | بازی گردونه |
| `/slide` | بازی اسلاید |
| `/profile` | حساب کاربری |
| `/fairness` | شفافیت و عدالت |
| `/blog` | وبلاگ |
| `/admin/dashboard` | داشبورد ادمین |
| `/admin/raffles` | مدیریت قرعه‌کشی‌ها |

## Tailwind Classes مفید

```tsx
// Containers
<div className="max-w-6xl mx-auto px-4">

// Cards
<div className="card glass p-8">
<div className="glass p-6">

// Typography
<h1 className="text-5xl font-bold">عنوان</h1>
<h2 className="text-3xl font-bold">زیرعنوان</h2>
<p className="text-dark-text/60">متن</p>

// Colors
<span className="text-accent-gold">طلایی</span>
<span className="text-accent-cyan">فیروزه‌ای</span>
<span className="text-status-success">سبز</span>

// Buttons
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-tertiary">Tertiary</button>

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Spacing
<div className="pt-32 pb-20 px-4">

// Hover Effects
<div className="hover:border-accent-gold/50 transition-colors">
```

## Framer Motion سریع

```tsx
// Basic fade-in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.6 }}
>

// On scroll into view
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>

// Stagger children
{items.map((item, idx) => (
  <motion.div
    key={idx}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.1, duration: 0.5 }}
  >
))}
```

## Toast Notifications

```tsx
import toast from "react-hot-toast"

toast.success("موفق!")
toast.error("خطا!")
toast.loading("در حال...")
toast("پیام عادی")
```

## Component Examples

### Card
```tsx
<div className="card glass p-8">
  <h3 className="text-2xl font-bold mb-4">عنوان</h3>
  <p className="text-dark-text/60">محتوا</p>
</div>
```

### Button Groups
```tsx
<div className="flex gap-4">
  <button className="btn-primary flex-1">اولی</button>
  <button className="btn-secondary flex-1">دوم</button>
</div>
```

### Grid Layout
```tsx
<div className="grid md:grid-cols-3 gap-6">
  {items.map((item) => (
    <div key={item.id} className="card glass">
      {/* Content */}
    </div>
  ))}
</div>
```

### Table
```tsx
<div className="card glass overflow-hidden">
  <table className="w-full">
    <thead className="bg-dark-bg/50">
      <tr>
        <th className="px-6 py-4 text-right">ستون</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-dark-border/10">
        <td className="px-6 py-4">مقدار</td>
      </tr>
    </tbody>
  </table>
</div>
```

## فایل‌های پیکربندی

### tailwind.config.ts
رنگ‌ها و فونت‌ها

### next.config.js
تنظیمات Next.js

### tsconfig.json
TypeScript configuration

### globals.css
استایل‌های عمومی

## دستورات Terminal

```bash
# توسعه
npm run dev

# Build
npm run build

# Production
npm start

# Lint
npm run lint

# بازنصب dependencies
rm -rf node_modules && npm install
```

## فایل‌های مهم

```
src/
├── app/layout.tsx          # Root layout
├── app/globals.css         # Global styles
├── app/page.tsx            # Home page
├── components/
│   ├── layout/header.tsx   # Header
│   ├── layout/footer.tsx   # Footer
│   └── providers.tsx       # Providers
└── app/admin/layout.tsx    # Admin layout
```

## Structure نمونه Page

```tsx
"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export default function PageName() {
  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-5xl font-bold mb-12">
          <span className="text-gradient">عنوان</span>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="card glass p-8">
            {/* Content */}
          </div>
        </motion.div>
      </div>
    </main>
  )
}
```

## Debug Tips

```tsx
// کنسول
console.log('value:', value)

// React DevTools browser extension
// TypeScript errors: npx tsc --noEmit

// Network: F12 → Network tab
```

## اعداد فارسی

```tsx
// فرمت کردن اعداد
const formatted = value.toLocaleString('fa-IR')

// مثال
const num = 1234567
console.log(num.toLocaleString('fa-IR')) // ۱٬۲۳۴٬۵۶۷
```

## Media Queries

```tsx
// Tailwind breakpoints
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

## Links

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [TypeScript](https://www.typescriptlang.org/)

## Common Issues

### Port already in use
```bash
npm run dev -- -p 3001
```

### Cache issues
```bash
rm -rf .next
npm run dev
```

### Module not found
```bash
npm install
```

### TypeScript errors
Check tsconfig.json paths

## مستندات کامل

- `README.md` - خلاصه
- `SETUP.md` - نصب
- `DEVELOPMENT.md` - توسعه
- `PROJECT_SUMMARY.md` - خلاصه پروژه

---

**نکته**: فایل‌های تمام صفحات و کامپوننت‌ها آماده هستند!
