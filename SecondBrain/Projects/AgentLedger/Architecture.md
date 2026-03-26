---
project: AgentLedger
type: architecture
status: phase-5-deployment
tags: [system-design, tech-stack, nestjs, nextjs, typescript, sdk]
created: 2026-03-24
---

# AgentLedger Architecture

Tamper-proof audit & compliance layer for AI agents. See also [[API-Reference]], [[Decisions]], [[Setup-Guide]].

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | NestJS | 11.x |
| Frontend | Next.js (App Router) | 16.x |
| Database | PostgreSQL (Neon) | - |
| Cache/Queue | Redis (Upstash) | - |
| ORM | TypeORM | 0.3.x |
| Auth | Passport + JWT | - |
| UI | Radix UI + Tailwind v4 + Framer Motion | - |
| SDK | TypeScript (tsup build) | 0.1.0 |
| Deployment | Koyeb (backend) + Cloudflare Pages (frontend) | - |

## Directory Structure

```
AgentLedger/
├── backend/
│   └── src/
│       ├── app.module.ts          # Root module (10 feature modules)
│       ├── main.ts                # Bootstrap, Helmet, CORS, /api/v1 prefix
│       ├── data-source.ts         # TypeORM CLI config
│       ├── agents/                # Agent CRUD
│       ├── api-keys/              # API key management (SHA-256 hashed)
│       ├── auth/                  # JWT + refresh token + strategies + guards
│       ├── sessions/              # Session lifecycle tracking
│       ├── events/                # Append-only event log + hash verification
│       ├── organisations/         # Org management
│       ├── users/                 # User entities
│       ├── audit-logs/            # Action audit trail
│       ├── analytics/             # Cost, usage, model analytics
│       ├── anomalies/             # Anomaly detection
│       ├── compliance/            # Compliance reports + checks
│       ├── health/                # GET /health
│       ├── common/                # Guards, decorators, filters, interfaces
│       ├── migrations/            # 3 migrations
│       └── seeds/                 # Demo data seeder
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (auth)/            # Login, Signup
│       │   └── (dashboard)/       # 10 protected pages
│       ├── components/ui/         # LoadingSkeleton, ErrorState, EmptyState, Badge
│       ├── contexts/              # AuthContext (JWT state management)
│       ├── lib/                   # api.ts (Axios client), formatDate.ts
│       └── styles/                # glass.css (glassmorphism design)
├── sdk/
│   └── src/
│       ├── client.ts              # AgentLedger class (wrap, session, track)
│       ├── session.ts             # Session class (hash chaining, approvals)
│       ├── emitter.ts             # HTTP event emitter with retry
│       ├── hasher.ts              # SHA-256 + chain hashing
│       ├── types.ts               # TypeScript interfaces
│       └── errors.ts              # Custom error hierarchy
├── koyeb.yaml                     # Koyeb deployment config
└── CLAUDE.md                      # Project orchestration
```

## Database Schema (8 Tables)

| Table | Key Columns | Notes |
|-------|------------|-------|
| `organisations` | id, name, slug (unique), plan (free/pro/enterprise) | Root tenant |
| `users` | id, orgId (FK), email (unique), passwordHash, role (owner/admin/member) | Belongs to org |
| `agents` | id, orgId (FK), name, modelProvider, modelId, status, metadata (JSONB) | AI agent registry |
| `sessions` | id, orgId (FK), agentId (FK), status, totalEvents, totalCost | Agent execution session |
| `events` | id, orgId, agentId, sessionId, category, level, message, hash, tampered | **Append-only** |
| `api_keys` | id, orgId, userId, keyHash, keyPrefix, name, revokedAt | SHA-256 hashed |
| `refresh_tokens` | id, userId, tokenHash, expiresAt, revokedAt | JWT refresh tokens |
| `audit_logs` | id, orgId, userId, action, resourceType, ipAddress | System audit trail |

### Enums

- **AgentStatus**: active, idle, error, offline
- **SessionStatus**: active, completed, failed, timeout
- **EventCategory**: agent_lifecycle, llm_call, tool_invocation, user_action, system, security, guardrail
- **EventLevel**: debug, info, warn, error, fatal
- **OrganisationPlan**: free, pro, enterprise
- **UserRole**: owner, admin, member
- **AuditLogAction**: read, create, update, delete, login, logout, signup, generate_key, revoke_key

## Authentication Architecture

```
┌─────────────────────────────────────────────────┐
│                  Auth Flow                       │
├─────────────────────────────────────────────────┤
│  Signup/Login → JWT Access (15min)              │
│              → Refresh Token (7d, SHA-256 in DB)│
│                                                  │
│  API Key → Header: X-API-Key                    │
│         → SHA-256 hashed, prefix: al_live_sk_   │
│                                                  │
│  Guards:                                         │
│    JwtAuthGuard     → auth-only endpoints       │
│    CombinedAuthGuard → JWT OR API key           │
│    @Public()         → no auth needed           │
└─────────────────────────────────────────────────┘
```

## Event Integrity System

- Events are **append-only** (no UPDATE/DELETE)
- Each event gets a SHA-256 hash of its content
- Hash chaining: `chainHash(action, input, timestamp, prevHash)`
- `tampered` boolean flag for verification results
- `stateBefore` / `stateAfter` JSONB snapshots per event
- Verification endpoints: `GET /events/verify` and `GET /events/:id/verify`

## Frontend Pages (13 total)

| Route | Description |
|-------|------------|
| `/` | Landing page |
| `/login` | Auth login |
| `/signup` | Auth signup |
| `/dashboard` | Main dashboard |
| `/agents` | Agent management |
| `/sessions` | Session list |
| `/events` | Event log viewer |
| `/cost-analytics` | Cost & usage analytics |
| `/anomalies` | Anomaly detection |
| `/compliance` | Compliance reports |
| `/settings` | Org settings + API keys |
| `/session-replay` | Session replay list |
| `/session-replay/[id]` | Individual session replay |

## SDK Flow

```
AgentLedger.wrap(agentId, fn)
  → Session.run(fn, input)
    → emit START event (with chainHash)
    → poll approval (if requireApproval)
    → execute fn(input)
    → emit COMPLETED/FAILED event
    → return result (never crashes agent)
```
