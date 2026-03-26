# AgentLedger

**Tamper-proof audit layer for AI agents.**

## What It Does
AgentLedger provides SHA-256 hashed audit trails, human-in-loop approvals, a rollback engine, and one-click compliance reports (EU AI Act, SOC 2, ISO 42001) for any AI agent framework.

## Key Features
- **Tamper-Proof Audit Chain** — Every agent action is SHA-256 hashed and chained. Altering any record breaks the chain.
- **Human-in-Loop Approval Queue** — Intercept high-risk agent actions before execution. EU AI Act Article 14 compliant.
- **Rollback Engine** — One-click rollback with cryptographic proof of changes.
- **Real-Time Anomaly Detection** — Alerts on cost spikes, infinite loops, silent failures.
- **One-Click Compliance Reports** — EU AI Act (Articles 9, 13, 14, 17), SOC 2 Type II, ISO 42001.
- **Session Replay** — Step through any agent session like a debugger.

## Tech Stack
| Layer | Technology |
|---|---|
| SDK | TypeScript (`@agentledger/sdk`) |
| Backend | NestJS + PostgreSQL (Neon) + Redis (Upstash) |
| Frontend | Next.js 15 + Tailwind CSS |
| Deployment | Koyeb + Cloudflare Pages |
| Hashing | SHA-256 (Node.js crypto) |

## Quick Start
```bash
npm install @agentledger/sdk
```

```typescript
import { AgentLedger } from '@agentledger/sdk';

const ledger = new AgentLedger({ apiKey: 'al_your_key' });

const agent = ledger.wrap('my-agent', async (input) => {
  return await openai.chat.completions.create({ ... });
});

const result = await agent.run({ task: 'Analyze customer data' });
```

## Links
- **GitHub**: [github.com/2434addy/AgentLedger](https://github.com/2434addy/AgentLedger)
- **License**: MIT

## Roadmap
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
