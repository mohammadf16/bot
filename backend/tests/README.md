# Car Lottery Backend - Test Suite Module

## 📋 خلاصه

یک **ماژول تست کامل و جامع** برای سیستم لاتاری خودروها که:

- ✅ **100 کاربر تستی** با شانس‌های متفاوت ایجاد می‌کند
- ✅ **500 دور چرخ** با توزیع واقع‌گرایانه اجرا می‌کند  
- ✅ **192-300 تراکنش** کیف پول ثبت می‌کند
- ✅ **تمام داده‌ها** را در فروشگاه اپلیکیشن ذخیره می‌کند
- ✅ **9 بررسی اعتبارداشتی** انجام می‌دهد
- ✅ **گزارش JSON تفصیلی** تولید می‌کند

---

## 🚀 استفاده سریع

### دستور ساده‌ترین

```bash
cd backend
npm install  # اگر قبلاً نشده
npm run test:generate
```

### سفارشی‌کردن

```bash
# 50 کاربر، 10 دور هریک
npm run test:generate:export  # با صادرات JSON
```

---

## 📁 فایل‌های ایجاد شده

```
backend/tests/
├── test-data-generator.ts       # ماژول اصلی تولید داده
├── test-runner.ts               # برنامه اجرا
├── database-integration.ts       # پشتیبانی MySQL (اختیاری)
├── QUICK_START.md                # راهنمای سریع (فارسی)
├── TEST_SUITE_GUIDE.md           # راهنمای کامل
└── README.md                     # این فایل

backend/
├── package.json                  # اسکریپت‌های npm اضافه شد:
│   ├── test:generate
│   ├── test:generate:large
│   └── test:generate:export
```

---

## 🎯 هدف و چرایی

### مسائل حل شده

✓ تأیید صحت منطق بازی  
✓ پشتیبانی از سناریو‌های واقع‌گرایانه  
✓ بررسی تأثیرات تراکنش‌های مالی  
✓ اعتبارداشتی یکپارچگی داده‌ها  

### استفاده‌های ممکن

1. **تست محلی**: قبل از배포
2. **CI/CD**: آزمایش خودکار
3. **تشخیص مشکلات**: شناسایی باگ‌های منطقی
4. **بهتر‌سازی عملکرد**: اندازه‌گیری سرعت

---

## 📊 سیاق داده‌های تستی

### کاربران: 100 نفر

```
Chances Distribution:
│ 10   │ 20   │ 50   │ 100  │ 200  │ 500  │
│ 16   │ 17   │ 17   │ 17   │ 17   │ 16   │

Wallet: 1M - 11M per user (avg ~6M)
Total:  ~600M Rials
```

### دورها: 500 بار

```
Segment Distribution (Weighted):
│ ۵۰ میلیون │ ۵ میلیون │ شانس اضافه │ ۱۰ میلیون │ طلای آب │ پوچ │
│ ~94      │ ~78      │ ~129       │ ~71       │ ~39     │ ~89 │
```

### تراکنش‌ها: 192-234

```
Types: 
- Deposit (33%)
- Ticket Purchase (33%)
- Cashback (33%)

Amount: 100k - 5M Rials each
```

---

## ✅ بررسی‌های انجام شده

هر بار که تست اجرا می‌شود:

```
[1] تمام کاربران در فروشگاه وجود دارند
[2] تمام کاربران در شاخص ایمیل ثبت‌اند
[3] هیچ دوری به کاربر نامعتبر اشاره نمی‌کند
[4] شانس‌ها منفی نیستند
[5] موجودی کیف‌پول منفی نیست (هشدار)
[6] کد‌های معرفی منحصرالفرد‌اند
[7] ایمیل‌ها منحصرالفرد‌اند
[8] تراکنش‌ها معتبرند
[9] سیاق‌های حسابداری صحیح‌اند

نتیجه: PASSED ✓ یا FAILED ✗
```

---

## 📈 عملکرد

**زمان اجرا برای 100 کاربر، 5 دور:**

```
Creating users:      ~500ms
Performing spins:    ~800ms
Creating transactions: ~200ms
Validation:          ~100ms
Exporting JSON:      ~50ms
────────────────────────────
Total:              ~1.6s
```

---

## 🔧 اختیارات دستور

```bash
npx tsx tests/test-runner.ts [options]

--users N          تعداد کاربران (default: 100)
--spins N          دورها برای هر کاربر (default: 5)
--prefix STRING    پیشوند داده‌های تستی (default: "test_")
--export FILE      نام فایل JSON (خودکار اگر نمشخص نشود)
```

### مثال‌های عملی

