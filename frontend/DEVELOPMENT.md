# 📖 راهنمای توسعه

## سریع شروع

```bash
# نصب پروژه
npm install

# اجرای در حالت توسعه
npm run dev

# ساخت برای production
npm run build
npm start

# چک کردن خطاهای linting
npm run lint
```

## ساختار فولدرها

```
src/
├── app/              # صفحات Next.js
├── components/       # اجزای قابل استفاده مجدد
│   ├── layout/      # Header, Footer
│   └── providers.tsx # Provider برای toast و سایر
├── lib/             # Utility functions
├── hooks/           # Custom React hooks
├── stores/          # Zustand stores (اختیاری)
└── styles/          # Global styles
```

## اضافه کردن صفحه جدید

```typescript
// src/app/my-page/page.tsx
"use client"

import { motion } from "framer-motion"

export default function MyPage() {
  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-5xl font-bold mb-12">
          <span className="text-gradient">عنوان صفحه</span>
        </h1>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Content */}
        </motion.div>
      </div>
    </main>
  )
}
```

## استفاده از کامپوننت‌ها

### کارت شیشه‌ای (Glass Card)

```tsx
<div className="card glass p-8">
  <h2 className="text-2xl font-bold mb-4">عنوان</h2>
  <p className="text-dark-text/60">محتوا</p>
</div>
```

### دکمه‌ها

```tsx
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-tertiary">Tertiary</button>
```

### انیمیشن

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.2 }}
>
  Content
</motion.div>
```

### Toast Notification

```tsx
import toast from "react-hot-toast"

// Success
toast.success("موفق!")

// Error
toast.error("خطا")

// Loading
const id = toast.loading("در حال...")
toast.success("تکمیل", { id })
```

## CSS Variables

### رنگ‌ها

```css
/* در globals.css یا component */
color: hsl(var(--accent-gold));
background: hsl(var(--dark-bg));
border: 1px solid hsl(var(--dark-border));
```

### Utility Classes

```html
<!-- Glass Morphism -->
<div class="glass">Content</div>

<!-- Glow Effects -->
<div class="glow-gold">Gold Glow</div>
<div class="glow-cyan">Cyan Glow</div>

<!-- Text Gradient -->
<h1 class="text-gradient">Gradient Text</h1>

<!-- Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <!-- Items -->
</div>
```

## RTL Support

پروژه به‌طور کامل برای RTL پیکربندی شده است:

```html
<!-- HTML dir attribute -->
<html lang="fa" dir="rtl">

<!-- CSS -->
body { direction: rtl; }
```

## نمادها و Emojis

```tsx
// استفاده در محتوا
🎰 - قرعه‌کشی
🚗 - ماشین
🎡 - گردونه
🏆 - جایزه
💰 - پول
👥 - کاربران
📊 - داشبورد
⚙️ - تنظیمات
```

## API Endpoints (آماده برای backend)

```
GET  /api/raffles              # لیست قرعه‌کشی‌ها
GET  /api/raffles/:id          # جزئیات یک قرعه‌کشی
POST /api/raffles/:id/tickets  # خرید بلیط

GET  /api/wallet               # اطلاعات کیف پول
POST /api/wallet/charge        # شارژ کیف پول
POST /api/wallet/withdraw      # درخواست برداشت

GET  /api/users/:id/profile    # اطلاعات کاربر
POST /api/users/:id/profile    # بروزرسانی پروفایل

GET  /api/admin/dashboard      # KPI‌های داشبورد
POST /api/admin/raffles        # ایجاد قرعه‌کشی
GET  /api/admin/raffles        # لیست مدیریتی
```

## ساختار Database (Proposed)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR,
  balance DECIMAL,
  cashback DECIMAL,
  created_at TIMESTAMP
);

-- Raffles
CREATE TABLE raffles (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  prize VARCHAR,
  base_price DECIMAL,
  mode VARCHAR (random/target),
  target_number INTEGER,
  status VARCHAR (active/completed/upcoming),
  created_at TIMESTAMP
);

-- Tickets
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  raffle_id UUID REFERENCES raffles,
  quantity INTEGER,
  price_paid DECIMAL,
  cashback_earned DECIMAL,
  created_at TIMESTAMP
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  type VARCHAR (charge/withdraw/cashback/ticket),
  amount DECIMAL,
  status VARCHAR (pending/completed/failed),
  created_at TIMESTAMP
);
```

## استقرار (Deployment)

### Vercel

```bash
npm i -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
docker build -t carraffle .
docker run -p 3000:3000 carraffle
```

## Troubleshooting

### خطای Tailwind

```bash
# حذف cache
rm -rf .next
npm run dev
```

### خطای Module Not Found

```bash
# بازنصب dependencies
rm -rf node_modules
npm install
```

### RTL Issues

اطمینان دهید:
- `dir="rtl"` در HTML root
- Tailwind جهت صحیح را شناسایی می‌کند
- اسلیدر‌ها و animations برای RTL بهینه باشند

## بهترین Practices

### 1. Component Organization

```tsx
// ✅ صحیح
export function MyComponent() {
  return <div className="card glass">Content</div>
}

// ❌ نادرست
export default function MyComponent() {
  return <div style={{...}}>Content</div>
}
```

### 2. استفاده از Tailwind

```tsx
// ✅
<div className="text-2xl font-bold text-accent-gold">Text</div>

// ❌
<div style={{fontSize: '24px', fontWeight: 'bold', color: '#FBB324'}}>
  Text
</div>
```

### 3. Accessibility

```tsx
// ✅ با aria-labels
<button aria-label="بستن" onClick={close}>
  <svg />
</button>

// ❌ بدون accessibility
<button onClick={close}><svg /></button>
```

### 4. Performance

```tsx
// ✅ تصاویر با lazy loading
<Image src="/image.jpg" alt="description" loading="lazy" />

// ❌ بدون lazy loading
<img src="/image.jpg" />
```

## پیوندهای مفید

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [TypeScript](https://www.typescriptlang.org/)

---

برای سوالات و مسائل، لطفا issue را در repository ایجاد کنید.
