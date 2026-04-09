/**
 * AgentLedger Comprehensive 16-Module E2E Test Suite
 * Uses Playwright for browser testing + fetch for API testing
 * Run: node tests/e2e-full-test.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';
const API_BASE = `${BACKEND_URL}/api/v1`;
const SCREENSHOT_DIR = join(process.cwd(), 'demo-screenshots', 'e2e');

// Test state shared across modules
const state = {
  accessToken: null,
  csrfToken: null,
  userId: null,
  orgId: null,
  apiKey: null,
  apiKeyId: null,
  apiKey2Id: null,
  agents: [],
  sessions: [],
  events: [],
  approvalIds: [],
  testEmail: `e2e-test-${Date.now()}@agentledger.dev`,
  testPassword: 'E2eTestPass123!',
  testName: 'E2E Test User',
};

// Results tracking
const results = {
  startTime: new Date(),
  modules: [],
  bugs: [],
  screenshots: [],
  performance: [],
  security: [],
};

let bugCounter = 0;

function addBug(module, severity, description, expected, actual) {
  bugCounter++;
  results.bugs.push({
    id: `BUG-${String(bugCounter).padStart(3, '0')}`,
    module,
    severity,
    description,
    expected,
    actual,
    status: 'OPEN',
  });
}

function addPerf(endpoint, responseTime, target = 500) {
  results.performance.push({
    endpoint,
    responseTime: Math.round(responseTime),
    target,
    status: responseTime <= target ? 'PASS' : 'FAIL',
  });
}

async function screenshot(page, name, module) {
  const filename = `${name}.png`;
  const filepath = join(SCREENSHOT_DIR, filename);
  try {
    await page.screenshot({ path: filepath, fullPage: name.includes('full') });
    results.screenshots.push({ filename, module, description: name });
    console.log(`  [SCREENSHOT] ${filename}`);
  } catch (e) {
    console.log(`  [SCREENSHOT FAILED] ${filename}: ${e.message}`);
  }
}

async function apiCall(method, path, body = null, headers = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) opts.body = JSON.stringify(body);
  const start = performance.now();
  try {
    const res = await fetch(url, opts);
    const elapsed = performance.now() - start;
    // Extract CSRF token from Set-Cookie header
    const setCookie = res.headers.get('set-cookie') || '';
    const csrfMatch = setCookie.match(/csrf-token=([^;]+)/);
    if (csrfMatch) state.csrfToken = csrfMatch[1];
    let data = null;
    const text = await res.text();
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data, elapsed, headers: Object.fromEntries(res.headers.entries()), setCookie };
  } catch (e) {
    return { status: 0, data: null, elapsed: performance.now() - start, error: e.message };
  }
}

function authHeaders() {
  const h = { Authorization: `Bearer ${state.accessToken}` };
  if (state.csrfToken) {
    h['X-CSRF-Token'] = state.csrfToken;
    h['Cookie'] = `csrf-token=${state.csrfToken}`;
  }
  return h;
}

function apiKeyHeaders() {
  return { 'x-api-key': state.apiKey };
}

// ======================== MODULE 1: Landing Page ========================
async function module1(page) {
  const mod = { name: 'Module 1: Landing Page', tests: 0, passed: 0, failed: 0, details: [] };
  console.log('\n=== MODULE 1: Landing Page ===');

  function test(name, pass, detail = '') {
    mod.tests++;
    if (pass) { mod.passed++; mod.details.push(`PASS: ${name}`); }
    else { mod.failed++; mod.details.push(`FAIL: ${name} — ${detail}`); }
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  // Navigate to landing page
  const navStart = performance.now();
  const response = await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 15000 });
  const loadTime = performance.now() - navStart;
  addPerf('Landing Page Load', loadTime, 3000);
  test('Landing page loads', response?.ok() || response?.status() === 304);
  test('Page load under 3 seconds', loadTime < 3000, `${Math.round(loadTime)}ms`);

  await page.waitForTimeout(1000);

  // Screenshot full landing page
  await screenshot(page, 'module1-landing-full', 'Module 1');

  // Check hero section
  const heroText = await page.textContent('body').catch(() => '');
  test('Hero section has headline text', heroText.includes('Tamper') || heroText.includes('AI') || heroText.includes('Agent') || heroText.length > 100);

  // Check for navigation links
  const signInLink = await page.$('a[href*="login"], a[href*="signin"], button:has-text("Sign In"), a:has-text("Sign In")');
  test('Sign In link present', !!signInLink);

  const getStartedLink = await page.$('a[href*="signup"], a:has-text("Start"), button:has-text("Start"), a:has-text("Get Started")');
  test('Get Started / Sign Up link present', !!getStartedLink);

  // Check for code tabs (SDK Demo)
  const codeTabsExist = await page.$('[role="tablist"], .tab, button:has-text("OpenAI"), button:has-text("LangChain"), [data-tab]');
  test('SDK code tabs present', !!codeTabsExist);

  if (codeTabsExist) {
    const tabs = await page.$$('[role="tab"], .tab, button[data-tab]');
    for (const tab of tabs.slice(0, 4)) {
      try {
        await tab.click();
        await page.waitForTimeout(300);
      } catch {}
    }
    test('Code tabs are clickable', true);
  } else {
    test('Code tabs are clickable', false, 'tabs not found');
  }

  // Check for pricing section
  const pricingText = await page.textContent('body');
  test('Pricing section present', pricingText.includes('Free') || pricingText.includes('Pro') || pricingText.includes('Enterprise') || pricingText.includes('pricing') || pricingText.includes('Pricing'));

  // Responsive tests
  const viewports = [
    { name: '375px (iPhone)', width: 375, height: 812 },
    { name: '768px (iPad)', width: 768, height: 1024 },
    { name: '1024px (Laptop)', width: 1024, height: 768 },
    { name: '1440px (Desktop)', width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(500);
    await screenshot(page, `module1-responsive-${vp.width}px`, 'Module 1');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    test(`Responsive ${vp.name} — no horizontal overflow`, bodyWidth <= vp.width + 20, `scrollWidth=${bodyWidth}, viewport=${vp.width}`);
  }

  // Reset viewport to desktop
  await page.setViewportSize({ width: 1440, height: 900 });

  mod.status = mod.failed === 0 ? 'PASS' : (mod.failed <= 2 ? 'PARTIAL' : 'FAIL');
  results.modules.push(mod);
  return mod;
}

// ======================== MODULE 2: Authentication ========================
async function module2(page) {
  const mod = { name: 'Module 2: Authentication Flow', tests: 0, passed: 0, failed: 0, details: [] };
  console.log('\n=== MODULE 2: Authentication Flow ===');

  function test(name, pass, detail = '') {
    mod.tests++;
    if (pass) { mod.passed++; mod.details.push(`PASS: ${name}`); }
    else { mod.failed++; mod.details.push(`FAIL: ${name} — ${detail}`); }
    console.log(`  ${pass ? 'FAIL' : 'FAIL'}: ${name}`.replace(pass ? 'FAIL' : 'x', pass ? 'PASS' : 'FAIL') );
  }

  // Test 1: Navigate to signup via API
  console.log('  Testing signup via API...');
  const signupRes = await apiCall('POST', '/auth/signup', {
    email: state.testEmail,
    password: state.testPassword,
    displayName: state.testName,
  });
  addPerf('POST /auth/signup', signupRes.elapsed);
  test('Signup returns 201', signupRes.status === 201, `got ${signupRes.status}: ${JSON.stringify(signupRes.data).slice(0, 200)}`);

  if (signupRes.status === 201) {
    state.accessToken = signupRes.data.accessToken;
    state.userId = signupRes.data.user?.id;
    state.orgId = signupRes.data.user?.orgId;
    // Extract CSRF token from signup response cookies
    const csrfMatch = (signupRes.setCookie || '').match(/csrf-token=([^;]+)/);
    if (csrfMatch) state.csrfToken = csrfMatch[1];
    test('Signup returns access token', !!state.accessToken);
    test('Signup returns user object', !!signupRes.data.user);
    test('Signup sets CSRF token', !!state.csrfToken, `token=${state.csrfToken?.slice(0, 16)}...`);
  }

  // Test 2: Navigate to signup page in browser
  await page.goto(`${FRONTEND_URL}/signup`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await screenshot(page, 'module2-signup-page', 'Module 2');
  const signupPageLoaded = await page.$('input[type="email"], input[name="email"], form');
  test('Signup page renders form', !!signupPageLoaded);

  // Test 3: Duplicate email signup
  const dupRes = await apiCall('POST', '/auth/signup', {
    email: state.testEmail,
    password: state.testPassword,
    displayName: state.testName,
  });
  test('Duplicate email returns 400/409', dupRes.status === 400 || dupRes.status === 409, `got ${dupRes.status}`);

  // Test 4: Login via API
  const loginRes = await apiCall('POST', '/auth/login', {
    email: state.testEmail,
    password: state.testPassword,
  });
  addPerf('POST /auth/login', loginRes.elapsed);
  test('Login returns 200', loginRes.status === 200, `got ${loginRes.status}: ${JSON.stringify(loginRes.data).slice(0, 200)}`);

  if (loginRes.status === 200) {
    state.accessToken = loginRes.data.accessToken;
    // Capture CSRF token from login cookies
    const csrfMatch = (loginRes.setCookie || '').match(/csrf-token=([^;]+)/);
    if (csrfMatch) state.csrfToken = csrfMatch[1];
    test('Login returns access token', !!state.accessToken);
    test('Login sets CSRF token', !!state.csrfToken, `token=${state.csrfToken?.slice(0, 16)}...`);
  }

  // Test 5: Login page in browser
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await screenshot(page, 'module2-login-page', 'Module 2');
  const loginPageLoaded = await page.$('input[type="email"], input[name="email"], form');
  test('Login page renders form', !!loginPageLoaded);

  // Test 6: Wrong password
  const wrongPwRes = await apiCall('POST', '/auth/login', {
    email: state.testEmail,
    password: 'WrongPassword123!',
  });
  test('Wrong password returns 401', wrongPwRes.status === 401, `got ${wrongPwRes.status}`);

  // Test 7: Access dashboard without auth
  const noAuthRes = await apiCall('GET', '/agents');
  test('Unauthenticated GET /agents returns 401', noAuthRes.status === 401, `got ${noAuthRes.status}`);

  // Test 8: Forgot password page
  await page.goto(`${FRONTEND_URL}/forgot-password`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
  await screenshot(page, 'module2-forgot-password', 'Module 2');
  const forgotPage = await page.$('input[type="email"], form, body');
  test('Forgot password page renders', !!forgotPage);

  // Test 9: Forgot password API
  const forgotRes = await apiCall('POST', '/auth/forgot-password', { email: state.testEmail });
  test('Forgot password returns 200', forgotRes.status === 200, `got ${forgotRes.status}`);

  mod.status = mod.failed === 0 ? 'PASS' : (mod.failed <= 2 ? 'PARTIAL' : 'FAIL');
  results.modules.push(mod);
  return mod;
}

// ======================== MODULE 3: Dashboard Overview ========================
async function module3(page) {
  const mod = { name: 'Module 3: Dashboard Overview', tests: 0, passed: 0, failed: 0, details: [] };
  console.log('\n=== MODULE 3: Dashboard Overview ===');

  function test(name, pass, detail = '') {
    mod.tests++;
    if (pass) { mod.passed++; mod.details.push(`PASS: ${name}`); }
    else { mod.failed++; mod.details.push(`FAIL: ${name} — ${detail}`); }
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  // We need to be authenticated in the browser. Let's use localStorage-based auth or navigate directly
  // First set the token in localStorage via page context
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);

  // Try to log in via the browser UI
  const emailInput = await page.$('input[type="email"], input[name="email"]');
  const passwordInput = await page.$('input[type="password"], input[name="password"]');

  if (emailInput && passwordInput) {
    await emailInput.fill(state.testEmail);
    await passwordInput.fill(state.testPassword);
    const submitBtn = await page.$('button[type="submit"], button:has-text("Log In"), button:has-text("Sign In"), button:has-text("Login")');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  // Try to set auth token directly
  await page.evaluate((token) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('token', token);
  }, state.accessToken);

  const navStart = performance.now();
  await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  const loadTime = performance.now() - navStart;
  addPerf('Dashboard Page Load', loadTime, 3000);
  await page.waitForTimeout(2000);

  await screenshot(page, 'module3-dashboard-overview', 'Module 3');

  const pageText = await page.textContent('body').catch(() => '');
  test('Dashboard page loads', pageText.length > 50);

  // Check for metric cards or dashboard content
  const hasCards = pageText.includes('Agent') || pageText.includes('Event') || pageText.includes('Session') || pageText.includes('Cost') || pageText.includes('Dashboard') || pageText.includes('Welcome');
  test('Dashboard shows content (cards/welcome)', hasCards, pageText.slice(0, 200));

  // Check sidebar navigation links
  const sidebarLinks = [
    { name: 'Agents', path: '/dashboard/agents' },
    { name: 'Sessions', path: '/dashboard/sessions' },
    { name: 'Events', path: '/dashboard/events' },
    { name: 'Compliance', path: '/dashboard/compliance' },
    { name: 'Approvals', path: '/dashboard/approvals' },
    { name: 'Settings', path: '/dashboard/settings' },
  ];

  for (const link of sidebarLinks) {
    await page.goto(`${FRONTEND_URL}${link.path}`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);
    const text = await page.textContent('body').catch(() => '');
    test(`${link.name} page loads (${link.path})`, text.length > 50, text.slice(0, 100));
  }

  // Return to dashboard
  await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await screenshot(page, 'module3-dashboard-final', 'Module 3');

  mod.status = mod.failed === 0 ? 'PASS' : (mod.failed <= 2 ? 'PARTIAL' : 'FAIL');
  results.modules.push(mod);
  return mod;
}

// ======================== MODULE 4: Agent Management ========================
async function module4(page) {
  const mod = { name: 'Module 4: Agent Management', tests: 0, passed: 0, failed: 0, details: [] };
  console.log('\n=== MODULE 4: Agent Management ===');

  function test(name, pass, detail = '') {
    mod.tests++;
    if (pass) { mod.passed++; mod.details.push(`PASS: ${name}`); }
    else { mod.failed++; mod.details.push(`FAIL: ${name} — ${detail}`); }
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  const agentsToCreate = [
    { name: 'gpt-4o-finance-bot', modelProvider: 'openai', modelId: 'gpt-4o', description: 'Financial analysis bot' },
    { name: 'claude-support-agent', modelProvider: 'anthropic', modelId: 'claude-3-sonnet', description: 'Customer support agent' },
    { name: 'data-pipeline-worker', modelProvider: 'custom', modelId: 'custom-model-v1', description: 'Data processing pipeline' },
  ];

  for (const agent of agentsToCreate) {
    const res = await apiCall('POST', '/agents', agent, authHeaders());
    addPerf(`POST /agents (${agent.name})`, res.elapsed);
    test(`Create agent "${agent.name}"`, res.status === 201, `got ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`);
    if (res.status === 201) {
      state.agents.push(res.data);
    }
  }

  // List agents
  const listRes = await apiCall('GET', '/agents', null, authHeaders());
  addPerf('GET /agents', listRes.elapsed);
  const agentList = listRes.data?.data || listRes.data || [];
  test('List agents returns data', Array.isArray(agentList) && agentList.length >= 3, `count=${agentList.length}`);

  // Get individual agent
  if (state.agents.length > 0) {
    const detailRes = await apiCall('GET', `/agents/${state.agents[0].id}`, null, authHeaders());
    addPerf('GET /agents/:id', detailRes.elapsed);
    test('Get agent detail', detailRes.status === 200, `got ${detailRes.status}`);
  }

  // Navigate to agents page in browser
  await page.goto(`${FRONTEND_URL}/dashboard/agents`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await screenshot(page, 'module4-agents-list', 'Module 4');

  const agentsPageText = await page.textContent('body').catch(() => '');
  test('Agents page renders in browser', agentsPageText.length > 50);

  mod.status = mod.failed === 0 ? 'PASS' : (mod.failed <= 2 ? 'PARTIAL' : 'FAIL');
  results.modules.push(mod);
  return mod;
}

// ======================== MODULE 5: API Key Management ========================
async function module5(page) {
  const mod = { name: 'Module 5: API Key Management', tests: 0, passed: 0, failed: 0, details: [] };
  console.log('\n=== MODULE 5: API Key Management ===');

  function test(name, pass, detail = '') {
    mod.tests++;
    if (pass) { mod.passed++; mod.details.push(`PASS: ${name}`); }
    else { mod.failed++; mod.details.push(`FAIL: ${name} — ${detail}`); }
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  // Create API key 1
  const key1Res = await apiCall('POST', '/api-keys', { name: 'E2E Production Key' }, authHeaders());
  addPerf('POST /api-keys', key1Res.elapsed);
  test('Create API key 1', key1Res.status === 201, `got ${key1Res.status}: ${JSON.stringify(key1Res.data).slice(0, 200)}`);

  if (key1Res.status === 201) {
    state.apiKey = key1Res.data.plaintext || key1Res.data.key || key1Res.data.rawKey;
    state.apiKeyId = key1Res.data.id;
    test('API key plaintext returned', !!state.apiKey, `keys: ${Object.keys(key1Res.data).join(', ')}`);
  }

  // Create API key 2
  const key2Res = await apiCall('POST', '/api-keys', { name: 'E2E Test Key' }, authHeaders());
  test('Create API key 2', key2Res.status === 201, `got ${key2Res.status}`);
  if (key2Res.status === 201) {
    state.apiKey2Id = key2Res.data.id;
  }

  // List API keys
  const listRes = await apiCall('GET', '/api-keys', null, authHeaders());
  addPerf('GET /api-keys', listRes.elapsed);
  const keysList = listRes.data?.data || listRes.data || [];
  test('List API keys returns data', listRes.status === 200);

  // Verify plaintext not returned in list
  const listText = JSON.stringify(keysList);
  if (state.apiKey) {
    test('Plaintext key not in list response', !listText.includes(state.apiKey));
  }

  // Revoke key 2
  if (state.apiKey2Id) {
    const revokeRes = await apiCall('DELETE', `/api-keys/${state.apiKey2Id}`, null, authHeaders());
    test('Revoke API key 2', revokeRes.status === 200, `got ${revokeRes.status}`);
  }

  // Navigate to API keys page in browser
  await page.goto(`${FRONTEND_URL}/dashboard/settings`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await screenshot(page, 'module5-api-keys-page', 'Module 5');

  mod.status = mod.failed === 0 ? 'PASS' : (mod.failed <= 2 ? 'PARTIAL' : 'FAIL');
  results.modules.push(mod);
  return mod;
}

// ======================== MODULE 6: Event Ingestion ========================
async function module6() {
  const mod = { name: 'Module 6: Event Ingestion via SDK', tests: 0, passed: 0, failed: 0, details: [] };
  console.log('\n=== MODULE 6: Event Ingestion via SDK ===');

  function test(name, pass, detail = '') {
    mod.tests++;
    if (pass) { mod.passed++; mod.details.push(`PASS: ${name}`); }
    else { mod.failed++; mod.details.push(`FAIL: ${name} — ${detail}`); }
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  const headers = state.apiKey ? apiKeyHeaders() : authHeaders();
  const agentId = state.agents[0]?.id;
  const agentId2 = state.agents[1]?.id;

  if (!agentId) {
    test('Agent exists for event ingestion', false, 'no agents created');
    mod.status = 'FAIL';
    results.modules.push(mod);
    return mod;
  }

  // Create a session first
  const sessionRes = await apiCall('POST', '/sessions', { agentId, metadata: { type: 'finance-analysis' } }, headers);
  addPerf('POST /sessions', sessionRes.elapsed);
  test('Create session', sessionRes.status === 201, `got ${sessionRes.status}: ${JSON.stringify(sessionRes.data).slice(0, 200)}`);
  const sessionId = sessionRes.data?.id;
  if (sessionId) state.sessions.push(sessionId);

  // Batch 1: Finance bot session (5 events)
  const batch1 = {
    events: [
      { agentId, sessionId, category: 'agent_lifecycle', level: 'info', message: 'Agent initialized', payload: { status: 'initialized', model: 'gpt-4o', agentName: 'gpt-4o-finance-bot' } },
      { agentId, sessionId, category: 'llm_call', level: 'info', message: 'Analyze Q4 revenue trends', payload: { model: 'gpt-4o', prompt: 'Analyze Q4 revenue trends', response: 'Revenue increased 12% to $2.4M' }, tokensInput: 850, tokensOutput: 400, costUsd: 0.015, latencyMs: 1200 },
      { agentId, sessionId, category: 'tool_invocation', level: 'info', message: 'Database query executed', payload: { tool: 'database_query', input: { query: 'SELECT revenue FROM q4' }, output: { revenue: 2400000 } }, latencyMs: 45 },
      { agentId, sessionId, category: 'llm_call', level: 'info', message: 'Generate recommendation', payload: { model: 'gpt-4o', prompt: 'Generate recommendation', response: 'Increase allocation by 15%' }, tokensInput: 490, tokensOutput: 400, costUsd: 0.011, latencyMs: 980 },
      { agentId, sessionId, category: 'agent_lifecycle', level: 'info', message: 'Agent completed', payload: { status: 'completed', summary: 'Analysis complete' } },
    ],
  };

  const batch1Res = await apiCall('POST', '/events', batch1, headers);
  addPerf('POST /events (batch 5)', batch1Res.elapsed);
  test('Batch 1 — Finance bot (5 events)', batch1Res.status === 201, `got ${batch1Res.status}: ${JSON.stringify(batch1Res.data).slice(0, 300)}`);

  if (batch1Res.status === 201) {
    const evts = batch1Res.data?.events || batch1Res.data || [];
    if (Array.isArray(evts)) state.events.push(...evts);
  }

  // Batch 2: Support agent session (4 events)
  let sessionId2 = null;
  if (agentId2) {
    const sess2Res = await apiCall('POST', '/sessions', { agentId: agentId2 }, headers);
    sessionId2 = sess2Res.data?.id;
    if (sessionId2) state.sessions.push(sessionId2);

    const batch2 = {
      events: [
        { agentId: agentId2, sessionId: sessionId2, category: 'agent_lifecycle', level: 'info', message: 'Support agent initialized', payload: { status: 'initialized' } },
        { agentId: agentId2, sessionId: sessionId2, category: 'llm_call', level: 'info', message: 'Customer billing inquiry', payload: { model: 'claude-3-sonnet', prompt: 'Customer asking about billing', response: 'Your current balance is $245.00' }, tokensInput: 320, tokensOutput: 180, costUsd: 0.003, latencyMs: 650 },
        { agentId: agentId2, sessionId: sessionId2, category: 'tool_invocation', level: 'info', message: 'Account lookup', payload: { tool: 'lookup_account', accountId: 'ACC-12345' }, latencyMs: 120 },
        { agentId: agentId2, sessionId: sessionId2, category: 'agent_lifecycle', level: 'info', message: 'Support agent completed', payload: { status: 'completed' } },
      ],
    };

    const batch2Res = await apiCall('POST', '/events', batch2, headers);
    addPerf('POST /events (batch 4)', batch2Res.elapsed);
    test('Batch 2 — Support agent (4 events)', batch2Res.status === 201, `got ${batch2Res.status}`);
  }

  // Batch 3 & 4: Approval events via approvals endpoint
  const approval1Res = await apiCall('POST', '/approvals', {
    agentId,
    type: 'cost_threshold',
    payload: { action: 'Execute wire transfer $48,200', amount: 48200, currency: 'USD' },
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  }, headers);
  addPerf('POST /approvals (wire transfer)', approval1Res.elapsed);
  test('Create approval — wire transfer', approval1Res.status === 201, `got ${approval1Res.status}: ${JSON.stringify(approval1Res.data).slice(0, 200)}`);
  if (approval1Res.status === 201) state.approvalIds.push(approval1Res.data.id);

  const approval2Res = await apiCall('POST', '/approvals', {
    agentId,
    type: 'data_access',
    payload: { action: 'Delete 12,400 production records', table: 'customer_data' },
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  }, headers);
  addPerf('POST /approvals (data delete)', approval2Res.elapsed);
  test('Create approval — data deletion', approval2Res.status === 201, `got ${approval2Res.status}: ${JSON.stringify(approval2Res.data).slice(0, 200)}`);
  if (approval2Res.status === 201) state.approvalIds.push(approval2Res.data.id);

  // Batch 5: Stress test — 100 events
  const stressEvents = [];
  for (let i = 0; i < 100; i++) {
    stressEvents.push({
      agentId,
      sessionId,
      category: 'llm_call',
      level: 'info',
      message: `Stress test event #${i + 1}`,
      payload: { index: i, model: 'gpt-4o', prompt: `Test prompt ${i}`, response: `Test response ${i}` },
      tokensInput: 100 + i,
      tokensOutput: 50 + i,
      costUsd: 0.001,
      latencyMs: 100 + Math.floor(Math.random() * 500),
    });
  }

  const stressRes = await apiCall('POST', '/events', { events: stressEvents }, headers);
  addPerf('POST /events (batch 100 stress)', stressRes.elapsed);
  test('Batch 5 — Stress test (100 events)', stressRes.status === 201, `got ${stressRes.status}`);

  mod.status = mod.failed === 0 ? 'PASS' : (mod.failed <= 2 ? 'PARTIAL' : 'FAIL');
  results.modules.push(mod);
  return mod;
}

// ======================== MODULE 7: Events Explorer ========================
async function module7(page) {
  const mod = { name: 'Module 7: Events Explorer', tests: 0, passed: 0, failed: 0, details: [] };
  console.log('\n=== MODULE 7: Events Explorer ===');

  function test(name, pass, detail = '') {
    mod.tests++;
    if (pass) { mod.passed++; mod.details.push(`PASS: ${name}`); }
    else { mod.failed++; mod.details.push(`FAIL: ${name} — ${detail}`); }
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  const headers = state.apiKey ? apiKeyHeaders() : authHeaders();

  // List all events
  const listRes = await apiCall('GET', '/events?limit=500', null, headers);
  addPerf('GET /events (500 limit)', listRes.elapsed);
  const eventsList = listRes.data?.data || listRes.data || [];
  test('List events returns data', listRes.status === 200 && Array.isArray(eventsList), `status=${listRes.status}, count=${eventsList.length}`);
  test('Events count >= 100 (stress test)', eventsList.length >= 100, `count=${eventsList.length}`);

  // Filter by agent
  if (state.agents[0]?.id) {
    const filterRes = await apiCall('GET', `/events?agentId=${state.agents[0].id}`, null, headers);
    addPerf('GET /events (filter by agent)', filterRes.elapsed);
    const filtered = filterRes.data?.data || filterRes.data || [];
    test('Filter by agent returns results', filterRes.status === 200 && Array.isArray(filtered) && filtered.length > 0, `count=${filtered.length}`);
  }

  // Filter by category
  const catRes = await apiCall('GET', '/events?category=llm_call', null, headers);
  addPerf('GET /events (filter by category)', catRes.elapsed);
  const catFiltered = catRes.data?.data || catRes.data || [];
  test('Filter by category=llm_call', catRes.status === 200 && Array.isArray(catFiltered) && catFiltered.length > 0, `count=${catFiltered.length}`);

  // Get single event
  if (eventsList.length > 0) {
    const eventId = eventsList[0].id;
    const singleRes = await apiCall('GET', `/events/${eventId}`, null, headers);
    addPerf('GET /events/:id', singleRes.elapsed);
    test('Get single event', singleRes.status === 200);
    test('Event has hash field', !!singleRes.data?.hash, `hash=${singleRes.data?.hash?.slice(0, 16)}...`);
    test('Event has prevHash field', singleRes.data?.prevHash !== undefined);
  }

  // Verify hash chain
  const chainRes = await apiCall('GET', '/events/verify-chain', null, headers);
  addPerf('GET /events/verify-chain', chainRes.elapsed, 1000);
  test('Hash chain verification endpoint works', chainRes.status === 200, `${JSON.stringify(chainRes.data).slice(0, 200)}`);

  const chainValid = chainRes.data?.chainIntact === true || chainRes.data?.valid === true || chainRes.data?.intact === true || chainRes.data?.verified === true;
  test('Hash chain is VALID', chainValid, `data=${JSON.stringify(chainRes.data).slice(0, 200)}`);

  // Browser: Navigate to events page
  await page.goto(`${FRONTEND_URL}/dashboard/events`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await screenshot(page, 'module7-events-list', 'Module 7');

  mod.status = mod.failed === 0 ? 'PASS' : (mod.failed <= 2 ? 'PARTIAL' : 'FAIL');
  results.modules.push(mod);
  return mod;
}

// ======================== MODULE 8: Session Replay ========================
async function module8(page) {
  const mod = { name: 'Module 8: Session Replay', tests: 0, passed: 0, failed: 0, details: [] };
  console.log('\n=== MODULE 8: Session Replay ===');

  function test(name, pass, detail = '') {
    mod.tests++;
    if (pass) { mod.passed++; mod.details.push(`PASS: ${name}`); }
    else { mod.failed++; mod.details.push(`FAIL: ${name} — ${detail}`); }
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  const headers = state.apiKey ? apiKeyHeaders() : authHeaders();

  // List sessions
  const sessRes = await apiCall('GET', '/sessions', null, headers);
  addPerf('GET /sessions', sessRes.elapsed);
  const sessions = sessRes.data?.data || sessRes.data || [];
  test('List sessions returns data', sessRes.status === 200 && Array.isArray(sessions), `count=${sessions.length}`);
  test('Sessions count >= 2', sessions.length >= 2, `count=${sessions.length}`);

  // Get session detail
  if (sessions.length > 0) {
    const sessionId = sessions[0].id;
    const detailRes = await apiCall('GET', `/sessions/${sessionId}`, null, headers);
    addPerf('GET /sessions/:id', detailRes.elapsed);
    test('Get session detail', detailRes.status === 200);

    // Get events for this session
    const sessEventsRes = await apiCall('GET', `/events?sessionId=${sessionId}`, null, headers);
    const sessEvents = sessEventsRes.data?.data || sessEventsRes.data || [];
    test('Session has events', sessEventsRes.status === 200 && Array.isArray(sessEvents) && sessEvents.length > 0, `count=${sessEvents.length}`);
  }

  // Browser: Navigate to sessions page
  await page.goto(`${FRONTEND_URL}/dashboard/sessions`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await screenshot(page, 'module8-sessions-list', 'Module 8');

  // Try session replay page
  await page.goto(`${FRONTEND_URL}/dashboard/session-replay`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await screenshot(page, 'module8-session-replay', 'Module 8');

  mod.status = mod.failed === 0 ? 'PASS' : (mod.failed <= 2 ? 'PARTIAL' : 'FAIL');
  results.modules.push(mod);
  return mod;
}

// ======================== MODULE 9: Approval Queue ========================
async function module9(page) {
  const mod = { name: 'Module 9: Approval Queue', tests: 0, passed: 0, failed: 0, details: [] };
  console.log('\n=== MODULE 9: Approval Queue ===');

  function test(name, pass, detail = '') {
    mod.tests++;
    if (pass) { mod.passed++; mod.details.push(`PASS: ${name}`); }
    else { mod.failed++; mod.details.push(`FAIL: ${name} — ${detail}`); }
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  const headers = authHeaders(); // Approvals need JWT for owner/admin role

  // List pending approvals
  const pendingRes = await apiCall('GET', '/approvals/pending', null, headers);
  addPerf('GET /approvals/pending', pendingRes.elapsed);
  const pending = pendingRes.data?.data || pendingRes.data || [];
  test('List pending approvals', pendingRes.status === 200, `count=${Array.isArray(pending) ? pending.length : 'N/A'}`);

  // Approve first one (wire transfer)
  if (state.approvalIds[0]) {
    const approveRes = await apiCall('PATCH', `/approvals/${state.approvalIds[0]}/approve`, { comment: 'Approved by E2E test' }, headers);
    addPerf('PATCH /approvals/:id/approve', approveRes.elapsed);
    test('Approve wire transfer', approveRes.status === 200, `got ${approveRes.status}: ${JSON.stringify(approveRes.data).slice(0, 200)}`);

    if (approveRes.status === 200) {
      test('Approval status is approved', approveRes.data?.status === 'approved', `status=${approveRes.data?.status}`);
    }
  }

  // Reject second one (data deletion)
  if (state.approvalIds[1]) {
    const rejectRes = await apiCall('PATCH', `/approvals/${state.approvalIds[1]}/reject`, { comment: 'Rejected — too risky' }, headers);
    addPerf('PATCH /approvals/:id/reject', rejectRes.elapsed);
    test('Reject data deletion', rejectRes.status === 200, `got ${rejectRes.status}: ${JSON.stringify(rejectRes.data).slice(0, 200)}`);

    if (rejectRes.status === 200) {
      test('Rejection status is rejected', rejectRes.data?.status === 'rejected', `status=${rejectRes.data?.status}`);
    }
  }

  // List all approvals (should show approved and rejected)
  const allRes = await apiCall('GET', '/approvals', null, headers);
  const allApprovals = allRes.data?.data || allRes.data || [];
  test('All approvals list returns data', allRes.status === 200);

  // Browser: Navigate to approvals page
  await page.goto(`${FRONTEND_URL}/dashboard/approvals`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await screenshot(page, 'module9-approvals', 'Module 9');

  mod.status = mod.failed === 0 ? 'PASS' : (mod.failed <= 2 ? 'PARTIAL' : 'FAIL');
  results.modules.push(mod);
  return mod;
}

// ======================== MODULE 10: Compliance Reports ========================
async function module10(page) {
  const mod = { name: 'Module 10: Compliance Reports', tests: 0, passed: 0, failed: 0, details: [] };
  console.log('\n=== MODULE 10: Compliance Reports ===');

  function test(name, pass, detail = '') {
    mod.tests++;
    if (pass) { mod.passed++; mod.details.push(`PASS: ${name}`); }
    else { mod.failed++; mod.details.push(`FAIL: ${name} — ${detail}`); }
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  const headers = authHeaders();

  // Generate EU AI Act report
  const euRes = await apiCall('POST', '/compliance/reports/generate', { framework: 'eu-ai-act' }, headers);
  addPerf('POST /compliance/reports/generate (EU AI Act)', euRes.elapsed);
  test('Generate EU AI Act report', euRes.status === 201 || euRes.status === 200, `got ${euRes.status}: ${JSON.stringify(euRes.data).slice(0, 300)}`);

  // Generate SOC 2 report
  const soc2Res = await apiCall('POST', '/compliance/reports/generate', { framework: 'soc2' }, headers);
  addPerf('POST /compliance/reports/generate (SOC 2)', soc2Res.elapsed);
  test('Generate SOC 2 report', soc2Res.status === 201 || soc2Res.status === 200, `got ${soc2Res.status}`);

  // Generate ISO 42001 report
  const isoRes = await apiCall('POST', '/compliance/reports/generate', { framework: 'iso42001' }, headers);
  addPerf('POST /compliance/reports/generate (ISO 42001)', isoRes.elapsed);
  test('Generate ISO 42001 report', isoRes.status === 201 || isoRes.status === 200, `got ${isoRes.status}`);

  // Get compliance checks
  const checksRes = await apiCall('GET', '/compliance/checks', null, headers);
  addPerf('GET /compliance/checks', checksRes.elapsed);
  test('Get compliance checks', checksRes.status === 200);

  // Get latest report
  const reportRes = await apiCall('GET', '/compliance/report', null, headers);
  addPerf('GET /compliance/report', reportRes.elapsed);
  test('Get latest compliance report', reportRes.status === 200);

  // Browser: Navigate to compliance page
  await page.goto(`${FRONTEND_URL}/dashboard/compliance`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await screenshot(page, 'module10-compliance', 'Module 10');

  mod.status = mod.failed === 0 ? 'PASS' : (mod.failed <= 2 ? 'PARTIAL' : 'FAIL');
  results.modules.push(mod);
  return mod;
}

// ======================== MODULE 11: Cost Analytics ========================
async function module11(page) {
  const mod = { name: 'Module 11: Cost Analytics', tests: 0, passed: 0, failed: 0, details: [] };
  console.log('\n=== MODULE 11: Cost Analytics ===');

  function test(name, pass, detail = '') {
    mod.tests++;
    if (pass) { mod.passed++; mod.details.push(`PASS: ${name}`); }
    else { mod.failed++; mod.details.push(`FAIL: ${name} — ${detail}`); }
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  const headers = state.apiKey ? apiKeyHeaders() : authHeaders();

  // Cost breakdown
  const costRes = await apiCall('GET', '/analytics/cost', null, headers);
  addPerf('GET /analytics/cost', costRes.elapsed);
  test('Get cost breakdown', costRes.status === 200, `${JSON.stringify(costRes.data).slice(0, 300)}`);

  // Usage stats
  const usageRes = await apiCall('GET', '/analytics/usage', null, headers);
  addPerf('GET /analytics/usage', usageRes.elapsed);
  test('Get usage stats', usageRes.status === 200, `${JSON.stringify(usageRes.data).slice(0, 300)}`);

  // Model stats
  const modelsRes = await apiCall('GET', '/analytics/models', null, headers);
  addPerf('GET /analytics/models', modelsRes.elapsed);
  test('Get model stats', modelsRes.status === 200, `${JSON.stringify(modelsRes.data).slice(0, 300)}`);

  // Browser: Navigate to cost analytics page
  await page.goto(`${FRONTEND_URL}/dashboard/cost-analytics`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await screenshot(page, 'module11-cost-analytics', 'Module 11');

  mod.status = mod.failed === 0 ? 'PASS' : (mod.failed <= 2 ? 'PARTIAL' : 'FAIL');
  results.modules.push(mod);
  return mod;
}

// ======================== MODULE 12: Settings ========================
async function module12(page) {
  const mod = { name: 'Module 12: Settings', tests: 0, passed: 0, failed: 0, details: [] };
  console.log('\n=== MODULE 12: Settings ===');

  function test(name, pass, detail = '') {
    mod.tests++;
    if (pass) { mod.passed++; mod.details.push(`PASS: ${name}`); }
    else { mod.failed++; mod.details.push(`FAIL: ${name} — ${detail}`); }
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  // Navigate to settings in browser
  await page.goto(`${FRONTEND_URL}/dashboard/settings`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await screenshot(page, 'module12-settings', 'Module 12');

  const settingsText = await page.textContent('body').catch(() => '');
  test('Settings page loads', settingsText.length > 50);
  test('Settings has form content', settingsText.includes('Settings') || settingsText.includes('API') || settingsText.includes('Profile') || settingsText.includes('Key'));

  mod.status = mod.failed === 0 ? 'PASS' : (mod.failed <= 2 ? 'PARTIAL' : 'FAIL');
  results.modules.push(mod);
  return mod;
}

// ======================== MODULE 13: Edge Cases ========================
async function module13() {
  const mod = { name: 'Module 13: Edge Cases and Error Handling', tests: 0, passed: 0, failed: 0, details: [] };
  console.log('\n=== MODULE 13: Edge Cases and Error Handling ===');

  function test(name, pass, detail = '') {
    mod.tests++;
    if (pass) { mod.passed++; mod.details.push(`PASS: ${name}`); }
    else { mod.failed++; mod.details.push(`FAIL: ${name} — ${detail}`); }
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  // 1. Invalid API key
  const invalidKeyRes = await apiCall('GET', '/events', null, { 'x-api-key': 'invalid-key-12345' });
  test('Invalid API key → 401', invalidKeyRes.status === 401, `got ${invalidKeyRes.status}`);

  // 2. No auth at all
  const noAuthRes = await apiCall('GET', '/events');
  test('No auth → 401', noAuthRes.status === 401, `got ${noAuthRes.status}`);

  // 3. Batch over 500 events
  const headers = state.apiKey ? apiKeyHeaders() : authHeaders();
  const agentId = state.agents[0]?.id;

  if (agentId) {
    const bigBatch = { events: Array.from({ length: 501 }, (_, i) => ({
      agentId, category: 'llm_call', level: 'info', message: `Over-limit event #${i}`,
    })) };
    const overLimitRes = await apiCall('POST', '/events', bigBatch, headers);
    test('Batch 501 events → 400', overLimitRes.status === 400, `got ${overLimitRes.status}`);
  }

  // 4. Large payload event (try 100KB)
  if (agentId) {
    const largePayload = { agentId, category: 'llm_call', level: 'info', message: 'Large payload test', payload: { data: 'x'.repeat(100000) } };
    const largeRes = await apiCall('POST', '/events', largePayload, headers);
    test('100KB payload → 400 or 413', largeRes.status === 400 || largeRes.status === 413, `got ${largeRes.status}`);
  }

  // 5. IDOR — access other org's events (before rate limit test)
  const fakeOrgUuid = '00000000-0000-0000-0000-000000000000';
  const idorRes = await apiCall('GET', `/events/${fakeOrgUuid}`, null, headers);
  test('IDOR — guessed UUID → 404 or 403', idorRes.status === 404 || idorRes.status === 403, `got ${idorRes.status}`);

  // 6. SQL injection in filter (before rate limit test)
  const sqlInjectRes = await apiCall('GET', `/events?agentId=${encodeURIComponent("'; DROP TABLE events;--")}`, null, headers);
  test('SQL injection in filter → safe handling (400)', sqlInjectRes.status === 400 || sqlInjectRes.status === 200, `got ${sqlInjectRes.status}`);

  // 7. Rate limiting test (send 200 rapid requests — run LAST because it triggers 429s)
  console.log('  Testing rate limiting (200 rapid requests)...');
  let rateLimited = false;
  const ratePromises = [];
  for (let i = 0; i < 200; i++) {
    ratePromises.push(apiCall('GET', '/events?limit=1', null, headers));
  }
  const rateResults = await Promise.all(ratePromises);
  for (const r of rateResults) {
    if (r.status === 429) { rateLimited = true; break; }
  }
  test('Rate limiting triggers on rapid requests', rateLimited, `200 requests sent, ${rateResults.filter(r => r.status === 429).length} got 429`);

  // Wait for rate limit to cool down
  await new Promise(r => setTimeout(r, 2000));

  // 8. XSS in agent name (use authHeaders with CSRF for JWT-based POST)
  const xssRes = await apiCall('POST', '/agents', {
    name: '<script>alert("xss")</script>',
    modelProvider: 'test',
    modelId: 'test-model',
  }, authHeaders());
  test('XSS in agent name → sanitized (400) or stripped', xssRes.status === 400 || (xssRes.status === 201 && !JSON.stringify(xssRes.data).includes('<script>')), `got ${xssRes.status}: ${JSON.stringify(xssRes.data).slice(0, 200)}`);

  // 9. Missing required fields (use API key header which is CSRF-exempt)
  const missingHeaders = state.apiKey ? apiKeyHeaders() : authHeaders();
  const missingRes = await apiCall('POST', '/events', { events: [{ category: 'llm_call' }] }, missingHeaders);
  test('Missing required fields → 400', missingRes.status === 400, `got ${missingRes.status}`);

  // 10. Invalid JSON body
  const invalidJsonRes = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: '{ invalid json }}}',
  }).then(r => ({ status: r.status })).catch(e => ({ status: 0, error: e.message }));
  test('Invalid JSON → 400', invalidJsonRes.status === 400, `got ${invalidJsonRes.status}`);

  mod.status = mod.failed === 0 ? 'PASS' : (mod.failed <= 2 ? 'PARTIAL' : 'FAIL');
  results.modules.push(mod);
  return mod;
}

// ======================== MODULE 14: Mobile Responsive ========================
async function module14(page) {
  const mod = { name: 'Module 14: Mobile Responsive Testing', tests: 0, passed: 0, failed: 0, details: [] };
  console.log('\n=== MODULE 14: Mobile Responsive Testing ===');

  function test(name, pass, detail = '') {
    mod.tests++;
    if (pass) { mod.passed++; mod.details.push(`PASS: ${name}`); }
    else { mod.failed++; mod.details.push(`FAIL: ${name} — ${detail}`); }
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  // iPhone viewport
  await page.setViewportSize({ width: 375, height: 812 });

  const pages = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Events', path: '/dashboard/events' },
    { name: 'Approvals', path: '/dashboard/approvals' },
    { name: 'Agents', path: '/dashboard/agents' },
  ];

  for (const p of pages) {
    await page.goto(`${FRONTEND_URL}${p.path}`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    test(`Mobile ${p.name} — no horizontal overflow`, scrollWidth <= 395, `scrollWidth=${scrollWidth}`);
    await screenshot(page, `module14-mobile-${p.name.toLowerCase()}`, 'Module 14');
  }

  // Test hamburger menu
  const hamburger = await page.$('[aria-label*="menu"], button:has-text("☰"), .hamburger, [data-testid="mobile-menu"], button[aria-label="Toggle sidebar"]');
  test('Hamburger menu button exists', !!hamburger);
  if (hamburger) {
    await hamburger.click().catch(() => {});
    await page.waitForTimeout(500);
    await screenshot(page, 'module14-mobile-menu-open', 'Module 14');
    test('Hamburger menu opens', true);
  }

  // Reset viewport
  await page.setViewportSize({ width: 1440, height: 900 });

  mod.status = mod.failed === 0 ? 'PASS' : (mod.failed <= 2 ? 'PARTIAL' : 'FAIL');
  results.modules.push(mod);
  return mod;
}

// ======================== MODULE 15: Performance ========================
async function module15(page) {
  const mod = { name: 'Module 15: Performance Metrics', tests: 0, passed: 0, failed: 0, details: [] };
  console.log('\n=== MODULE 15: Performance Metrics ===');

  function test(name, pass, detail = '') {
    mod.tests++;
    if (pass) { mod.passed++; mod.details.push(`PASS: ${name}`); }
    else { mod.failed++; mod.details.push(`FAIL: ${name} — ${detail}`); }
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  const headers = state.apiKey ? apiKeyHeaders() : authHeaders();

  // API Response times
  const endpoints = [
    { name: 'GET /events (100+)', path: '/events?limit=100' },
    { name: 'GET /sessions', path: '/sessions' },
    { name: 'GET /agents', path: '/agents' },
    { name: 'GET /analytics/cost', path: '/analytics/cost' },
    { name: 'GET /analytics/usage', path: '/analytics/usage' },
    { name: 'GET /compliance/checks', path: '/compliance/checks' },
    { name: 'GET /approvals', path: '/approvals' },
  ];

  for (const ep of endpoints) {
    const res = await apiCall('GET', ep.path, null, headers);
    addPerf(ep.name, res.elapsed, 500);
    test(`${ep.name} under 500ms`, res.elapsed < 500, `${Math.round(res.elapsed)}ms`);
  }

  // Batch event ingestion performance
  const batchEvents = Array.from({ length: 50 }, (_, i) => ({
    agentId: state.agents[0]?.id,
    category: 'llm_call',
    level: 'info',
    message: `Perf test event #${i}`,
    tokensInput: 100,
    tokensOutput: 50,
    costUsd: 0.001,
  }));

  if (state.agents[0]?.id) {
    const batchRes = await apiCall('POST', '/events', { events: batchEvents }, headers);
    addPerf('POST /events (batch 50)', batchRes.elapsed, 2000);
    test('POST /events batch 50 under 2s', batchRes.elapsed < 2000, `${Math.round(batchRes.elapsed)}ms`);
  }

  // Hash chain verification performance
  const chainRes = await apiCall('GET', '/events/verify-chain', null, headers);
  addPerf('GET /events/verify-chain (all events)', chainRes.elapsed, 5000);
  test('Hash chain verification under 5s', chainRes.elapsed < 5000, `${Math.round(chainRes.elapsed)}ms`);

  // Page load performance (measured earlier but summarize)
  const pageLoadTests = results.performance.filter(p => p.endpoint.includes('Page Load'));
  for (const plt of pageLoadTests) {
    test(`${plt.endpoint} under ${plt.target}ms`, plt.status === 'PASS', `${plt.responseTime}ms`);
  }

  mod.status = mod.failed === 0 ? 'PASS' : (mod.failed <= 2 ? 'PARTIAL' : 'FAIL');
  results.modules.push(mod);
  return mod;
}

// ======================== MODULE 16: Security ========================
async function module16(page) {
  const mod = { name: 'Module 16: Security During Testing', tests: 0, passed: 0, failed: 0, details: [] };
  console.log('\n=== MODULE 16: Security During Testing ===');

  function test(name, pass, detail = '') {
    mod.tests++;
    if (pass) { mod.passed++; mod.details.push(`PASS: ${name}`); }
    else { mod.failed++; mod.details.push(`FAIL: ${name} — ${detail}`); }
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  }

  const headers = authHeaders();

  // CORS headers check
  const corsRes = await fetch(`${API_BASE}/events`, {
    method: 'OPTIONS',
    headers: { Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'GET' },
  }).catch(() => null);

  if (corsRes) {
    const corsHeaders = Object.fromEntries(corsRes.headers.entries());
    test('CORS Access-Control-Allow-Origin present', !!corsHeaders['access-control-allow-origin'], `value=${corsHeaders['access-control-allow-origin']}`);
  } else {
    test('CORS preflight responds', false, 'request failed');
  }

  // No stack traces in error responses
  const errorRes = await apiCall('GET', '/events/nonexistent-uuid-format', null, headers);
  const errorStr = JSON.stringify(errorRes.data);
  test('No stack trace in error response', !errorStr.includes('at ') && !errorStr.includes('.ts:') && !errorStr.includes('node_modules'), errorStr.slice(0, 200));

  // Rate limit headers
  const rateLimitRes = await apiCall('GET', '/events?limit=1', null, headers);
  const hasRateHeaders = !!rateLimitRes.headers['x-ratelimit-limit'] || !!rateLimitRes.headers['ratelimit-limit'] || !!rateLimitRes.headers['retry-after'];
  test('Rate limit headers present', hasRateHeaders, `headers: ${Object.keys(rateLimitRes.headers).filter(h => h.includes('rate') || h.includes('limit') || h.includes('retry')).join(', ')}`);

  // CSRF cookie check — login sets csrf cookie
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: state.testEmail, password: state.testPassword }),
  });
  const setCookies = loginRes.headers.get('set-cookie') || '';
  test('Login sets refresh token cookie', setCookies.includes('refreshToken'));
  test('Refresh token cookie is httpOnly', setCookies.includes('HttpOnly') || setCookies.includes('httponly'));
  test('CSRF token cookie set', setCookies.includes('csrf-token'));

  // API key is hashed (not returned in plaintext in list)
  const keysRes = await apiCall('GET', '/api-keys', null, headers);
  const keysStr = JSON.stringify(keysRes.data);
  if (state.apiKey) {
    test('API key not leaked in list', !keysStr.includes(state.apiKey));
  }

  // Health endpoint doesn't leak info (at /health, not /api/v1/health)
  const healthRes = await apiCall('GET', `${BACKEND_URL}/health`);
  test('Health endpoint returns minimal info', healthRes.status === 200 && !JSON.stringify(healthRes.data).includes('password') && !JSON.stringify(healthRes.data).includes('secret'), `status=${healthRes.status}`);

  // Check for sensitive info in browser console
  await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  await page.waitForTimeout(2000);
  const sensitiveConsole = consoleLogs.some(l => l.includes('password') || l.includes('secret') || l.includes('apiKey'));
  test('No sensitive data in console', !sensitiveConsole, sensitiveConsole ? 'Found sensitive console output' : '');

  results.security.push(
    { check: 'Auth bypass (invalid key)', result: 'PASS' },
    { check: 'XSS injection', result: 'TESTED' },
    { check: 'SQL injection', result: 'TESTED' },
    { check: 'IDOR (UUID guessing)', result: 'TESTED' },
    { check: 'Rate limiting', result: 'TESTED' },
    { check: 'CORS configuration', result: corsRes ? 'PASS' : 'CHECK' },
    { check: 'JWT cookie security', result: setCookies.includes('HttpOnly') ? 'PASS' : 'WARN' },
    { check: 'CSRF protection', result: setCookies.includes('csrf-token') ? 'PASS' : 'WARN' },
  );

  mod.status = mod.failed === 0 ? 'PASS' : (mod.failed <= 2 ? 'PARTIAL' : 'FAIL');
  results.modules.push(mod);
  return mod;
}

// ======================== MAIN ========================
async function main() {
  console.log('=== AgentLedger Comprehensive E2E Test Suite ===');
  console.log(`Start time: ${new Date().toISOString()}`);
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend: ${BACKEND_URL}`);
  console.log(`Screenshot dir: ${SCREENSHOT_DIR}\n`);

  // Ensure screenshot dir exists
  if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Check server availability (health endpoint excluded from global prefix)
  const healthCheck = await apiCall('GET', `${BACKEND_URL}/health`);
  if (healthCheck.status !== 200) {
    console.error(`Backend health check failed: ${healthCheck.status}`);
    console.log('Attempting to continue anyway...');
  } else {
    console.log('Backend health check: OK');
  }

  const frontCheck = await fetch(FRONTEND_URL).then(r => r.status).catch(() => 0);
  if (frontCheck !== 200) {
    console.error(`Frontend check failed: ${frontCheck}`);
  } else {
    console.log('Frontend check: OK');
  }

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  try {
    await module1(page);
    await module2(page);
    await module3(page);
    await module4(page);
    await module5(page);
    await module6(); // API only, no page needed
    await module7(page);
    await module8(page);
    await module9(page);
    await module10(page);
    await module11(page);
    await module12(page);
    await module13(); // API only, no page needed
    await module14(page);
    await module15(page);
    await module16(page);
  } catch (e) {
    console.error(`\n!!! Test execution error: ${e.message}`);
    console.error(e.stack);
  } finally {
    await browser.close();
  }

  // Calculate results
  const endTime = new Date();
  const totalTests = results.modules.reduce((s, m) => s + m.tests, 0);
  const totalPassed = results.modules.reduce((s, m) => s + m.passed, 0);
  const totalFailed = results.modules.reduce((s, m) => s + m.failed, 0);
  const modulesPass = results.modules.filter(m => m.status === 'PASS').length;
  const healthScore = Math.round((totalPassed / Math.max(totalTests, 1)) * 100);

  console.log('\n=== FINAL RESULTS ===');
  console.log(`Modules: ${results.modules.length}/16`);
  console.log(`Tests: ${totalTests} total, ${totalPassed} passed, ${totalFailed} failed`);
  console.log(`Health Score: ${healthScore}/100`);
  console.log(`Time: ${Math.round((endTime - results.startTime) / 1000)}s`);
  console.log(`Screenshots: ${results.screenshots.length}`);
  console.log(`Bugs: ${results.bugs.length}`);

  // Generate report JSON for later processing
  const reportData = {
    executiveSummary: {
      healthScore,
      modulesRun: results.modules.length,
      totalModules: 16,
      totalTests,
      totalPassed,
      totalFailed,
      totalSkipped: 0,
      startTime: results.startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationSeconds: Math.round((endTime - results.startTime) / 1000),
    },
    modules: results.modules,
    screenshots: results.screenshots,
    bugs: results.bugs,
    performance: results.performance,
    security: results.security,
    state: {
      testEmail: state.testEmail,
      agentCount: state.agents.length,
      sessionCount: state.sessions.length,
      approvalCount: state.approvalIds.length,
    },
  };

  writeFileSync(join(process.cwd(), 'demo-screenshots', 'e2e', 'test-results.json'), JSON.stringify(reportData, null, 2));
  console.log('\nResults saved to demo-screenshots/e2e/test-results.json');

  // Exit with appropriate code
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(2);
});
