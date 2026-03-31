<div align="center">

```
 █████╗  ██████╗ ███████╗███╗   ██╗████████╗
██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║
██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║
██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝
██╗     ███████╗██████╗  ██████╗ ███████╗██████╗
██║     ██╔════╝██╔══██╗██╔════╝ ██╔════╝██╔══██╗
██║     █████╗  ██║  ██║██║  ███╗█████╗  ██████╔╝
██║     ██╔══╝  ██║  ██║██║   ██║██╔══╝  ██╔══██╗
███████╗███████╗██████╔╝╚██████╔╝███████╗██║  ██║
╚══════╝╚══════╝╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝
```

**Black Box Recorder for AI Agents**

Tamper-proof SHA-256 audit trails, human-in-loop approval queues, session replay, compliance reports, cost analytics, and anomaly detection.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live_Demo-agentledger.pages.dev-blueviolet?style=flat-square)](https://agentledger.pages.dev)
[![npm](https://img.shields.io/badge/SDK-@2434addy/agentledger--sdk-red?style=flat-square&logo=npm)](https://www.npmjs.com/package/@2434addy/agentledger-sdk)

[Live Demo](https://agentledger.pages.dev) · [SDK Docs](#sdk) · [Self-Host](#self-host) · [API Docs](#api) · [Contributing](#contributing)

</div>

---

## What is AgentLedger?

AgentLedger is an open-source observability and compliance platform for AI agents. Every LLM call, tool invocation, cost, and decision is recorded in a cryptographically chained audit trail — searchable, replayable, and auditor-ready.

## Features

| Feature | Description |
|---------|-------------|
| **SHA-256 Hash Chain** | Every event is chained: `hash = SHA256(data + prevHash)`. Tamper with one record and the chain breaks. Verified via `GET /events/verify-chain`. |
| **Session Replay** | Step through any agent session event-by-event with full payload inspection and hash chain visualization. |
| **Human-in-Loop Approvals** | Pause high-risk agent actions for human review. Approve or reject with audit trail. |
| **Compliance Reports** | One-click reports for **EU AI Act** (Articles 9, 13, 14, 17), **SOC 2 Type II**, and **ISO 42001**. |
| **Cost Analytics** | Per-agent, per-session, per-model token and dollar tracking with charts. |
| **Anomaly Detection** | Automatic alerts on latency spikes, error bursts, and agent loops. |
| **Real-Time Streaming** | WebSocket gateway pushes events to the dashboard in real time. |
| **RBAC** | Role-based access control (Owner, Admin, Member) on destructive operations. |
| **CSRF Protection** | Double-submit cookie pattern on all state-changing endpoints. |
| **API Key Auth** | SHA-256 hashed API keys with per-org tier-based rate limiting (Redis). |

---

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────┐
│  Your Agent  │     │              AgentLedger                 │
│  (any LLM)  │────>│                                          │
│             │ SDK │  ┌─────────┐  ┌──────────┐  ┌─────────┐ │
│  OpenAI     │  or │  │ NestJS  │  │PostgreSQL│  │  Redis  │ │
│  Anthropic  │ API │  │  API    │──│ (Neon)   │  │(Upstash)│ │
│  LangChain  │     │  │         │  │          │  │         │ │
│  CrewAI     │     │  │ JWT +   │  │ Events   │  │ Rate    │ │
│  Custom     │     │  │ API Key │  │ Chain    │  │ Limits  │ │
└─────────────┘     │  │ Auth    │  │ Approvals│  │         │ │
                    │  └────┬────┘  └──────────┘  └─────────┘ │
┌─────────────┐     │       │ WebSocket                        │
│  Dashboard  │<────│       v                                  │
│  (Next.js)  │     │  ┌─────────┐                             │
│             │     │  │Socket.IO│ Real-time event streaming   │
│  Replay     │     │  └─────────┘                             │
│  Approvals  │     └──────────────────────────────────────────┘
│  Compliance │
│  Analytics  │
└─────────────┘
```

---

## Quick Start

### 1. Install the SDK

```bash
npm install @2434addy/agentledger-sdk
```

### 2. Track your agent (5 lines)

```typescript
import { AgentLedger } from '@2434addy/agentledger-sdk'

const al = new AgentLedger({ apiKey: 'al_live_sk_...' })

const agent = await al.createAgent({
  name: 'support-bot',
  modelProvider: 'anthropic',
  modelId: 'claude-sonnet-4-6',
})

const session = await al.createSession({ agentId: agent.id })

al.track({
  agentId: agent.id,
  sessionId: session.id,
  category: 'llm_call',
  level: 'info',
  message: 'Called Claude API',
  tokensInput: 150,
  tokensOutput: 420,
  latencyMs: 1200,
})

await al.flush()
```

---

## Self-Host

### With Docker Compose (recommended)

```bash
git clone https://github.com/2434addy/AgentLedger.git
cd AgentLedger

# Start PostgreSQL + Redis + Backend
docker-compose up -d

# Backend  → http://localhost:3001
# Swagger  → http://localhost:3001/api/docs (dev only)

# Start Frontend (separate terminal)
cd frontend && npm install && npm run dev
# Frontend → http://localhost:3000
```

### Manual Setup

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL, REDIS_URL, JWT_SECRET
npm install
npm run migration:run
npm run start:dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### Production Deployment

| Component | Recommended | Free Tier |
|-----------|-------------|-----------|
| Backend | Koyeb / Render | Yes |
| Frontend | Cloudflare Pages / Vercel | Yes |
| Database | Neon PostgreSQL | Yes |
| Redis | Upstash | Yes |

Set all env vars from `backend/.env.example` in your hosting platform.

---

## API

All endpoints are prefixed with `/api/v1/`. Authentication via JWT Bearer token or `x-api-key` header.

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | Public | Create account |
| POST | `/auth/login` | Public | Login (sets httpOnly refresh cookie) |
| POST | `/auth/refresh` | Cookie | Refresh access token |
| POST | `/auth/logout` | JWT | Logout (clears cookies) |
| POST | `/auth/forgot-password` | Public | Request password reset |
| POST | `/auth/reset-password` | Public | Reset password with token |

### Agents
| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/agents` | JWT/Key | All | List agents |
| POST | `/agents` | JWT/Key | All | Register agent |
| PATCH | `/agents/:id` | JWT/Key | Owner, Admin | Update agent |
| DELETE | `/agents/:id` | JWT/Key | Owner, Admin | Delete agent |

### Events
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/events` | JWT/Key | List events (cursor pagination) |
| POST | `/events` | JWT/Key | Create events (batch up to 500) |
| GET | `/events/verify` | JWT/Key | Verify all event hashes |
| GET | `/events/verify-chain` | JWT/Key | Verify hash chain integrity |
| GET | `/events/:id/verify` | JWT/Key | Verify single event hash |

### Approvals
| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/approvals` | JWT/Key | All | Request approval |
| GET | `/approvals/pending` | JWT/Key | All | List pending approvals |
| PATCH | `/approvals/:id/approve` | JWT | Owner, Admin | Approve |
| PATCH | `/approvals/:id/reject` | JWT | Owner, Admin | Reject |

### Compliance
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/compliance/reports/generate` | JWT/Key | Generate framework report (eu-ai-act, soc2, iso42001) |
| GET | `/compliance/report` | JWT/Key | Basic compliance summary |
| GET | `/compliance/checks` | JWT/Key | Compliance check status |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/cost` | Cost breakdown by agent |
| GET | `/analytics/usage` | Event usage by category |
| GET | `/analytics/models` | Model usage statistics |

---

## SDK

```bash
npm install @2434addy/agentledger-sdk
```

| Method | Description |
|--------|-------------|
| `new AgentLedger({ apiKey, baseUrl? })` | Initialize client |
| `al.createAgent({ name, modelProvider, modelId })` | Register agent |
| `al.createSession({ agentId })` | Start session |
| `al.track({ agentId, sessionId, category, level, message })` | Queue event |
| `al.flush()` | Send queued events |
| `al.shutdown()` | Flush + stop timer |

**Categories:** `agent_lifecycle` `llm_call` `tool_invocation` `user_action` `system` `security` `guardrail`

**Levels:** `debug` `info` `warn` `error` `fatal`

---

## Security

- Passwords: bcrypt with cost factor 12
- JWT: HS256, 15-minute access tokens, 7-day refresh tokens (httpOnly cookies)
- API keys: SHA-256 hashed, never stored raw
- Event integrity: SHA-256 hash chain with PostgreSQL advisory locks
- CSRF: Double-submit cookie pattern on all state-changing endpoints
- RBAC: Role-based access control (Owner/Admin/Member) on destructive operations
- Rate limiting: Per-org tier-based via Redis (100/min free, 1000/min pro, 5000/min enterprise)
- Input validation: class-validator on all DTOs, JSONB payload size limits
- CORS: Single-origin, credentials mode
- Security headers: Helmet with CSP in production

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | NestJS 11, TypeORM, PostgreSQL, Redis, Socket.IO |
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Framer Motion, Recharts |
| **SDK** | TypeScript, zero dependencies |
| **Auth** | JWT + httpOnly cookies + API keys (SHA-256) + CSRF |
| **Infra** | Docker, Neon (Postgres), Upstash (Redis), Koyeb/Render, Cloudflare Pages |

---

## Contributing

PRs welcome. Please open an issue first for large changes.

```bash
git clone https://github.com/2434addy/AgentLedger.git
cd AgentLedger
docker-compose up -d  # Start Postgres + Redis
cd backend && npm install && npm run start:dev
cd frontend && npm install && npm run dev  # separate terminal
```

---

## License

MIT

---

<div align="center">

**Your agents are making decisions. You should be able to see every one.**

[Get Started](https://agentledger.pages.dev) · [Report Bug](https://github.com/2434addy/AgentLedger/issues) · [Request Feature](https://github.com/2434addy/AgentLedger/issues)

</div>
