const http = require('http');

const BASE = 'http://localhost:3001';
let passed = 0, failed = 0;

function req(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: data }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function check(name, condition) {
  if (condition) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name}`); }
}

async function run() {
  const UNIQUE = Date.now();
  console.log('\n=== AgentLedger Full API Test Suite ===\n');

  // 1. Health
  const health = await req('GET', '/health');
  check('1. Health check', health.body.status === 'ok');

  // 2. Signup
  const signup = await req('POST', '/api/v1/auth/signup', {
    email: `test-${UNIQUE}@agentledger.io`, password: 'Test@2026!', displayName: 'Tester'
  });
  check('2. Signup', signup.body.accessToken && signup.body.refreshToken);
  const TOKEN = signup.body.accessToken;
  const REFRESH = signup.body.refreshToken;
  const auth = { Authorization: `Bearer ${TOKEN}` };

  // 3. Login
  const login = await req('POST', '/api/v1/auth/login', {
    email: `test-${UNIQUE}@agentledger.io`, password: 'Test@2026!'
  });
  check('3. Login', login.body.accessToken);

  // 4. Organisation
  const org = await req('GET', '/api/v1/organisations/me', null, auth);
  check('4. Get organisation', org.body.id);

  // 5. Create Agent
  const agent = await req('POST', '/api/v1/agents', {
    name: 'TestBot', description: 'Test agent', modelProvider: 'openai', modelId: 'gpt-4'
  }, auth);
  check('5. Create agent', agent.body.id);
  const AGENT_ID = agent.body.id;

  // 6. List Agents
  const agents = await req('GET', '/api/v1/agents', null, auth);
  check('6. List agents', Array.isArray(agents.body) && agents.body.length > 0);

  // 7. Create Session
  const session = await req('POST', '/api/v1/sessions', { agentId: AGENT_ID }, auth);
  check('7. Create session', session.body.id);
  const SESSION_ID = session.body.id;

  // 8. List Sessions
  const sessions = await req('GET', '/api/v1/sessions', null, auth);
  check('8. List sessions', Array.isArray(sessions.body) && sessions.body.length > 0);

  // 9. Bulk Events
  const events = await req('POST', '/api/v1/events', {
    events: [{
      sessionId: SESSION_ID, agentId: AGENT_ID, category: 'llm_call', level: 'info',
      message: 'Test LLM call', tokensInput: 100, tokensOutput: 50, costUsd: 0.01, latencyMs: 500
    }]
  }, auth);
  check('9. Bulk event ingestion', Array.isArray(events.body) && events.body.length > 0);

  // 10. List Events
  const eventList = await req('GET', '/api/v1/events', null, auth);
  check('10. List events', Array.isArray(eventList.body) && eventList.body.length > 0);

  // 11. Cost Analytics
  const cost = await req('GET', '/api/v1/analytics/cost', null, auth);
  check('11. Cost analytics', Array.isArray(cost.body));

  // 12. Usage Analytics
  const usage = await req('GET', '/api/v1/analytics/usage', null, auth);
  check('12. Usage analytics', Array.isArray(usage.body));

  // 13. Model Analytics
  const models = await req('GET', '/api/v1/analytics/models', null, auth);
  check('13. Model analytics', Array.isArray(models.body));

  // 14. Anomalies
  const anomalies = await req('GET', '/api/v1/anomalies', null, auth);
  check('14. Anomaly detection', anomalies.body.latencySpikes !== undefined);

  // 15. Compliance Checks
  const checks = await req('GET', '/api/v1/compliance/checks', null, auth);
  check('15. Compliance checks', Array.isArray(checks.body));

  // 16. Compliance Report
  const report = await req('GET', '/api/v1/compliance/report', null, auth);
  check('16. Compliance report', report.body.generatedAt);

  // 17. Create API Key
  const apiKey = await req('POST', '/api/v1/api-keys', { name: 'test-key' }, auth);
  check('17. Create API key', apiKey.body.key || apiKey.body.rawKey);

  // 18. List API Keys
  const apiKeys = await req('GET', '/api/v1/api-keys', null, auth);
  check('18. List API keys', Array.isArray(apiKeys.body) && apiKeys.body.length > 0);

  // 19. Token Refresh
  const refresh = await req('POST', '/api/v1/auth/refresh', { refreshToken: REFRESH });
  check('19. Token refresh', refresh.body.accessToken);

  // 20. Auth guard (no token = 401)
  const noAuth = await req('GET', '/api/v1/agents');
  check('20. Auth guard (401)', noAuth.status === 401);

  // 21. Helmet security headers
  const healthHeaders = await req('GET', '/health');
  check('21. Helmet X-Content-Type-Options', healthHeaders.headers['x-content-type-options'] === 'nosniff');
  check('22. Helmet X-Frame-Options', !!healthHeaders.headers['x-frame-options']);

  // 23. Password strength validation
  const weakPw = await req('POST', '/api/v1/auth/signup', {
    email: `weak-${UNIQUE}@a.io`, password: 'weakpassword', displayName: 'Weak'
  });
  check('23. Weak password rejected', weakPw.status === 400);

  // 24. Invalid date param rejected
  const badDate = await req('GET', '/api/v1/analytics/cost?from=not-a-date', null, auth);
  check('24. Invalid date rejected', badDate.status === 400);

  // 25. Get single session
  const singleSession = await req('GET', `/api/v1/sessions/${SESSION_ID}`, null, auth);
  check('25. Get single session', singleSession.body.id === SESSION_ID);

  // 26. Get single agent
  const singleAgent = await req('GET', `/api/v1/agents/${AGENT_ID}`, null, auth);
  check('26. Get single agent', singleAgent.body.id === AGENT_ID);

  // 27. Create a standalone agent to delete (no sessions/events attached)
  const delTarget = await req('POST', '/api/v1/agents', {
    name: 'ToDelete', description: 'Temp', modelProvider: 'openai', modelId: 'gpt-4'
  }, auth);
  const deleteAgent = await req('DELETE', `/api/v1/agents/${delTarget.body.id}`, null, auth);
  check('27. Delete agent', deleteAgent.status === 200 && deleteAgent.body.message === 'Agent deleted');

  console.log(`\n=== Results: ${passed}/${passed + failed} PASSED ===\n`);
  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error('Test error:', e); process.exit(1); });
