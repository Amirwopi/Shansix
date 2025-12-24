# سیستم قرعه‌کشی آنلاین - راهنمای فنی و استقرار

## 📋 فهرست مطالب

- [معرفی پروژه](#معرفی-پروژه)
- [پیش‌نیازها](#پیش‌نیازها)
- [نصب و راه‌اندازی](#نصب-و-راه‌اندازی)
- [پیکربندی محیط](#پیکربندی-محیط)
- [ساختار پروژه](#ساختار-پروژه)
- [API Documentation](#api-documentation)
- [امنیت](#امنیت)
- [راهنمای استقرار](#راهنمای-استقرار)
- [عیب‌یابی](#عیب‌یابی)

---

## 🎯 معرفی پروژه

سیستم قرعه‌کشی آنلاین یک اپلیکیشن وب کامل برای اجرای قرعه‌کشی‌های دیجیتال است با قابلیت‌های زیر:

### ویژگی‌های کلیدی

- ✅ ثبت‌نام و ورود با شماره موبایل ایرانی (OTP-based authentication)
- ✅ ارسال واقعی پیامک SMS با Melipayamak SDK
- ✅ پرداخت آنلاین با درگاه زرین‌پال (ZarinPal)
- ✅ تولید خودکار کدهای قرعه‌کشی امن و غیرقابل تکرار
- ✅ اجرای خودکار قرعه‌کشی پس از تکمیل ظرفیت
- ✅ پنل کاربری برای مشاهده کدها و سوابق
- ✅ پنل مدیریت کامل برای ادمین
- ✅ ثبت و گزارش‌دهی تراکنش‌ها
- ✅ محدودیت نرخ درخواست (Rate Limiting)
- ✅ ذخیره‌سازی امن توکن‌ها در HttpOnly Cookies

---

## 📦 پیش‌نیازها

### نرم‌افزارهای مورد نیاز

- **Node.js** نسخه 18 یا بالاتر
- **Bun** (جایگزین Node.js برای اجرای سریع‌تر)
- **Git**

### اکانت‌های سرویس‌ها

1. **Melipayamak** برای ارسال SMS
   - ثبت‌نام در: https://melipayamak.com
   - دریافت username و password
   - دریافت کد الگو (Pattern Code) برای OTP
   - دریافت شماره ارسال‌کننده (Sender Number)

2. **ZarinPal** برای پرداخت آنلاین
   - ثبت‌نام در: https://zarinpal.com
   - دریافت Merchant ID
   - تنظیم آدرس Callback URL در پنل زرین‌پال

---

## 🚀 نصب و راه‌اندازی

### ۱. کلون کردن پروژه

```bash
git clone <repository-url>
cd my-project
```

### ۲. نصب وابستگی‌ها

```bash
bun install
# یا
npm install
```

### ۳. پیکربندی محیط

کپی فایل `.env.example` به `.env`:

```bash
cp .env.example .env
```

ویرایش فایل `.env` و تنظیم مقادیر:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="generate-secure-random-string"
ADMIN_TOKEN="set-admin-token"
ADMIN_MOBILE="09337309575"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
FARAZ_API_KEY="your-api-key"
FARAZ_ORIGINATOR="5000..."
FARAZ_OTP_PATTERN_CODE="blrp83g66hrdc2n"
ZARINPAL_MERCHANT_ID="your-merchant-id"
NODE_ENV="development"
```

### ۴. راه‌اندازی دیتابیس

```bash
# ایجاد دیتابیس
bun run db:push

# یا با Prisma CLI
bun prisma db push
```

### ۵. راه‌اندازی تنظیمات اولیه قرعه‌کشی

```bash
# از طریق API یا مستقیم در دیتابیس
# یک رکورد در جدول lottery_settings ایجاد کنید:
# - capacity: 1000
# - entryPrice: 50000
# - winnersCount: 1
# - status: OPEN
```

### ۶. اجرای پروژه

```bash
# حالت توسعه
bun run dev

# یا
npm run dev
```

پروژه در آدرس `http://localhost:3000` در دسترس خواهد بود.

---

## ⚙️ پیکربندی محیط

### متغیرهای محیطی ضروری

| متغیر | توضیحات | مثال |
|--------|---------|------|
| `DATABASE_URL` | آدرس دیتابیس SQLite | `file:./dev.db` |
| `JWT_SECRET` | کلید رمزنگاری JWT | `random-64-char-string` |
| `ADMIN_TOKEN` | توکن احراز هویت ادمین | `admin-secret-123` |
| `ADMIN_MOBILE` | شماره موبایل ادمین (ورود خودکار به پنل مدیریت بعد از OTP) | `09337309575` |
| `NEXT_PUBLIC_BASE_URL` | آدرس پایه اپلیکیشن | `https://your-domain.com` |
| `FARAZ_API_KEY` | کلید API فراز اس‌ام‌اس | `your-api-key` |
| `FARAZ_ORIGINATOR` | شماره/سرشماره ارسال‌کننده | `5000123456` |
| `FARAZ_OTP_PATTERN_CODE` | کد الگوی OTP | `blrp83g66hrdc2n` |
| `ZARINPAL_MERCHANT_ID` | شناسه پذیرنده زرین‌پال | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `NODE_ENV` | محیط اجرا | `production` |

### تولید کلید امنیتی JWT

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📁 ساختار پروژه

```
my-project/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── send-otp/
│   │   │   │   │   └── route.ts
│   │   │   │   └── verify-otp/
│   │   │   │       └── route.ts
│   │   │   ├── payment/
│   │   │   │   ├── create/
│   │   │   │   │   └── route.ts
│   │   │   │   └── verify/
│   │   │   │       └── route.ts
│   │   │   ├── admin/
│   │   │   │   ├── route.ts
│   │   │   │   ├── run-lottery/
│   │   │   │   │   └── route.ts
│   │   │   │   └── export/
│   │   │   │       └── route.ts
│   │   │   └── dashboard/
│   │   │       └── route.ts
│   │   ├── admin/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── ui/              # shadcn/ui components
│   ├── lib/
│   │   ├── db.ts            # Prisma client
│   │   ├── utils.ts         # Utility functions
│   │   └── types.ts         # TypeScript types
├── prisma/
│   └── schema.prisma        # Database schema
├── .env.example
├── .env
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## 📡 API Documentation

### Authentication APIs

#### ارسال کد تایید (OTP)

```
POST /api/auth/send-otp
Content-Type: application/json

{
  "mobile": "09123456789"
}
```

**پاسخ موفق:**
```json
{
  "success": true,
  "message": "کد تایید ارسال شد",
  "expiresAt": "2024-01-01T12:00:00.000Z"
}
```

#### تایید کد OTP و ورود

```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "mobile": "09123456789",
  "code": "123456"
}
```

**پاسخ موفق:**
```json
{
  "success": true,
  "message": "ورود موفق",
  "user": {
    "id": "user-id",
    "mobile": "09123456789",
    "isActive": true,
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
}
```

### Payment APIs

#### ایجاد درخواست پرداخت

```
POST /api/payment/create
Content-Type: application/json
Cookie: auth_token=<jwt-token>

{
  "amount": 50000
}
```

**پاسخ موفق:**
```json
{
  "success": true,
  "message": "درخواست پرداخت ایجاد شد",
  "authority": "A00000000000000000000000000",
  "paymentUrl": "https://www.zarinpal.com/pg/StartPay/..."
}
```

#### تایید پرداخت (Callback)

```
GET /api/payment/verify?Authority=...&Status=OK
```

پس از پرداخت موفق، کاربر به dashboard هدایت می‌شود.

### Dashboard API

#### دریافت اطلاعات داشبورد کاربر

```
GET /api/dashboard
Cookie: auth_token=<jwt-token>
```

### Admin APIs

#### دریافت اطلاعات مدیریت

```
GET /api/admin
Cookie: admin_token=<admin-token>
```

#### اجرای قرعه‌کشی

```
POST /api/admin/run-lottery
Content-Type: application/json
Cookie: admin_token=<admin-token>
```

#### دانلود گزارش

```
GET /api/admin/export
Cookie: admin_token=<admin-token>
```

---

## 🔒 امنیت

### ویژگی‌های امنیتی پیاده‌سازی شده

1. **احراز هویت OTP-Based**
   - کدهای یک‌بار مصرف 6 رقمی
   - انقضای کد بعد از 2 دقیقه
   - محدودیت ارسال پیامک (3 درخواست در هر دقیقه)

2. **توکن‌های JWT**
   - ذخیره در HttpOnly Cookies
   - انقضای 7 روزه
   - رمزنگاری HS256

3. **تولید کد قرعه‌کشی امن**
   - استفاده از `crypto.randomBytes`
   - فرمت: `LOT-XXXX-YYYY`
   - تضمین عدم تکرار

4. **محدودیت نرخ درخواست (Rate Limiting)**
   - جلوگیری از سوءاستفاده SMS
   - جلوگیری از درخواست‌های مکرر

5. **لاگ‌گیری تراکنش‌ها**
   - ثبت تمام تراکنش‌های مهم
   - ذخیره IP و User-Agent

6. **توکن محافظ‌شده**
   - احراز هویت ادمین با توکن جداگانه

### توصیه‌های امنیتی برای تولید

1. از HTTPS استفاده کنید
2. متغیرهای محیطی را در فایل `.env` نگه دارید (never commit)
3. کلید JWT امن و طولانی استفاده کنید
4. تنظیمات CORS را محدود کنید
5. از Firewall در سرور استفاده کنید
6. بکاپ منظم از دیتابیس بگیرید

---

## 🚢 راهنمای استقرار

### استقرار روی Vercel

1. **اتصال به GitHub**

```bash
# Push کد به GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **ایجاد پروژه در Vercel**

- به https://vercel.com بروید
- پروژه جدید بسازید
- ریپازیتوری GitHub را انتخاب کنید

3. **پیکربندی متغیرهای محیطی**

در تنظیمات پروژه Vercel:
```
DATABASE_URL="" (استفاده از Vercel Postgres برای production)
JWT_SECRET=<your-production-secret>
ADMIN_TOKEN=<your-production-admin-token>
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
MELIPAYAMAK_USERNAME=<your-username>
MELIPAYAMAK_PASSWORD=<your-password>
MELIPAYAMAK_OTP_PATTERN_CODE=<your-pattern-code>
MELIPAYAMAK_SENDER_NUMBER=<your-sender-number>
ZARINPAL_MERCHANT_ID=<your-merchant-id>
NODE_ENV=production
```

4. **اجرا migrations**

```bash
# قبل از استقرار
bun run db:push
```

### استقرار روی VPS (DigitalOcean, Linode, etc.)

1. **نصب Node.js و Bun**

```bash
curl -fsSL https://bun.sh/install | bash
```

2. **نصب PM2 برای مدیریت پروسه**

```bash
npm install -g pm2
```

3. **Clone و نصب پروژه**

```bash
git clone <your-repo-url>
cd my-project
bun install
```

4. **پیکربندی محیط**

```bash
cp .env.example .env
nano .env  # ویرایش تنظیمات
```

5. **راه‌اندازی دیتابیس**

```bash
bun run db:push
```

6. **ایجاد SSL با Certbot**

```bash
sudo apt install certbot
sudo certbot --nginx -d your-domain.com
```

7. **اجرای پروژه با PM2**

```bash
pm2 start bun --name "lottery-app" -- run dev
pm2 save
pm2 startup
```

8. **پیکربندی Nginx**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 🐛 عیب‌یابی

### مشکل: ارسال پیامک انجام نمی‌شود

**راه‌حل:**
1. چک کنید username و password ملی پیامک صحیح است
2. موجودی حساب ملی پیامک را بررسی کنید
3. کد الگو (Pattern Code) را در پنل ملی پیامک بررسی کنید
4. شماره ارسال‌کننده را بررسی کنید

### مشکل: درگاه پرداخت کار نمی‌کند

**راه‌حل:**
1. Merchant ID زرین‌پال را بررسی کنید
2. Callback URL را در پنل زرین‌پال تنظیم کنید
3. در حالت production از حالت sandbox خارج شوید
4. مبلغ تراکنش را بررسی کنید

### مشکل: کاربر نمی‌تواند وارد شود

**راه‌حل:**
1. شماره موبایل با فرمت 09xxxxxxxxx است؟
2. OTP منقضی شده است؟ (زمان 2 دقیقه)
3. Cookie مرورگر فعال است؟

### مشکل: قرعه‌کشی اجرا نمی‌شود

**راه‌حل:**
1. ظرفیت قرعه‌کشی پر شده است؟
2. کد قرعه‌کشی معتبر وجود دارد؟
3. توکن ادمین صحیح است؟

---

## 📞 پشتیبانی

برای مشکلات فنی:
- 📧 Email: support@example.com
- 📱 Telegram: @support
- 🌐 Documentation: https://docs.example.com

---

## 📄 مجوز

این پروژه با مجوز MIT منتشر شده است.

---

## 🙏 سپاسگزاری

سپاس از استفاده از سیستم قرعه‌کشی آنلاین!
