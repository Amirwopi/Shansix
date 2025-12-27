# Shansix (سیستم قرعه‌کشی آنلاین)

اپلیکیشن **Shansix** یک سیستم قرعه‌کشی آنلاین مبتنی بر **Next.js 15** است که با احراز هویت **OTP**، پرداخت آنلاین **زرین‌پال**، مدیریت دوره‌های قرعه‌کشی (Round-based Lottery) و پنل ادمین، امکان برگزاری قرعه‌کشی‌های شفاف و قابل رهگیری را فراهم می‌کند.

این README بر اساس کد موجود در این ریپازیتوری نوشته شده و با مسیرها/اسکریپت‌ها/متغیرهای محیطی واقعی پروژه هم‌راستا است.

## فهرست مطالب

- [ویژگی‌ها](#ویژگیها)
- [پشته فناوری](#پشته-فناوری)
- [جریان کلی کارکرد سیستم](#جریان-کلی-کارکرد-سیستم)
- [راه‌اندازی سریع](#راهاندازی-سریع)
- [پیکربندی (.env)](#پیکربندی-env)
- [دیتابیس و Prisma](#دیتابیس-و-prisma)
- [اسکریپت‌ها (Scripts)](#اسکریپتها-scripts)
- [مسیرها و صفحات مهم](#مسیرها-و-صفحات-مهم)
- [API Reference (خلاصه)](#api-reference-خلاصه)
- [امنیت و نکات عملیاتی](#امنیت-و-نکات-عملیاتی)
- [عیب‌یابی](#عیبیابی)

---

## ویژگی‌ها

- **ورود/ثبت‌نام با شماره موبایل (OTP)**
  - اعتبارسنجی شماره موبایل ایران (`^09\d{9}$`)
  - محدودیت نرخ درخواست OTP (۳ درخواست در دقیقه)
  - ذخیره OTP در دیتابیس و انقضای ۲ دقیقه‌ای
  - ایجاد کاربر هنگام ارسال OTP در صورت عدم وجود
- **ثبت آیدی اینستاگرام برای هر کاربر**
  - دریافت `instagramId` در مرحله ارسال OTP و ذخیره روی پروفایل کاربر
  - قابل مشاهده و قابل جستجو در پنل ادمین
- **پرداخت آنلاین با زرین‌پال**
  - ایجاد درخواست پرداخت (`/api/payment/create`)
  - کال‌بک و تأیید پرداخت (`/api/payment/verify`)
  - ثبت وضعیت تراکنش‌ها: `PENDING` / `SUCCESS` / `FAILED`
- **تولید کد قرعه‌کشی و ثبت سوابق**
  - تولید کد قرعه‌کشی یکتا و ذخیره در جدول `lottery_codes`
  - اتصال کد به پرداخت و کاربر
- **مدیریت دوره‌های قرعه‌کشی (Rounds)**
  - هر دوره دارای ظرفیت، مبلغ ورود، تعداد برندگان و وضعیت (`OPEN`/`CLOSED`/`DRAWN`) است
  - با رسیدن به ظرفیت، سیستم می‌تواند قرعه‌کشی را به صورت خودکار اجرا کند
- **قرعه‌کشی و انتخاب برندگان**
  - انتخاب تصادفی برندگان از بین کدهای شرکت‌کننده
  - محاسبه جایزه هر برنده بر اساس مجموع درآمد دوره / تعداد برندگان
  - ثبت برندگان در جدول `winners`
  - امکان ارسال پیامک به برندگان
- **پنل کاربری (Dashboard)**
  - نمایش وضعیت دوره فعلی، ظرفیت، مبلغ شرکت
  - نمایش کدهای صادر شده کاربر در دوره فعلی
  - نمایش سوابق پرداخت کاربر (برای همان دوره)
- **پنل مدیریت (Admin)**
  - مشاهده کاربران، پرداخت‌ها، کدها، برندگان
  - جستجو بر اساس شماره موبایل یا `instagramId`
  - اجرای دستی قرعه‌کشی
  - خروجی CSV (Excel-friendly)
  - گزارش مالی تجمیعی و نمودار درآمد (هفتگی/ماهانه/سالانه)
  - مدیریت بنرهای داشبورد (CRUD)
  - مدیریت پیام‌های «بازخورد/تماس با ما»
  - ریست دوره و ایجاد دوره جدید
- **موزیک پلیر سایت**
  - پخش موزیک پس‌زمینه (با fallback و رعایت محدودیت‌های autoplay مرورگر)
  - عدم نمایش پلیر در بخش ادمین

---

## پشته فناوری

- **Next.js 15** (App Router)
- **React 18**
- **TypeScript**
- **Prisma** + **MySQL** (`mysql2`)
- **ZarinPal**
  - مسیر اصلی پرداخت در محصول: `zarinpal-checkout`
  - همچنین یک مسیر پرداخت جداگانه در `api/zarinpal/*` وجود دارد (برای سناریوهای ساده/تستی)
- **Faraz SMS** (`@aspianet/faraz-sms`) برای ارسال پیامک OTP/برندگان
- **shadcn/ui + TailwindCSS** برای UI

---

## جریان کلی کارکرد سیستم

### 1) ورود/ثبت‌نام با OTP

1. کاربر شماره موبایل و (اختیاری) `instagramId` را در صفحه اصلی وارد می‌کند.
2. درخواست به `POST /api/auth/send-otp` ارسال می‌شود.
3. سیستم:
   - کاربر را در صورت نبودن ایجاد می‌کند.
   - OTP را ایجاد و ذخیره می‌کند.
   - پیامک را ارسال می‌کند.
4. کاربر کد را وارد می‌کند و `POST /api/auth/verify-otp` انجام می‌شود.
5. در صورت موفقیت:
   - کاربر فعال می‌شود (`isActive=true`)
   - JWT ساخته و در `auth_token` (HttpOnly cookie) ذخیره می‌شود.
   - اگر موبایل برابر `ADMIN_MOBILE` باشد، `admin_token` هم ست می‌شود و کاربر به پنل ادمین هدایت می‌شود.

### 2) شرکت در قرعه‌کشی (پرداخت)

1. در داشبورد کاربر، دکمه «پرداخت و دریافت کد شانس» اجرا می‌شود.
2. درخواست به `POST /api/payment/create` ارسال می‌شود.
3. سیستم یک `Payment` با وضعیت `PENDING` ایجاد می‌کند و لینک پرداخت زرین‌پال را می‌دهد.
4. کاربر به زرین‌پال منتقل می‌شود.
5. پس از پرداخت، زرین‌پال کاربر را به `GET /api/payment/verify` برمی‌گرداند.
6. سیستم پرداخت را Verify می‌کند، وضعیت را `SUCCESS` می‌کند و یک `LotteryCode` برای کاربر می‌سازد.

### 3) اجرای قرعه‌کشی

- به صورت **خودکار**: وقتی ظرفیت دوره پر شود (پس از تایید پرداخت)
- به صورت **دستی توسط ادمین**: `POST /api/admin/run-lottery`

---

## راه‌اندازی سریع

### پیش‌نیازها

- Node.js (طبق `package.json`: نسخه `>=20 <24`)
- یک دیتابیس MySQL

### نصب

```bash
npm install
```

### ساخت `.env`

```bash
copy .env.example .env
```

مقادیر را تنظیم کنید (بخش [پیکربندی](#پیکربندی-env)).

### سینک دیتابیس

این پروژه از `prisma db push` برای سینک اسکیمای دیتابیس استفاده می‌کند:

```bash
npm run db:push
```

### اجرای Development

```bash
npm run dev
```

سایت روی `http://localhost:3000` در دسترس است.

---

## پیکربندی (.env)

فایل نمونه در `.env.example` قرار دارد.

| متغیر | توضیح |
|---|---|
| `DATABASE_URL` | اتصال MySQL (مثال: `mysql://USER:PASSWORD@HOST:3306/DBNAME`) |
| `JWT_SECRET` | کلید امضا JWT (حتماً در پروداکشن تغییر کند) |
| `ADMIN_TOKEN` | توکن ادمین (در cookie: `admin_token`) |
| `ADMIN_MOBILE` | شماره موبایل ادمین (اگر با این شماره وارد شوید ادمین می‌شوید) |
| `NEXT_PUBLIC_BASE_URL` | آدرس پایه (برای callback پرداخت) |
| `FARAZ_API_KEY` | کلید فراز اس‌ام‌اس |
| `FARAZ_ORIGINATOR` | سرشماره/خط ارسال پیامک |
| `FARAZ_OTP_PATTERN_CODE` | کد الگوی OTP (در مسیر send-otp استفاده می‌شود) |
| `ZARINPAL_MERCHANT_ID` | مرچنت زرین‌پال |
| `ZARINPAL_SANDBOX` | `true/false` (برای مسیر `api/zarinpal/*`) |
| `NODE_ENV` | `development` / `production` |

### تولید JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## دیتابیس و Prisma

### مدل‌ها (کلیت)

- `User` (کاربر)
  - `mobile` (unique)
  - `instagramId` (اختیاری)
  - `isActive`
- `OTP` (کد یکبار مصرف)
- `Payment` (پرداخت)
- `LotteryCode` (کد قرعه‌کشی)
- `LotteryRound` (دوره قرعه‌کشی)
- `LotterySettings` (تنظیمات کلی)
- `Winner` (برنده)
- `DashboardBannerItem` (بنر داشبورد)
- `TransactionLog` (لاگ عملیاتی)
- `Feedback` (پیام کاربران)

### سینک اسکیمای دیتابیس

```bash
npm run db:push
```

### ساخت دیتابیس در MySQL به صورت خودکار

اسکریپت `ensure-db` قبل از `start` اجرا می‌شود و اگر دیتابیس وجود نداشته باشد آن را می‌سازد، سپس `prisma db push` را اجرا می‌کند:

```bash
npm run ensure-db
```

> در محیط production با `npm run start` (standalone) این کار خودکار انجام می‌شود.

---

## اسکریپت‌ها (Scripts)

| دستور | توضیح |
|---|---|
| `npm run dev` | اجرای Next در حالت توسعه |
| `npm run build` | تولید build (به همراه `prisma generate`) |
| `npm run start` | اجرای standalone server (`server.js`) + `ensure-db` |
| `npm run ensure-db` | ساخت DB در MySQL (در صورت نیاز) + `prisma db push` |
| `npm run db:push` | `prisma db push` |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | lint |

---

## مسیرها و صفحات مهم

- `/` صفحه ورود/ثبت‌نام OTP
- `/dashboard` پنل کاربری
- `/admin` پنل مدیریت
- `/admin/finance` گزارش مالی
- `/payment/result` صفحه نتیجه پرداخت

---

## API Reference (خلاصه)

### Auth

- `POST /api/auth/send-otp`
  - Body:
    - `mobile: string`
    - `instagramId?: string`
- `POST /api/auth/verify-otp`
  - Body:
    - `mobile: string`
    - `code: string`
- `GET|POST /api/auth/logout`

### Dashboard

- `GET /api/dashboard` (نیازمند `auth_token`)
- `GET /api/dashboard/banner`

### Payments (مسیر اصلی محصول)

- `POST /api/payment/create` (نیازمند `auth_token`)
- `GET /api/payment/verify` (callback زرین‌پال)

### Admin

- `GET /api/admin` (نیازمند `admin_token`)
- `POST /api/admin/run-lottery`
- `GET /api/admin/export` (CSV)
- `PATCH /api/admin/settings` (ایجاد/به‌روزرسانی تنظیمات و ساخت دوره جدید)
- `POST /api/admin/reset` (بستن دوره باز و ساخت دوره جدید)
- `GET /api/admin/finance?period=weekly|monthly|yearly`
- `GET|POST /api/admin/dashboard-banners`
- `PATCH|DELETE /api/admin/dashboard-banners/:id`
- `GET|PATCH /api/admin/feedback`

### Feedback (Public)

- `POST /api/feedback`

---

## امنیت و نکات عملیاتی

- توکن کاربر (`auth_token`) و توکن ادمین (`admin_token`) در **HttpOnly Cookie** ذخیره می‌شوند.
- برای ورود ادمین، شرط اصلی **برابر بودن موبایل با `ADMIN_MOBILE`** و ست شدن `admin_token` است.
- حتماً در production:
  - `JWT_SECRET` و `ADMIN_TOKEN` را تغییر دهید.
  - `NEXT_PUBLIC_BASE_URL` را روی دامنه واقعی قرار دهید.
  - HTTPS را فعال کنید.

---

## عیب‌یابی

### OTP ارسال نمی‌شود

- مقادیر `FARAZ_API_KEY` و `FARAZ_ORIGINATOR` را بررسی کنید.
- کد الگوی `FARAZ_OTP_PATTERN_CODE` را بررسی کنید.
- لاگ‌های سرور را ببینید (در dev داخل ترمینال Next).

### پرداخت به نتیجه نمی‌رسد

- `ZARINPAL_MERCHANT_ID` را بررسی کنید.
- `NEXT_PUBLIC_BASE_URL` باید دقیقاً با دامنه‌ای که callback روی آن می‌آید یکسان باشد.
- اگر sandbox می‌خواهید، توجه کنید مسیر اصلی پرداخت از `zarinpal-checkout` استفاده می‌کند و sandbox بودن را با `NODE_ENV !== 'production'` تعیین می‌کند.

### جدول‌ها ساخته نمی‌شوند

- `DATABASE_URL` باید حتماً `mysql://...` باشد.
- `npm run db:push` را اجرا کنید.
- اگر دیتابیس هنوز وجود ندارد: `npm run ensure-db`.

---

### وضعیت مستندات

این README با وضعیت فعلی ریپازیتوری همگام است. اگر API/مدل جدیدی اضافه شد، این فایل را هم به‌روزرسانی کنید.
