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

Every LLM call. Every tool use. Every token spent. Recorded, searchable, and replayable.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live_Demo-agent--ledger--tau.vercel.app-blueviolet?style=flat-square)](https://agent-ledger-tau.vercel.app)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](https://github.com/2434addy/AgentLedger/pulls)

[Live Demo](https://agent-ledger-tau.vercel.app) &middot; [SDK Docs](#sdk) &middot; [Self-Host](#self-host) &middot; [Contributing](#contributing)

</div>

---

## What is AgentLedger?

AgentLedger is an open-source observability platform that records everything your AI agents do — LLM calls, tool invocations, costs, errors — and lets you replay, analyze, and audit any session after the fact.

## The Problem

You deploy an AI agent. It runs 10,000 sessions a day. Then something goes wrong.

- **What happened?** You have logs, but they're scattered across stdout, CloudWatch, and Datadog.
- **How much did it cost?** You check the OpenAI dashboard. It shows a total. Not per-session. Not per-agent.
- **Was it the prompt? The tool? The model?** You add more logging. Deploy. Wait. Hope it happens again.
- **The compliance team asks for an audit trail.** You open a spreadsheet.

AI agents are the first software that makes decisions on your behalf, but they ship with less observability than a 2005 Rails app.

## The Solution

AgentLedger sits between your agent and the outside world. One SDK call wraps your agent. From that point, every LLM call, tool use, and state change is captured with:

- **Session replay** — step through any session like a debugger
- **Cost analytics** — per-agent, per-session, per-model token and dollar tracking
- **Anomaly detection** — automatic alerts on cost spikes, error bursts, and drift
- **Compliance reports** — EU AI Act, SOC 2, ISO 42001 audit-ready exports
- **SHA-256 hash chains** — tamper-proof event history

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
  description: 'Customer support agent',
  modelProvider: 'anthropic',
  modelId: 'claude-sonnet-4-6',
})

const session = await al.createSession({ agentId: agent.id })

// Track any event — LLM calls, tool use, errors, anything
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

That's it. Every event is now in your dashboard — searchable, replayable, auditable.

---

## Features

### Session Replay

Step through any agent session event-by-event. See the exact inputs, outputs, and timing of every LLM call, tool invocation, and decision point. Debug production issues without adding more logging.

### Cost Analytics

Track token usage and dollar cost per agent, per session, per model. Spot which agents are burning through your budget. Set alerts before you get a surprise invoice.

### Anomaly Detection

Automatic detection of cost spikes, error rate increases, latency degradation, and behavioral drift. Get alerted when an agent starts acting differently — before your users notice.

### Compliance & Audit

Generate audit-ready reports for regulatory frameworks:

- **EU AI Act** — Articles 9, 13, 14, 17 (human oversight, transparency, risk management)
- **SOC 2 Type II** — CC7.2, CC7.3, CC9.2 (monitoring, detection, incident response)
- **ISO 42001** — Clauses 6.1, 8.4, 9.1, 10.2 (AI risk, operations, evaluation)

Every event is SHA-256 hashed and chained. Tamper with one record and the chain breaks.

### TypeScript SDK

Lightweight, zero-dependency SDK with batched event sending, automatic retries, and graceful shutdown. Works with any framework — OpenAI, Anthropic, LangChain, CrewAI, or raw HTTP calls.

---

## Dashboard

> Screenshots coming soon. Try the [live demo](https://agent-ledger-tau.vercel.app) in the meantime.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | NestJS, TypeORM, PostgreSQL, Redis (BullMQ) |
| **Frontend** | Next.js 15, Tailwind CSS, Recharts |
| **SDK** | TypeScript, zero dependencies |
| **Auth** | JWT (access + refresh) + API key (SHA-256 hashed) |
| **Infra** | Docker, Neon (Postgres), Upstash (Redis), Koyeb, Cloudflare Pages |

---

## Self-Host

```bash
git clone https://github.com/2434addy/AgentLedger.git
cd AgentLedger

# Configure
cp backend/.env.example backend/.env
# Set DATABASE_URL, REDIS_URL, JWT_SECRET in backend/.env

# Run
docker-compose up -d

# Backend  → http://localhost:3001
# Frontend → http://localhost:3000
```

Runs on any machine with Docker. The free tier of Neon (Postgres) and Upstash (Redis) works for production if you don't want to self-host the data layer.

---

## SDK

```bash
npm install @2434addy/agentledger-sdk
```

| Method | Description |
|---|---|
| `new AgentLedger({ apiKey, baseUrl? })` | Initialize the client |
| `al.createAgent({ name, modelProvider, modelId })` | Register an agent |
| `al.createSession({ agentId })` | Start a tracking session |
| `al.track({ agentId, sessionId, category, level, message })` | Queue an event |
| `al.flush()` | Send all queued events |
| `al.shutdown()` | Flush + stop auto-flush timer |

**Event categories:** `agent_lifecycle` `llm_call` `tool_invocation` `user_action` `system` `security` `guardrail`

**Event levels:** `debug` `info` `warn` `error` `fatal`

Full SDK source is in [`sdk/`](./sdk).

---

## Live Demo

**[agent-ledger-tau.vercel.app](https://agent-ledger-tau.vercel.app)**

---

## Contributing

PRs welcome. Please open an issue first for large changes.

```bash
git clone https://github.com/2434addy/AgentLedger.git
cd AgentLedger

# Backend
cd backend && npm install && npm run start:dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev

# SDK
cd sdk && npm install && npm run dev
```

---

## License

MIT

---

<div align="center">

**Your agents are making decisions. You should be able to see every one.**

[Get Started](https://agent-ledger-tau.vercel.app) &middot; [Report Bug](https://github.com/2434addy/AgentLedger/issues) &middot; [Request Feature](https://github.com/2434addy/AgentLedger/issues)

</div>
