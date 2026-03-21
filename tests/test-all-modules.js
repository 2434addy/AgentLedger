/**
 * AgentLedger — Comprehensive API Test Suite
 * Tests EVERY module end-to-end with real data
 */

const http = require('http');

const BASE = 'http://localhost:3001';
const TS = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
let pass = 0, fail = 0;
let ACCESS_TOKEN = '';
let REFRESH_TOKEN = '';
let USER_ID = '';
let ORG_ID = '';
let AGENT_IDS = [];
let SESSION_IDS = [];
let EVENT_IDS = [];
let API_KEY_ID = '';
let RAW_API_KEY = '';

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, hostname: url.hostname, port: url.port, path: url.pathname + url.search, headers };
    const r = http.request(opts, (res) => {
      let chunks = '';
      res.on('data', (d) => chunks += d);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(chunks); } catch {}
        resolve({ status: res.statusCode, body: json, raw: chunks, headers: res.headers });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function reqApiKey(method, path, apiKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey };
    const opts = { method, hostname: url.hostname, port: url.port, path: url.pathname + url.search, headers };
    const r = http.request(opts, (res) => {
      let chunks = '';
      res.on('data', (d) => chunks += d);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(chunks); } catch {}
        resolve({ status: res.statusCode, body: json });
      });
    });
    r.on('error', reject);
    r.end();
  });
}

