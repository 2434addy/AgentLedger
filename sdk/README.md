# @2434addy/agentledger-sdk

TypeScript SDK for [AgentLedger](https://github.com/2434addy/AgentLedger) — tamper-proof audit trails for AI agents.

[![npm version](https://img.shields.io/npm/v/@2434addy/agentledger-sdk?style=flat-square)](https://www.npmjs.com/package/@2434addy/agentledger-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](../LICENSE)

## Installation

```bash
npm install @2434addy/agentledger-sdk
```

## Quick Start

```typescript
import { AgentLedger } from '@2434addy/agentledger-sdk'

const ledger = new AgentLedger({ apiKey: 'al_live_sk_...' })
const agent = await ledger.createAgent({ name: 'my-bot', modelProvider: 'openai', modelId: 'gpt-4o' })
const session = await ledger.createSession({ agentId: agent.id })
ledger.track({ agentId: agent.id, sessionId: session.id, category: 'llm_call', level: 'info', message: 'Called GPT-4o' })
await ledger.flush()
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | *required* | Your AgentLedger API key |
| `baseUrl` | `string` | `https://api.agentledger.io/api/v1` | API base URL |
| `timeout` | `number` | `5000` | Request timeout in ms |
| `flushInterval` | `number` | `5000` | Auto-flush interval in ms (0 to disable) |
| `maxBatchSize` | `number` | `50` | Max events per batch before auto-flush |
| `debug` | `boolean` | `false` | Log retries and warnings to console |

## API Reference

### `new AgentLedger(config)`

Create a new client. Starts an auto-flush timer that sends queued events at `flushInterval`.

```typescript
const ledger = new AgentLedger({
  apiKey: 'al_live_sk_...',
  baseUrl: 'http://localhost:3001/api/v1',
  debug: true,
})
```

### `ledger.createAgent(input): Promise<Agent>`

Register an agent with AgentLedger.

```typescript
const agent = await ledger.createAgent({
  name: 'support-bot',
  description: 'Handles customer support tickets',  // optional
  modelProvider: 'anthropic',
  modelId: 'claude-sonnet-4-6',
  metadata: { team: 'support' },  // optional
})
```

### `ledger.createSession(input): Promise<Session>`

Start a new tracking session for an agent.

```typescript
const session = await ledger.createSession({
  agentId: agent.id,
  metadata: { userId: 'user_123' },  // optional
})
```

### `ledger.track(event): void`

Queue an event for batched sending. Auto-flushes when the batch reaches `maxBatchSize`.

```typescript
ledger.track({
  agentId: agent.id,
  sessionId: session.id,        // optional
  category: 'llm_call',         // required — see Event Categories
  level: 'info',                // required — see Event Levels
  message: 'Generated response',// required
  payload: { model: 'gpt-4o' },// optional — arbitrary JSON
  tokensInput: 150,             // optional
  tokensOutput: 420,            // optional
  costUsd: 0.0023,             // optional
  latencyMs: 1200,             // optional
})
```

### `ledger.flush(): Promise<TrackedEvent[]>`

Send all queued events immediately. Returns the created events with their SHA-256 hashes.

```typescript
const events = await ledger.flush()
console.log(events[0].hash) // SHA-256 hash of the event
```

### `ledger.shutdown(): Promise<void>`

Stop the auto-flush timer and send remaining events. Call before process exit.

```typescript
process.on('beforeExit', () => ledger.shutdown())
```

## Event Categories

| Category | Description |
|----------|-------------|
| `agent_lifecycle` | Agent start/stop/error events |
| `llm_call` | LLM API calls with token counts |
| `tool_invocation` | Tool/function calls |
| `user_action` | User interactions |
| `system` | System-level events |
| `security` | Auth, access control events |
| `guardrail` | Safety/guardrail triggers |

## Event Levels

`debug` | `info` | `warn` | `error` | `fatal`

## Framework Examples

### OpenAI

```typescript
import { AgentLedger } from '@2434addy/agentledger-sdk'
import OpenAI from 'openai'

const ledger = new AgentLedger({ apiKey: 'al_live_sk_...' })
const openai = new OpenAI()

const agent = await ledger.createAgent({ name: 'gpt-agent', modelProvider: 'openai', modelId: 'gpt-4o' })
const session = await ledger.createSession({ agentId: agent.id })

const start = Date.now()
const res = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
})

ledger.track({
  agentId: agent.id,
  sessionId: session.id,
  category: 'llm_call',
  level: 'info',
  message: 'GPT-4o call',
  tokensInput: res.usage?.prompt_tokens,
  tokensOutput: res.usage?.completion_tokens,
  latencyMs: Date.now() - start,
})

await ledger.shutdown()
```

### Anthropic (Claude)

```typescript
import { AgentLedger } from '@2434addy/agentledger-sdk'
import Anthropic from '@anthropic-ai/sdk'

const ledger = new AgentLedger({ apiKey: 'al_live_sk_...' })
const anthropic = new Anthropic()

const agent = await ledger.createAgent({ name: 'claude-agent', modelProvider: 'anthropic', modelId: 'claude-sonnet-4-6' })
const session = await ledger.createSession({ agentId: agent.id })

const start = Date.now()
const res = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello' }],
})

ledger.track({
  agentId: agent.id,
  sessionId: session.id,
  category: 'llm_call',
  level: 'info',
  message: 'Claude call',
  tokensInput: res.usage.input_tokens,
  tokensOutput: res.usage.output_tokens,
  latencyMs: Date.now() - start,
})

await ledger.shutdown()
```

### LangChain

```typescript
import { AgentLedger } from '@2434addy/agentledger-sdk'
// Use AgentLedger alongside your LangChain agent
// Track each step by calling ledger.track() in your chain callbacks

const ledger = new AgentLedger({ apiKey: 'al_live_sk_...' })
const agent = await ledger.createAgent({ name: 'langchain-agent', modelProvider: 'openai', modelId: 'gpt-4o' })
const session = await ledger.createSession({ agentId: agent.id })

// In your LangChain callback handler:
ledger.track({
  agentId: agent.id,
  sessionId: session.id,
  category: 'tool_invocation',
  level: 'info',
  message: 'LangChain tool call: search',
  payload: { tool: 'web_search', input: 'latest AI news' },
})

await ledger.shutdown()
```

## Error Handling

The SDK exports typed errors for common failure modes:

```typescript
import { AgentLedger, AuthenticationError, NetworkError, AgentLedgerError } from '@2434addy/agentledger-sdk'

try {
  await ledger.flush()
} catch (err) {
  if (err instanceof AuthenticationError) {
    // Invalid or expired API key
  } else if (err instanceof NetworkError) {
    // Server unreachable or HTTP error
  } else if (err instanceof AgentLedgerError) {
    // Other SDK error
  }
}
```

Failed flushes automatically retry up to 3 times with exponential backoff. Events are re-queued on failure so no data is lost.

## TypeScript Types

All types are exported for use in your application:

```typescript
import type {
  AgentLedgerConfig,
  CreateAgentInput,
  Agent,
  CreateSessionInput,
  Session,
  TrackEventInput,
  TrackedEvent,
  EventCategory,
  EventLevel,
} from '@2434addy/agentledger-sdk'
```

## License

MIT
