# AgentLedger — Architecture

## Overview

AgentLedger is a tamper-proof audit layer for AI agents. It uses a NestJS backend, Next.js frontend, PostgreSQL database, and Redis cache — all deployed on free-tier infrastructure.

```
┌─────────────────────────────────────┐
│         Your AI Agent               │
└────────────┬────────────────────────┘
             │ @agentledger/sdk
┌────────────▼────────────────────────┐
│        AgentLedger SDK              │
│  SHA-256 hashing · event streaming  │
└────────────┬────────────────────────┘
             │ REST API (/api/v1)
┌────────────▼────────────────────────┐
│       NestJS Backend (Koyeb)        │
│  Port 3001 · JWT + API Key auth     │
│  PostgreSQL (Neon) · Redis (Upstash)│
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│    Next.js Frontend (Cloudflare)    │
│  App Router · Glass UI · Recharts   │
└─────────────────────────────────────┘
```

---

## Backend (NestJS)

### Modules
| Module | Purpose |
|---|---|
| AuthModule | JWT signup/login/refresh/logout |
| OrganisationsModule | Org CRUD (multi-tenant) |
| ApiKeysModule | API key generation & revocation |
| AgentsModule | AI agent CRUD |
| SessionsModule | Agent session tracking |
| EventsModule | Append-only event logging + tamper verification |
| AnalyticsModule | Cost/usage stats, model breakdowns |
| AnomalyModule | Latency spikes, error bursts, loop detection |
| ComplianceModule | EU AI Act / SOC 2 / ISO 42001 reports |
| HealthModule | `/health` endpoint |

### Authentication
- **JWT**: Access token (15 min) + Refresh token (7 days, SHA-256 hashed in DB)
- **API Key**: Format `al_live_sk_` + 64 hex chars, stored as SHA-256 hash
- **CombinedAuthGuard**: Tries JWT first, falls back to API key
- **@Public() decorator**: Skips auth on signup/login/refresh/health

### Database Entities

**users** — `id`, `orgId`, `email`, `passwordHash` (bcrypt cost=12), `displayName`, `role` (OWNER/ADMIN/MEMBER)

**organisations** — `id`, `name`, `slug` (unique), `plan` (FREE/PRO/ENTERPRISE)

**agents** — `id`, `orgId`, `name`, `description`, `modelProvider`, `modelId`, `status` (ACTIVE/IDLE/ERROR/OFFLINE), `metadata` (JSONB), `lastSeenAt`

**sessions** — `id`, `orgId`, `agentId`, `status` (ACTIVE/COMPLETED/FAILED/TIMEOUT), `startedAt`, `endedAt`, `totalEvents`, `totalCost`, `metadata` (JSONB)

**events** (APPEND-ONLY) — `id`, `orgId`, `sessionId`, `agentId`, `category`, `level`, `message`, `payload` (JSONB), `tokensInput`, `tokensOutput`, `costUsd`, `latencyMs`, `timestamp`, `stateBefore` (JSONB), `stateAfter` (JSONB), `hash` (SHA-256), `tampered` (bool)

**api_keys** — `id`, `orgId`, `userId`, `keyHash`, `keyPrefix`, `name`, `lastUsedAt`, `revokedAt`

**refresh_tokens** — `id`, `userId`, `tokenHash`, `expiresAt`, `revokedAt`

**audit_logs** — `id`, `orgId`, `userId`, `action`, `resourceType`, `resourceId`, `metadata` (JSONB), `ipAddress`

### Key Patterns
- **Org Isolation**: All queries filter by `req.user.orgId`
- **Append-Only Events**: No updates or deletes on events table
- **Tamper Detection**: SHA-256 hash of `{agentId, category, level, message, timestamp, payload, stateBefore, stateAfter}`
- **Session Auto-Creation**: Events referencing a missing session auto-create it
- **Hash-Based Secrets**: Refresh tokens and API keys stored as SHA-256 hashes only
- **Rate Limiting**: Global 60 req/min, auth endpoints 5/min, refresh 10/min

### Global Middleware
- **Helmet**: Security headers (CSP in production)
- **HTTPS Redirect**: In production, trusts first proxy
- **ValidationPipe**: Whitelist + forbid unknown + auto-transform
- **ThrottlerGuard**: Global rate limiting
- **GlobalExceptionFilter**: Centralized error handling

---

## Frontend (Next.js 16)

### Tech Stack
- Next.js 16 App Router (all client components)
- React 19 + TypeScript 5
- Tailwind CSS 4 (glass morphism dark theme)
- Axios (API client with auto-refresh)
- Framer Motion (animations)
- Recharts (charts)
- Lucide React (icons)

### Pages
| Route | Purpose |
|---|---|
| `/login` | Login with glass UI + animated orbs |
| `/signup` | Registration (auto-creates org) |
| `/dashboard` | Overview: metric cards, line chart, recent events, anomalies |
| `/agents` | Agent list + register modal |
| `/sessions` | Session grid cards |
| `/session-replay/[id]` | Event timeline with play/pause, JSON tree, state diffs |
| `/events` | Event table with category/level/agent filters |
| `/cost-analytics` | Line/pie/bar charts for cost breakdown |
| `/anomalies` | Latency spikes, error bursts, agent loops |
| `/compliance` | Compliance score, checks list, HTML export |
| `/settings` | API key management (create/copy/delete) |

### Auth Flow
- **AuthContext** (React Context API) manages user, org, tokens
- Tokens stored in `localStorage`
- 401 responses trigger auto-refresh with queue deduplication
- Dashboard layout redirects to `/login` if unauthenticated

### Design System (Glass Morphism)
- Dark background: `#0A0A0F`
- Glass cards: `backdrop-filter: blur(20px)`, `rgba(255,255,255,0.06)` bg
- Accent colors: Violet (`#7C3AED`), Cyan (`#06B6D4`)
- Text: Primary (white), Secondary (70% opacity), Muted (40% opacity)
- Status colors: Success (`#10B981`), Warning (`#F59E0B`), Error (`#EF4444`)

### State Management
- React hooks + Context API only (no Redux/Zustand)
- Each page loads data via `useEffect` + `useCallback`
- Parallel data loading with `Promise.allSettled`

---

## Deployment Stack (Free Tier)
| Service | Provider | Tier |
|---|---|---|
| Backend | Koyeb (Frankfurt) | Free |
| Frontend | Cloudflare Pages | Free |
| Database | Neon PostgreSQL | Free forever |
| Cache/Queue | Upstash Redis | Free forever |
| Source | GitHub | Free |

### Environment Variables
| Variable | Required | Default |
|---|---|---|
| `PORT` | No | 3001 |
| `NODE_ENV` | Yes | — |
| `DATABASE_URL` | Yes | — (Neon pooled + `?pgbouncer=true`) |
| `REDIS_URL` | No | — (Upstash `rediss://`) |
| `JWT_SECRET` | Yes | — (64-char hex) |
| `JWT_REFRESH_SECRET` | Yes | — (64-char hex) |
| `CORS_ORIGIN` | No | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:3001` |
