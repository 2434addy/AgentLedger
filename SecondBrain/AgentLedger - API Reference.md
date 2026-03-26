# AgentLedger — API Reference

Base URL: `/api/v1` (port 3001)

All endpoints return JSON. Auth via `Authorization: Bearer <token>` or `x-api-key: <key>`.

---

## Auth (`/api/v1/auth`)

### POST `/signup` — Public, 5/min
```json
// Request
{ "email": "user@example.com", "password": "Pass1234!", "displayName": "Jane" }
// Response
{ "accessToken": "...", "refreshToken": "...", "user": { "id", "email", "displayName", "organisationId" } }
```
Password: 8-72 chars, 1 upper + 1 lower + 1 digit + 1 special.

### POST `/login` — Public, 5/min
```json
{ "email": "user@example.com", "password": "Pass1234!" }
```

### POST `/refresh` — Public, 10/min
```json
{ "refreshToken": "..." }
```

### POST `/logout` — JWT required, 10/min
```json
{ "refreshToken": "..." }
```

---

## Organisations (`/api/v1/organisations`)

### GET `/me` — JWT required
Returns the authenticated user's organisation.

### PATCH `/me` — JWT required
```json
{ "name?": "New Name", "slug?": "new-slug" }
```

---

## Agents (`/api/v1/agents`)

### GET `/` — Combined auth
Returns all agents for the org.

### POST `/` — Combined auth
```json
{
  "name": "My Agent",
  "modelProvider": "openai",
  "modelId": "gpt-4",
  "description?": "Optional desc",
  "status?": "offline",
  "metadata?": {}
}
```

### GET `/:id` — Combined auth

### PATCH `/:id` — Combined auth
Same fields as POST, all optional.

### DELETE `/:id` — Combined auth

---

## API Keys (`/api/v1/api-keys`)

### GET `/` — JWT required
Returns all keys (masked, no raw key).

### POST `/` — JWT required
```json
{ "name": "Production Key" }
// Response includes raw key (shown ONCE): "al_live_sk_..." + 64 hex chars
```

### DELETE `/:id` — JWT required
Sets `revokedAt`, does not delete.

---

## Sessions (`/api/v1/sessions`)

### GET `/` — Combined auth
Query params: `agentId?` (UUID)

### POST `/` — Combined auth
```json
{ "agentId": "uuid", "metadata?": {} }
```

### GET `/:id` — Combined auth

### PATCH `/:id` — Combined auth
```json
{ "status?": "completed|failed|timeout", "endedAt?": "ISO8601", "metadata?": {} }
```

---

## Events (`/api/v1/events`)

### GET `/` — Combined auth
Query params: `sessionId?`, `agentId?`, `category?`, `level?`, `limit?` (1-500, default 100), `page?` (default 1)

### POST `/` — Combined auth
Single event or batch:
```json
// Single
{
  "agentId": "uuid",
  "category": "llm_call",
  "level": "info",
  "message": "Called GPT-4",
  "sessionId?": "uuid",
  "payload?": {},
  "tokensInput?": 150,
  "tokensOutput?": 200,
  "costUsd?": 0.003,
  "latencyMs?": 1200,
  "stateBefore?": {},
  "stateAfter?": {},
  "occurredAt?": "ISO8601"
}

// Batch
{ "events": [ ...array of above... ] }
```

**Categories**: `agent_lifecycle`, `llm_call`, `tool_invocation`, `user_action`, `system`, `security`, `guardrail`

**Levels**: `debug`, `info`, `warn`, `error`, `fatal`

**Side effects**: Auto-creates missing sessions, computes SHA-256 hash, updates session totals, updates agent `lastSeenAt`.

### GET `/:id` — Combined auth

### GET `/verify` — Combined auth
Verifies ALL events for the org.
```json
{ "total": 100, "valid": 99, "tampered": 1, "tamperedIds": ["uuid"] }
```

### GET `/:id/verify` — Combined auth
```json
{ "id": "uuid", "valid": true, "storedHash": "sha256:...", "recomputedHash": "sha256:..." }
```

---

## Analytics (`/api/v1/analytics`)

### GET `/cost` — Combined auth
Query: `from?`, `to?` (ISO8601)
```json
[{ "agentId": "uuid", "totalCost": 1.23, "eventCount": 50 }]
```

### GET `/usage` — Combined auth
Query: `from?`, `to?`
```json
[{ "category": "llm_call", "count": 42 }]
```

### GET `/models` — Combined auth
```json
[{ "modelProvider": "openai", "modelId": "gpt-4", "totalTokensInput": 5000, "totalTokensOutput": 3000, "totalCost": 0.50, "eventCount": 10 }]
```

---

## Anomalies (`/api/v1/anomalies`)

### GET `/` — Combined auth
```json
{
  "latencySpikes": [ ...events where latencyMs > 2x average... ],
  "errorBursts": [{ "minute": "2026-03-24T10:42:00Z", "error_count": 8 }],
  "agentLoops": [{ "sessionId": "uuid", "agentId": "uuid", "message": "...", "repeat_count": 15 }]
}
```

---

## Compliance (`/api/v1/compliance`)

### GET `/report` — Combined auth
```json
{ "guardrailEvents": 12, "securityEvents": 5, "totalAuditLogs": 200, "generatedAt": "ISO8601" }
```

### GET `/checks` — Combined auth
```json
[
  { "name": "Guardrail monitoring", "status": "pass", "description": "..." },
  { "name": "Audit trail", "status": "warn", "description": "..." },
  { "name": "Security monitoring", "status": "fail", "description": "..." }
]
```

---

## Health (`/health`)

### GET `/health` — Public, no rate limit
```json
{ "status": "ok", "timestamp": "ISO8601" }
```
