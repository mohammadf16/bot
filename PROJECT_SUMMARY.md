# 📋 خلاصه پروژه - Car Raffle Gaming Fintech

## 🎯 نمای کلی

یک **سایت قرعه‌کشی ماشین** حرفه‌ای و مدرن با:
- 🎨 طراحی luxury gaming fintech
- 📱 واکنش‌گرا (Responsive)
- 🌍 پشتیبانی کامل RTL (فارسی)
- 🚀 کارایی بالا (Performance optimized)
- 🔐 آماده برای احراز هویت و پرداخت

## 📊 آمار پروژه

| بخش | تعداد | وضعیت |
|-----|--------|-------|
| صفحات کاربر | 14 | ✅ آماده |
| صفحات ادمین | 10 | ✅ آماده |
| کامپوننت‌های Shared | 3 | ✅ آماده |
| صفحات API | - | 📝 آماده برای backend |
| Database Schema | - | 📝 طراحی شده |

## 🎨 صفحات کاربری

### صفحه خانه `/`
- **Immersive scroll design** با 9 بخش:
  1. Landing gate (درِ گاراژ)
  2. Active raffle room (ماشین و قرعه‌کشی فعال)
  3. Prize ladder (پله‌های جایزه)
  4. Chance converter (تبدیل شانس)
  5. Wheel arena (سالن گردونه)
  6. Car slide track (مسیر اسلاید)
  7. Wallet/Vault (خزانه)
  8. Live winners wall (دیوار برندگان)
  9. Marketplace (بازار خدمات)

- Scroll snap sections
- Parallax effects
- Real-time winner ticker
- Fairness badge

### صفحات قرعه‌کشی
- **`/raffles`** - لیست با فیلتر‌ها (فعال/تمام‌شده/آینده)
- **`/raffles/:id`** - جزئیات با tabs:
  - خرید بلیط (stepper, pricing ladder)
  - استفاده از شانس‌ها (converter)
  - نتایج لایو (placeholder)
  - قوانین

### صفحات کیف پول
- **`/wallet`** - مدیریت موجودی:
  - موجودی قابل برداشت
  - کش‌بک (۲۰٪)
  - در انتظار
  - شانس‌ها
  - شارژ کیف پول (درگاه پرداخت)
  - درخواست برداشت (شرط ۵ بار)
  - تراکنش‌ها (Ledger view)

### بازی‌ها
- **`/wheel`** - بازی گردونه (Canvas-based)
  - چرخش interactive
  - اثبات عدالت (fairness proof)
  - تاریخچه

- **`/slide`** - بازی اسلاید (Racing game)
  - شروع/توقف
  - نمایش موقعیت
  - leaderboard
  - قوانین

### صفحات دیگر
- **`/profile`** - حساب کاربری
  - داشبورد
  - بلیط‌های من
  - دعوت دوستان (لینک + QR code)
  - قوانین
  - تنظیمات امنیتی

- **`/fairness`** - شفافیت و عدالت
  - توضیح کش‌بک
  - محاسبه شانس
  - اثبات رمزنگاری

- **`/blog`** - وبلاگ (مقالات)
- **`/auction`** - مزایده (real-time bidding)
- **`/loan`** - وام خودرو (فرم مرحله‌ای)
- **`/checks`** - خرید حواله (escrow)

## 👨‍💼 صفحات ادمین

### `/admin/dashboard`
- KPI‌های لحظه‌ای
- نمودارهای فروش
- تراکنش‌های اخیر

### `/admin/raffles`
- ایجاد قرعه‌کشی جدید
- ویرایش/حذف
- حالت: تصادفی یا عدد هدف

### `/admin/users`
- لیست کاربران
- جستجو
- بلاک/غیرفعال

### `/admin/finance`
- مدیریت برداشت‌ها
- تایید درخواست‌ها
- صورتحساب

### سایر صفحات
- `/admin/pricing` - قیمت‌گذاری پلکانی
- `/admin/wheel` - پیکربندی بخش‌های گردونه
- `/admin/rewards` - تعریف جوایز
- `/admin/live` - کنترل قرعه‌کشی زنده
- `/admin/content` - مدیریت محتوا
- `/admin/audit` - گزارش‌های تغییرات

## 🎨 طراحی و استایل

### رنگ‌ها
```
- Primary: Dark/Charcoal (#0a0a14)
- Accent Gold: #FBB324
- Accent Cyan: #22D3EE
- Success: #22C55E
- Warning: #F97316
- Danger: #EF4444
```

### کامپوننت‌ها
- Glass cards (glassmorphism)
- Neon edges
- Button states (primary/secondary/tertiary)
- Gradient text
- Smooth animations (Framer Motion)

