# GitHub Branch Protection Rules

این تنظیمات را در GitHub repository settings اعمال کنید:

## مسیر تنظیمات

Repository → Settings → Branches → Add rule

---

## 📋 تنظیمات پیشنهادی برای branch اصلی (main)

### 🔥 نام قاعده (Branch name pattern)
```
main
```

### ✅ تنظیمات فعال (Settings)

#### 1. 🔒 Require status checks to pass before merging
```
☑️ Require status checks to pass before merging
```

#### 2. ✅ Require branches to be up to date before merging
```
☑️ Require branches to be up to date before merging
```

#### 3. 🔢 Require pull request reviews before merging
```
☑️ Require pull request reviews before merging
```

- **Number of required reviewers:** 1
- **Dismiss stale review approvals when new commits are pushed:** ☑️

#### 4. 📝 Require review from Code Owners
```
☐ Require review from CODEOWNERS
```
(اختیاری - اگر CODEOWNERS file دارید)

#### 5. 🔒 Restrict who can push to matching branches
```
☑️ Restrict who can push to matching branches
```

- **Allow:**
  - Admins
  - `amirwopi` (و سایر maintainers)

#### 6. ❌ Do not allow bypassing the above settings
```
☑️ Do not allow bypassing the above settings
```

---

## 📊 Required Status Checks (Must Pass Before Merge)

این checks را فعال کنید:

```
☑️ 🔍 Lint & Code Quality
☑️ 🔎 TypeScript Type Check
☑️ 🏗️ Build Application
☑️ 🔒 Security Scan
☑️ 🗄️ Validate Database Schema
☑️ 📦 Dependency Audit
```

---

## 🔧 تنظیمات پیشرفته (Advanced)

### Require conversation resolution
```
☑️ Require conversation resolution before merging
```

### Require linear history
```
☑️ Require linear history
```

### Restrict edits to maintain linear history
```
☐ Restrict edits to maintain linear history
```

---

## 🚀 برای Pull Request Approval Rules

تعداد approvers:
- **Minimum:** 1 reviewer
- **Dismiss stale approvals:** بعد از هر push جدید

---

## 🎯 Best Practices برای Branch Protection

1. **همیشه main branch را محافظت کنید**
2. **تمام status checks باید green باشند**
3. **Code review الزامی است**
4. **Linear history را فعال کنید**
5. **Bypass را غیرفعال کنید** (برای security)
6. **منظور به‌روزرسانی** - rules را مرور کنید

---

## 📞 اگر settings را نمی‌توانید تغییر دهید

1. مطمئن شوید Admin access دارید
2. یا Owner را درخواست دهید
3. Settings → Collaborators and teams را بررسی کنید

---

## 🔗 لینک مستقیم به تنظیمات

برای repository شما:
```
https://github.com/Amirwopi/Shansix/settings/branches
```

---

## ✅ چک‌لیست قبل از فعال‌سازی

- [ ] Repository owner هستید یا admin access دارید
- [ ] CI/CD pipeline نصب و فعال است
- [ ] Status checks در GitHub شناخته شده‌اند
- [ ] یک commit در main branch وجود دارد
- [ ] .github/workflows/ci.yml وجود دارد

---

پس از اعمال این تنظیمات:
✅ هیچ کسی بدون گذراندن CI نمی‌تواند push کند
✅ Pull Request ها باید review شوند
✅ تمام checks باید green باشند
✅ Linear history حفظ می‌شود
