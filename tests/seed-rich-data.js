/**
 * Seed rich demo data for frontend testing
 * Creates a test account with agents, sessions, and 60+ events spread over 7 days
 */
const http = require('http');

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:3001');
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, hostname: url.hostname, port: url.port, path: url.pathname + url.search, headers };
    const r = http.request(opts, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, raw: chunks }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function main() {
  // Always create a fresh account for clean data
  let token;
  const email = 'aarti@agentledger.io';
  const password = 'SecurePass123!@#';

  // Try login first
  const login = await req('POST', '/api/v1/auth/login', { email, password });
  if (login.body && login.body.accessToken) {
    token = login.body.accessToken;
    console.log('Logged in:', email);
  } else {
    // Create new account
    const signup = await req('POST', '/api/v1/auth/signup', {
      email,
      password,
      displayName: 'Aarti Sharma'
    });
    if (signup.status !== 201) {
      console.error('Signup failed:', signup.status, JSON.stringify(signup.body || signup.raw));
      process.exit(1);
    }
    token = signup.body.accessToken;
    console.log('Created account:', email);
  }

  // Update org name
  await req('PATCH', '/api/v1/organisations/me', { name: 'AgentLedger HQ' }, token);
  console.log('Updated org name');

  // Check existing agents
  const existingAgents = await req('GET', '/api/v1/agents', null, token);
  const existingAgentNames = (existingAgents.body || []).map(a => a.name);

  // Create agents (skip if they already exist)
  const agentDefs = [
    { name: 'CodeReview-GPT', description: 'Automated code review agent analyzing PRs for security, performance and style issues', modelProvider: 'openai', modelId: 'gpt-4-turbo' },
    { name: 'DataPipeline-Claude', description: 'ETL orchestrator handling data ingestion from S3, transformation, and loading into Snowflake', modelProvider: 'anthropic', modelId: 'claude-sonnet-4-20250514' },
    { name: 'SupportBot-Gemini', description: 'Multilingual customer support chatbot with knowledge base integration', modelProvider: 'google', modelId: 'gemini-1.5-pro' },
  ];

  const agentIds = [];
  for (const def of agentDefs) {
    if (existingAgentNames.includes(def.name)) {
      const existing = existingAgents.body.find(a => a.name === def.name);
      agentIds.push(existing.id);
      console.log('Agent exists:', def.name);
    } else {
      const r = await req('POST', '/api/v1/agents', def, token);
      agentIds.push(r.body.id);
      console.log('Created agent:', def.name);
    }
  }

  // Create 5 sessions
  const sessionDefs = [
    { agentId: agentIds[0], metadata: { task: 'Code review for PR #1234 - Auth refactor', branch: 'feature/auth-refactor', repository: 'AgentLedger/backend' } },
    { agentId: agentIds[0], metadata: { task: 'Security audit of API endpoints', branch: 'main', repository: 'AgentLedger/backend' } },
    { agentId: agentIds[1], metadata: { task: 'Daily ETL pipeline - Customer data ingestion', source: 'S3://data-lake/raw/', destination: 'Snowflake/analytics' } },
    { agentId: agentIds[1], metadata: { task: 'Q1 2026 Data Quality Audit', source: 'Snowflake/production', report: true } },
    { agentId: agentIds[2], metadata: { task: 'Live chat support - Acme Corp ticket #8821', channel: 'live-chat', language: 'en', priority: 'high' } },
  ];

  const sessionIds = [];
  for (const def of sessionDefs) {
    const r = await req('POST', '/api/v1/sessions', def, token);
    sessionIds.push(r.body.id);
  }
  console.log('Created', sessionIds.length, 'sessions');

  // Build all events
  const allEvents = [];

  // Session 0: Code review completed
  const s0Events = [
    { cat: 'agent_lifecycle', lvl: 'info', msg: 'Agent initialized for code review on PR #1234 - Auth refactor branch', ti: 0, to: 0, cost: 0, lat: 45, sb: { status: 'idle', memory: { context: [] } }, sa: { status: 'initialized', task: 'code-review', pr: '#1234' } },
    { cat: 'tool_invocation', lvl: 'info', msg: 'Fetched PR diff from GitHub API - 342 lines changed across 8 files', ti: 0, to: 0, cost: 0, lat: 820, sb: { status: 'initialized' }, sa: { status: 'analyzing', filesLoaded: 8, linesChanged: 342 } },
    { cat: 'llm_call', lvl: 'info', msg: 'Analyzed code changes - found 3 issues: 1 SQL injection risk, 1 N+1 query, 1 style issue', ti: 4200, to: 1850, cost: 0.0182, lat: 3200 },
    { cat: 'tool_invocation', lvl: 'info', msg: 'Posted 3 inline review comments with fix suggestions on GitHub PR #1234', ti: 0, to: 0, cost: 0, lat: 650 },
    { cat: 'guardrail', lvl: 'info', msg: 'Review quality check passed - all suggestions include rationale and code examples', ti: 0, to: 0, cost: 0, lat: 25 },
    { cat: 'agent_lifecycle', lvl: 'info', msg: 'Code review completed successfully - 3 issues found, 3 suggestions posted', ti: 0, to: 0, cost: 0, lat: 12 },
  ];

  // Session 1: Security audit
  const s1Events = [
    { cat: 'agent_lifecycle', lvl: 'info', msg: 'Security audit agent started - scanning 28 API endpoints', ti: 0, to: 0, cost: 0, lat: 55 },
    { cat: 'tool_invocation', lvl: 'info', msg: 'Scanned 28 endpoints - mapped authentication and authorization patterns', ti: 0, to: 0, cost: 0, lat: 2100 },
    { cat: 'llm_call', lvl: 'info', msg: 'OWASP Top 10 compliance analysis in progress - checking injection, auth, XSS vectors', ti: 5800, to: 3200, cost: 0.0425, lat: 5500 },
    { cat: 'security', lvl: 'warn', msg: 'Potential IDOR vulnerability in GET /api/v1/events/:id - missing org scope on nested resources', ti: 0, to: 0, cost: 0, lat: 15 },
    { cat: 'security', lvl: 'warn', msg: 'Rate limiting too high for auth endpoints - recommend 10 req/min for /auth/login', ti: 0, to: 0, cost: 0, lat: 10 },
    { cat: 'llm_call', lvl: 'info', msg: 'Generated remediation report with severity rankings and fix recommendations', ti: 2800, to: 1900, cost: 0.0195, lat: 3800 },
    { cat: 'guardrail', lvl: 'info', msg: 'Audit report sanitized - no internal credentials or secrets in output', ti: 0, to: 0, cost: 0, lat: 30 },
  ];

  // Session 2: ETL success
  const s2Events = [
    { cat: 'agent_lifecycle', lvl: 'info', msg: 'ETL pipeline started - source: S3, destination: Snowflake', ti: 0, to: 0, cost: 0, lat: 55, sb: { status: 'idle', pipeline: null }, sa: { status: 'running', pipeline: 'daily-ingestion', stage: 'extract' } },
    { cat: 'tool_invocation', lvl: 'info', msg: 'Extracted 2.4GB raw data from S3 - 142 Parquet files processed', ti: 0, to: 0, cost: 0, lat: 12500, sb: { stage: 'extract' }, sa: { stage: 'transform', filesProcessed: 142, dataSize: '2.4GB' } },
    { cat: 'llm_call', lvl: 'info', msg: 'Generated SQL transformations - 8 tables, 45 columns mapped', ti: 5200, to: 3100, cost: 0.0342, lat: 5800 },
    { cat: 'tool_invocation', lvl: 'info', msg: 'Loaded data into Snowflake - 1.8M rows inserted across 8 tables', ti: 0, to: 0, cost: 0, lat: 8200, sa: { stage: 'load-complete', rowsInserted: 1800000 } },
    { cat: 'guardrail', lvl: 'warn', msg: 'Data quality: 0.3% rows had missing required fields - logged for review', ti: 0, to: 0, cost: 0, lat: 320 },
    { cat: 'system', lvl: 'info', msg: 'Pipeline metrics: throughput 42K rows/sec, avg transform latency 145ms', ti: 0, to: 0, cost: 0, lat: 50 },
    { cat: 'agent_lifecycle', lvl: 'info', msg: 'ETL pipeline completed successfully - total time: 27.2s', ti: 0, to: 0, cost: 0, lat: 27200 },
  ];

  // Session 3: Failed audit
  const s3Events = [
    { cat: 'agent_lifecycle', lvl: 'info', msg: 'Data quality audit started for Q1 2026 dataset', ti: 0, to: 0, cost: 0, lat: 42 },
    { cat: 'llm_call', lvl: 'info', msg: 'Analyzing schema drift across 12 source tables', ti: 6800, to: 4200, cost: 0.0485, lat: 7200 },
    { cat: 'llm_call', lvl: 'error', msg: 'Schema validation failed: 3 breaking changes in customer_events table', ti: 2100, to: 800, cost: 0.0112, lat: 3100 },
    { cat: 'security', lvl: 'error', msg: 'Data integrity alert: 847 records failed checksum validation', ti: 0, to: 0, cost: 0, lat: 200 },
    { cat: 'agent_lifecycle', lvl: 'fatal', msg: 'Audit aborted - critical schema incompatibility - manual intervention required', ti: 0, to: 0, cost: 0, lat: 8 },
  ];

  // Session 4: Support bot
  const s4Events = [
    { cat: 'agent_lifecycle', lvl: 'info', msg: 'Support bot activated for ticket #8821 - Acme Corp, priority: high', ti: 0, to: 0, cost: 0, lat: 32, sb: { status: 'idle' }, sa: { status: 'active', ticket: '#8821', customer: 'Acme Corp' } },
    { cat: 'user_action', lvl: 'info', msg: 'Customer: Our API integration stopped working after your latest update - getting 401 errors', ti: 0, to: 0, cost: 0, lat: 5 },
    { cat: 'tool_invocation', lvl: 'info', msg: 'Searched knowledge base - found 3 articles about API v2 migration', ti: 0, to: 0, cost: 0, lat: 450 },
    { cat: 'llm_call', lvl: 'info', msg: 'Generated troubleshooting response with step-by-step migration guide', ti: 2800, to: 1200, cost: 0.0095, lat: 1800 },
    { cat: 'user_action', lvl: 'info', msg: 'Customer: Thanks, the migration guide fixed our issue. Switching to v2 now', ti: 0, to: 0, cost: 0, lat: 3 },
    { cat: 'llm_call', lvl: 'info', msg: 'Generated follow-up with proactive API monitoring setup recommendations', ti: 1500, to: 800, cost: 0.0068, lat: 1200 },
    { cat: 'system', lvl: 'info', msg: 'Ticket #8821 resolved - resolution time: 4m 12s, satisfaction: 4.8/5.0', ti: 0, to: 0, cost: 0, lat: 180 },
    { cat: 'guardrail', lvl: 'info', msg: 'Response quality check passed - no PII leaked, tone professional', ti: 0, to: 0, cost: 0, lat: 25 },
  ];

  const sessionEvents = [s0Events, s1Events, s2Events, s3Events, s4Events];

  // Add templated events
  for (let s = 0; s < sessionIds.length; s++) {
    const events = sessionEvents[s];
    for (let e = 0; e < events.length; e++) {
      const d = new Date();
      d.setDate(d.getDate() - s);
      d.setHours(9 + e);
      d.setMinutes(Math.floor(Math.random() * 60));

      allEvents.push({
        sessionId: sessionIds[s],
        agentId: sessionDefs[s].agentId,
        category: events[e].cat,
        level: events[e].lvl,
        message: events[e].msg,
        tokensInput: events[e].ti,
        tokensOutput: events[e].to,
        costUsd: events[e].cost,
        latencyMs: events[e].lat,
        occurredAt: d.toISOString(),
        ...(events[e].sb ? { stateBefore: events[e].sb } : {}),
        ...(events[e].sa ? { stateAfter: events[e].sa } : {}),
      });
    }
  }

  // Add extra events spread over 7 days for chart variety
  const extraMsgs = [
    'Agent completed batch processing of 50 customer tickets',
    'LLM call: Translated technical documentation to Spanish',
    'Tool invocation: Jira PROJ-1234 updated with analysis results',
    'Data pipeline checkpoint: 89% of records validated',
    'Agent recovered from transient API timeout - retry succeeded',
    'LLM call: Generated unit test suite - 12 tests created',
    'Security alert: Rate limit threshold approached (85%)',
    'Compliance: All event hashes verified - no tampering',
    'Tool invocation: Slack notification sent to #engineering',
    'LLM call: Summarized 3-hour transcript into 5 action items',
    'System: DB connection pool optimized - latency reduced 23%',
    'User feedback processed: Positive sentiment (4.8/5.0)',
    'Agent lifecycle: Graceful shutdown for maintenance',
    'Guardrail: PII detection scan completed - outputs clean',
    'LLM call: Generated deployment checklist - 14 steps',
  ];
  const cats = ['agent_lifecycle', 'llm_call', 'tool_invocation', 'user_action', 'system', 'security', 'guardrail'];
  const lvls = ['debug', 'info', 'warn', 'error'];

  for (let day = 1; day < 7; day++) {
    const count = 5 + Math.floor(Math.random() * 6);
    for (let j = 0; j < count; j++) {
      const d = new Date();
      d.setDate(d.getDate() - day);
      d.setHours(8 + Math.floor(Math.random() * 10));
      d.setMinutes(Math.floor(Math.random() * 60));

      const cat = cats[Math.floor(Math.random() * cats.length)];
      const lvl = Math.random() < 0.65 ? 'info' : (Math.random() < 0.5 ? 'warn' : lvls[Math.floor(Math.random() * lvls.length)]);
      const isLlm = cat === 'llm_call';

      allEvents.push({
        sessionId: sessionIds[Math.floor(Math.random() * sessionIds.length)],
        agentId: agentIds[Math.floor(Math.random() * agentIds.length)],
        category: cat,
        level: lvl,
        message: extraMsgs[Math.floor(Math.random() * extraMsgs.length)],
        tokensInput: isLlm ? 500 + Math.floor(Math.random() * 5000) : 0,
        tokensOutput: isLlm ? 200 + Math.floor(Math.random() * 3000) : 0,
        costUsd: isLlm ? parseFloat((Math.random() * 0.06).toFixed(6)) : 0,
        latencyMs: 50 + Math.floor(Math.random() * 6000),
        occurredAt: d.toISOString(),
      });
    }
  }

  console.log('Inserting', allEvents.length, 'events...');
  const result = await req('POST', '/api/v1/events', { events: allEvents }, token);
  console.log('Status:', result.status, '- Created:', Array.isArray(result.body) ? result.body.length : 'error');

  // Update session statuses
  await req('PATCH', '/api/v1/sessions/' + sessionIds[0], { status: 'completed', endedAt: new Date().toISOString() }, token);
  await req('PATCH', '/api/v1/sessions/' + sessionIds[1], { status: 'completed', endedAt: new Date().toISOString() }, token);
  await req('PATCH', '/api/v1/sessions/' + sessionIds[2], { status: 'completed', endedAt: new Date().toISOString() }, token);
  await req('PATCH', '/api/v1/sessions/' + sessionIds[3], { status: 'failed', endedAt: new Date().toISOString() }, token);
  console.log('Sessions updated. Done!');
  console.log('\n  Login credentials:');
  console.log('  Email: aarti@agentledger.io');
  console.log('  Password: SecurePass123!@#\n');
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
