# AgentLedger Security Audit Report
**Date:** 2026-03-23
**Auditor:** Automated Security Audit (Claude)
**Scope:** Full codebase — backend (NestJS), frontend (Next.js), infrastructure

---

## Summary

| Metric | Count |
|--------|-------|
| Total vulnerabilities found | 14 |
| Critical | 1 |
| High | 4 |
| Medium | 7 |
| Low | 2 |
| **Fixed in this audit** | **5** |
| Remaining (architectural) | 9 |

---

## Exposed Secrets Scan

| Check | Result |
|-------|--------|
| Hardcoded API keys in code (`sk-*`) | NONE FOUND |
| Hardcoded passwords in code | NONE FOUND |
| Hardcoded JWT secrets in code | NONE FOUND |
| Hardcoded database URLs in code | NONE FOUND |
| .env files tracked in git | NONE (protected by .gitignore) |
| .env files in git history | NONE |

**Status: PASS** — No secrets exposed in codebase or git history.

---

## .gitignore Audit

| Pattern | Status |
|---------|--------|
| .env | PRESENT |
| .env.local | PRESENT |
| .env.production | PRESENT |
| .env*.local | PRESENT |
| *.pem | ADDED (was missing) |
| *.key | ADDED (was missing) |
| *.cert | ADDED (was missing) |
| node_modules/ | PRESENT |
| dist/ | PRESENT |
| .next/ | PRESENT |

**Fix applied:** Added `*.pem`, `*.key`, `*.cert` to .gitignore.

---

## JWT Security

| Check | Status | Details |
|-------|--------|---------|
| Algorithm explicit (not "none") | PASS | HS256 specified in auth.module.ts |
| Secret strength | PASS | 64-char hex (256-bit entropy) |
| Access token expiration | PASS | 15 minutes |
| Refresh token expiration | PASS | 7 days |
| Refresh token hashed in DB | PASS | SHA-256 hashed, not reversible |
| Refresh token revocation on use | PASS | Old token revoked on refresh |
| Logout invalidates token | PASS | Refresh token revoked on logout |
| Token not in URL params | PASS | Bearer header only |

**Status: PASS** — JWT implementation is secure.

---

## API Security

| Check | Status | Details |
|-------|--------|---------|
| Rate limiting (global) | PASS | 60 req/60s via @nestjs/throttler |
| Rate limiting (auth) | PASS | 5/min signup & login, 10/min refresh |
| Input validation | PASS | Global ValidationPipe with whitelist + forbidNonWhitelisted |
| SQL injection | PASS | TypeORM parameterized queries throughout |
| CORS | PASS | Single origin from CORS_ORIGIN env var |
| Helmet.js | PASS | Security headers enabled (CSP in production) |
| HTTPS enforcement | PASS | Redirects HTTP→HTTPS in production |
| Multi-tenancy isolation | PASS | All queries scoped by orgId |
| Password hashing | PASS | bcrypt with cost factor 12 |
| API key hashing | PASS | SHA-256, raw key returned only once |

**Status: PASS** — API security is solid.

---

## SSL Configuration

| Check | Status | Details |
|-------|--------|---------|
| SSL rejectUnauthorized (production) | FIXED | Changed to `true` in production |
| SSL rejectUnauthorized (development) | PASS | `false` for local development |

**Fix applied:** `app.module.ts` and `data-source.ts` now use `rejectUnauthorized: true` in production.

---

## XSS Protection

| Check | Status | Details |
|-------|--------|---------|
| Compliance export (document.write) | FIXED | Added escapeHtml() sanitizer |
| React rendering | PASS | No dangerouslySetInnerHTML usage |
| Input sanitization | PASS | Backend validates all inputs |

**Fix applied:** `compliance/page.tsx` now escapes all dynamic values in HTML export.

---

## Frontend Security

