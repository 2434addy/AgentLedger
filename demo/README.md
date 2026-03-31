# AgentLedger SDK Demo

A simple AI agent that answers a question using Claude and tracks everything with AgentLedger.

## Prerequisites

- Node.js >= 18
- AgentLedger backend running at `http://localhost:3001`
- Anthropic API key

## Setup

```bash
cd demo
npm install
```

## Run

```bash
ANTHROPIC_API_KEY=sk-ant-... npm start
```

## What it does

1. Registers an agent in AgentLedger
2. Creates a session
3. Tracks `agent_lifecycle` — "Agent started"
4. Sends a question to Claude (`claude-sonnet-4-6`)
5. Tracks `llm_call` with token counts, latency, and model info
6. Tracks `agent_lifecycle` — "Agent completed"
7. Flushes all events and shuts down

All events appear in the AgentLedger dashboard under the created session.
