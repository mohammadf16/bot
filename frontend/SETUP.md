# 🚀 راهنمای نصب و راه‌اندازی

## پیش‌نیازها

- Node.js 18+ ([دانلود](https://nodejs.org/))
- npm یا yarn
- Visual Studio Code (اختیاری)

## مرحله ۱: شروع پروژه

```bash
# کلون کردن / وارد شدن پوشه
cd d:\code\car

# نصب تمام وابستگی‌ها
npm install

# این فرایند 2-5 دقیقه طول می‌کشد
```

## مرحله ۲: اجرا در حالت توسعه

```bash
npm run dev

# سایت باز می‌شود در:
# http://localhost:3000
```

## مرحله ۳: اضافه کردن فایل‌های محلی

اگر نیاز به محلی‌سازی دارید:

```bash
# ایجاد .env.local
cp .env.example .env.local

# ویرایش برای تنظیمات محلی
# پیش‌فرض‌ها آماده هستند
```

## ساختار پروژه

```
car/
├── src/
│   ├── app/              # صفحات
│   ├── components/       # اجزا
│   └── styles/           # استایل‌ها
├── public/               # فایل‌های static
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── tailwind.config.ts    # Tailwind config
├── next.config.js        # Next.js config
└── README.md             # توضیحات
```

## صفحات موجود

### کاربران
- `/` - خانه (immersive scroll)
- `/raffles` - لیست قرعه‌کشی‌ها
- `/raffles/:id` - جزئیات قرعه‌کشی
- `/wallet` - کیف پول
- `/wheel` - بازی گردونه
- `/slide` - بازی اسلاید
- `/profile` - حساب کاربری
- `/fairness` - شفافیت
- `/blog` - وبلاگ
- `/auction` - مزایده
- `/loan` - وام خودرو
- `/checks` - خرید حواله

### مدیریت
- `/admin/dashboard` - داشبورد
- `/admin/users` - مدیریت کاربران
- `/admin/finance` - مدیریت مالی
- `/admin/raffles` - مدیریت قرعه‌کشی‌ها
- `/admin/pricing` - قیمت‌گذاری
- `/admin/wheel` - پیکربندی گردونه
- `/admin/rewards` - مدیریت جوایز
- `/admin/live` - کنترل لایو
- `/admin/content` - محتوا
- `/admin/audit` - گزارش‌ها

## کار با VS Code

### توصیه شده Extensions

```
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin
- Prettier - Code formatter
- Thunder Client (برای API testing)
```

### Settings

`.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## دستورات مفید

```bash
# Build برای production
npm run build

# اجرای production locally
npm run build
npm start

# Linting
npm run lint

# فرمت کردن کد
npx prettier --write src/

# حذف node_modules و بازنصب
rm -r node_modules package-lock.json
npm install
```

## Troubleshooting

### مشکل: Port 3000 درحال استفاده است

```bash
# Windows - پیدا کردن process
netstat -ano | findstr :3000

# Kill کردن process
taskkill /PID <PID> /F

# یا اجرا با port دیگر
npm run dev -- -p 3001
```

### مشکل: خطای Module Not Found

```bash
# حذف cache Next.js
rm -rf .next

# بازنصب dependencies
rm -rf node_modules
npm install

# اجرا مجدد
npm run dev
```

### مشکل: Tailwind استایل‌ها کار نمی‌کنند

```bash
# پاک کردن cache Tailwind
npx tailwindcss purge

# یا حذف .next
rm -rf .next
npm run dev
```

### مشکل: TypeScript errors

```bash
# چک کردن type errors
npx tsc --noEmit

# درست کردن خودکار
npx tsc --strict --noEmit
```

## Git Setup

```bash
# اولین بار
git init
git add .
git commit -m "Initial commit"

# تغییرات بعدی
git add .
git commit -m "تغییرات"
git push
```

## Database Setup (اختیاری)

اگر آماده‌سازی backend هستید:

```bash
# PostgreSQL locally
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql

# یا Docker
docker run --name carraffle-db -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15

# Create database
createdb carraffle

# در .env.local
DATABASE_URL=postgresql://postgres:password@localhost:5432/carraffle
```

## API Development

برای توسعه API endpoints:

```bash
# نصب Thunder Client یا Postman
# استفاده برای test کردن API‌ها

# یا curl
curl -X GET http://localhost:3000/api/raffles
```

## Performance Optimization

```bash
# سنجش performance
npm run build
npm start

# بررسی bundle size
npm install --save-dev webpack-bundle-analyzer
```

## Production Deployment

### روی Vercel

```bash
# نصب Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy به production
vercel --prod
```

### روی Docker

```bash
# Build image
docker build -t carraffle:latest .

# اجرا
docker run -p 3000:3000 carraffle:latest
```

## مستندات مرجع

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Framer Motion](https://www.framer.com/motion/)

## پشتیبانی و تماس

- 📧 Email: support@carraffle.ir
- 💬 Issues: GitHub Issues
- 🤝 Contributions: Pull Requests خوش‌آمد است

---

**نکته**: این پروژه frontend است و نیاز به backend API دارد. بخش backend را جداگانه توسعه دهید.

**آخرین به‌روزرسانی**: 1403/11/21
