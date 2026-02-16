# Test Suite - Quick Start Guide

## یک نگاه کلی

ماژول تست تکاملی برای بک‌اند لاتاری‌های خودرو که:

✓ **100 کاربر تستی** می‌سازد با شانس‌های متفاوت (10-500)  
✓ **500 دور چرخ** انجام می‌دهد با توزیع واقع‌گرایانه  
✓ **192 تراکنش کیف پول** ایجاد می‌کند  
✓ **تمام داده‌ها** را به جزئیات تأیید می‌کند  
✓ **گزارش JSON** کامل تولید می‌کند  

---

## شروع سریع

### 1. اجرای پیش‌فرض (100 کاربر، 5 دور)

```bash
cd backend
npm run test:generate
```

### 2. اجرای بزرگ‌تر (500 کاربر، 10 دور)

```bash
npm run test:generate:large
```

### 3. صادرات گزارش به JSON

```bash
npm run test:generate:export
```

گزارش در فایل `test-report.json` ذخیره می‌شود.

---

## اختیارات فرماند

```bash
npx tsx tests/test-runner.ts [options]

Options:
  --users N      تعداد کاربران تستی (پیش‌فرض: 100)
  --spins N      تعداد دورها برای هر کاربر (پیش‌فرض: 5)
  --prefix STR   پیشوند برای داده‌های تستی (پیش‌فرض: "test_")
  --export FILE  صادرات گزارش به فایل JSON
```

### مثال‌های استفاده

```bash
# 50 کاربر، 10 دور هریک
npx tsx tests/test-runner.ts --users 50 --spins 10

# صادرات نتایج
npx tsx tests/test-runner.ts --export my-results.json

# آزمایش تنش (1000 کاربر)
npx tsx tests/test-runner.ts --users 1000 --spins 20 --prefix stress_
```

---

## خروجی تست

هنگام اجرا، می‌بینید:

```
╔════════════════════════════════════════════════════════════════╗
║              Car Lottery Backend - Test Runner                 ║
╚════════════════════════════════════════════════════════════════╝

Creating 100 test users...
✓ Created 100 test users

Performing 5 spins per user...
✓ Performed 500 total spins

Creating wallet transactions...
✓ Created 192 wallet transactions

Validating data integrity...
✓ All validation checks passed

═══════════════════════════════════════════════════════════════

TEST REPORT

Test Configuration:
  - Test Users: 100
  - Spins per User: 5
  - Test Prefix: test_

Statistics:
  - Users Created: 100
  - Total Spins: 500
  - Wallet Transactions: 192
  - Total Wallet Value: 3,752.53M Rials
  - Audit Logs: 100

Spin Distribution:
  - ۵۰ میلیون: 94
  - ۵ میلیون: 78
  - شانس اضافه: 129
  - ۱۰ میلیون: 71
  - طلای آب شده: 39
  - پوچ: 89

Validation:
  - Status: ✓ PASSED
  - Errors: 0
  - Warnings: 0

═══════════════════════════════════════════════════════════════
✓ All tests passed successfully!
```

---

## ساختار دادهای تستی

### کاربران (100 عدد)

| شانس‌ها | تعداد | هدف |
|---------|-------|------|
| 10      | 16    | بازی‌کنندگان کم سرمایه |
| 20      | 17    | بازی‌کنندگان صاحت‌اقتصادی |
| 50      | 17    | بازی‌کنندگان معمولی |
| 100     | 17    | بازی‌کنندگان فعال |
| 200     | 17    | بازی‌کنندگان درگیر |
| 500     | 16    | بازی‌کنندگان VIP |

### موجودی کیف پول

- **مختص هریک**: 1,000,000 - 11,000,000 ریال
- **میانگین**: ~6,000,000 ریال
- **کل**: ~600,000,000 ریال

### چرخ‌های دوران

- **کل دورها**: 500 (100 کاربر × 5 دور)
- **توزیع وزن‌دار**: بر اساس وزن‌های بخش‌ها
- **احتمال برد**: 30% (به‌جز "پوچ")
- **مبلغ برد**: 1,000,000 - 50,000,000 ریال

---

## فایل‌های تستی

```
backend/
├── tests/
│   ├── test-data-generator.ts    # ماژول تولید داده‌ها
│   ├── test-runner.ts             # اسکریپت اجرا
│   ├── database-integration.ts     # یکپارچگی MySQL (اختیاری)
│   ├── TEST_SUITE_GUIDE.md         # راهنمای کامل
│   └── QUICK_START.md              # این فایل
```

---

## تأیید‌کردن‌های انجام شده

✓ تمام کاربران تستی در فروشگاه وجود دارند  
✓ تمام کاربران در شاخص ایمیل ثبت شده‌اند  
✓ تمام دورها به کاربران معتبر اشاره می‌کنند  
✓ هیچ مقدار منفی برای شانس‌ها وجود ندارد  
✓ هیچ موجودی منفی در کیف پول نیست (هشدار)  
✓ هیچ کد معرفی تکراری نیست  
✓ هیچ ایمیل تکراری نیست  
✓ تمام تراکنش‌های کیف پول معتبرند  
✓ تمامی‌ در سیاق‌های حسابداری صحیح‌اند  

---

## بازیافت داده‌های تستی

تمام داده‌های تستی با پیشوند `test_` شروع می‌شوند:

```bash
# پاک‌کرد کاربران تستی از MySQL (اختیاری)
DELETE FROM users WHERE email LIKE 'test_%';
```

---

## تشخیص و حل مشکلات

### خطا: Module not found
```bash
npm install
```

### خطا: Store segments not initialized
مجری bootstrap به درستی کار نکرد. لاگ‌ها را بررسی کنید.

### اجرا بطی است
برای 100 کاربر و 500 دور، معمولاً < 2 ثانیه لازم است.

---

## نتایج JSON

گزارش صادر شده شامل:

```json
{
  "metadata": {
    "executedAt": "2026-02-14T10:30:00Z",
    "nodeVersion": "v20.10.0",
    "platform": "win32"
  },
  "testReport": {
    "testRunId": "abc123...",
    "config": { ... },
    "stats": {
      "usersCreated": 100,
      "totalSpinsPerformed": 500,
      "spinsBySegment": { ... },
      "walletTransactions": 192,
      "totalWalletValue": 3752530000,
      "auditLogsCreated": 100
    },
    "validation": {
      "passed": true,
      "errors": [],
      "warnings": []
    }
  },
  "storeSnapshot": {
    "usersCount": 100,
    "wheelSpinsCount": 500,
    "walletTransactionsCount": 192,
    "auditLogsCount": 100,
    "rafflesCount": 1
  }
}
```

---

## منابع اضافی

- [راهنمای کامل تست](./TEST_SUITE_GUIDE.md)
- [ماژول تولید داده](./test-data-generator.ts)
- [یکپارچگی دیتابیس](./database-integration.ts)

---

## پشتیبانی

اگر سؤال یا مشکلی دارید:

1. خروجی لاگ را بررسی کنید
2. گزارش JSON را بررسی کنید
3. `npm install` را دوباره اجرا کنید
4. `NODE_ENV=test` را امتحان کنید