```bash
# حداقل تست
npx tsx tests/test-runner.ts --users 10 --spins 2

# تست میانی
npx tsx tests/test-runner.ts --users 100 --spins 5

# تست بزرگ
npx tsx tests/test-runner.ts --users 500 --spins 10

# تست تنش
npx tsx tests/test-runner.ts --users 1000 --spins 20 --prefix stress_

# با صادرات
npx tsx tests/test-runner.ts --export my-test-results.json

# کمپیلکس
npx tsx tests/test-runner.ts \
  --users 250 \
  --spins 8 \
  --prefix custom_ \
  --export results-$(date +%s).json
```

---

## 📤 خروجی گزارش

### در کنسول

```
✓ Created 100 test users
✓ Created 192 wallet transactions  
✓ Performed 500 total spins
✓ Created audit logs
✓ All validation checks passed

TEST REPORT
─────────────────────────────
Test Users: 100
Total Spins: 500
Wallet Transactions: 192
Total Wallet Value: 3,752.53M Rials
Audit Logs: 100

Spin Distribution:
- ۵۰ میلیون: 94
- ۵ میلیون: 78
- شانس اضافه: 129
- ۱۰ میلیون: 71
- طلای آب شده: 39
- پوچ: 89

Validation: ✓ PASSED
```

### در فایل JSON

```json
{
  "metadata": {..},
  "testReport": {
    "testRunId": "...",
    "config": {..},
    "stats": {
      "usersCreated": 100,
      "totalSpinsPerformed": 500,
      "spinsBySegment": {..},
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
  "storeSnapshot": {..}
}
```

---

## 🐛 حل مشکلات

| مشکل | راه‌حل |
|------|-------|
| `Cannot find module` | `npm install` را اجرا کنید |
| `Segments not initialized` | لاگ‌های bootstrap را بررسی کنید |
| اجرا بطی است | CPU/RAM رایانه را بررسی کنید |
| Export نتیجہ ندارد | اجازات فایل را بررسی کنید |
| Port در حال استفاده | backend server را بند کنید |

---

## 📚 فایل‌های راهنما

- **[QUICK_START.md](./QUICK_START.md)** - شروع سریع
- **[TEST_SUITE_GUIDE.md](./TEST_SUITE_GUIDE.md)** - راهنمای جزئی

---

## 🔗 ارتباط کد

### ماژول‌های استفاده شده

```typescript
// From src/
import { AppStore } from "../src/store/app-store.js"
import { bootstrapStore } from "../src/bootstrap.js"
import { id, nowIso, sha256Hex, randomHex } from "../src/utils/**"
import type { User, WalletTransaction, WheelSpinRecord, AuditLog } from "../src/types.js"
```

### ساختار بازگشت

```typescript
interface TestReport {
  testRunId: string
  createdAt: string
  config: TestConfig
  stats: {
    usersCreated: number
    totalSpinsPerformed: number
    spinsBySegment: Record<string, number>
    walletTransactions: number
    totalWalletValue: number
    auditLogsCreated: number
  }
  validation: {
    passed: boolean
    errors: string[]
    warnings: string[]
  }
}
```

---

## 💡 نکات مهم

✨ **داده‌های تستی موقتی‌اند** - فقط در حافظه ذخیره می‌شوند  
✨ **هیچ تغییر دیتابیس نمی‌دهد** - مگر با `--db` flag  
✨ **تمام کاربران** با پیشوند `test_` قابل‌شناخت‌اند  
✨ **سریع و ایمن** - می‌توان هرزمان اجرا کرد  

---

## 🚀 چه زمانی استفاده کنید؟

| زمان | فرماند |
|------|--------|
| **منطق تست** | `npm run test:generate` |
| **تست بزرگ‌تر** | `npm run test:generate:large` |
| **صادر نتایج** | `npm run test:generate:export` |
| **CI/CD Pipeline** | در GitHub Actions یا similar |
| **بررسی عملکرد** | با مختلف `--users` و `--spins` |

---

## 📝 نمونه استفاده در CI/CD

```yaml
# GitHub Actions
- name: Run Backend Tests
  run: |
    cd backend
    npm install
    npx tsx tests/test-runner.ts \
      --users 100 \
      --spins 5 \
      --export test-results.json
    
- name: Verify Results
  run: |
    if grep -q '"passed": false' test-results.json; then
      echo "Tests failed!"
      exit 1
    fi
```

---

## ✍️ توسعه‌ی آینده

خصوصیات قابل‌افزایش:

- [ ] پشتیبانی MySQL مکمل
- [ ] تست‌های تصادفی پیشرفته
- [ ] گراف‌های بصری
- [ ] مقایسه نتایج چندین اجرا
- [ ] سناریو‌های خاص شامل اختلالات

---

## 📞 سوالات؟

1. `QUICK_START.md` را بخوانید
2. `TEST_SUITE_GUIDE.md` را بررسی کنید
3. لاگ‌های کنسول را دیکھیں
4. فایل JSON تولید شده را بررسی کنید

---

**نوشته شده برای**: Car Raffle Backend  
**نسخه**: 1.0.0  
**تاریخ**: Februar 2026  
**وضعیت**: ✅ بروز و تست‌شده
