# مستندات API

## مقدمه

API سیستم Shansix با Next.js API Routes پیاده‌سازی شده و از REST principles پیروی می‌کند. تمام endpointها با JSON کار می‌کنند و از HTTP status codes استاندارد استفاده می‌کنند.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## احراز هویت

### POST /auth/send-otp
ارسال کد تایید به شماره موبایل

#### Request
```json
{
  "mobile": "09123456789"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "کد تایید ارسال شد",
  "expiresAt": "2024-01-01T12:00:00.000Z"
}
```

#### Response (429 Too Many Requests)
```json
{
  "success": false,
  "message": "لطفاً بعد از 30 ثانیه تلاش کنید"
}
```

#### Rate Limiting
- 3 درخواست در هر دقیقه
- 60 ثانیه timeout بین درخواست‌ها

---

### POST /auth/verify-otp
تایید کد OTP و ورود

#### Request
```json
{
  "mobile": "09123456789",
  "code": "123456"
}
```

#### Response (200 OK)
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

#### Cookies
`auth_token` - JWT token با انقضای 7 روز

---

## پرداخت

### POST /payment/create
ایجاد درخواست پرداخت

#### Headers
```
Cookie: auth_token=<jwt-token>
```

#### Request
```json
{
  "amount": 50000
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "درخواست پرداخت ایجاد شد",
  "authority": "A00000000000000000000000000",
  "paymentUrl": "https://www.zarinpal.com/pg/StartPay/..."
}
```

#### Response (400 Bad Request)
```json
{
  "success": false,
  "message": "ظرفیت قرعه‌کشی تکمیل شده است"
}
```

---

### GET /payment/verify
تایید پرداخت (Callback از ZarinPal)

#### Query Parameters
- `Authority` - کد authority از ZarinPal
- `Status` - وضعیت پرداخت (OK/NOK)

#### Response
Redirect به `/dashboard` یا `/` با پیام مناسب

---

## داشبورد

### GET /dashboard
دریافت اطلاعات داشبورد کاربر

#### Headers
```
Cookie: auth_token=<jwt-token>
```

#### Response (200 OK)
```json
{
  "mobile": "09123456789",
  "lotteryStatus": "OPEN",
  "capacity": 1000,
  "participants": 50,
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

---

## ادمین

### GET /admin
دریافت داده‌های کامل سیستم

#### Headers
```
Cookie: admin_token=<admin-token>
```

#### Response (200 OK)
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

---

### POST /admin/run-lottery
اجرای قرعه‌کشی

#### Headers
```
Cookie: admin_token=<admin-token>
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "قرعه‌کشی با موفقیت انجام شد",
  "winners": [
    {
      "id": "winner-id",
      "userId": "user-id",
      "lotteryCode": "LOT-A1B2-C3D4",
      "drawDate": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

### GET /admin/export
دانلود گزارش داده‌ها

#### Headers
```
Cookie: admin_token=<admin-token>
```

#### Response
CSV file download

---

## HTTP Status Codes

| Code | توضیحات |
|------|---------|
| 200 | موفق |
| 201 | ایجاد شد |
| 400 | درخواست نامعتبر |
| 401 | عدم احراز هویت |
| 404 | یافت نشد |
| 429 | بیش از حد مجاز |
| 500 | خطای سرور |

---

## خطاها

### فرمت خطا
```json
{
  "success": false,
  "message": "توضیح خطا"
}
```

### کدهای خطای رایج

| کد خطا | توضیحات |
|---------|---------|
| INVALID_MOBILE | شماره موبایل نامعتبر |
| OTP_EXPIRED | کد تایید منقضی شده |
| OTP_INVALID | کد تایید اشتباه |
| PAYMENT_FAILED | پرداخت ناموفق |
| CAPACITY_FULL | ظرفیت قرعه‌کشی پر شده |
| LOTTERY_CLOSED | قرعه‌کشی بسته شده |

---

## مثال‌ها

### با curl
```bash
# ارسال OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile":"09123456789"}'

# تایید OTP
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile":"09123456789","code":"123456"}'

# ایجاد پرداخت
curl -X POST http://localhost:3000/api/payment/create \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=..." \
  -d '{"amount":50000}'
```

### با JavaScript/Fetch
```javascript
// ارسال OTP
const response = await fetch('/api/auth/send-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mobile: '09123456789'
  })
});

const data = await response.json();
console.log(data);
```

---

## پشتیبانی

برای سوالات در مورد API، یک Issue باز کنید:
https://github.com/Amirwopi/Shansix/issues/new
