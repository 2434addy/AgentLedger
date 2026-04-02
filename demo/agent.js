const { AgentLedger } = require('@2434addy/agentledger-sdk');
const Anthropic = require('@anthropic-ai/sdk');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY environment variable');
  process.exit(1);
}

const AGENTLEDGER_API_KEY = process.env.AGENTLEDGER_API_KEY;
if (!AGENTLEDGER_API_KEY) {
  console.error('Missing AGENTLEDGER_API_KEY environment variable');
  process.exit(1);
}

const al = new AgentLedger({
  apiKey: AGENTLEDGER_API_KEY,
  baseUrl: process.env.AGENTLEDGER_BASE_URL || 'http://localhost:3001/api/v1',
  debug: true,
});

const anthropic = new Anthropic.default({ apiKey: ANTHROPIC_API_KEY });

async function main() {
  // 1. Register agent
  console.log('Creating agent...');
  const agent = await al.createAgent({
    name: 'Demo Q&A Agent',
    description: 'Answers questions using Claude API',
    modelProvider: 'anthropic',
    modelId: 'claude-sonnet-4-6',
  });
  console.log(`Agent created: ${agent.id}`);

  // 2. Start session
  console.log('Creating session...');
  const session = await al.createSession({ agentId: agent.id });
  console.log(`Session created: ${session.id}`);

  // 3. Track agent started
  al.track({
    agentId: agent.id,
    sessionId: session.id,
    category: 'agent_lifecycle',
    level: 'info',
    message: 'Agent started',
  });
  console.log('Tracked: Agent started');

  // 4. Call Claude API
  const question = 'What are the top 3 benefits of observability for AI agents?';
  console.log(`\nAsking Claude: "${question}"\n`);

  const startMs = Date.now();
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: question }],
  });
  const latencyMs = Date.now() - startMs;

  const answer = response.content[0].text;
  console.log(`Claude says:\n${answer}\n`);

  // 5. Track LLM call
  al.track({
    agentId: agent.id,
    sessionId: session.id,
    category: 'llm_call',
    level: 'info',
    message: `LLM call: ${question}`,
    tokensInput: response.usage.input_tokens,
    tokensOutput: response.usage.output_tokens,
    latencyMs,
    payload: {
      model: response.model,
      stopReason: response.stop_reason,
    },
  });
  console.log(`Tracked: llm_call (${response.usage.input_tokens} in / ${response.usage.output_tokens} out, ${latencyMs}ms)`);

  // 6. Track agent completed
  al.track({
    agentId: agent.id,
    sessionId: session.id,
    category: 'agent_lifecycle',
    level: 'info',
    message: 'Agent completed',
  });
  console.log('Tracked: Agent completed');

  // 7. Flush and shutdown
  const flushed = await al.flush();
  console.log(`\nFlushed ${flushed.length} events`);
  await al.shutdown();
  console.log('Shutdown complete');
}

main().catch((err) => {
  console.error('Demo failed:', err);
  process.exit(1);
});
