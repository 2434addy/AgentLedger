---
project: FlashBite
type: architecture
status: active
tags:
  - food-delivery
  - monorepo
  - nestjs
  - nextjs
  - prisma
  - turborepo
created: 2026-03-24
---

# FlashBite Architecture

Trust-first food delivery platform targeting Mumbai, Delhi NCR, and Bangalore. See also [[API-Reference]], [[Setup-Guide]], [[TODOs]], [[Changelog]].

## System Overview

```
┌──────────────┐  ┌──────────────┐
│ Customer App │  │ Admin Panel  │
│ Next.js 14   │  │ Next.js 14   │
│ PWA :3000    │  │ :3002        │
└──────┬───────┘  └──────┬───────┘
       │   REST + Socket.io   │
       └──────────┬───────────┘
          ┌───────▼────────┐
          │   NestJS API   │
          │   REST + WS    │
          │   :3001        │
          └──┬─────────┬───┘
     ┌───────▼──┐  ┌───▼───────┐
     │ Postgres │  │   Redis   │
     │ 16 :5432 │  │  7 :6379  │
     └──────────┘  └───────────┘
```

## Tech Stack (Frozen)

| Layer | Technology | Version |
|-------|-----------|---------|
| Monorepo | Turborepo + pnpm | 2.3.0 / 9.0.0 |
| Frontend | Next.js 14 App Router | 14.x |
| Backend | NestJS | 10.4 |
| Database | PostgreSQL + Prisma | 16 / 5.22 |
| Cache/Queue | Redis + BullMQ | 7 / 5.31 |
| Real-time | Socket.io | 4.8 |
| Auth | JWT (access + refresh) | — |
| UI | shadcn/ui + Tailwind CSS | 3.4 |
| Validation | Zod | 3.24 |
| Payments | Razorpay | 2.9 |
| State | Zustand + TanStack Query | 4.5 / 5.90 |
| Maps | Leaflet + react-leaflet | 1.9 / 4.2 |

## Monorepo Structure

```
FlashBite/
├── apps/
│   ├── customer-app/     # Next.js 14 PWA (port 3000)
│   ├── admin-panel/      # Next.js 14 dashboard (port 3002)
│   └── api/              # NestJS REST + WebSocket (port 3001)
├── packages/
│   ├── shared-types/     # Zod schemas + TypeScript types
│   ├── ui/               # shadcn/ui components (Button, Input, Card)
│   └── config/           # ESLint, TSConfig, Tailwind shared configs
├── docker/
├── docs/
└── Dockerfile            # Railway API deployment
```

## API Module Architecture

```
apps/api/src/
├── common/
│   ├── guards/           # JwtAuthGuard, RolesGuard
│   ├── decorators/       # @CurrentUser, @Roles, @Public
│   ├── filters/          # HttpExceptionFilter
│   ├── interceptors/     # TransformInterceptor
│   └── pipes/            # ZodValidationPipe
├── modules/
│   ├── auth/             # OTP login, JWT tokens
│   ├── users/            # Profile, addresses
│   ├── restaurants/      # CRUD, search, menu
│   ├── orders/           # Create, cancel, track
│   ├── cart/             # Cart CRUD
│   ├── payments/         # Razorpay integration
│   ├── coupons/          # Validate, list
│   ├── delivery/         # Partner registration, tracking
│   ├── admin/            # Dashboard, management
│   ├── restaurant-owner/ # Owner-facing APIs
│   ├── prisma/           # Database service
│   ├── redis/            # Cache service
│   └── health/           # Health check
├── gateways/
│   ├── order-tracking.gateway.ts
│   └── delivery-tracking.gateway.ts
└── config/               # Env config files
```

**Request Pipeline:** CORS → Rate Limit → JWT Auth → Roles Guard → Zod Validation → Controller → Service → Prisma

## Database Schema

**17 models** across 4 domains:

