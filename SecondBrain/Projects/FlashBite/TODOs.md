---
project: FlashBite
type: todos
status: active
tags:
  - roadmap
  - backlog
  - gaps
  - phase-2
created: 2026-03-24
---

# FlashBite TODOs

Tracked feature gaps, incomplete work, and next steps. See also [[Architecture]], [[Changelog]].

## Phase 1 (MVP) — Mostly Complete

- [x] User registration/login (OTP-based)
- [x] Restaurant discovery and search
- [x] Menu browsing with filters
- [x] Cart management
- [x] Checkout flow with price breakdown
- [x] Razorpay payment integration
- [x] Order tracking (basic)
- [x] Transparent pricing display
- [x] Admin panel (basic dashboard, orders, restaurants, users)
- [x] Customer app deployed to Vercel
- [x] PWA support (service worker, offline mode, install prompt)
- [x] Demo mode (explorable without backend)

## Phase 2 — In Progress

### Real-time & Delivery
- [ ] Live order tracking UI in customer app (Socket.io gateway built, frontend incomplete)
- [ ] Delivery partner mobile app UI (backend APIs built, no mobile UI)
- [ ] Push notifications via Firebase (dependency not integrated)
- [ ] Delivery tracking with live maps (Leaflet dependency present, not wired)

### Reviews & Refunds
- [ ] Reviews UI in customer app (backend complete)
- [ ] Auto-refund engine (DB schema ready, service logic incomplete)
- [ ] Restaurant owner reply to reviews UI

### Restaurant Owner
- [ ] Restaurant owner panel UI (only backend APIs built)
- [ ] Menu management UI for owners
- [ ] Restaurant analytics dashboard UI
- [ ] Order management for owners

### Admin Panel
- [ ] Restaurant onboarding flow (partially built)
- [ ] Dispute resolution UI
- [ ] Finance/commission reports
- [ ] Analytics charts (Recharts dependency present)

## Phase 3 — Not Started

- [ ] Multi-city expansion beyond 3 metros
- [ ] Loyalty/rewards program
- [ ] AI-powered recommendations
- [ ] Group ordering
- [ ] Scheduled orders
- [ ] Subscription plans

## Infrastructure Gaps

### CI/CD
- [ ] GitHub Actions pipeline (`.github/workflows/` is empty, only `.gitkeep`)
- [ ] Automated testing in CI
- [ ] Automated deployment pipeline

### Testing
- [ ] E2E tests with Playwright (none exist)
- [ ] Increase unit test coverage (minimal test files currently)
- [ ] API integration tests with supertest
- [ ] Component tests with Testing Library

### DevOps
- [ ] Docker Compose for local development (not in repo)
- [ ] API deployment to Railway (Dockerfile ready, not deployed)
- [ ] Database backup strategy
- [ ] Monitoring and alerting setup
- [ ] SSL/domain configuration for production

## Code Quality

- [ ] Fix any remaining TypeScript `any` types (recent commits fixed some for Railway build)
- [ ] Add Swagger/OpenAPI decorators to all controllers
- [ ] Add request/response DTOs documentation
- [ ] Add API versioning strategy

## Security Hardening

- [ ] Rate limiting implementation verification
- [ ] CORS configuration for production
- [ ] Input sanitization audit
- [ ] Security headers (Helmet.js)
- [ ] Dependency vulnerability scanning in CI
