/**
 * AgentLedger — OpenAI Agent Demo
 *
 * Run: npx ts-node demo/openai-agent.ts
 *
 * Requires:
 *   OPENAI_API_KEY=sk-...
 *   AGENTLEDGER_API_KEY=al_live_sk_...
 */

import { AgentLedger } from '@2434addy/agentledger-sdk';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AGENTLEDGER_API_KEY = process.env.AGENTLEDGER_API_KEY;

if (!OPENAI_API_KEY || !AGENTLEDGER_API_KEY) {
  console.error('Set OPENAI_API_KEY and AGENTLEDGER_API_KEY environment variables');
  process.exit(1);
}

async function main() {
  const ledger = new AgentLedger({
    apiKey: AGENTLEDGER_API_KEY!,
    baseUrl: process.env.AGENTLEDGER_BASE_URL || 'http://localhost:3001/api/v1',
    debug: true,
  });

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  // Register agent
  const agent = await ledger.createAgent({
    name: 'openai-demo-agent',
    description: 'Answers questions using GPT-4o',
    modelProvider: 'openai',
    modelId: 'gpt-4o',
  });
  console.log('Agent:', agent.id);

  // Start session
  const session = await ledger.createSession({ agentId: agent.id });
  console.log('Session:', session.id);

  // Track agent start
  ledger.track({
    agentId: agent.id,
    sessionId: session.id,
    category: 'agent_lifecycle',
    level: 'info',
    message: 'Agent started',
  });

  // Call OpenAI
  const question = 'What are the top 3 benefits of audit trails for AI agents?';
  console.log(`\nAsking: "${question}"\n`);

  const start = Date.now();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: question }],
  });
  const latencyMs = Date.now() - start;
  const answer = completion.choices[0]?.message?.content || '';

  console.log(`GPT-4o says:\n${answer}\n`);

  // Track the LLM call
  ledger.track({
    agentId: agent.id,
    sessionId: session.id,
    category: 'llm_call',
    level: 'info',
    message: `LLM call: ${question}`,
    tokensInput: completion.usage?.prompt_tokens,
    tokensOutput: completion.usage?.completion_tokens,
    latencyMs,
    payload: {
      model: completion.model,
      finishReason: completion.choices[0]?.finish_reason,
    },
  });

  // Track agent completed
  ledger.track({
    agentId: agent.id,
    sessionId: session.id,
    category: 'agent_lifecycle',
    level: 'info',
    message: 'Agent completed',
  });

  const events = await ledger.flush();
  console.log(`Flushed ${events.length} events`);
  await ledger.shutdown();
}

main().catch((err) => {
  console.error('Demo failed:', err);
  process.exit(1);
});