### User Management
- `User` — Roles: CUSTOMER, RESTAURANT_OWNER, DELIVERY_PARTNER, ADMIN
- `Address` — Delivery addresses with lat/lng
- `RefreshToken` — JWT refresh tokens (7-day expiry)

### Restaurant Operations
- `Restaurant` — Profile, ratings, commission tiers
- `MenuCategory` — Starters, Mains, etc.
- `MenuItem` — Prices stored in paise

### Order Flow
- `Cart` / `CartItem` — Shopping cart (per-user, per-restaurant)
- `Order` / `OrderItem` — Full pricing breakdown snapshots
- `OrderTracking` — Status timeline with GPS

### Payments & Reviews
- `Payment` — Razorpay records with idempotency keys
- `Coupon` / `CouponRedemption` — Promo codes
- `Refund` — Auto-approval logic
- `Review` — 1-5 ratings with owner replies
- `DeliveryPartner` / `DeliveryAssignment` — Delivery lifecycle

### Key Enums
`UserRole` | `OrderStatus` (PLACED→DELIVERED) | `PaymentMethod` (UPI/CARD/WALLET/COD) | `PaymentStatus` | `RefundCategory` | `RefundStatus` | `DiscountType` | `VehicleType` | `DeliveryAssignmentStatus`

## Authentication Flow

1. Phone → `POST /auth/send-otp` → OTP via SMS
2. OTP → `POST /auth/verify-otp` → JWT access (15min) + refresh (7d httpOnly cookie)
3. Requests: `Authorization: Bearer <accessToken>`
4. Refresh: `POST /auth/refresh-token` with cookie
5. JWT payload: `{ sub: userId, role: UserRole }`

## Order Lifecycle

```
PLACED → CONFIRMED → PREPARING → READY → PICKED_UP → ON_THE_WAY → DELIVERED
                                                                       ↓
                                                              Refund window opens
```

Cancellation allowed until READY status.

## Real-time (Socket.io)

**Namespace:** `/tracking`

| Direction | Event | Purpose |
|-----------|-------|---------|
| Client→Server | `join-order` | Subscribe to order updates |
| Client→Server | `leave-order` | Unsubscribe |
| Client→Server | `join:restaurant` | Restaurant new orders |
| Client→Server | `delivery:update_location` | GPS update |
| Server→Client | `order:status_updated` | Status change |
| Server→Client | `order:delivery_location` | Driver GPS |
| Server→Client | `order:eta_updated` | ETA recalc |
| Server→Client | `notification:new` | Push notification |

## Pricing Rules

All monetary values stored in **paise** (integer, never float). ₹1 = 100 paise.

| Component | Rule |
|-----------|------|
| Platform fee | ₹5 flat |
| Delivery fee | ₹15-49 by distance, free above ₹299 |
| Packaging | Restaurant-set (₹0-30) |
| GST | 5% food, 18% delivery |
| Surge | 1.0x-1.5x (peak hours, shown transparently) |

**Commission tiers** (on item total):

| Monthly GMV | Rate |
|---|---|
| < ₹2L | 18% |
| ₹2L-₹10L | 16% |
| > ₹10L | 15% |

## Deployment

| Target | Platform | URL |
|--------|----------|-----|
| Customer App | Vercel | https://flashbite-gamma.vercel.app |
| API | Railway | (ready, not yet deployed) |
| Database | — | PostgreSQL 16 |
| Cache | — | Redis 7 |

### Vercel Config
- Root Directory: `apps/customer-app`
- Build: `cd ../.. && pnpm turbo build --filter=@flashbite/customer-app`
- Install: `cd ../.. && corepack enable && pnpm install --no-frozen-lockfile`
- `.npmrc`: `node-linker=hoisted` (required for pnpm + Vercel)

## Performance Targets

| Metric | Target |
|--------|--------|
| API p95 | < 200ms |
| LCP | < 2.5s |
| TTI | < 3.5s |
| Bundle (customer) | < 200KB initial JS |
| DB queries | No N+1 (Prisma include/select) |
