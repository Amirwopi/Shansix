# 🔒 راهنمای جامع Branch Protection

این راهنمای تمام Rule های Branch Protection را با جزئیات کامل توضیح می‌دهد.

---

## 📍 مسیر تنظیمات

```
Repository → Settings → Branches
```

---

## 📋 لیست کامل Rules

### ✅ Rule 1: Restrict creations

**وضعیت پیشنهادی:** فعال ☑️

**توضیح فارسی:**
> فقط کاربران با دسترسی Bypass مجاز به ساخت شاخه‌های جدید هستند.

**توضیح فنی:**
```yaml
restrictions:
  allow:
    users: ["amirwopi", "admins"]
    apps: []
    teams: []
```

**چرا باید فعال باشد؟**
- جلوگیری از ساخت branch های تصادفی
- کنترل کامل بر توسعه
- حفظ امنیت codebase

**نحوه فعال‌سازی:**
1. به Settings > Branches بروید
2. روی Add rule کلیک کنید
3. Branch name pattern: `main`
4. گزینه Restrict creations را انتخاب کنید
5. Save کنید

---

### ✅ Rule 2: Restrict updates

**وضعیت پیشنهادی:** فعال ☑️

**توضیح فارسی:**
> فقط کاربران با دسترسی Bypass مجاز به به‌روزرسانی شاخه‌ها هستند.

**توضیح فنی:**
```yaml
restrictions:
  allow:
    users: ["amirwopi", "maintainers"]
    apps: []
    teams: []
```

**چرا باید فعال باشد؟**
- جلوگیری از تغییرات غیرمجاز
- کنترل روی کسی که می‌تواند push کند
- حفظ یکپارچی

**نحوه فعال‌سازی:**
1. در همان rule برای main
2. گزینه Restrict updates را انتخاب کنید
3. Save کنید

---

### ✅ Rule 3: Restrict deletions

**وضعیت پیشنهادی:** فعال ☑️

**توضیح فارسی:**
> فقط کاربران با دسترسی Bypass مجاز به حذف شاخه‌ها هستند.

**چرا باید فعال باشد؟**
- جلوگیری از حذف تصادفی main branch
- حفظ تاریخچه پروژه
- امنیت بالا

**نحوه فعال‌سازی:**
1. در همان rule برای main
2. گزینه Restrict deletions را انتخاب کنید
3. Save کنید

---

### ✅ Rule 4: Require linear history

**وضعیت پیشنهادی:** فعال ☑️

**توضیح فارسی:**
> جلوگیری از merge commits. تاریخچه خطی حفظ می‌شود.

**توضیح فنی:**
```bash
# Bad (merge commit):
git merge feature-branch

# Good (rebase):
git rebase main
git push
```

**چرا باید فعال باشد؟**
- تاریخچه تمیز و خوانا
- استفاده از rebase بهتر از merge است
- جلوگیری از complex graph

**نحوه فعال‌سازی:**
1. در همان rule برای main
2. گزینه Require linear history را انتخاب کنید
3. Save کنید

---

### ☐ Rule 5: Require deployments to succeed

**وضعیت پیشنهادی:** غیرفعال ☐

**توضیح فارسی:**
> اگر از environments استفاده می‌کنید، deployment باید موفق باشد.

**چرا غیرفعال؟**
- پروژه فعلاً از GitHub Actions deployment استفاده نمی‌کند
- این rule برای GitHub Pages و GitHub Environments است
- اگر در آینده از environments استفاده کردید، فعال کنید

**نحوه فعال‌سازی در آینده:**
1. در همان rule برای main
2. گزینه Require deployments to succeed را انتخاب کنید
3. environments مناسب را انتخاب کنید

---

### ☐ Rule 6: Require signed commits

**وضعیت پیشنهادی:** غیرفعال ☐

**توضیح فارسی:**
> تمام کامیت‌ها باید با GPG sign شوند.

**توضیح فنی:**
```bash
# Sign a commit
git commit -S -m "message"

# Verify signature
git log --show-signature
```

