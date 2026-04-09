/**
 * Focused E2E: Module 13 (Edge Cases) + Module 15 (Performance)
 * Run: node tests/e2e-edge-perf.mjs
 */
const BACKEND = 'http://localhost:3001';
const API = `${BACKEND}/api/v1`;

const state = { accessToken: null, csrfToken: null, apiKey: null, agents: [], sessions: [] };

async function api(method, path, body = null, headers = {}) {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const t0 = performance.now();
  const res = await fetch(url, opts);
  const elapsed = performance.now() - t0;
  const setCookie = res.headers.getSetCookie?.()?.join('; ') || res.headers.get('set-cookie') || '';
  const csrfMatch = setCookie.match(/csrf-token=([^;]+)/);
  if (csrfMatch) state.csrfToken = csrfMatch[1];
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data, elapsed, headers: Object.fromEntries(res.headers.entries()), setCookie };
}

function auth() {
  const h = { Authorization: `Bearer ${state.accessToken}` };
  if (state.csrfToken) { h['X-CSRF-Token'] = state.csrfToken; h['Cookie'] = `csrf-token=${state.csrfToken}`; }
  return h;
}
function apiKeyH() { return { 'x-api-key': state.apiKey }; }

// ── Setup ──────────────────────────────────────────────────
async function setup() {
  console.log('=== Setup: auth + agents + apikey + events ===');
  const email = `e2e-edge-${Date.now()}@test.dev`;
  const pw = 'E2eTestPass123!';
  const signup = await api('POST', '/auth/signup', { email, password: pw, displayName: 'Edge Perf Tester' });
  if (signup.status !== 201) { console.error('Signup failed:', signup.status, signup.data); process.exit(1); }
  state.accessToken = signup.data.accessToken;
  const csrfMatch = (signup.setCookie || '').match(/csrf-token=([^;]+)/);
  if (csrfMatch) state.csrfToken = csrfMatch[1];

  // Create agent
  const ag = await api('POST', '/agents', { name: 'edge-test-agent', modelProvider: 'openai', modelId: 'gpt-4o' }, auth());
  if (ag.status === 201) state.agents.push(ag.data);
  else console.error('Agent creation failed:', ag.status, ag.data);

  // Create API key
  const key = await api('POST', '/api-keys', { name: 'Edge Test Key' }, auth());
  if (key.status === 201) state.apiKey = key.data.key;
  else console.error('API key creation failed:', key.status, key.data);

  // Create session + seed 120 events for perf tests
  const agentId = state.agents[0]?.id;
  if (agentId && state.apiKey) {
    const sess = await api('POST', '/sessions', { agentId }, apiKeyH());
    if (sess.status === 201) state.sessions.push(sess.data.id);

    const events = Array.from({ length: 120 }, (_, i) => ({
      agentId, sessionId: state.sessions[0],
      category: 'llm_call', level: 'info',
      message: `Seed event ${i}`,
      tokensInput: 100, tokensOutput: 50, costUsd: 0.001, latencyMs: 80,
    }));
    await api('POST', '/events', { events }, apiKeyH());
  }
  console.log(`  token: ${state.accessToken ? 'OK' : 'MISSING'}  csrf: ${state.csrfToken ? 'OK' : 'MISSING'}  apiKey: ${state.apiKey ? 'OK' : 'MISSING'}  agent: ${state.agents[0]?.id ?? 'NONE'}  session: ${state.sessions[0] ?? 'NONE'}`);
}

