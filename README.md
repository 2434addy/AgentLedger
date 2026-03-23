<div align="center">

# AgentLedger

**Tamper-proof audit layer for AI agents. SHA-256 hashed audit trails, human-in-loop approvals, rollback engine, and one-click EU AI Act / SOC 2 / ISO 42001 compliance reports.**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](https://github.com/2434addy/AgentLedger/pulls)
[![Status](https://img.shields.io/badge/Status-Public%20Beta-orange?style=for-the-badge)]()
[![Live Demo](https://img.shields.io/badge/Live%20Demo-agent--ledger--tau.vercel.app-purple?style=for-the-badge)](https://agent-ledger-tau.vercel.app)

⭐ Star this repo if AgentLedger saves you from a compliance nightmare

</div>

---

## Why AgentLedger?

LangSmith shows you what your agents did. AgentLedger proves it can't be changed — and generates the compliance paperwork to prove it to regulators. One SDK. Any framework. Full EU AI Act Article 14 compliance in under 5 minutes.

| Feature | AgentLedger | LangSmith |
|---|---|---|
| SHA-256 Tamper-Proof Audit Chain | ✅ | ❌ |
| Human-in-Loop Approval Queue | ✅ | ❌ |
| Agent Rollback Engine | ✅ | ❌ |
| EU AI Act Compliance Reports | ✅ | ❌ Enterprise only |
| SOC 2 Type II Reports | ✅ | ❌ Enterprise only |
| ISO 42001 Reports | ✅ | ❌ |
| Works with ANY framework | ✅ | ⚠️ LangChain only |
| Pricing | $29/mo | $100K+/yr for compliance |

---

## 🚀 Live Demo

> Try it live → **[agent-ledger-tau.vercel.app](https://agent-ledger-tau.vercel.app)**

---

## ⚡ Quick Start

Up and running in 5 minutes.

### Step 1 — Install

```bash
npm install @agentledger/sdk
```

### Step 2 — Wrap your agent

**OpenAI:**

```typescript
import { AgentLedger } from '@agentledger/sdk';

const ledger = new AgentLedger({ apiKey: 'al_your_key' });

const agent = ledger.wrap('my-agent', async (input) => {
  return await openai.chat.completions.create({ ... });
});

// Every call is now SHA-256 hashed + EU AI Act ready
const result = await agent.run({ task: 'Analyze customer data' });
```

**LangChain:**

```typescript
import { AgentLedger } from '@agentledger/sdk';

const ledger = new AgentLedger({ apiKey: 'al_your_key' });

// Drop into any existing LangChain agent — zero refactoring
const trackedExecutor = ledger.wrap('langchain-agent', executor);

await trackedExecutor.invoke({ input: 'Summarize sales report' });
// Tamper-proof audit trail generated automatically ✓
```

**CrewAI / Any Framework:**

```typescript
import { AgentLedger } from '@agentledger/sdk';

const ledger = new AgentLedger({ apiKey: 'al_your_key' });

// Works with any agent framework via simple wrapper
const session = await ledger.session('my-crew', () =>
  crew.kickoff({ inputs: { topic: 'Q1 Sales' } })
);
```

### Step 3 — View your dashboard

Open [agent-ledger-tau.vercel.app](https://agent-ledger-tau.vercel.app) → sign in → see every agent action, hash, and compliance status in real time.

---

## 🔐 Features

**🔒 Tamper-Proof Audit Chain**

Every agent action is SHA-256 hashed and chained. Altering any historical record breaks the chain — giving regulators a trail they can actually trust.

```json
{
  "action_id": "act_9f3k2m",
  "hash": "sha256:a3f8c2e1d9b4...",
  "prev_hash": "sha256:b2e7d1f4c8a3...",
  "timestamp": "2026-03-23T10:42:11Z",
  "status": "VERIFIED"
}
```

**👤 Human-in-Loop Approval Queue**

Intercept high-risk agent actions before they execute. Approve, reject, or modify — with full audit log. EU AI Act Article 14 compliant out of the box.

**↩️ Rollback Engine**

One-click rollback any agent action. Full state restoration with cryptographic proof of what changed.

**📊 Real-Time Anomaly Detection**

Automatic alerts on cost spikes, infinite loops, silent failures, and unexpected behavior patterns.

**📋 One-Click Compliance Reports**

Generate audit-ready reports for:
- 🇪🇺 **EU AI Act** — Articles 9, 13, 14, 17
- 🔐 **SOC 2 Type II** — CC7.2, CC7.3, CC9.2
- 📋 **ISO 42001** — Clauses 6.1, 8.4, 9.1, 10.2

**⚡ Real-Time Session Replay**

Step through any agent session like a debugger. Inspect every payload, every decision, every cost.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              Your AI Agent                  │
└──────────────────┬──────────────────────────┘
                   │ AgentLedger SDK wraps agent
┌──────────────────▼──────────────────────────┐
│           AgentLedger SDK                   │
│  • SHA-256 action hashing                   │
│  • Human-in-loop gate                       │
│  • Event streaming                          │
└──────────────────┬──────────────────────────┘
                   │ Events via REST / WebSocket
┌──────────────────▼──────────────────────────┐
│           AgentLedger Backend               │
│  Node.js + Express + PostgreSQL + Redis     │
│  • Audit chain storage                      │
│  • Approval queue                           │
│  • Anomaly detection engine                 │
│  • Compliance report generator              │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           AgentLedger Dashboard             │
│  Next.js frontend on Vercel                 │
│  • Live session replay                      │
│  • Cost analytics                           │
│  • Compliance report download               │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| SDK | TypeScript |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Cache / Queue | Redis |
| Frontend | Next.js 15 + Tailwind CSS |
| Deployment | Docker + Vercel |
| Hashing | SHA-256 (crypto module) |

---

## 🐳 Self-Hosting

```bash
# Clone the repo
git clone https://github.com/2434addy/AgentLedger.git
cd AgentLedger

# Copy environment variables
cp backend/.env.example backend/.env
# Fill in your DATABASE_URL, REDIS_URL, JWT_SECRET

# Start everything with Docker
docker-compose up -d

# Backend runs on http://localhost:3001
# Frontend runs on http://localhost:3000
```

---

## 💰 Pricing

| Plan | Price | Agents | Events/month | Compliance Reports |
|---|---|---|---|---|
| Free | $0 | 3 | 10,000 | Basic logs only |
| Pro | $29/mo | Unlimited | 1,000,000 | EU AI Act + SOC 2 |
| Enterprise | Custom | Unlimited | Unlimited | All frameworks + ISO 42001 |

> 🚀 [Start Free at agent-ledger-tau.vercel.app](https://agent-ledger-tau.vercel.app)

---

## 🗺️ Roadmap

- [x] SHA-256 tamper-proof audit chain
- [x] Human-in-loop approval queue
- [x] Real-time session replay
- [x] Cost analytics dashboard
- [x] Anomaly detection
- [x] EU AI Act / SOC 2 / ISO 42001 reports
- [ ] AgentLedger MCP server
- [ ] Slack / PagerDuty alerts
- [ ] HIPAA compliance reports
- [ ] SOC 2 Type II certification (Q3 2026)
- [ ] On-premise / air-gapped deployment

---

## 🤝 Contributing

PRs are welcome. For major changes please open an issue first.

```bash
git clone https://github.com/2434addy/AgentLedger.git
cd AgentLedger
npm install
# Create your feature branch
git checkout -b feat/your-feature
# Push and open a PR
```

---

## 📄 License

MIT © 2026 AgentLedger

---

<div align="center">
  <strong>Built for the EU AI Act era.</strong><br/>
  <a href="https://agent-ledger-tau.vercel.app">Live Demo</a> ·
  <a href="https://github.com/2434addy/AgentLedger/issues">Report Bug</a> ·
  <a href="https://github.com/2434addy/AgentLedger/issues">Request Feature</a>
</div>