**چرا غیرفعال؟**
- نیاز به GPG key setup دارد
- پیچیدگی برای contributors جدید
- اگر از code signing نیاز ندارید، غیرفعال بگذارید

**نحوه فعال‌سازی در آینده:**
1. GPG key بسازید و distribute کنید
2. این rule را فعال کنید

---

### ✅ Rule 7: Require a pull request before merging

**وضعیت پیشنهادی:** فعال ☑️ (بسیار مهم!)

**توضیح فارسی:**
> تغییرات مستقیم غیرمجاز است. همه تغییرات باید از طریق PR انجام شوند.

**چرا بسیار مهم است؟**
- ✅ Code review قبل از merge
- ✅ CI چک می‌شود
- ✅ History شفاف است
- ✅ Collaboration بهبود می‌شود

**نحوه فعال‌سازی:**
1. در همان rule برای main
2. گزینه Require a pull request before merging را انتخاب کنید
3. Save کنید

**نکته مهم:**
- پس از فعال‌سازی، `git push` مستقیم دیگر کار نمی‌کند
- حتماً باید PR باز کنید
- PR باید review و approval دریافت کند

---

### ✅ Rule 8: Require status checks to pass

**وضعیت پیشنهادی:** فعال ☑️

**توضیح فارسی:**
> تمام CI checks باید سبز باشند قبل از merge.

**Status checks برای Shansix:**
```
🔍 Lint & Code Quality          [اختیاری]
🔎 TypeScript Type Check         [اجباری]
🏗️ Build Application            [اجباری]
🔒 Security Scan (Trivy)        [اجباری]
🗄️ Validate Database Schema     [اجباری]
📦 Dependency Audit             [اختیاری]
```

**نحوه فعال‌سازی:**
1. گزینه Require status checks to pass را انتخاب کنید
2. از لیست available checks، این‌ها را انتخاب کنید:
   - Lint & Code Quality
   - TypeScript Type Check
   - Build Application
   - Security Scan
   - Validate Database Schema
   - Dependency Audit
3. بهتر است همگی را انتخاب کنید
4. Save کنید

**مزایای Status Check:**
- 🟢 Check passed
- 🟡 Check pending
- 🔴 Check failed
- ⚪ Check skipped

---

### ☐ Rule 9: Do not require status checks on creation

**وضعیت پیشنهادی:** غیرفعال ☐

**توضیح فارسی:**
> اجازه ساخت شاخه‌های جدید بدون منتظر ماندن برای CI.

**چرا غیرفعال؟**
- برای development branches مفید است
- شاخه‌های hotfix سریع ساخته می‌شوند
- برای main/production مناسب نیست

**نحوه فعال‌سازی (اگر خواستید):**
1. این گزینه را انتخاب کنید
2. فقط برای specific branches اعمال کنید

---

### ☐ Rule 10: No required checks

**وضعیت پیشنهادی:** غیرفعال ☐

**توضیح فارسی:**
> انتخاب استاندارد checks از لیست.

**چرا غیرفعال؟**
- از Rule 8 (Require status checks to pass) استفاده کنید
- این گزینه قدیمی است

---

### ✅ Rule 11: Block force pushes

**وضعیت پیشنهادی:** فعال ☑️ (بسیار مهم!)

**توضیح فارسی:**
> جلوگیری از حذف تاریخچه. امنیت بالا.

**توضیح فنی:**
```bash
# این دستور دیگر کار نمی‌کند:
git push -f origin main

# خطا:
remote: error: denying non-fast-forward
```

**چرا بسیار مهم است؟**
- ✅ جلوگیری از حذف تاریخچه
- ✅ جلوگیری از overwrite commits
- ✅ حفظ audit trail
- ✅ جلوگیری از خرابکاری

**نحوه فعال‌سازی:**
1. در Settings > Branches
2. روی ... (more options) کنار rule کلیک کنید
3. گزینه Block force pushes را انتخاب کنید
4. Save کنید

