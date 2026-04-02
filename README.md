<div align="center">

# AgentLedger

### Black Box Recorder for AI Agents

Tamper-proof SHA-256 audit trails, human-in-loop approval queues, session replay, compliance reports, cost analytics, and anomaly detection.

[![npm version](https://img.shields.io/npm/v/@2434addy/agentledger-sdk?style=flat-square&logo=npm&color=CB3837)](https://www.npmjs.com/package/@2434addy/agentledger-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live_Demo-agentledger.pages.dev-blueviolet?style=flat-square)](https://agentledger.pages.dev)

[Live Demo](https://agentledger.pages.dev) · [SDK Docs](#sdk-installation) · [Self-Host](#self-hosting) · [API Reference](#api-reference) · [Contributing](CONTRIBUTING.md)

</div>

---

## Quick Start

```bash
npm install @2434addy/agentledger-sdk
```

```typescript
import { AgentLedger } from '@2434addy/agentledger-sdk'

const ledger = new AgentLedger({ apiKey: 'al_live_sk_...' })
const agent = await ledger.createAgent({ name: 'support-bot', modelProvider: 'openai', modelId: 'gpt-4o' })
const session = await ledger.createSession({ agentId: agent.id })
ledger.track({ agentId: agent.id, sessionId: session.id, category: 'llm_call', level: 'info', message: 'Called GPT-4o', tokensInput: 150, tokensOutput: 420 })
await ledger.flush() // SHA-256 hashed, chained, and stored
```

---

## Why AgentLedger?

- **Tamper-proof audit trail** — Every event is SHA-256 hashed and chained. Modify one record and the chain breaks. Auditors can verify integrity with a single API call.
- **Human-in-loop approvals** — Pause high-risk agent actions for human review before execution. Meet EU AI Act Article 14 mandates out of the box.
- **One-click compliance** — Generate audit-ready reports mapped to EU AI Act, SOC 2 Type II, and ISO 42001 frameworks in one click.

---

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| SHA-256 Hash Chain | :white_check_mark: | Every event chained: `hash = SHA256(data + prevHash)`. Tamper = chain breaks. |
| Session Replay | :white_check_mark: | Step through any agent session event-by-event with full payload inspection. |
| Approval Queue | :white_check_mark: | Pause high-risk actions for human review. Approve/reject with audit trail. |
| Compliance Reports | :white_check_mark: | EU AI Act (Art. 9, 13, 14, 17), SOC 2 Type II, ISO 42001 — one click. |
| Cost Analytics | :white_check_mark: | Per-agent, per-session, per-model token and dollar tracking with charts. |
| Anomaly Detection | :white_check_mark: | Automatic alerts on latency spikes, error bursts, and agent loops. |
| WebSocket Streaming | :white_check_mark: | Real-time event push to dashboard via Socket.IO. |
| RBAC | :white_check_mark: | Role-based access control (Owner, Admin, Member). |

---

## SDK Installation

```bash
npm install @2434addy/agentledger-sdk
```

### Framework Support

Works with **any** LLM framework — OpenAI, LangChain, CrewAI, Vercel AI SDK, or plain REST.

**OpenAI example:**

```typescript
import { AgentLedger } from '@2434addy/agentledger-sdk'
import OpenAI from 'openai'

const ledger = new AgentLedger({ apiKey: 'al_live_sk_...' })
const openai = new OpenAI()

const agent = await ledger.createAgent({ name: 'gpt-4o-agent', modelProvider: 'openai', modelId: 'gpt-4o' })
const session = await ledger.createSession({ agentId: agent.id })

const start = Date.now()
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Summarize Q1 sales' }],
})

ledger.track({
  agentId: agent.id,
  sessionId: session.id,
  category: 'llm_call',
  level: 'info',
  message: 'GPT-4o completion',
  tokensInput: completion.usage?.prompt_tokens,
  tokensOutput: completion.usage?.completion_tokens,
  latencyMs: Date.now() - start,
})

await ledger.flush()
```

See the [SDK README](sdk/README.md) for the full API reference and more framework examples.

---

## Comparison

| Feature | AgentLedger ($29/mo) | LangSmith (~$100K/yr) | Langfuse ($29/mo) |
|---------|---------------------|----------------------|-------------------|
| EU AI Act Compliance Reports | :white_check_mark: Included | Enterprise only | Not available |
| SOC 2 Type II Reports | :white_check_mark: Included | Enterprise only | Not available |
| ISO 42001 Reports | :white_check_mark: Included | Enterprise only | Not available |
| Human-in-Loop Approval Queue | :white_check_mark: Included | Not available | Not available |
| Tamper-Proof SHA-256 Hash Chain | :white_check_mark: Included | Not available | Not available |
| One-Click Compliance Export | :white_check_mark: Included | Enterprise only | Not available |
| Works with ANY Framework | :white_check_mark: Yes | LangChain only | Yes |
| Retention (base plan) | 90 days | 14 days | 60 days |

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

## Self-Hosting

### Docker Compose (recommended)

```bash
git clone https://github.com/2434addy/AgentLedger.git
cd AgentLedger

# Start PostgreSQL + Redis + Backend
docker-compose up -d

# Backend  → http://localhost:3001
# Swagger  → http://localhost:3001/api/docs

# Start Frontend (separate terminal)
cd frontend && npm install && npm run dev
# Frontend → http://localhost:3000
```

### Manual Setup

```bash
# Backend
cd backend
cp .env.example .env   # Edit with your DATABASE_URL, REDIS_URL, JWT_SECRET
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
| Backend | [Koyeb](https://koyeb.com) | Yes |
| Frontend | [Cloudflare Pages](https://pages.cloudflare.com) | Yes |
| Database | [Neon PostgreSQL](https://neon.tech) | Yes |
| Redis | [Upstash](https://upstash.com) | Yes |

Set all env vars from `backend/.env.example` in your hosting platform.

---

## API Reference

All endpoints are prefixed with `/api/v1/`. Auth via JWT Bearer token or `x-api-key` header.

Swagger UI available at `/api/docs` in development mode.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Login (returns JWT) |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agents` | List agents |
| POST | `/agents` | Register agent |
| PATCH | `/agents/:id` | Update agent |
| DELETE | `/agents/:id` | Delete agent |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | List events (cursor pagination) |
| POST | `/events` | Create events (batch up to 500) |
| GET | `/events/verify` | Verify all event hashes |
| GET | `/events/verify-chain` | Verify hash chain integrity |
| GET | `/events/:id/verify` | Verify single event hash |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sessions` | List sessions |
| POST | `/sessions` | Create session |
| PATCH | `/sessions/:id` | Update session |

### Approvals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/approvals` | Request approval |
| GET | `/approvals/pending` | List pending approvals |
| PATCH | `/approvals/:id/approve` | Approve |
| PATCH | `/approvals/:id/reject` | Reject |

### Compliance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/compliance/reports/generate` | Generate framework report |
| GET | `/compliance/report` | Compliance summary |
| GET | `/compliance/checks` | Check status |

---

## Security

- **Passwords**: bcrypt with cost factor 12
- **JWT**: HS256, 15-min access tokens, 7-day refresh tokens (httpOnly cookies)
- **API keys**: SHA-256 hashed, never stored raw
- **Event integrity**: SHA-256 hash chain with PostgreSQL advisory locks
- **CSRF**: Double-submit cookie pattern on state-changing endpoints
- **RBAC**: Owner/Admin/Member roles on destructive operations
- **Rate limiting**: Per-org tier-based via Redis
- **Headers**: Helmet with CSP in production

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS 11, TypeORM, PostgreSQL, Redis, Socket.IO |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Framer Motion, Recharts |
| SDK | TypeScript, zero dependencies |
| Auth | JWT + httpOnly cookies + API keys (SHA-256) + CSRF |
| Infra | Docker, Neon, Upstash, Koyeb, Cloudflare Pages |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
git clone https://github.com/2434addy/AgentLedger.git
cd AgentLedger
docker-compose up -d
cd backend && npm install && npm run start:dev
cd frontend && npm install && npm run dev  # separate terminal
```

---

## License

[MIT](LICENSE)

---

<div align="center">

**Your agents are making decisions. You should be able to see every one.**

[Get Started](https://agentledger.pages.dev) · [Report Bug](https://github.com/2434addy/AgentLedger/issues) · [Request Feature](https://github.com/2434addy/AgentLedger/issues)

</div>
