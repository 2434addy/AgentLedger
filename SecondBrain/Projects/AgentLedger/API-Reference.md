---
project: AgentLedger
type: api-reference
status: complete
tags: [api, endpoints, rest, nestjs, auth]
created: 2026-03-24
---

# AgentLedger API Reference

Base URL: `/api/v1` (except health). See also [[Architecture]], [[Setup-Guide]].

Global config: ValidationPipe (whitelist + transform), Helmet, ThrottlerGuard (60 req/min).

## Auth Endpoints

### POST /api/v1/auth/signup
- **Auth**: Public | **Throttle**: 5/60s
- **Body**: `{ email: string (max 255), password: string (8-72, must include upper+lower+digit+special), displayName: string (2-100) }`
- **Response**: `{ accessToken, refreshToken, user: { id, email, displayName, orgId, role } }`

### POST /api/v1/auth/login
- **Auth**: Public | **Throttle**: 5/60s | **Status**: 200
- **Body**: `{ email: string, password: string }`
- **Response**: Same as signup

### POST /api/v1/auth/refresh
- **Auth**: Public | **Throttle**: 10/60s | **Status**: 200
- **Body**: `{ refreshToken: string }`
- **Response**: New token pair

### POST /api/v1/auth/logout
- **Auth**: JwtAuthGuard | **Throttle**: 10/60s | **Status**: 200
- **Body**: `{ refreshToken: string }`
- **Response**: Success message

---

## Agents Endpoints (CombinedAuthGuard)

### GET /api/v1/agents
- **Response**: Agent[] (filtered by org)

### POST /api/v1/agents
- **Body**: `{ name (max 100), description? (max 500), modelProvider (max 50), modelId (max 100), status?: enum, metadata?: object }`
- **Response**: Created Agent

### GET /api/v1/agents/:id
- **Params**: id (UUID)
- **Response**: Agent | 404

### PATCH /api/v1/agents/:id
- **Body**: All fields optional (same as POST)
- **Response**: Updated Agent

### DELETE /api/v1/agents/:id
- **Response**: Success

---

## Sessions Endpoints (CombinedAuthGuard)

### GET /api/v1/sessions
- **Query**: `agentId?: UUID`
- **Response**: Session[]

### POST /api/v1/sessions
- **Body**: `{ agentId: UUID, metadata?: object }`
- **Response**: Created Session

### GET /api/v1/sessions/:id
- **Response**: Session with related events

### PATCH /api/v1/sessions/:id
- **Body**: `{ status?: enum, endedAt?: Date, metadata?: object }`
- **Response**: Updated Session

---

## Events Endpoints (CombinedAuthGuard)

### GET /api/v1/events
- **Query**: `sessionId?, agentId?, category?, level?, limit? (1-500, default 100), page? (default 1)`
- **Response**: Paginated Event[]

### POST /api/v1/events
- **Body** (single): `{ agentId: UUID, sessionId?: UUID, category: enum, level: enum, message (max 2000), payload?, tokensInput?, tokensOutput?, costUsd?, latencyMs?, stateBefore?, stateAfter?, occurredAt? }`
- **Body** (batch): `{ events: CreateEventItemDto[] }`
- **Response**: Created event(s)

### GET /api/v1/events/verify
- **Response**: Verification report for all events in org

### GET /api/v1/events/:id
- **Response**: Single Event

### GET /api/v1/events/:id/verify
- **Response**: Verification result for single event

---

## API Keys Endpoints (JwtAuthGuard)

### GET /api/v1/api-keys
- **Response**: ApiKey[] (id, name, keyPrefix, lastUsedAt, revokedAt, createdAt)

### POST /api/v1/api-keys
- **Body**: `{ name: string (1-100) }`
- **Response**: ApiKey with full key (only returned once). Format: `alg_<64-char-hex>`

### DELETE /api/v1/api-keys/:id
- **Response**: Success (soft delete — sets revokedAt)

---

## Organisations Endpoints (JwtAuthGuard)

### GET /api/v1/organisations/me
- **Response**: Current org (id, name, slug, plan, createdAt)

### PATCH /api/v1/organisations/me
- **Body**: `{ name? (max 100), slug? (max 64, pattern: ^[a-z0-9-]+$) }`
- **Response**: Updated org

---

## Analytics Endpoints (CombinedAuthGuard)

### GET /api/v1/analytics/cost
- **Query**: `from?: ISO8601, to?: ISO8601`
- **Response**: Cost breakdown (daily aggregated by agent, session, model)

### GET /api/v1/analytics/usage
- **Query**: `from?: ISO8601, to?: ISO8601`
- **Response**: Usage stats (token counts, request counts, latency percentiles)

### GET /api/v1/analytics/models
- **Response**: Per-model usage, costs, latencies

---

## Compliance Endpoints (CombinedAuthGuard)

### GET /api/v1/compliance/report
- **Response**: Full compliance report (audit trail, verification status, tampering summary)

### GET /api/v1/compliance/checks
- **Response**: Compliance check results with status, failures, recommendations

---

## Anomalies Endpoint (CombinedAuthGuard)

### GET /api/v1/anomalies
- **Response**: Detected anomalies (type, severity, affected events/sessions, confidence)

---

## Health Endpoint

### GET /health
- **Auth**: Public | **No prefix** (excluded from /api/v1)
- **Response**: `{ status: 'ok', timestamp: ISO8601 }`

---

## Auth Summary

| Auth Type | Endpoints |
|-----------|-----------|
| Public | /health, /auth/signup, /auth/login, /auth/refresh |
| JwtAuthGuard | /auth/logout, /api-keys/*, /organisations/* |
| CombinedAuthGuard (JWT OR API key) | /agents/*, /events/*, /sessions/*, /analytics/*, /compliance/*, /anomalies |

**Total: 30 endpoints**
