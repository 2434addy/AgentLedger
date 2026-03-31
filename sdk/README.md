# @agentledger/sdk

TypeScript SDK for AgentLedger — track, audit, and monitor your AI agents.

## Install

```bash
npm install @agentledger/sdk
```

## Quick Start

```typescript
import { AgentLedger } from '@agentledger/sdk'

const al = new AgentLedger({ apiKey: 'al_live_sk_...' })

// Create an agent
const agent = await al.createAgent({
  name: 'My Assistant',
  description: 'Customer support bot',
  modelProvider: 'anthropic',
  modelId: 'claude-sonnet-4-6',
})

// Create a session
const session = await al.createSession({ agentId: agent.id })

// Track events (batched automatically)
al.track({
  agentId: agent.id,
  sessionId: session.id,
  category: 'llm_call',
  level: 'info',
  message: 'Called Claude API',
  payload: { prompt: 'Hello world' },
})

// Send all queued events now
await al.flush()
```

## API

### `new AgentLedger(config)`

| Option          | Type     | Default                                    | Description              |
| --------------- | -------- | ------------------------------------------ | ------------------------ |
| `apiKey`        | `string` | *required*                                 | Your API key             |
| `baseUrl`       | `string` | `https://api.agentledger.io/api/v1`        | API base URL             |
| `timeout`       | `number` | `5000`                                     | Request timeout (ms)     |
| `flushInterval` | `number` | `5000`                                     | Auto-flush interval (ms) |
| `maxBatchSize`  | `number` | `50`                                       | Max events per batch     |
| `debug`         | `boolean`| `false`                                    | Log warnings to console  |

### `al.createAgent(input)`

Create a registered agent.

```typescript
const agent = await al.createAgent({
  name: 'Email Agent',
  modelProvider: 'openai',
  modelId: 'gpt-4o',
})
```

### `al.createSession(input)`

Start a new session for an agent.

```typescript
const session = await al.createSession({ agentId: agent.id })
```

### `al.track(event)`

Queue an event for batched sending. Fires immediately when the batch reaches `maxBatchSize`.

```typescript
al.track({
  agentId: agent.id,
  sessionId: session.id,
  category: 'llm_call',
  level: 'info',
  message: 'Generated response',
  payload: { model: 'claude-sonnet-4-6' },
  tokensInput: 150,
  tokensOutput: 420,
  latencyMs: 1200,
})
```

### `al.flush()`

Send all queued events immediately. Returns the created events.

```typescript
const events = await al.flush()
```

### `al.shutdown()`

Stop the auto-flush timer and send remaining events. Call before process exit.

```typescript
process.on('beforeExit', () => al.shutdown())
```

## Event Categories

`agent_lifecycle` | `llm_call` | `tool_invocation` | `user_action` | `system` | `security` | `guardrail`

## Event Levels

`debug` | `info` | `warn` | `error` | `fatal`

## License

MIT
