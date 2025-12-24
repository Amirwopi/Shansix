# استراتژی آپدیت وابستگی‌ها (Dependency Update Strategy)

## 📚 مقدمه

این مستند استراتژی مدیریت وابستگی‌ها در پروژه Shansix را تعریف می‌کند. هدف ما حفظ امنیت، پایداری و به‌روز بودن پروژه است.

---

## 🎯 اصول راهبری (Guiding Principles)

### 1️⃣ امنیت اولویت اول
تمام آپدیت‌های امنیتی فوراً بررسی و اعمال می‌شوند.

### 2️⃣ پایداری در قدم بعدی
قبل از major version updates، testing کامل انجام می‌شود.

### 3️⃣ اتوماسیون هوشمند
برای آپدیت‌های minor و patch، Dependabot از ما پیروی می‌کند.

### 4️⃣ review منظم
تمام dependency updates قبل از merge بررسی می‌شوند.

---

## 📊 دسته‌بندی وابستگی‌ها

### 🔴 High Priority (فوری)
- آپدیت‌های امنیتی (Security patches)
- Fixed vulnerabilities در وابستگی‌ها
- Critical bugs در dependencies

**نحوه مدیریت:**
- 🕐 زمان پاسخ: < 24 ساعت
- 🔄 Action: فوراً review و merge
- 📧 Automated merge برای patch versions

### 🟡 Medium Priority (هفتگی)
- Minor version updates
- Feature updates در dependencies
- Performance improvements

**نحوه مدیریت:**
- 🕐 زمان پاسخ: < 1 هفته
- 🔄 Action: review در اولین فرصت
- ✅ Merge بعد از green CI

### 🟢 Low Priority (ماهانه)
- Major version updates
- Breaking changes
- Framework upgrades

**نحوه مدیریت:**
- 🕐 زمان پاسخ: < 1 ماه
- 🔄 Action: برنامه‌ریزی برای migration
- 🧪 تست کامل در branch جداگانه

---

## 🏗️ وابستگی‌های کلیدی (Critical Dependencies)

این dependencies باید با احتیاط آپدیت شوند:

| Package | نسخه فعلی | استراتژی آپدیت | توضیحات |
|---------|-------------|-----------------|---------|
| Next.js | 15 | Patch/Minor: Auto<br>Major: Manual | Breaking changes نیاز به migration |
| React | 18 | Patch/Minor: Auto<br>Major: Manual | Core library - تست کامل الزامی |
| Prisma | 5 | Patch/Minor: Manual<br>Major: Manual | Database schema changes |
| TypeScript | 5 | Patch/Minor: Auto<br>Major: Manual | Type checking critical |

---

## 🔧 فرایند آپدیت (Update Process)

### مراحل استاندارد

#### 1️⃣ شناسایی
- Dependabot PR ایجاد می‌کند
- یا دستی بررسی `npm outdated`

#### 2️⃣ بررسی
```bash
# آپدیت‌های در دسترس را ببینید
bunx npm-check-updates

# security audit انجام دهید
bun pm audit

# changelog را بخوانید
bunx npx -y release-it@latest release
```

#### 3️⃣ تست
```bash
# در branch جداگانه
git checkout -b update/package-name
git merge dependabot/pr

# نصب و تست
bun install
bun run test
bun run lint
bun run build
```

#### 4️⃣ Review
- بررسی changelog
- بررسی breaking changes
- review code differences
- test functionality

#### 5️⃣ Merge
- CI باید green باشد
- Approvals دریافت شده باشد
- Linear history حفظ شود

---

## 🤖 Dependabot Configuration

### آپدیت‌های خودکار (Automated Updates)

#### ✅ Auto-merge برای:
- Security patches (minor/patch)
- Bug fixes در dependencies
- Development dependencies (dev deps)

#### ⛔ Manual review برای:
- Major version bumps
- Next.js updates
- React updates
- Prisma updates