**تأثیر روی توسعه:**
- اگر نیاز به rewrite history دارید:
  - به admin access داشته باشید
  - یا از GitHub Settings bypass کنید
- برای develop branches ممکن است غیرفعال باشد

---

### ✅ Rule 12: Require code scanning results

**وضعیت پیشنهادی:** فعال ☑️

**توضیح فارسی:**
> تمام code scan ها باید بدون مشکل باشند.

**توضیح فنی:**
```yaml
# .github/workflows/ci.yml
security-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        severity: 'CRITICAL,HIGH'
```

**چرا باید فعال باشد؟**
- Security scanning خودکار
- جلوگیری از merge کدهای آسیب‌پذیر
- Compliance با استانداردهای امنیتی

**نحوه فعال‌سازی:**
1. گزینه Require code scanning results را انتخاب کنید
2. ابزار اسکن را انتخاب کنید (Trivy/CodeQL)
3. severity level را تنظیم کنید:
   - Critical: الزامی
   - High: الزامی
   - Medium: اختیاری
4. Save کنید

---

### ✅ Rule 13: Require code quality results

**وضعیت پیشنهادی:** فعال ☑️

**توضیح فارسی:**
> بررسی کیفیت کد باید pass کند.

**چرا باید فعال باشد؟**
- اگر از SonarQube یا CodeClimate استفاده می‌کنید
- اگر از GitHub Advanced Security استفاده می‌کنید
- اگر از ESLint/TypeScript در CI استفاده می‌کنید

**نحوه فعال‌سازی:**
1. گزینه Require code quality results را انتخاب کنید
2. ابزار quality را انتخاب کنید
3. severity level را تنظیم کنید
4. Save کنید

---

### ☐ Rule 14: Automatically request Copilot code review

**وضعیت پیشنهادی:** غیرفعال ☐

**توضیح فارسی:**
> درخواست review خودکار با GitHub Copilot.

**چرا غیرفعال؟**
- نیاز به Copilot license دارد
- فعلاً در پروژه استفاده نمی‌شود
- اختیاری است

**نحوه فعال‌سازی در آینده:**
1. اگر از Copilot استفاده می‌کنید
2. این گزینه را فعال کنید

---

### ☐ Rule 15: Manage static analysis tools

**وضعیت پیشنهادی:** غیرفعال ☐

**توضیح فارسی:**
> تنظیم ابزارهای static analysis در Copilot.

**چرا غیرفعال؟**
- مربوط به GitHub Copilot است
- فعلاً در پروژه استفاده نمی‌شود

---

## 🎯 پیکربندی نهایی پیشنهادی

### مجموعه Rules برای main branch

```
✅ Restrict creations
✅ Restrict updates
✅ Restrict deletions
✅ Require linear history
☐ Require deployments to succeed (استفاده نمی‌شود)
☐ Require signed commits (فعلاً غیرفعال)
✅ Require a pull request before merging
✅ Require status checks to pass
☐ Do not require status checks on creation (برای main غیرفعال)
☐ No required checks (از Rule 8 استفاده کنید)
✅ Block force pushes
✅ Require code scanning results
✅ Require code quality results
☐ Automatically request Copilot code review (فعلاً غیرفعال)
☐ Manage static analysis tools (فعلاً غیرفعال)
```

---

## 🔒 پیکربندی Security

### Rules با اولویت امنیتی بالا

1. **Block force pushes** ⭐⭐⭐
   - مهم‌ترین rule امنیتی
   - جلوگیری از history tampering

2. **Restrict creations** ⭐⭐⭐
   - کنترل کامل بر development
   - فقط authorized users

3. **Restrict updates & deletions** ⭐⭐
   - حفظ main branch
   - فقط admins

4. **Require PR before merging** ⭐⭐⭐
   - code review الزامی
   - CI checks

5. **Require status checks** ⭐⭐
   - build/lint/security

6. **Require code scanning** ⭐⭐⭐
   - Security vulnerabilities