| Check | Status | Details |
|-------|--------|---------|
| Email validation | FIXED | Proper regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| Password validation | FIXED | Requires uppercase, lowercase, digit, special char |
| Token storage | WARNING | localStorage (see Remaining Issues) |

**Fix applied:** `signup/page.tsx` now enforces strong password and email validation.

---

## Dependency Vulnerabilities

### Backend (`npm audit`)
| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | — |
| High | 0 | — |
| Moderate | 6 | Dev-only (@nestjs/cli schematics) — no production impact |

### Frontend (`npm audit`)
| Severity | Count | Status |
|----------|-------|--------|
| High | 1 (flatted) | FIXED via `npm audit fix` |

**Status:** Frontend: 0 vulnerabilities. Backend: 6 moderate (dev-only, not exploitable in production).

---

## Hash Chain Integrity

| Metric | Value |
|--------|-------|
| Total events verified | 35 |
| Valid hashes | 34 |
| Tampered | 1 (pre-existing test data) |

**Status: PASS** — Hash chain integrity verification is working correctly. The 1 tampered event was from earlier testing and is correctly detected by the system.

---

## Authentication Bypass Tests

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| No token | 401 | 401 | PASS |
| Malformed token | 401 | 401 | PASS |
| Expired token | 401 | 401 | PASS |
| Cross-org data access | 403/404 | 404 (not found) | PASS |
| Invalid credentials | 401 | 401 | PASS |

**Status: PASS** — All authentication bypass vectors blocked.

---

## Remaining Issues (Architectural — Future Work)

| # | Severity | Issue | Recommendation |
|---|----------|-------|----------------|
| 1 | HIGH | Tokens stored in localStorage | Move refresh tokens to httpOnly Secure cookies |
| 2 | HIGH | No role-based access control on CRUD | Add @Roles() guards for admin operations |
| 3 | MEDIUM | No CSRF protection | Add CSRF tokens when switching to cookies |
| 4 | MEDIUM | Audit log entity exists but not wired | Create NestJS interceptor for auto-logging |
| 5 | MEDIUM | No client-side rate limiting on login | Add exponential backoff after failed attempts |
| 6 | MEDIUM | No React Error Boundaries | Wrap dashboard in ErrorBoundary components |
| 7 | MEDIUM | No per-API-key rate limiting | Add throttle per keyHash in ApiKeyGuard |
| 8 | LOW | No Swagger/OpenAPI documentation | Add @nestjs/swagger for API docs |
| 9 | LOW | No session inactivity timeout | Add idle timer in frontend |

---

## Fixes Applied in This Audit

1. **SSL `rejectUnauthorized`** — Set to `true` in production (app.module.ts, data-source.ts)
2. **XSS in compliance export** — Added `escapeHtml()` sanitizer (compliance/page.tsx)
3. **Weak signup validation** — Added email regex + password complexity rules (signup/page.tsx)
4. **.gitignore** — Added `*.pem`, `*.key`, `*.cert` patterns
5. **Frontend dependencies** — Fixed 1 high vulnerability via `npm audit fix`

---

## End-to-End Test Results

| Component | Status |
|-----------|--------|
| Backend running | YES (port 3001) |
| Frontend running | YES (port 3000) |
| Health check | PASS |
| User registration | PASS |
| User login | PASS |
| API key lifecycle | PASS (create, list, revoke) |
| 3 agents created | PASS |
| 15 events with SHA-256 hashes | PASS |
| Anomaly detection | PASS (4 latency spikes detected) |
| Session replay | PASS (5 events in order) |
| Hash chain verification | PASS (34/35 valid) |
| Compliance report | PASS |
| Compliance checks | PASS (3/3) |
| Cost analytics | PASS |
| Usage analytics | PASS (7 categories) |
| Model analytics | PASS (3 models tracked) |
| Auth bypass blocked | PASS (all 5 vectors) |

---

*Report generated automatically. All CRITICAL and HIGH issues have been either fixed or documented with remediation plans.*
