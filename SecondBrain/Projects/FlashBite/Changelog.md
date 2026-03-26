---
project: FlashBite
type: changelog
status: active
tags:
  - history
  - releases
  - deployments
created: 2026-03-24
---

# FlashBite Changelog

Development history from git log. See also [[Architecture]], [[TODOs]].

## 2026-03-10 — Deployment & Build Fixes

### Vercel Deployment (Customer App)
- Deployed customer app to **https://flashbite-gamma.vercel.app**
- PWA tested on Android and iOS
- Added `node-linker=hoisted` to `.npmrc` for Vercel + pnpm compatibility
- Fixed `.npmrc` encoding issues (PowerShell null byte problem)

### Railway Preparation (API)
- Added `Dockerfile` for Railway API deployment (`8483f58`)
- Moved Dockerfile to repo root (`7ba18d4`)
- Fixed TypeScript implicit `any` errors for production build (`7cb64b0`, `8483f58`)
- Fixed Next.js security vulnerabilities (`370fb34`)
- Upgraded Next.js and fixed lockfile (`ace157d`)
- Excluded `customer-mobile` from workspace (`357d401`)

## 2026-03-09 — UI/UX Rebuild

### Premium UI Overhaul
- Complete frontend rebuild with 7 screens (`fab6271`)
- Premium dark cinematic UI with glassmorphism effects (`e769260`)
- Real food images from Unsplash
- Mobile responsive Zomato-style layout (`7a64134`)

### Resilience & Demo Mode
- Full offline demo mode — app explorable without backend (`dfb9881`)
- Demo mode with fallback data (`64edf22`)
- Fixed mobile layout, fallback data, API resilience (`e7d6af8`)
- Fixed mobile layout, cuisine grid (`7beffa2`)

## 2026-03-08 — Delivery & PWA

- Rebuilt delivery app, fixed order lifecycle, Razorpay types (`9ad7e48`)
- Added PWA support: service worker, offline mode, install prompt (`42fe34a`)

## 2026-03-07 — Pre-Migration Backup

- Pre-Linux migration backup (`36e5b89`)

## 2026-03-05 — MVP Complete

### Complete MVP Release (`d3cb480`)
- Auth module: OTP login, JWT tokens, refresh flow
- Users module: profile, addresses CRUD
- Restaurants module: CRUD, search, menu browsing
- Cart module: add/update/remove/clear
- Orders module: create, cancel, track, status updates
- Payments module: Razorpay create-order, verify, refund
- Coupons module: validate, list
- Delivery module: partner registration, assignment, tracking
- Admin module: dashboard KPIs, user/order/restaurant management
- Restaurant Owner module: dashboard, menu CRUD, analytics, orders
- Socket.io gateways: order tracking, delivery tracking
- Shared types package: 15+ Zod schema files
- UI package: Button, Input, Card components
- Prisma schema: 17 models, 9 enums
- Full monorepo setup with Turborepo + pnpm

## 2026-03-01 — Work Update

- Work milestone update (`1ac9bdb`)

## 2026-01-27 — Project Init

- Initial commit (`48b18a5`)

---

## Deployment Status (as of 2026-03-24)

| Service | Platform | Status | URL |
|---------|----------|--------|-----|
| Customer App | Vercel | **Live** | https://flashbite-gamma.vercel.app |
| API | Railway | Ready (not deployed) | — |
| Admin Panel | — | Local only | — |
| Database | — | Local Docker | — |
| Redis | — | Local Docker | — |
