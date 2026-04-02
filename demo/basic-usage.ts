/**
 * AgentLedger — Basic Usage Demo
 *
 * Run: npx ts-node demo/basic-usage.ts
 *
 * Requires:
 *   AGENTLEDGER_API_KEY=al_live_sk_...
 *   AGENTLEDGER_BASE_URL=http://localhost:3001/api/v1  (optional, defaults to localhost)
 */

import { AgentLedger } from '@2434addy/agentledger-sdk';

const apiKey = process.env.AGENTLEDGER_API_KEY;
if (!apiKey) {
  console.error('Set AGENTLEDGER_API_KEY environment variable');
  process.exit(1);
}

async function main() {
  const ledger = new AgentLedger({
    apiKey,
    baseUrl: process.env.AGENTLEDGER_BASE_URL || 'http://localhost:3001/api/v1',
    debug: true,
  });

  // 1. Register an agent
  const agent = await ledger.createAgent({
    name: 'basic-demo-agent',
    modelProvider: 'openai',
    modelId: 'gpt-4o',
  });
  console.log('Agent created:', agent.id);

  // 2. Start a session
  const session = await ledger.createSession({ agentId: agent.id });
  console.log('Session created:', session.id);

  // 3. Track some events
  ledger.track({
    agentId: agent.id,
    sessionId: session.id,
    category: 'agent_lifecycle',
    level: 'info',
    message: 'Agent started',
  });

  ledger.track({
    agentId: agent.id,
    sessionId: session.id,
    category: 'llm_call',
    level: 'info',
    message: 'Called GPT-4o',
    tokensInput: 150,
    tokensOutput: 420,
    latencyMs: 1200,
    costUsd: 0.0023,
  });

  ledger.track({
    agentId: agent.id,
    sessionId: session.id,
    category: 'agent_lifecycle',
    level: 'info',
    message: 'Agent completed',
  });

  // 4. Flush and shutdown
  const events = await ledger.flush();
  console.log(`Flushed ${events.length} events`);
  console.log('First event hash:', events[0]?.hash);

  await ledger.shutdown();
  console.log('Done!');
}

main().catch((err) => {
  console.error('Demo failed:', err);
  process.exit(1);
});
