/**
 * AgentLedger — Human-in-Loop Approval Flow Demo
 *
 * Run: npx ts-node demo/approval-flow.ts
 *
 * Demonstrates how to request human approval before executing
 * a high-risk agent action. The approval appears in the dashboard
 * under the Approvals tab.
 *
 * Requires:
 *   AGENTLEDGER_API_KEY=al_live_sk_...
 */

import { AgentLedger } from '@2434addy/agentledger-sdk';

const apiKey = process.env.AGENTLEDGER_API_KEY;
if (!apiKey) {
  console.error('Set AGENTLEDGER_API_KEY environment variable');
  process.exit(1);
}

// Direct API call for approval endpoints (not yet in SDK)
async function requestApproval(baseUrl: string, apiKeyHeader: string, body: Record<string, unknown>) {
  const res = await fetch(`${baseUrl}/approvals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKeyHeader },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Approval request failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function getPendingApprovals(baseUrl: string, apiKeyHeader: string) {
  const res = await fetch(`${baseUrl}/approvals/pending`, {
    headers: { 'x-api-key': apiKeyHeader },
  });
  if (!res.ok) throw new Error(`Failed to fetch approvals: ${res.status}`);
  return res.json();
}

async function main() {
  const baseUrl = process.env.AGENTLEDGER_BASE_URL || 'http://localhost:3001/api/v1';

  const ledger = new AgentLedger({
    apiKey: apiKey!,
    baseUrl,
    debug: true,
  });

  // Register agent
  const agent = await ledger.createAgent({
    name: 'approval-demo-agent',
    description: 'Demonstrates human-in-loop approval flow',
    modelProvider: 'openai',
    modelId: 'gpt-4o',
  });
  console.log('Agent:', agent.id);

  // Start session
  const session = await ledger.createSession({ agentId: agent.id });
  console.log('Session:', session.id);

  // Simulate: agent wants to send an email (high-risk action)
  console.log('\nAgent wants to send email to customer — requesting approval...');

  ledger.track({
    agentId: agent.id,
    sessionId: session.id,
    category: 'tool_invocation',
    level: 'warn',
    message: 'Requesting approval: send_email to customer@example.com',
    payload: { tool: 'send_email', to: 'customer@example.com', subject: 'Your order has been refunded' },
  });

  // Request approval via API
  const approval = await requestApproval(baseUrl, apiKey!, {
    agentId: agent.id,
    sessionId: session.id,
    action: 'send_email',
    payload: {
      to: 'customer@example.com',
      subject: 'Your order has been refunded',
      body: 'We have processed your refund of $149.99.',
    },
    reason: 'Agent wants to send a refund email to a customer. Requires human review.',
  });
  console.log('Approval requested:', approval.id, '— Status:', approval.status);

  // List pending approvals
  const pending = await getPendingApprovals(baseUrl, apiKey!);
  console.log(`\nPending approvals: ${Array.isArray(pending) ? pending.length : pending.data?.length || 0}`);
  console.log('Go to the AgentLedger dashboard → Approvals tab to approve or reject.\n');

  await ledger.flush();
  await ledger.shutdown();
  console.log('Done! Check the dashboard for the pending approval.');
}

main().catch((err) => {
  console.error('Demo failed:', err);
  process.exit(1);
});