// ── Module 13: Edge Cases ──────────────────────────────────
async function module13() {
  console.log('\n=== MODULE 13: Edge Cases and Error Handling ===');
  const tests = [];
  function t(name, pass, detail = '') {
    tests.push({ name, pass, detail });
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  const h = state.apiKey ? apiKeyH() : auth();
  const agentId = state.agents[0]?.id;

  // 1. Invalid API key → 401
  const r1 = await api('GET', '/events', null, { 'x-api-key': 'bad-key-xyz' });
  t('Invalid API key → 401', r1.status === 401, `got ${r1.status}`);

  // 2. No auth → 401
  const r2 = await api('GET', '/events');
  t('No auth → 401', r2.status === 401, `got ${r2.status}`);

  // 3. Batch > 500 → 400
  if (agentId) {
    const bigBatch = { events: Array.from({ length: 501 }, (_, i) => ({ agentId, category: 'llm_call', level: 'info', message: `#${i}` })) };
    const r3 = await api('POST', '/events', bigBatch, h);
    t('Batch 501 events → 400', r3.status === 400, `got ${r3.status}`);
  }

  // 4. Large payload (100 KB single field) — body limit is 1 MB, per-field is 64 KB
  if (agentId) {
    const bigPayload = 'x'.repeat(100_000);
    const r4 = await api('POST', '/events', {
      agentId, category: 'llm_call', level: 'info', message: 'big',
      payload: { blob: bigPayload },
    }, h);
    // 64KB = 65536 bytes; 100KB > 64KB → MaxJsonSize validator should reject
    t('100KB payload field → 400 (MaxJsonSize 64KB)', r4.status === 400, `got ${r4.status}: ${JSON.stringify(r4.data).slice(0, 200)}`);
  }

  // 5. IDOR
  const r5 = await api('GET', '/events/00000000-0000-0000-0000-000000000000', null, h);
  t('IDOR — random UUID → 404', r5.status === 404, `got ${r5.status}`);

  // 6. SQL injection
  const r6 = await api('GET', `/events?agentId=${encodeURIComponent("'; DROP TABLE events;--")}`, null, h);
  t('SQL injection in agentId → 400', r6.status === 400, `got ${r6.status}`);

  // 7. XSS in agent name
  const r7 = await api('POST', '/agents', { name: '<script>alert(1)</script>', modelProvider: 'x', modelId: 'y' }, auth());
  t('XSS agent name → 400 or stripped', r7.status === 400 || (r7.status === 201 && !JSON.stringify(r7.data).includes('<script>')), `got ${r7.status}`);

  // 8. Missing required fields
  const r8 = await api('POST', '/events', { events: [{ category: 'llm_call' }] }, h);
  t('Missing required fields → 400', r8.status === 400, `got ${r8.status}`);

  // 9. Invalid JSON
  const r9raw = await fetch(`${API}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(state.apiKey ? apiKeyH() : auth()) },
    body: '{{bad json',
  });
  t('Invalid JSON → 400', r9raw.status === 400, `got ${r9raw.status}`);

  // 10. Rate limiting (200 rapid GET)
  console.log('  Testing rate limiting (200 rapid requests)...');
  const rateResults = await Promise.all(
    Array.from({ length: 200 }, () => api('GET', '/events?limit=1', null, h))
  );
  const got429 = rateResults.filter(r => r.status === 429).length;
  t('Rate limiting triggers (429)', got429 > 0, `${got429}/200 got 429`);

  // Summary
  const passed = tests.filter(x => x.pass).length;
  console.log(`\n  Module 13 result: ${passed}/${tests.length} passed`);
  return tests;
}

// ── Module 15: Performance ─────────────────────────────────
async function module15() {
  console.log('\n=== MODULE 15: Performance Metrics ===');

  // Wait for rate-limit cool-down from module 13
  await new Promise(r => setTimeout(r, 3000));

  const tests = [];
  function t(name, pass, detail = '') {
    tests.push({ name, pass, detail });
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  const h = state.apiKey ? apiKeyH() : auth();

  // GET endpoints — each with 500ms target (allow some margin, run 3 times, take median)
  const endpoints = [
    { label: 'GET /events?limit=100', path: '/events?limit=100', target: 500 },
    { label: 'GET /sessions', path: '/sessions', target: 500 },
    { label: 'GET /agents', path: '/agents', target: 500 },
    { label: 'GET /analytics/cost', path: '/analytics/cost', target: 500 },
    { label: 'GET /analytics/usage', path: '/analytics/usage', target: 500 },
    { label: 'GET /compliance/checks', path: '/compliance/checks', target: 500 },
    { label: 'GET /approvals', path: '/approvals', target: 500 },
  ];

  for (const ep of endpoints) {
    // Warm-up call (first call is often slow due to connection setup)
    await api('GET', ep.path, null, h);

    // 3 measured calls, take median
    const times = [];
    for (let i = 0; i < 3; i++) {
      const r = await api('GET', ep.path, null, h);
      times.push(r.elapsed);
    }
    times.sort((a, b) => a - b);
    const median = times[1]; // median of 3
    t(`${ep.label} < ${ep.target}ms (median of 3)`, median < ep.target, `${Math.round(median)}ms [${times.map(x => Math.round(x)).join(', ')}]`);
  }

  // Batch POST performance
  if (state.agents[0]?.id) {
    const batch = { events: Array.from({ length: 50 }, (_, i) => ({
      agentId: state.agents[0].id,
      category: 'llm_call', level: 'info', message: `Perf ${i}`,
      tokensInput: 100, tokensOutput: 50, costUsd: 0.001,
    })) };
    // Warm-up
    await api('POST', '/events', { events: [{ agentId: state.agents[0].id, category: 'system', level: 'info', message: 'warm' }] }, h);
    const batchRes = await api('POST', '/events', batch, h);
    t('POST /events batch-50 < 2s', batchRes.elapsed < 2000, `${Math.round(batchRes.elapsed)}ms`);
  }

  // Hash chain verification
  // Warm-up
  await api('GET', '/events/verify-chain', null, h);
  const chainRes = await api('GET', '/events/verify-chain', null, h);
  t('GET /events/verify-chain < 5s', chainRes.elapsed < 5000, `${Math.round(chainRes.elapsed)}ms`);

  // Frontend page load
  const t0 = performance.now();
  await fetch('http://localhost:3000');
  const pageLoad = performance.now() - t0;
  t('Landing page load < 3s', pageLoad < 3000, `${Math.round(pageLoad)}ms`);

  const passed = tests.filter(x => x.pass).length;
  console.log(`\n  Module 15 result: ${passed}/${tests.length} passed`);
  return tests;
}

// ── Main ───────────────────────────────────────────────────
async function main() {
  await setup();
  const t13 = await module13();
  const t15 = await module15();

  const all = [...t13, ...t15];
  const passed = all.filter(x => x.pass).length;
  const failed = all.filter(x => !x.pass);

  console.log('\n========================================');
  console.log(`TOTAL: ${passed}/${all.length} passed, ${failed.length} failed`);
  if (failed.length) {
    console.log('\nFailed tests:');
    for (const f of failed) console.log(`  FAIL: ${f.name} — ${f.detail}`);
  }
  process.exit(failed.length > 0 ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