### Schedule
```
Security updates:     روزانه (هر روز ساعت 9)
Minor updates:         هفتگی (دوشنبه ساعت 9)
Major updates:         هفتگی (دوشنبه ساعت 10 - manual review)
```

---

## 🚨 مدیریت Security Updates

### فلوچارت امنیتی

```
Vulnerability Detection
        ↓
Check Severity
        ↓
   High/Critical? ──Yes─→ Immediate Review
        |                 ↓
       No              Patch & Deploy
        ↓
  Schedule Update
```

### ابزارها
```bash
# Dependabot (خودکار)
# GitHub Security Alerts
# npm audit
# Trivy scan در CI
```

---

## 📝 Checklist برای Dependency Updates

قبل از merge هر dependency update:

- [ ] Changelog خوانده شده
- [ ] Breaking changes بررسی شده
- [ ] CI pipeline green است
- [ ] Tests pass می‌شوند
- [ ] Documentation to‌روز شده
- [ ] CHANGELOG.md به‌روز شده

---

## 🔄 استراتژی Major Updates

برای major version upgrades:

### 1️⃣ Planning Phase
- Upgrade guide بخوانید
- Breaking changes لیست کنید
- Estimated effort را تخمین بزنید

### 2️⃣ Development Phase
- Branch جدید بسازید: `upgrade/next-v16`
- Upgrade انجام دهید
- Fix breaking changes

### 3️⃣ Testing Phase
- Unit tests
- Integration tests
- E2E tests
- Manual testing

### 4️⃣ Review Phase
- Code review
- Performance testing
- Security review

### 5️⃣ Deployment Phase
- Release notes بنویسید
- Announce در community
- Deploy با caution

---

## 🚦 آپدیت‌های Framework

### Next.js
- **Patch/Minor:** به‌روزرسانی در 24 ساعت
- **Major:** یک sprint کامل برای migration
- **Checklist:**
  - [ ] API changes
  - [ ] Breaking changes
  - [ ] Migration guide
  - [ ] New features utilization

### React
- **Patch/Minor:** به‌روزرسانی در 24 ساعت
- **Major:** review کامل قبل از merge
- **Checklist:**
  - [ ] Hooks compatibility
  - [ ] Component lifecycle changes
  - [ ] Performance impact

### Prisma
- **Patch/Minor:** Manual review
- **Major:** Database migration plan
- **Checklist:**
  - [ ] Schema changes
  - [ ] Migration script
  - [ ] Backup strategy
  - [ ] Rollback plan

---

## 📊 مانیتورینگ

### Metrics برای track کردن

1. **Dependency freshness:**
   ```bash
   # تعداد outdated packages
   bunx npm outdated | wc -l
   ```

2. **Security vulnerabilities:**
   ```bash
   # تعداد vulnerabilities
   bun pm audit --json | jq '.vulnerabilities | length'
   ```

3. **Update frequency:**
   - Weekly updates: هدف
   - Security patches: < 24 ساعت

4. **CI Pass Rate:**
   - Target: > 95%
   - Monitor failures

---

## 🆘 Emergency Rollback

اگر آپدیت باعث مشکل شد:

```bash
# 1. سریع revert کنید
git revert <commit-hash>

# 2. Push کنید
git push origin main --force-with-lease

# 3. Patch نسخه قبلی بسازید
git checkout -b patch/previous-version

# 4. Deploy کنید
```

---

## 📚 منابع مفید

- [Dependabot Docs](https://docs.github.com/en/code-security/dependabot)
- [npm audit docs](https://docs.npmjs.com/cli/audit)
- [Semantic Versioning](https://semver.org/)
- [Next.js Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading)
- [React Changelog](https://github.com/facebook/react/blob/main/CHANGELOG.md)

---

## ✅ Summary

| دسته | استراتژی | زمان پاسخ |
|------|-----------|----------|
| Security | فوری | < 24h |
| Minor/Patch | Dependabot Auto | < 1 week |
| Major | Manual Review | < 1 month |
| Framework | Careful Planning | سهمند |

---

**آخرین به‌روزرسانی:** 2025
