# @agentledger/sdk

Tamper-proof audit layer for AI agents. SHA-256 hashed audit trails, human-in-loop approvals, and compliance reports (EU AI Act / SOC 2 / ISO 42001).

## Install

```bash
npm install @agentledger/sdk
```

## Quick Start (3 lines)

```typescript
import { AgentLedger } from '@agentledger/sdk';

const ledger = new AgentLedger({ apiKey: 'your-api-key' });
const agent = ledger.wrap('my-agent', myAgentFunction);
const result = await agent.run({ prompt: 'Hello' });
```

## Features

- **SHA-256 Chain Hashing** — every event is cryptographically chained, tamper-proof
- **Human-in-Loop** — require human approval before high-risk actions execute
- **Compliance Reports** — EU AI Act, SOC 2, ISO 42001 ready
- **Framework Agnostic** — works with LangChain, OpenAI, CrewAI, or any async function
- **Zero Config** — defaults work out of the box, customize when needed

## Usage

### Wrap any agent function

```typescript
import { AgentLedger } from '@agentledger/sdk';

const ledger = new AgentLedger({ apiKey: process.env.AGENTLEDGER_API_KEY! });

// Wrap your agent function
const agent = ledger.wrap('email-agent', sendEmail, {
  defaultRiskLevel: 'high',
  requireApproval: true,
});

// Every call is now tracked with full audit trail
const result = await agent.run(
  { to: 'user@example.com', body: 'Hello!' },
  { action: 'send_email', riskLevel: 'high' }
);
```

### Multi-step sessions

```typescript
const session = ledger.session('data-pipeline');

const data = await session.run(fetchData, { source: 'db' }, { action: 'fetch' });
const cleaned = await session.run(cleanData, data, { action: 'clean' });
const result = await session.run(analyze, cleaned, {
  action: 'analyze',
  riskLevel: 'medium',
});
```

### Fire-and-forget tracking

```typescript
await ledger.track('monitoring-agent', 'health_check', {
  status: 'ok',
  latency: 42,
});
```

## Configuration

```typescript
const ledger = new AgentLedger({
  apiKey: 'your-api-key',        // required
  baseUrl: 'https://...',        // default: https://api.agentledger.io
  timeout: 5000,                 // ms, default: 5000
  riskThreshold: 'medium',       // auto-flag above this level
  debug: false,                  // enable console warnings
});
```

## License

MIT