7. **Require linear history** ⭐
   - Clean history

---

## 📊 چک‌لیست تکمیل قبل از فعال‌سازی

برای اینکه مطمئن شوید همه چیز درست است:

### Pre-configuration
- [ ] به Settings > Branches رفته‌اید
- [ ] یک commit در main branch وجود دارد
- [ ] CI/CD pipeline فعال و کار می‌کند
- [ ] Status checks در GitHub شناخته شده‌اند

### Users & Teams
- [ ] خودتان Admin access دارید
- [ ] یا owner هستید
- [ ] اگر collaborators دارید، maintainers role به آنها بدهید

### Rules Activation
- [ ] Restrict creations فعال است
- [ ] Restrict updates فعال است
- [ ] Restrict deletions فعال است
- [ ] Require linear history فعال است
- [ ] Require PR before merging فعال است
- [ ] Require status checks فعال است
- [ ] Status checks انتخاب شده‌اند:
  - [ ] Lint & Code Quality
  - [ ] TypeScript Type Check
  - [ ] Build Application
  - [ ] Security Scan
  - [ ] Validate Database Schema
  - [ ] Dependency Audit
- [ ] Block force pushes فعال است
- [ ] Require code scanning فعال است
- [ ] Require code quality فعال است (اگر ابزار دارید)

### Testing
- [ ] سعی کنید push مستقیم (باید fail شود)
- [ ] یک PR باز کنید (باید ساخته شود)
- [ ] منتظر بمانید تا CI سبز شود
- [ ] سعی کنید merge (باید موفق باشد)

---

## 🚀 مزایای این تنظیمات

### Security
- ✅ هیچ کسی بدون approval نمی‌تواند merge کند
- ✅ Code review الزامی است
- ✅ Security scan قبل از merge
- ✅ Force push غیرمجاز است

### Code Quality
- ✅ Linting الزامی است
- ✅ Type checking الزامی است
- ✅ Build باید موفق باشد
- ✅ Linear history تمیز

### Collaboration
- ✅ همه تغییرات از طریق PR
- ✅ Review workflow شفاف
- ✅ Approval process واضح
- ✅ Transparency بالا

---

## 🛠️ Troubleshooting

### مشکل: Cannot push to main
**نمایش:** remote rejected (force)

**راه‌حل:**
- Branch protection کار می‌کند ✅
- PR باز کنید و مراحه کنید

### مشکل: Status checks showing as None
**نمایش:** هیچ check موجود نیست

**راه‌حل:**
1. یک commit به branch دیگر بفرستید (feature/)
2. منتظر بمانید CI complete شود
3. به Settings > Branches برگردید
4. Status checks باید نمایش داده شوند

### مشکل: Push failed despite having access
**نمایش:** permission denied

**راه‌حل:**
1. Admin خودتان را چک کنید
2. Users & Teams را بررسی کنید
3. دسترسی Bypass را ببینید

### مشکل: CI is not recognized as a status check
**نمایش:** checks greyed out

**راه‌حل:**
1. CI workflow باید حداقل یک بار موفق شود
2. به Actions tab بروید
3. مطمئن شوید workflow اسم دارد و status report می‌کند

---

## 📚 منابع و مستندات

- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/about-protected-branches)
- [About Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/about-protected-branches)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-rulesets-for-protected-branches)
- [Status Checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/about-protected-branches#require-status-checks-to-pass-before-merging)
- [Code Scanning](https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning)

---

## ✅ نتیجه

با اعمال این تنظیمات:

🔒 **امنیت حداکثری:** تمام push ها از طریق PR و review
🎯 **کیفیت کد:** CI/CD الزامی قبل از merge
📊 **شفافیت:** تاریخچه تمیز و linear
🚀 **به‌روزرسانی خودکار:** Security patches و dependencies
👥 **کنترل کامل:** فقط authorized users می‌توانند تغییر دهند

---

**آخرین به‌روزرسانی:** 2025
