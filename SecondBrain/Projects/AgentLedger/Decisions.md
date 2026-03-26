---
project: AgentLedger
type: decisions
status: current
tags: [adr, architecture-decisions, trade-offs]
created: 2026-03-24
---

# AgentLedger Technical Decisions

Key architectural choices and their rationale. See also [[Architecture]], [[API-Reference]].

## D1: JWT + API Key Dual Auth

**Decision**: Support both JWT (user sessions) and API key (SDK/programmatic access).

- JWT: Access token 15min, refresh token 7d (SHA-256 hashed in DB)
- API Key: SHA-256 hashed, prefix `al_live_sk_`, stored in `api_keys` table
- `CombinedAuthGuard` tries JWT first, falls back to API key
- User-management endpoints (api-keys, organisations) are JWT-only

**Why**: Users interact via browser (JWT), agents interact via SDK (API key). Both need auth but with different lifetimes and security profiles.

## D2: Append-Only Events Table

**Decision**: Events table has no UPDATE or DELETE operations.

- INSERT only — events are immutable once created
- SHA-256 hash per event + hash chaining (prev_hash → current_hash)
- `tampered` boolean flag for integrity verification
- `stateBefore` / `stateAfter` JSONB for state snapshots

**Why**: Core value proposition is tamper-proof audit trail. Immutability is required for compliance (SOC 2, GDPR audit logs). Hash chaining enables cryptographic verification.

## D3: $0/month Deployment Stack

**Decision**: All infrastructure on free tiers with no credit card required.

| Service | Provider | Free Tier |
|---------|----------|-----------|
| Backend hosting | Koyeb | Free tier, no CC |
| Frontend hosting | Cloudflare Pages | Unlimited free |
| PostgreSQL | Neon | Free forever |
| Redis | Upstash | Free forever |
| CI/CD | GitHub | Free |

**Why**: Solo founder, pre-revenue product. Needs to stay live indefinitely without cost pressure. All providers offer genuine free tiers (not trials).

## D4: NestJS + TypeORM (Backend)

**Decision**: NestJS framework with TypeORM for database access.

- Modular architecture (10 feature modules)
- TypeORM with migrations (no synchronize in production)
- Global ValidationPipe with whitelist + transform
- Global ThrottlerGuard (60 req/min default, custom per-route)

**Why**: NestJS provides enterprise-grade structure (DI, guards, pipes, interceptors). TypeORM gives migration-based schema management. Both are TypeScript-native.

## D5: Next.js App Router (Frontend)

**Decision**: Next.js 16 with App Router, Radix UI, Tailwind v4, glassmorphism design.

- Route groups: `(auth)` and `(dashboard)`
- AuthContext for JWT state management
- Axios client with automatic token refresh interceptor
- Recharts for analytics visualizations

**Why**: App Router is the modern Next.js pattern. Radix UI provides accessible primitives. Glassmorphism creates a distinctive, modern look.

## D6: TypeScript SDK Architecture

**Decision**: Standalone SDK (`@agentledger/sdk`) with wrap/session/track API.

- `wrap()` — one-liner to instrument any async function
- `session()` — multi-step tracked session
- `track()` — fire-and-forget event emission
- Hash chaining built into SDK (sha256 + chainHash)
- Approval polling for human-in-the-loop
- **Never crashes the agent** — all SDK errors are swallowed

**Why**: SDK must be zero-friction for agent developers. The "never crash" guarantee is critical — observability should never break the thing it's observing.

## D7: Redis Usage Scope

**Decision**: Redis (Upstash) used ONLY for session caching, BullMQ queues, and rate limiting.

**Why**: Upstash free tier has limited commands/day. Keeping Redis usage narrow avoids hitting limits. PostgreSQL handles all persistent data.

## D8: Global API Prefix `/api/v1`

**Decision**: All routes prefixed with `/api/v1/` except the health check (`GET /health`).

**Why**: Versioned API from day one enables future breaking changes without disrupting existing SDK users. Health check excluded for simplicity (load balancer probes).

## D9: Enum Values are Final

**Decision**: All enum values (AgentStatus, SessionStatus, EventCategory, EventLevel, OrganisationPlan, UserRole, AuditLogAction) are frozen and cannot be modified.

**Why**: Enums are stored as PostgreSQL enum types. Adding values requires migrations; removing values breaks existing data. Treat as immutable contracts.

## D10: Multi-Tenant via orgId

**Decision**: All data is scoped by `orgId` foreign key. Every query filters by the authenticated user's org.

**Why**: Simple multi-tenancy without separate schemas or databases. Scales with the free tier constraints. Every controller method extracts orgId from the authenticated request.
