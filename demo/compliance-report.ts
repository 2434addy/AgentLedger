/**
 * AgentLedger — Compliance Report Demo
 *
 * Run: npx ts-node demo/compliance-report.ts
 *
 * Generates a compliance report (EU AI Act, SOC 2, or ISO 42001)
 * and displays the results.
 *
 * Requires:
 *   AGENTLEDGER_API_KEY=al_live_sk_...
 */

const apiKey = process.env.AGENTLEDGER_API_KEY;
if (!apiKey) {
  console.error('Set AGENTLEDGER_API_KEY environment variable');
  process.exit(1);
}

async function apiCall(path: string, method = 'GET', body?: Record<string, unknown>) {
  const baseUrl = process.env.AGENTLEDGER_BASE_URL || 'http://localhost:3001/api/v1';
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey!,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  // 1. Check current compliance status
  console.log('Checking compliance status...\n');
  const checks = await apiCall('/compliance/checks');
  console.log('Compliance checks:', JSON.stringify(checks, null, 2));

  // 2. Generate EU AI Act report
  console.log('\n--- Generating EU AI Act Report ---\n');
  const euReport = await apiCall('/compliance/reports/generate', 'POST', {
    framework: 'eu-ai-act',
  });
  console.log('EU AI Act Report:');
  console.log(JSON.stringify(euReport, null, 2));

  // 3. Generate SOC 2 report
  console.log('\n--- Generating SOC 2 Type II Report ---\n');
  const soc2Report = await apiCall('/compliance/reports/generate', 'POST', {
    framework: 'soc2',
  });
  console.log('SOC 2 Report:');
  console.log(JSON.stringify(soc2Report, null, 2));

  // 4. Generate ISO 42001 report
  console.log('\n--- Generating ISO 42001 Report ---\n');
  const isoReport = await apiCall('/compliance/reports/generate', 'POST', {
    framework: 'iso42001',
  });
  console.log('ISO 42001 Report:');
  console.log(JSON.stringify(isoReport, null, 2));

  // 5. Get summary
  console.log('\n--- Compliance Summary ---\n');
  const summary = await apiCall('/compliance/report');
  console.log(JSON.stringify(summary, null, 2));

  console.log('\nDone! Reports are also viewable in the dashboard → Compliance tab.');
}

main().catch((err) => {
  console.error('Demo failed:', err);
  process.exit(1);
});
