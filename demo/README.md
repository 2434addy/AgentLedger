# AgentLedger Demos

Runnable examples showing how to integrate AgentLedger with your AI agents.

## Prerequisites

- Node.js >= 18
- AgentLedger backend running at `http://localhost:3001` (see [Self-Hosting](../README.md#self-hosting))
- An AgentLedger API key (create one in the dashboard under Settings)

## Setup

```bash
cd demo
npm install
```

## Demos

### Basic Usage

Minimal example — register an agent, create a session, track events, flush.

```bash
AGENTLEDGER_API_KEY=al_live_sk_... npx ts-node basic-usage.ts
```

### OpenAI Agent

Real OpenAI GPT-4o integration with token tracking and latency measurement.

```bash
OPENAI_API_KEY=sk-... AGENTLEDGER_API_KEY=al_live_sk_... npx ts-node openai-agent.ts
```

### Approval Flow

Demonstrates the human-in-loop approval queue — requests approval for a high-risk action, then check the dashboard to approve/reject.

```bash
AGENTLEDGER_API_KEY=al_live_sk_... npx ts-node approval-flow.ts
```

### Compliance Report

Generates EU AI Act, SOC 2, and ISO 42001 compliance reports via the API.

```bash
AGENTLEDGER_API_KEY=al_live_sk_... npx ts-node compliance-report.ts
```

## Existing Demo

The original `agent.js` demo uses Anthropic's Claude API:

```bash
ANTHROPIC_API_KEY=sk-ant-... AGENTLEDGER_API_KEY=al_live_sk_... npm start
```