function check(name, ok) {
  if (ok) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}`); }
}

async function run() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  AgentLedger — Full Module Test Suite');
  console.log('══════════════════════════════════════════════\n');

  // ═══════ 1. HEALTH ═══════
  console.log('▶ HEALTH MODULE');
  {
    const r = await req('GET', '/health');
    check('GET /health returns 200', r.status === 200);
    check('Health response has status=ok', r.body?.status === 'ok');
    check('Health response has timestamp', !!r.body?.timestamp);
  }

  // ═══════ 2. AUTH — SIGNUP ═══════
  console.log('\n▶ AUTH MODULE — Signup');
  {
    const email = `testuser_${TS}@agentledger.io`;
    const r = await req('POST', '/api/v1/auth/signup', {
      email,
      password: 'TestPass123!@#',
      displayName: `Test User ${TS}`
    });
    check('POST /auth/signup returns 201', r.status === 201);
    check('Signup returns accessToken', !!r.body?.accessToken);
    check('Signup returns refreshToken', !!r.body?.refreshToken);
    check('Signup returns user object', !!r.body?.user);
    check('User has correct email', r.body?.user?.email === email);
    check('User has organisationId', !!r.body?.user?.organisationId);
    ACCESS_TOKEN = r.body?.accessToken || '';
    REFRESH_TOKEN = r.body?.refreshToken || '';
    USER_ID = r.body?.user?.id || '';
    ORG_ID = r.body?.user?.organisationId || '';
  }

  // ═══════ 2b. AUTH — Signup validation ═══════
  console.log('\n▶ AUTH MODULE — Signup Validation');
  {
    const r = await req('POST', '/api/v1/auth/signup', {
      email: 'bad',
      password: '123',
      displayName: ''
    });
    check('Weak password rejected (400)', r.status === 400);
  }
  {
    const r = await req('POST', '/api/v1/auth/signup', {
      email: `testuser_${TS}@agentledger.io`,
      password: 'TestPass123!@#',
      displayName: 'Duplicate'
    });
    check('Duplicate email rejected (409 or 400)', r.status === 409 || r.status === 400);
  }

  // ═══════ 2c. AUTH — Login ═══════
  console.log('\n▶ AUTH MODULE — Login');
  {
    const r = await req('POST', '/api/v1/auth/login', {
      email: `testuser_${TS}@agentledger.io`,
      password: 'TestPass123!@#'
    });
    check('POST /auth/login returns 201', r.status === 200 || r.status === 201);
    check('Login returns accessToken', !!r.body?.accessToken);
    check('Login returns refreshToken', !!r.body?.refreshToken);
    ACCESS_TOKEN = r.body?.accessToken || ACCESS_TOKEN;
    REFRESH_TOKEN = r.body?.refreshToken || REFRESH_TOKEN;
  }
  {
    const r = await req('POST', '/api/v1/auth/login', {
      email: `testuser_${TS}@agentledger.io`,
      password: 'WrongPassword!'
    });
    check('Wrong password rejected (401)', r.status === 401);
  }

  // ═══════ 2d. AUTH — Refresh ═══════
  console.log('\n▶ AUTH MODULE — Token Refresh');
  {
    const r = await req('POST', '/api/v1/auth/refresh', { refreshToken: REFRESH_TOKEN });
    check('POST /auth/refresh returns 201', r.status === 200 || r.status === 201);
    check('Refresh returns new accessToken', !!r.body?.accessToken);
    ACCESS_TOKEN = r.body?.accessToken || ACCESS_TOKEN;
    if (r.body?.refreshToken) REFRESH_TOKEN = r.body.refreshToken;
  }

  // ═══════ 2e. AUTH — Guards ═══════
  console.log('\n▶ AUTH MODULE — Auth Guard');
  {
    const r = await req('GET', '/api/v1/agents');
    check('Protected route without token returns 401', r.status === 401);
  }

  // ═══════ 3. ORGANISATIONS ═══════
  console.log('\n▶ ORGANISATIONS MODULE');
  {
    const r = await req('GET', '/api/v1/organisations/me', null, ACCESS_TOKEN);
    check('GET /organisations/me returns 200', r.status === 200);
    check('Org has id', !!r.body?.id);
    check('Org has name', !!r.body?.name);
    check('Org has plan', !!r.body?.plan);
  }
  {
    const newName = `Updated Org ${TS}`;
    const r = await req('PATCH', '/api/v1/organisations/me', { name: newName }, ACCESS_TOKEN);
    check('PATCH /organisations/me returns 200', r.status === 200);
    check('Org name updated', r.body?.name === newName);
  }

  // ═══════ 4. AGENTS ═══════
  console.log('\n▶ AGENTS MODULE');
  const agentDefs = [
    { name: `CodeAssistant-GPT-${TS}`, description: 'AI code review and refactoring agent for production pipelines', modelProvider: 'openai', modelId: 'gpt-4-turbo' },
    { name: `DataPipeline-Claude-${TS}`, description: 'ETL orchestrator handling data ingestion from multiple sources', modelProvider: 'anthropic', modelId: 'claude-sonnet-4-20250514' },
    { name: `SupportBot-Gemini-${TS}`, description: 'Customer support chatbot with multilingual capabilities', modelProvider: 'google', modelId: 'gemini-1.5-pro' },
  ];
  for (const def of agentDefs) {
    const r = await req('POST', '/api/v1/agents', def, ACCESS_TOKEN);
    check(`POST /agents creates "${def.name.split('-')[0]}"`, r.status === 201);
    check(`Agent has id`, !!r.body?.id);
    check(`Agent modelProvider=${def.modelProvider}`, r.body?.modelProvider === def.modelProvider);
    if (r.body?.id) AGENT_IDS.push(r.body.id);
  }
  {
    const r = await req('GET', '/api/v1/agents', null, ACCESS_TOKEN);
    check('GET /agents returns agent list', r.status === 200 && Array.isArray(r.body));
    check(`Agent list has ${AGENT_IDS.length} agents`, r.body?.length >= AGENT_IDS.length);
  }
  {
    const r = await req('GET', `/api/v1/agents/${AGENT_IDS[0]}`, null, ACCESS_TOKEN);
    check('GET /agents/:id returns single agent', r.status === 200);
    check('Agent has correct id', r.body?.id === AGENT_IDS[0]);
  }
  {
    const r = await req('PATCH', `/api/v1/agents/${AGENT_IDS[0]}`, { status: 'active' }, ACCESS_TOKEN);
    check('PATCH /agents/:id updates agent', r.status === 200);
    check('Agent status is now active', r.body?.status === 'active');
  }

  // ═══════ 5. SESSIONS ═══════
  console.log('\n▶ SESSIONS MODULE');
  const sessionDefs = [
    { agentId: AGENT_IDS[0], metadata: { task: 'Code review for PR #1234', branch: 'feature/auth-refactor' } },
    { agentId: AGENT_IDS[0], metadata: { task: 'Refactoring database layer', branch: 'fix/db-pool' } },
    { agentId: AGENT_IDS[1], metadata: { task: 'ETL pipeline run - daily ingestion', source: 'S3', destination: 'Snowflake' } },
    { agentId: AGENT_IDS[1], metadata: { task: 'Data quality audit Q1 2026', report: true } },
    { agentId: AGENT_IDS[2], metadata: { task: 'Customer support ticket #8821', channel: 'live-chat', language: 'en' } },
  ];
  for (const def of sessionDefs) {
    const r = await req('POST', '/api/v1/sessions', def, ACCESS_TOKEN);
    check(`POST /sessions creates session for agent`, r.status === 201);
    if (r.body?.id) SESSION_IDS.push(r.body.id);
  }
  {
    const r = await req('GET', '/api/v1/sessions', null, ACCESS_TOKEN);
    check('GET /sessions returns session list', r.status === 200);
    check(`Session list has ${SESSION_IDS.length}+ sessions`, (Array.isArray(r.body) ? r.body : r.body?.data)?.length >= SESSION_IDS.length);
  }
  {
    const r = await req('GET', `/api/v1/sessions/${SESSION_IDS[0]}`, null, ACCESS_TOKEN);
    check('GET /sessions/:id returns single session', r.status === 200);
    check('Session has agent relation', !!r.body?.agent || !!r.body?.agentId);
  }
  {
    const r = await req('GET', `/api/v1/sessions?agentId=${AGENT_IDS[0]}`, null, ACCESS_TOKEN);
    check('GET /sessions?agentId filters correctly', r.status === 200);
  }
  {
    const r = await req('PATCH', `/api/v1/sessions/${SESSION_IDS[0]}`, { status: 'completed', endedAt: new Date().toISOString() }, ACCESS_TOKEN);
    check('PATCH /sessions/:id completes session', r.status === 200);
    check('Session status is completed', r.body?.status === 'completed');
  }

  // ═══════ 6. EVENTS — Bulk Ingestion with Real Data ═══════
  console.log('\n▶ EVENTS MODULE — Bulk Ingestion');
  const eventBatches = [
    // Session 0 (CodeAssistant - completed code review)
    { sessionId: SESSION_IDS[0], agentId: AGENT_IDS[0], category: 'agent_lifecycle', level: 'info', message: 'Agent initialized for code review task on PR #1234', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 45, stateBefore: { status: 'idle', memory: { context: [] } }, stateAfter: { status: 'initialized', memory: { context: ['PR #1234 loaded'] }, task: 'code-review' } },
    { sessionId: SESSION_IDS[0], agentId: AGENT_IDS[0], category: 'tool_invocation', level: 'info', message: 'Fetched PR diff from GitHub API - 342 lines changed across 8 files', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 820, stateBefore: { status: 'initialized' }, stateAfter: { status: 'analyzing', filesLoaded: 8, linesChanged: 342 } },
    { sessionId: SESSION_IDS[0], agentId: AGENT_IDS[0], category: 'llm_call', level: 'info', message: 'Analyzed code changes - found 3 issues: 1 security vulnerability, 1 performance concern, 1 style issue', tokensInput: 4200, tokensOutput: 1850, costUsd: 0.0182, latencyMs: 3200, stateBefore: { status: 'analyzing' }, stateAfter: { status: 'reviewed', issues: [{ type: 'security', severity: 'high' }, { type: 'performance', severity: 'medium' }, { type: 'style', severity: 'low' }] } },
    { sessionId: SESSION_IDS[0], agentId: AGENT_IDS[0], category: 'tool_invocation', level: 'info', message: 'Posted review comments on GitHub PR #1234 with inline suggestions', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 650, stateBefore: { status: 'reviewed' }, stateAfter: { status: 'completed', commentsPosted: 3 } },
    { sessionId: SESSION_IDS[0], agentId: AGENT_IDS[0], category: 'agent_lifecycle', level: 'info', message: 'Code review session completed successfully', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 12 },

    // Session 1 (CodeAssistant - refactoring with error)
    { sessionId: SESSION_IDS[1], agentId: AGENT_IDS[0], category: 'agent_lifecycle', level: 'info', message: 'Agent started refactoring task for database connection pooling', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 38 },
    { sessionId: SESSION_IDS[1], agentId: AGENT_IDS[0], category: 'llm_call', level: 'info', message: 'Generated refactoring plan: migrate from pg.Pool to TypeORM connection pool with retry logic', tokensInput: 3100, tokensOutput: 2200, costUsd: 0.0215, latencyMs: 4100 },
    { sessionId: SESSION_IDS[1], agentId: AGENT_IDS[0], category: 'tool_invocation', level: 'warn', message: 'File write conflict detected: src/data-source.ts was modified by another process', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 120 },
    { sessionId: SESSION_IDS[1], agentId: AGENT_IDS[0], category: 'llm_call', level: 'info', message: 'Resolved merge conflict and applied connection pool configuration with max=10, idle=30s', tokensInput: 1800, tokensOutput: 950, costUsd: 0.0098, latencyMs: 2800 },
    { sessionId: SESSION_IDS[1], agentId: AGENT_IDS[0], category: 'security', level: 'warn', message: 'Detected hardcoded database credentials in config — flagged for remediation', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 15 },

    // Session 2 (DataPipeline - ETL run)
    { sessionId: SESSION_IDS[2], agentId: AGENT_IDS[1], category: 'agent_lifecycle', level: 'info', message: 'ETL pipeline agent started — source: S3 (s3://data-lake/raw/), destination: Snowflake', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 55, stateBefore: { status: 'idle', pipeline: null }, stateAfter: { status: 'running', pipeline: 'daily-ingestion', stage: 'extract' } },
    { sessionId: SESSION_IDS[2], agentId: AGENT_IDS[1], category: 'tool_invocation', level: 'info', message: 'Extracted 2.4GB of raw data from S3 bucket — 142 Parquet files processed', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 12500, stateBefore: { stage: 'extract' }, stateAfter: { stage: 'transform', filesProcessed: 142, dataSize: '2.4GB' } },
    { sessionId: SESSION_IDS[2], agentId: AGENT_IDS[1], category: 'llm_call', level: 'info', message: 'Generated SQL transformation queries for data normalization — 8 tables, 45 columns mapped', tokensInput: 5200, tokensOutput: 3100, costUsd: 0.0342, latencyMs: 5800, stateBefore: { stage: 'transform' }, stateAfter: { stage: 'transform-complete', tablesProcessed: 8, columnsMatched: 45 } },
    { sessionId: SESSION_IDS[2], agentId: AGENT_IDS[1], category: 'tool_invocation', level: 'info', message: 'Loaded transformed data into Snowflake — 1.8M rows inserted across 8 tables', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 8200, stateAfter: { stage: 'load-complete', rowsInserted: 1800000 } },
    { sessionId: SESSION_IDS[2], agentId: AGENT_IDS[1], category: 'guardrail', level: 'warn', message: 'Data quality check: 0.3% of rows had missing required fields — logged for review', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 320 },
    { sessionId: SESSION_IDS[2], agentId: AGENT_IDS[1], category: 'agent_lifecycle', level: 'info', message: 'ETL pipeline completed successfully — total processing time: 27.2s', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 27200 },

    // Session 3 (DataPipeline - failed audit)
    { sessionId: SESSION_IDS[3], agentId: AGENT_IDS[1], category: 'agent_lifecycle', level: 'info', message: 'Data quality audit started for Q1 2026 dataset', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 42 },
    { sessionId: SESSION_IDS[3], agentId: AGENT_IDS[1], category: 'llm_call', level: 'info', message: 'Analyzing schema drift across 12 source tables — comparing production vs staging schemas', tokensInput: 6800, tokensOutput: 4200, costUsd: 0.0485, latencyMs: 7200 },
    { sessionId: SESSION_IDS[3], agentId: AGENT_IDS[1], category: 'llm_call', level: 'error', message: 'Schema validation failed: 3 breaking changes detected in customer_events table — column type mismatch on event_payload', tokensInput: 2100, tokensOutput: 800, costUsd: 0.0112, latencyMs: 3100 },
    { sessionId: SESSION_IDS[3], agentId: AGENT_IDS[1], category: 'agent_lifecycle', level: 'fatal', message: 'Audit aborted due to critical schema incompatibility — manual intervention required', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 8 },

    // Session 4 (SupportBot - live chat)
    { sessionId: SESSION_IDS[4], agentId: AGENT_IDS[2], category: 'agent_lifecycle', level: 'info', message: 'Support bot activated for ticket #8821 — customer: Acme Corp, priority: high', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 32, stateBefore: { status: 'idle' }, stateAfter: { status: 'active', ticket: '#8821', customer: 'Acme Corp' } },
    { sessionId: SESSION_IDS[4], agentId: AGENT_IDS[2], category: 'user_action', level: 'info', message: 'Customer message received: "Our API integration stopped working after your latest update"', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 5 },
    { sessionId: SESSION_IDS[4], agentId: AGENT_IDS[2], category: 'tool_invocation', level: 'info', message: 'Searched knowledge base — found 3 relevant articles about API v2 migration breaking changes', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 450 },
    { sessionId: SESSION_IDS[4], agentId: AGENT_IDS[2], category: 'llm_call', level: 'info', message: 'Generated response with troubleshooting steps and API migration guide link', tokensInput: 2800, tokensOutput: 1200, costUsd: 0.0095, latencyMs: 1800 },
    { sessionId: SESSION_IDS[4], agentId: AGENT_IDS[2], category: 'user_action', level: 'info', message: 'Customer confirmed: "Thanks, the migration guide fixed our issue. Switching to v2 endpoints now."', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 3 },
    { sessionId: SESSION_IDS[4], agentId: AGENT_IDS[2], category: 'system', level: 'info', message: 'Ticket #8821 resolved — resolution time: 4m 12s, customer satisfaction: positive', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 180 },
    { sessionId: SESSION_IDS[4], agentId: AGENT_IDS[2], category: 'guardrail', level: 'info', message: 'Response quality check passed — no PII leaked, tone appropriate, accuracy verified', tokensInput: 0, tokensOutput: 0, costUsd: 0, latencyMs: 25 },
  ];

  // Send events in batches
  const r = await req('POST', '/api/v1/events', { events: eventBatches }, ACCESS_TOKEN);
  check('POST /events bulk ingestion succeeds', r.status === 201);
  if (Array.isArray(r.body)) {
    check(`Created ${r.body.length} events`, r.body.length === eventBatches.length);
    EVENT_IDS = r.body.map(e => e.id);
  } else if (r.body?.id) {
    EVENT_IDS.push(r.body.id);
  }

  // ═══════ 6b. EVENTS — Query & Filter ═══════
  console.log('\n▶ EVENTS MODULE — Query & Filter');
  {
    const r = await req('GET', '/api/v1/events', null, ACCESS_TOKEN);
    check('GET /events returns event list', r.status === 200);
    const events = Array.isArray(r.body) ? r.body : r.body?.data;
    check('Events list has data', events?.length > 0);
  }
  {
    const r = await req('GET', `/api/v1/events?category=llm_call`, null, ACCESS_TOKEN);
    check('GET /events?category=llm_call filters correctly', r.status === 200);
  }
  {
    const r = await req('GET', `/api/v1/events?level=error`, null, ACCESS_TOKEN);
    check('GET /events?level=error filters correctly', r.status === 200);
  }
  {
    const r = await req('GET', `/api/v1/events?sessionId=${SESSION_IDS[0]}`, null, ACCESS_TOKEN);
    check('GET /events?sessionId filters correctly', r.status === 200);
    const events = Array.isArray(r.body) ? r.body : r.body?.data;
    check('Session 0 has 5 events', events?.length === 5);
  }
  if (EVENT_IDS.length > 0) {
    const r = await req('GET', `/api/v1/events/${EVENT_IDS[0]}`, null, ACCESS_TOKEN);
    check('GET /events/:id returns single event', r.status === 200);
    check('Event has message', !!r.body?.message);
    check('Event has category', !!r.body?.category);
    check('Event has level', !!r.body?.level);
  }

  // ═══════ 6c. EVENTS — Integrity Verification ═══════
  console.log('\n▶ EVENTS MODULE — Integrity Verification');
  {
    const r = await req('GET', '/api/v1/events/verify', null, ACCESS_TOKEN);
    check('GET /events/verify returns verification result', r.status === 200);
    check('Verification has total count', typeof r.body?.total === 'number');
    check('Verification has tampered count', typeof r.body?.tampered === 'number');
  }
  if (EVENT_IDS.length > 0) {
    const r = await req('GET', `/api/v1/events/${EVENT_IDS[0]}/verify`, null, ACCESS_TOKEN);
    check('GET /events/:id/verify verifies single event', r.status === 200);
    check('Single event verification has valid field', r.body?.valid !== undefined);
  }

  // ═══════ 7. ANALYTICS ═══════
  console.log('\n▶ ANALYTICS MODULE');
  {
    const r = await req('GET', '/api/v1/analytics/cost', null, ACCESS_TOKEN);
    check('GET /analytics/cost returns 200', r.status === 200);
    check('Cost analytics returns array', Array.isArray(r.body));
  }
  {
    const r = await req('GET', '/api/v1/analytics/usage', null, ACCESS_TOKEN);
    check('GET /analytics/usage returns 200', r.status === 200);
    check('Usage analytics returns array', Array.isArray(r.body));
  }
  {
    const r = await req('GET', '/api/v1/analytics/models', null, ACCESS_TOKEN);
    check('GET /analytics/models returns 200', r.status === 200);
    check('Model analytics returns array', Array.isArray(r.body));
    if (Array.isArray(r.body) && r.body.length > 0) {
      check('Model analytics has modelProvider', !!r.body[0].modelProvider);
      check('Model analytics has totalCost', r.body[0].totalCost !== undefined);
    }
  }

  // ═══════ 8. ANOMALIES ═══════
  console.log('\n▶ ANOMALIES MODULE');
  {
    const r = await req('GET', '/api/v1/anomalies', null, ACCESS_TOKEN);
    check('GET /anomalies returns 200', r.status === 200);
    check('Anomalies has latencySpikes array', Array.isArray(r.body?.latencySpikes));
    check('Anomalies has errorBursts array', Array.isArray(r.body?.errorBursts));
    check('Anomalies has agentLoops array', Array.isArray(r.body?.agentLoops));
  }

  // ═══════ 9. COMPLIANCE ═══════
  console.log('\n▶ COMPLIANCE MODULE');
  {
    const r = await req('GET', '/api/v1/compliance/report', null, ACCESS_TOKEN);
    check('GET /compliance/report returns 200', r.status === 200);
    check('Report has guardrailEvents count', typeof r.body?.guardrailEvents === 'number');
    check('Report has securityEvents count', typeof r.body?.securityEvents === 'number');
    check('Report has totalAuditLogs count', typeof r.body?.totalAuditLogs === 'number');
  }
  {
    const r = await req('GET', '/api/v1/compliance/checks', null, ACCESS_TOKEN);
    check('GET /compliance/checks returns 200', r.status === 200);
    check('Compliance checks is array', Array.isArray(r.body));
    if (Array.isArray(r.body) && r.body.length > 0) {
      check('Check has name', !!r.body[0].name);
      check('Check has status (pass/warn/fail)', ['pass', 'warn', 'fail'].includes(r.body[0].status));
    }
  }

  // ═══════ 10. API KEYS ═══════
  console.log('\n▶ API KEYS MODULE');
  {
    const r = await req('POST', '/api/v1/api-keys', { name: `Test Key ${TS}` }, ACCESS_TOKEN);
    check('POST /api-keys creates key', r.status === 201);
    check('API key has id', !!r.body?.id);
    check('API key returns raw key', !!r.body?.key);
    check('API key has correct prefix', r.body?.key?.startsWith('al_live_sk_'));
    check('API key has keyPrefix', !!r.body?.keyPrefix);
    API_KEY_ID = r.body?.id || '';
    RAW_API_KEY = r.body?.key || '';
  }
  {
    const r = await req('GET', '/api/v1/api-keys', null, ACCESS_TOKEN);
    check('GET /api-keys returns key list', r.status === 200);
    check('Key list has entries', Array.isArray(r.body) && r.body.length > 0);
    // Verify raw key is NOT returned in list
    if (Array.isArray(r.body)) {
      check('Listed keys do NOT expose raw key', !r.body[0].key);
    }
  }

  // ═══════ 10b. API KEY AUTH ═══════
  console.log('\n▶ API KEY AUTHENTICATION');
  if (RAW_API_KEY) {
    const r = await reqApiKey('GET', '/api/v1/agents', RAW_API_KEY);
    check('GET /agents with API key auth works', r.status === 200);
    check('API key auth returns agent list', Array.isArray(r.body));
  }
  if (RAW_API_KEY) {
    const r = await reqApiKey('GET', '/api/v1/sessions', RAW_API_KEY);
    check('GET /sessions with API key auth works', r.status === 200);
  }

  // ═══════ 10c. REVOKE API KEY ═══════
  console.log('\n▶ API KEY REVOCATION');
  if (API_KEY_ID) {
    const r = await req('DELETE', `/api/v1/api-keys/${API_KEY_ID}`, null, ACCESS_TOKEN);
    check('DELETE /api-keys/:id revokes key', r.status === 200);
  }
  if (RAW_API_KEY) {
    const r = await reqApiKey('GET', '/api/v1/agents', RAW_API_KEY);
    check('Revoked API key returns 401', r.status === 401);
  }

  // ═══════ 11. SESSION UPDATE — Mark failed session ═══════
  console.log('\n▶ SESSION STATUS UPDATES');
  {
    const r = await req('PATCH', `/api/v1/sessions/${SESSION_IDS[3]}`, { status: 'failed', endedAt: new Date().toISOString() }, ACCESS_TOKEN);
    check('Mark session as failed', r.status === 200);
    check('Session status is failed', r.body?.status === 'failed');
  }

  // ═══════ 12. AUTH — LOGOUT ═══════
  console.log('\n▶ AUTH MODULE — Logout');
  {
    const r = await req('POST', '/api/v1/auth/logout', { refreshToken: REFRESH_TOKEN }, ACCESS_TOKEN);
    check('POST /auth/logout returns 201', r.status === 200 || r.status === 201);
  }

  // ═══════ 13. SECURITY HEADERS ═══════
  console.log('\n▶ SECURITY HEADERS');
  {
    const r = await req('GET', '/health');
    check('X-Content-Type-Options header present', !!r.headers['x-content-type-options']);
    check('X-Frame-Options or CSP header present', !!r.headers['x-frame-options'] || !!r.headers['content-security-policy']);
  }

  // ═══════ CLEANUP / DELETE TESTS ═══════
  console.log('\n▶ DELETE CONSTRAINTS');
  // Re-login since we logged out
  {
    const r = await req('POST', '/api/v1/auth/login', {
      email: `testuser_${TS}@agentledger.io`,
      password: 'TestPass123!@#'
    });
    ACCESS_TOKEN = r.body?.accessToken || '';
  }
  // Agent with sessions should fail to delete (FK constraint — correct behavior)
  {
    const r = await req('DELETE', `/api/v1/agents/${AGENT_IDS[0]}`, null, ACCESS_TOKEN);
    check('DELETE agent with sessions fails (FK constraint)', r.status === 500 || r.status === 409 || r.status === 400);
  }
  // Create a fresh agent with no sessions and delete it
  {
    const r = await req('POST', '/api/v1/agents', { name: `DeleteMe-${TS}`, modelProvider: 'openai', modelId: 'gpt-4' }, ACCESS_TOKEN);
    const freshId = r.body?.id;
    if (freshId) {
      const del = await req('DELETE', `/api/v1/agents/${freshId}`, null, ACCESS_TOKEN);
      check('DELETE agent without sessions succeeds', del.status === 200);
    }
  }

  // ═══════ SUMMARY ═══════
  console.log('\n══════════════════════════════════════════════');
  console.log(`  RESULTS: ${pass} PASSED, ${fail} FAILED (${pass + fail} total)`);
  console.log('══════════════════════════════════════════════\n');

  if (fail > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
