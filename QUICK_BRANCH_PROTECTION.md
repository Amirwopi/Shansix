# راهنمای سریع فعال‌سازی Branch Protection

## ⚡ راهنمای سریع (5 دقیقه)

### مرحله 1: به Settings بروید
```
https://github.com/Amirwopi/Shansix/settings/branches
```

### مرحله 2: روی Add rule کلیک کنید

### مرحله 3: تنظیمات را وارد کنید

#### Branch name pattern:
```
main
```

#### Require status checks to pass before merging:
```
☑️ فعال کنید
```

#### این status checks را انتخاب کنید:
```
☑️ 🔍 Lint & Code Quality
☑️ 🔎 TypeScript Type Check
☑️ 🏗️ Build Application
☑️ 🔒 Security Scan
☑️ 🗄️ Validate Database Schema
☑️ 📦 Dependency Audit
```

#### Require pull request reviews before merging:
```
☑️ فعال کنید
Number of required reviewers: 1
Dismiss stale review approvals when new commits are pushed: ☑️
```

#### Restrict who can push to matching branches:
```
☑️ فعال کنید
Allow: Admins, Amirwopi
```

#### Do not allow bypassing the above settings:
```
☑️ فعال کنید
```

### مرحله 4: Save کنید

روی **Create** یا **Save changes** کلیک کنید.

---

## ✅ چک‌لیست تکمیل

- [ ] به Settings > Branches رفته‌اید
- [ ] Add rule را زده‌اید
- [ ] Branch name را main گذاشته‌اید
- [ ] Status checks را فعال کرده‌اید
- [ ] تمام 6 checks را انتخاب کرده‌اید
- [ ] PR reviews را فعال کرده‌اید
- [ ] Push restrictions را فعال کرده‌اید
- [ ] Bypass را غیرفعال کرده‌اید
- [ ] Save را زده‌اید

---

## 🎯 نتیجه

پس از این تنظیمات:
- ✅ هیچ کسی بدون green CI نمی‌تواند push کند
- ✅ تمام PRها باید review شوند
- ✅ Linear history حفظ می‌شود
- ✅ Security بهبود می‌شود

---

## 🔍 تست

برای تست که branch protection کار می‌کند:

1. به GitHub بروید
2. یک PR باز کنید (یا Dependabot ایجاد کند)
3. نگاه کنید که:
   - ✅ Cannot merge (چون CI هنوز running است)
   - ✅ بعد از green شدن، Merge option فعال می‌شود
   - ✅ بدون approval نمی‌توانید merge کنید

---

## 📞 مشکلات؟

 اگر نمی‌توانید settings را تغییر دهید:
1. مطمئن شوید Admin access دارید
2. یا Owner را درخواست دهید
3. Settings > Collaborators و teams را بررسی کنید

---

**تکمیل شد!** 🎉
