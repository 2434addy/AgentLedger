---
project: AgentLedger
type: guide
status: current
tags: [setup, dev-environment, docker, env-vars]
created: 2026-03-24
---

# AgentLedger Setup Guide

How to run the project locally. See also [[Architecture]], [[API-Reference]].

## Prerequisites

- Node.js >= 18
- PostgreSQL (or Neon free tier)
- Redis (or Upstash free tier)
- npm

## 1. Clone & Install

```bash
git clone https://github.com/2434addy/AgentLedger.git
cd AgentLedger

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install --legacy-peer-deps

# SDK (optional)
cd ../sdk
npm install
```

> The frontend requires `--legacy-peer-deps` (also configured in `frontend/.npmrc`).

## 2. Environment Variables

### Backend (`backend/.env`)

```env
PORT=3001
NODE_ENV=development

# Database — Neon PostgreSQL (free tier)
DATABASE_URL=postgresql://user:pass@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true

# Redis — Upstash (free tier)
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379

# Auth — generate with: openssl rand -hex 32
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<another-64-char-random-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# API Keys
API_KEY_PREFIX=al_live_sk_
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 3. Database Setup

```bash
cd backend

# Run migrations
npm run migration:run

# Seed demo data (optional)
DEMO_PASSWORD=YourDemoP@ss1 npm run seed
```

Demo seed creates:
- Org: "demo-org" (FREE plan)
- User: demo@agentledger.io (OWNER role)
- 3 agents: CodeReview-GPT, DataPipeline-Claude, SupportBot-Gemini
- 5 sample sessions

## 4. Run Development Servers

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm run start:dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

## 5. Verify

```bash
# Health check
curl http://localhost:3001/health
# Expected: { "status": "ok", "timestamp": "..." }
```

## 6. Build for Production

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm start
```

## 7. SDK Development

```bash
cd sdk
npm run dev    # Watch mode with tsup
npm run build  # Production build (CJS + ESM + .d.ts)
npm run lint   # TypeScript type check
```

## Key Scripts

| Directory | Script | Description |
|-----------|--------|-------------|
| backend | `start:dev` | NestJS watch mode |
| backend | `start:prod` | Production (node dist/main) |
| backend | `migration:run` | Run TypeORM migrations |
| backend | `migration:generate` | Generate new migration |
| backend | `seed` | Seed demo data |
| frontend | `dev` | Next.js dev server |
| frontend | `build` | Production build |
| sdk | `build` | tsup build (CJS + ESM + DTS) |
| sdk | `dev` | tsup watch mode |

## Deployment

See [[Decisions]] for deployment stack details. Deployment uses:
- **Koyeb** (backend) — Docker build from `backend/Dockerfile`
- **Cloudflare Pages** (frontend) — Git integration
- **Neon** (PostgreSQL) — Pooled connection with pgbouncer
- **Upstash** (Redis) — TLS connection (rediss://)

Config files: `koyeb.yaml`, `backend/Dockerfile`, `backend/.env.example`, `frontend/.env.example`
