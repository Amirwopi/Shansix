# آنلاین قرعه‌کشی - مستندات فنی

## 📋 فهرست مطالب

- [نمای کلی](#نمای-کلی)
- [معماری سیستم](#معماری-سیستم)
- [نصب و راه‌اندازی](#نصب-و-راهاندازی)
- [پیکربندی](#پیکربندی)
- [API‌ها](#apiها)
- [امنیت](#امنیت)
- [راهنمای استقرار در محیط تولید](#راهنمای-استقرار-در-محیط-تولید)

---

## نمای کلی

این یک سیستم قرعه‌کشی آنلاین کاملاً خودکار است که با استفاده از:

- **Next.js 15** برای فرانت‌اند
- **Prisma ORM** برای مدیریت پایگاه داده
- **ZarinPal** برای درگاه پرداخت
- **JWT** برای احراز هویت

ساخته شده است.

---

## معماری سیستم

### فرانت‌اند (Frontend)

```
src/
├── app/
│   ├── page.tsx                  # صفحه اصلی ورود
│   ├── dashboard/page.tsx          # پنل کاربر
│   ├── admin/page.tsx              # پنل مدیریت
│   ├── api/
│   │   ├── auth/
│   │   │   ├── send-otp/         # ارسال OTP
│   │   │   └── verify-otp/       # تایید OTP
│   │   ├── payment/
│   │   │   ├── create/            # ایجاد پرداخت
│   │   │   └── verify/            # تایید پرداخت
│   │   ├── dashboard/              # دریافت اطلاعات داشبورد
│   │   └── admin/
│   │       ├── route.ts            # دریافت داده‌های ادمین
│   │       ├── run-lottery/        # انجام قرعه‌کشی
│   │       └── export/             # دانلود گزارش
│   ├── layout.tsx                 # Layout اصلی
│   └── globals.css                # استایل‌های جهانی
├── components/
│   └── ui/                      # کامپوننت‌های UI
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── tabs.tsx
│       ├── alert.tsx
│       └── badge.tsx
└── lib/
    ├── db.ts                     # Prisma Client
    ├── utils.ts                  # توابع کاربردی
    └── types.ts                  # TypeScript types
```

### پایگاه داده (Database)

سیستم از Prisma با SQLite استفاده می‌کند. جداول اصلی:

```prisma
- User            # کاربران ثبت‌نام شده
- OTP             # کدهای یک‌بار مصرف
- Payment         # تراکنش‌های پرداخت
- LotteryCode     # کدهای قرعه‌کشی
- LotterySettings # تنظیمات قرعه‌کشی
- Winner          # برندگان قرعه‌کشی
- TransactionLog  # لاگ تراکنش‌ها
```

---

## نصب و راه‌اندازی

### پیش‌نیازها

- Node.js 18+ / Bun
- SQLite (همراه با Prisma)

### مراحل نصب

1. **کلون کردن پروژه:**
```bash
git clone <repository-url>
cd my-project
```

2. **نصب وابستگی‌ها:**
```bash
bun install
```

3. **پیکربندی محیط:**
```bash
cp .env.example .env
# ویرایش فایل .env با مقادیر واقعی
```

4. **راه‌اندازی پایگاه داده:**
```bash
bun prisma generate
bun prisma db push
```

5. **اجرای پروژه:**
```bash
bun run dev
```

---

## پیکربندی

### متغیرهای محیطی

```env
# پایگاه داده
DATABASE_URL="file:./dev.db"

# JWT Secret (باید رشته‌ای امن و تصادفی باشد)
JWT_SECRET="your-super-secret-jwt-key"

# رمز عبور ادمین
ADMIN_SECRET="your-admin-password"

# پیکربندی ZarinPal
ZARINPAL_MERCHANT_ID="your-merchant-id"

# محیط (development | production)
NODE_ENV="development"

# آدرس پایه
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### پیکربندی ZarinPal

1. به [ZarinPal](https://zarinpal.com) بروید
2. ثبت‌نام کنید
3. Merchant ID را بگیرید
4. در فایل `.env` وارد کنید:
```env
ZARINPAL_MERCHANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

## API‌ها

### احراز هویت

#### 1. ارسال OTP
```http
POST /api/auth/send-otp
```

**Body:**
```json
{
  "mobile": "09123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "کد تایید ارسال شد",
  "expiresAt": "2024-01-01T12:02:00.000Z"
}
```

**Rate Limiting:**
- 3 درخواست در هر دقیقه
- OTP پس از 2 دقیقه منقضی می‌شود

#### 2. تایید OTP
```http
POST /api/auth/verify-otp
```

**Body:**
```json
{
  "mobile": "09123456789",
  "code": "123456"
}
```

**Response:**
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

### داشبورد کاربر

#### دریافت اطلاعات داشبورد
```http
GET /api/dashboard
```

**Headers:**
```
Cookie: auth_token=<jwt_token>
```

**Response:**
```json
{
  "mobile": "09123456789",
  "lotteryStatus": "OPEN",
  "capacity": 1000,
  "participants": 150,
  "entryPrice": 50000,
  "lotteryCodes": [
    {
      "code": "LOT-A1B2-C3D4",
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "payments": [
    {
      "amount": 50000,
      "status": "SUCCESS",
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  ]
}
```

### پرداخت

#### ایجاد درخواست پرداخت
```http
POST /api/payment/create
```

**Body:**
```json
{
  "amount": 50000
}
```

**Response:**
```json
{
  "success": true,
  "message": "درخواست پرداخت ایجاد شد",
  "authority": "A00000000000000000000000000000391234",
  "paymentUrl": "https://www.zarinpal.com/pg/StartPay/..."
}
```

#### تایید پرداخت (Callback)
```http
GET /api/payment/verify?Authority=...&Status=OK
```

**Redirect:**
- موفق: `/dashboard?success=true&code=LOT-XXXX-YYYY`
- ناموفق: `/dashboard?error=payment_failed`

### مدیریت

#### ورود ادمین
```http
POST /api/admin
```

**Body:**
```json
{
  "username": "admin",
  "password": "your-admin-password"
}
```

#### دریافت داده‌های مدیریت
```http
GET /api/admin
```

**Response:**
```json
{
  "users": [...],
  "payments": [...],
  "lotteryCodes": [...],
  "winners": [...],
  "settings": {
    "capacity": 1000,
    "entryPrice": 50000,
    "winnersCount": 1,
    "status": "OPEN"
  }
}
```

#### انجام قرعه‌کشی
```http
POST /api/admin/run-lottery
```

**Response:**
```json
{
  "success": true,
  "message": "قرعه‌کشی با موفقیت انجام شد",
  "winners": [
    {
      "userId": "user-id",
      "mobile": "09123456789",
      "code": "LOT-A1B2-C3D4"
    }
  ]
}
```

#### دانلود گزارش
```http
GET /api/admin/export
```

**Response:** CSV File

---

## امنیت

### پیاده‌سازی شده

1. **JWT Authentication**
   - توکن‌های HttpOnly
   - انقضای 7 روز
   - رمزنگاری HS256

2. **Rate Limiting**
   - OTP: 3 درخواست در دقیقه
   - محدودیت بر اساس IP

3. **Input Validation**
   - اعتبارسنجی شماره موبایل ایرانی
   - اعتبارسنجی طول و فرمت OTP
   - اعتبارسنجی مبالغ پرداخت

4. **Transaction Logging**
   - لاگ تمام تراکنش‌های مهم
   - ذخیره IP و User-Agent

5. **CSRF Protection**
   - توکن‌های HttpOnly
   - SameSite cookies

5. **SQL Injection Prevention**
   - استفاده از Prisma ORM
   - Parameterized queries

### پیشنهادات امنیتی

1. **محیط تولید:**
   ```env
   NODE_ENV="production"
   JWT_SECRET="<generate-strong-secret>"
   ADMIN_SECRET="<change-admin-password>"
   ```

2. **HTTPS:**
   - حتماً از HTTPS استفاده کنید
   - HSTS را فعال کنید

3. **CORS:**
   ```javascript
   // در production، فقط دامنه‌های مجاز را اجازه دهید
   cors({
     origin: ['https://yourdomain.com'],
     credentials: true,
   })
   ```

---

## راهنمای استقرار در محیط تولید

### 1. آماده‌سازی محیط تولید

```bash
# ایجاد فایل .env.production
cat > .env.production << EOF
DATABASE_URL="file:./production.db"
JWT_SECRET="$(openssl rand -base64 32)"
ADMIN_SECRET="$(openssl rand -base64 24)"
ZARINPAL_MERCHANT_ID="your-production-merchant-id"
NODE_ENV="production"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
EOF
```

### 2. ساختن برای تولید

```bash
bun run build
```

### 3. استقرار

#### گزینه 1: Vercel
```bash
vercel deploy --prod
```

#### گزینه 2: Docker
```dockerfile
FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --production

COPY . .
RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]
```

#### گزینه 3: VPS
```bash
# SSH به سرور
ssh user@your-server.com

# کلون پروژه
git clone <repo-url> /var/www/lottery
cd /var/www/lottery

# نصب وابستگی‌ها
bun install --production
bun run build

# اجرای با PM2
npm install -g pm2
pm2 start bun --name "lottery" -- run start
pm2 save
pm2 startup
```

### 4. پیکربندی Nginx (اختیاری)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

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

### 5. فعال‌سازی SSL (LetsEncrypt)

```bash
sudo certbot --nginx -d yourdomain.com
```

---

## عیب‌یابی (Troubleshooting)

### خطا "پایگاه داده یافت نشد"
```bash
bun prisma db push
```

### OTP ارسال نمی‌شود
- چک کنید که شماره موبایل با الگوی `09\d{9}` مطابقت دارد
- Rate limiting را چک کنید (صبر کنید 1 دقیقه)

### پرداخت ناموفق است
- چک کنید که ZARINPAL_MERCHANT_ID صحیح است
- Callback URL در ZarinPal پیکربندی شده باشد
- در محیط development، از sandbox.zarinpal.com استفاده کنید

---

## پشتیبانی

برای سوالات و مشکلات:
- ایجاد Issue در GitHub
- ارسال ایمیل به support@example.com

---

## مجوز

MIT License
