---
project: FlashBite
type: guide
status: active
tags:
  - setup
  - docker
  - development
  - environment
created: 2026-03-24
---

# FlashBite Setup Guide

Local development setup for the FlashBite monorepo. See also [[Architecture]], [[API-Reference]].

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ LTS | [nodejs.org](https://nodejs.org) |
| pnpm | 9.0.0 | `corepack enable && corepack prepare pnpm@9.0.0 --activate` |
| Docker | 24+ | [docker.com](https://docker.com) (for Postgres/Redis) |
| Git | 2.40+ | [git-scm.com](https://git-scm.com) |

## Quick Start

```bash
# 1. Clone
git clone <repo-url>
cd FlashBite

# 2. Install dependencies
pnpm install

# 3. Start Postgres and Redis via Docker
docker run -d --name flashbite-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=flashbite \
  -p 5432:5432 postgres:16

docker run -d --name flashbite-redis \
  -p 6379:6379 redis:7-alpine

# 4. Configure environment
cp apps/api/.env.example apps/api/.env.local
cp apps/customer-app/.env.example apps/customer-app/.env.local
cp apps/admin-panel/.env.example apps/admin-panel/.env.local
# Edit .env.local files — see Environment Variables below

# 5. Setup database
pnpm db:generate    # Generate Prisma client
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed with demo data

# 6. Start all apps
pnpm dev
```

## Access Points

| Service | URL |
|---------|-----|
| Customer App | http://localhost:3000 |
| Admin Panel | http://localhost:3002 |
| API Server | http://localhost:3001/api/v1/health |
| Swagger Docs | http://localhost:3001/api/docs |
| Prisma Studio | `pnpm db:studio` |

## Environment Variables

### API (`apps/api/.env.local`)

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flashbite?schema=public"
DATABASE_POOL_SIZE=10

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT (generate 32+ char secrets)
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# App
API_PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3002

# Razorpay (test keys)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# SMS (optional for dev — OTP logged to console)
SMS_PROVIDER_API_KEY=

# Firebase (optional)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
```

### Customer App (`apps/customer-app/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3001
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

### Admin Panel (`apps/admin-panel/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## NPM Scripts

### Root (Monorepo)

```bash
pnpm dev              # Start all apps in dev mode (Turborepo parallel)
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm type-check       # TypeScript validation
pnpm test             # Run all tests (Vitest)
pnpm test:e2e         # End-to-end tests (Playwright)
pnpm clean            # Clean all build artifacts
```

### Database

```bash
pnpm db:generate      # Generate Prisma client from schema
pnpm db:migrate       # Run pending migrations
pnpm db:seed          # Seed database with demo data
pnpm db:studio        # Open Prisma Studio GUI
```

### Individual Apps

```bash
pnpm dev --filter customer-app    # Customer PWA only
pnpm dev --filter admin-panel     # Admin dashboard only
pnpm dev --filter api             # API server only
pnpm build --filter api           # Build API only
```

## Docker Deployment

### API Dockerfile (Railway)

The root `Dockerfile` builds the API for Railway deployment:

```dockerfile
# Base: node:20-alpine
# 1. Enable corepack + pnpm
# 2. Copy monorepo root + workspace package.json files
# 3. pnpm install
# 4. pnpm turbo build --filter=@flashbite/api
# 5. Expose 3001
# 6. CMD node dist/main.js
```

### Vercel (Customer App)

Already deployed at https://flashbite-gamma.vercel.app

**Config:**
- Root Directory: `apps/customer-app`
- Build Command: `cd ../.. && pnpm turbo build --filter=@flashbite/customer-app`
- Install Command: `cd ../.. && corepack enable && pnpm install --no-frozen-lockfile`
- Output Directory: auto-detect (OFF)
- Include files outside root: Enabled

**Critical:** `.npmrc` must have `node-linker=hoisted` for Vercel + pnpm compatibility.

## Troubleshooting

### Windows-specific
- PowerShell `echo "text" >> file` causes null byte encoding. Use VS Code or `[System.IO.File]::WriteAllText()` instead.
- Use Git Bash or WSL for shell commands.

### Common Issues
- **Prisma client not found:** Run `pnpm db:generate`
- **Port already in use:** Kill existing process or change port in `.env.local`
- **pnpm install fails:** Ensure corepack is enabled and pnpm 9.0.0 is active
- **Vercel build fails:** Check `.npmrc` has `node-linker=hoisted`

## Git Conventions

```
Branch: feat/ | fix/ | chore/ | docs/
Commit: type(scope): description
        e.g., feat(orders): add real-time tracking
```

Never commit `.env` files, secrets, or `node_modules`.