### فارسی
- فونت: Vazirmatn, IRANSansX
- جهت: RTL تمام‌صفحه
- اعداد: فرمت‌شده (۱٬۲۳۴٬۵۶۷)

## 🛠 تکنولوژی‌ها

```
Frontend:
- Next.js 14 (React)
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- react-hot-toast (notifications)
- qrcode.react (QR codes)

Development:
- ESLint
- TypeScript compiler
- npm

Ready for:
- WebSocket (ws)
- Database (PostgreSQL)
- Payment Gateway integration
- Email service
- Authentication (JWT/OAuth)
```

## 📁 ساختار پوشه‌ها

```
src/
├── app/
│   ├── (pages)
│   │   ├── page.tsx (/)
│   │   ├── raffles/
│   │   ├── wallet/
│   │   ├── wheel/
│   │   ├── slide/
│   │   ├── profile/
│   │   ├── fairness/
│   │   ├── blog/
│   │   ├── auction/
│   │   ├── loan/
│   │   └── checks/
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── raffles/
│   │   ├── users/
│   │   ├── finance/
│   │   ├── pricing/
│   │   ├── wheel/
│   │   ├── rewards/
│   │   ├── live/
│   │   ├── content/
│   │   └── audit/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── header.tsx
│   │   └── footer.tsx
│   └── providers.tsx
```

## 🚀 شروع

```bash
# نصب
npm install

# توسعه
npm run dev

# Build
npm run build

# Production
npm start
```

سایت در `http://localhost:3000` اجرا می‌شود.

## ✅ موارد تکمیل شده

- [x] Setup Next.js + TypeScript
- [x] Design system (colors, typography, components)
- [x] Header + Footer
- [x] Immersive home page (9 sections)
- [x] Raffle listing + detail pages
- [x] Wallet page (balance, charge, withdraw, ledger)
- [x] Wheel game (Canvas)
- [x] Car slide game (Racing animation)
- [x] Profile/Account page
- [x] Fairness page
- [x] Blog page
- [x] Auction page
- [x] Loan page
- [x] Checks page
- [x] Admin layout
- [x] Admin dashboard
- [x] Admin raffle management
- [x] Admin user management
- [x] Admin finance management
- [x] Additional admin pages

## 📝 موارد برای Backend

- [ ] PostgreSQL database
- [ ] API endpoints (REST/GraphQL)
- [ ] Authentication (JWT/OAuth)
- [ ] Payment gateway integration
- [ ] WebSocket server (real-time updates)
- [ ] Email notifications
- [ ] File uploads (KYC docs)
- [ ] Admin APIs
- [ ] User APIs

## 🔒 امنیت

- [ ] Password hashing (bcrypt)
- [ ] JWT tokens
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] SQL injection prevention
- [ ] Input validation
- [ ] Audit logging

## 📊 سیستم‌های اساسی

### شانس‌ها
```
1 بلیط = 1 شانس + 20% کش‌بک
5 شانس = 1 ورود قرعه‌کشی
2 شانس = 1 چرخش گردونه
1 زیرمجموعه = 1 شانس
```

### قیمت‌گذاری
```
بلیط 1: 1,000,000 تومان
بلیط 2: 800,000 تومان (20% تخفیف)
بلیط 3: 650,000 تومان (35% تخفیف)
بلیط 4+: 550,000 تومان (45% تخفیف)
```

### جوایز
```
نفر 1-4: جایزه نقدی
نفر 5: ماشین
نفر 6-10: 9 ثوت طلا
نفر 10-100: 2 ثوت طلا
نفر 100-1000: 2 شانس گردونه
بقیه: 20% کش‌بک رایگان
```

## 🎯 Next Steps

1. **Backend Development**
   - Database setup (PostgreSQL)
   - API endpoints
   - Authentication

2. **Integration**
   - Connect frontend to API
   - Payment gateway
   - WebSocket for real-time

3. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests

4. **Deployment**
   - Vercel/Heroku/Docker
   - Database migration
   - CI/CD pipeline

## 📚 مستندات

- [README.md](README.md) - خلاصه پروژه
- [SETUP.md](SETUP.md) - راهنمای نصب
- [DEVELOPMENT.md](DEVELOPMENT.md) - راهنمای توسعه
- [.env.example](.env.example) - متغیرهای محیطی

## 📞 تماس

- 📧 Email: support@carraffle.ir
- 🌐 Website: carraffle.ir
- 💬 Issues: GitHub Issues

---

**نسخه**: 0.1.0  
**وضعیت**: فاز توسعه  
**آخرین بروزرسانی**: 1403/11/21

**آماده برای**: Backend Integration
