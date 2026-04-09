/**
 * AgentLedger — Full Customer Journey E2E Test
 *
 * Tests the complete flow a new customer would experience:
 *   signup → login → create agent → create API key → post events
 *   → verify hash chain → get analytics → generate compliance report
 *
 * All steps run serially because each builds on the previous step's state.
 * The backend must be running on http://localhost:3001 before executing.
 *
 * Run: npx playwright test tests/e2e/full-journey.spec.ts --config playwright.config.ts
 */

import { test, expect, APIRequestContext, APIResponse } from 'playwright/test';

// ---------------------------------------------------------------------------
// Shared journey state — populated step by step
// ---------------------------------------------------------------------------

interface JourneyState {
  accessToken: string;
  csrfToken: string;
  userId: string;
  orgId: string;
  agentId: string;
  apiKey: string;
  sessionId: string;
}

const state: Partial<JourneyState> = {};

// Unique per test-run so parallel CI runs don't collide on duplicate-email checks
const RUN_ID = Date.now();
const TEST_EMAIL = `journey-${RUN_ID}@e2e.test`;
const TEST_PASSWORD = 'E2eTestPass!99';
const TEST_DISPLAY_NAME = 'Journey Tester';
const TEST_ORG_NAME = `E2E Org ${RUN_ID}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse the csrf-token cookie from a Set-Cookie header. */
function extractCsrfCookie(response: APIResponse): string | undefined {
  const setCookieHeader = response.headersArray().filter(
    (h) => h.name.toLowerCase() === 'set-cookie',
  );
  for (const header of setCookieHeader) {
    const match = header.value.match(/csrf-token=([^;]+)/);
    if (match) return match[1];
  }
  return undefined;
}

/** Build headers for JWT-authenticated state-changing requests. */
function jwtHeaders(token: string, csrf: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf,
    // Mirror the csrf-token cookie value as a Cookie header so NestJS
    // cookie-parser can read it in the test environment (no real browser).
    Cookie: `csrf-token=${csrf}`,
  };
}

/** Build headers for JWT-authenticated GET requests (no CSRF needed). */
function jwtGetHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// ---------------------------------------------------------------------------
// The journey
// ---------------------------------------------------------------------------

test.describe.serial('Full Customer Journey', () => {
  // -------------------------------------------------------------------------
  // Step 1: Signup
  // -------------------------------------------------------------------------
  test('1. Signup — creates new user and organisation', async ({ request }) => {
    const response = await request.post('/api/v1/auth/signup', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        displayName: TEST_DISPLAY_NAME,
        orgName: TEST_ORG_NAME,
      },
    });

    expect(response.status(), `signup should return 201, got: ${await response.text()}`).toBe(201);

    const body = await response.json();

    // Shape assertions
    expect(body, 'response must have accessToken').toHaveProperty('accessToken');
    expect(body, 'response must have user').toHaveProperty('user');
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(0);

    // User object
    const { user } = body;
    expect(user.email).toBe(TEST_EMAIL);
    expect(user.displayName).toBe(TEST_DISPLAY_NAME);
    expect(user.id, 'user.id must be a non-empty string').toBeTruthy();
    expect(user.orgId, 'user.orgId must be a non-empty string').toBeTruthy();

    // CSRF cookie is set after signup
    const csrf = extractCsrfCookie(response);
    expect(csrf, 'csrf-token cookie must be set on signup').toBeTruthy();

    // Persist state for subsequent steps
    state.accessToken = body.accessToken;
    state.csrfToken = csrf!;
    state.userId = user.id;
    state.orgId = user.orgId;
  });

  // -------------------------------------------------------------------------
  // Step 2: Login
  // -------------------------------------------------------------------------
  test('2. Login — returns fresh access token', async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
    });

    expect(response.status(), `login should return 200, got: ${await response.text()}`).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('accessToken');
    expect(body).toHaveProperty('user');
    expect(body.user.email).toBe(TEST_EMAIL);
    expect(body.user.orgId).toBe(state.orgId);

    // Refresh the CSRF token — login sets a new one
    const csrf = extractCsrfCookie(response);
    expect(csrf, 'csrf-token cookie must be set on login').toBeTruthy();

    // Use the freshly issued token for remaining steps
    state.accessToken = body.accessToken;
    state.csrfToken = csrf!;
  });

  // -------------------------------------------------------------------------
  // Step 3: Create Agent
  // -------------------------------------------------------------------------
  test('3. Create Agent — registers an AI agent in the organisation', async ({ request }) => {
    expect(state.accessToken, 'accessToken must be set from step 2').toBeTruthy();
    expect(state.csrfToken, 'csrfToken must be set from step 2').toBeTruthy();

    const response = await request.post('/api/v1/agents', {
      headers: jwtHeaders(state.accessToken!, state.csrfToken!),
      data: {
        name: 'E2E Finance Bot',
        modelProvider: 'openai',
        modelId: 'gpt-4o',
        description: 'E2E test agent for financial analysis',
      },
    });

    expect(response.status(), `create agent should return 201, got: ${await response.text()}`).toBe(201);

    const agent = await response.json();
    expect(agent.id, 'agent.id must be present').toBeTruthy();
    expect(agent.name).toBe('E2E Finance Bot');
    expect(agent.modelProvider).toBe('openai');
    expect(agent.modelId).toBe('gpt-4o');
    expect(agent.orgId).toBe(state.orgId);

    state.agentId = agent.id;
  });

  // -------------------------------------------------------------------------
  // Step 4: Create API Key
  // -------------------------------------------------------------------------
  test('4. Create API Key — returns plaintext key shown once', async ({ request }) => {
    expect(state.accessToken, 'accessToken must be set from step 3').toBeTruthy();
    expect(state.csrfToken, 'csrfToken must be set from step 3').toBeTruthy();

    const response = await request.post('/api/v1/api-keys', {
      headers: jwtHeaders(state.accessToken!, state.csrfToken!),
      data: {
        name: `E2E Key ${RUN_ID}`,
      },
    });

    expect(response.status(), `create api key should return 201, got: ${await response.text()}`).toBe(201);

    const body = await response.json();
    expect(body.key, 'plaintext key must be present in response').toBeTruthy();
    expect(typeof body.key).toBe('string');
    expect(body.key, 'key should start with al_live_sk_').toMatch(/^al_live_sk_/);
    expect(body.id, 'key id must be present').toBeTruthy();
    expect(body.name).toBe(`E2E Key ${RUN_ID}`);

    state.apiKey = body.key;
  });

  // -------------------------------------------------------------------------
  // Step 5: Post Events via API Key
  // -------------------------------------------------------------------------
  test('5. Post Events — ingests a realistic batch via API key auth', async ({ request }) => {
    expect(state.apiKey, 'apiKey must be set from step 4').toBeTruthy();
    expect(state.agentId, 'agentId must be set from step 3').toBeTruthy();

    const events = buildRealisticEventBatch(state.agentId!);

    const response = await request.post('/api/v1/events', {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': state.apiKey!,
      },
      data: { events },
    });

    expect(response.status(), `post events should return 201, got: ${await response.text()}`).toBe(201);

    const body = await response.json();
    // The service returns the created events (or a summary with count)
    // Accept either an array or an object with a count/events property
    if (Array.isArray(body)) {
      expect(body.length, 'all 5 events should be created').toBe(5);
      state.sessionId = body[0]?.sessionId;
    } else if (body.events && Array.isArray(body.events)) {
      expect(body.events.length, 'all 5 events should be created').toBe(5);
      state.sessionId = body.events[0]?.sessionId;
    } else {
      // Some implementations return { created: N }
      expect(body).toHaveProperty('created');
      expect(body.created).toBe(5);
    }
  });

  // -------------------------------------------------------------------------
  // Step 6: Verify Hash Chain
  // -------------------------------------------------------------------------
  test('6. Verify Hash Chain — all events must form an intact chain', async ({ request }) => {
    expect(state.accessToken, 'accessToken must be set from step 2').toBeTruthy();

    const response = await request.get('/api/v1/events/verify-chain', {
      headers: jwtGetHeaders(state.accessToken!),
    });

    expect(response.status(), `verify-chain should return 200, got: ${await response.text()}`).toBe(200);

    const body = await response.json();
    expect(body, 'response must have chainIntact').toHaveProperty('chainIntact');
    expect(body.chainIntact, 'chainIntact must be true — no tampering detected').toBe(true);
    expect(body, 'response must have totalEvents').toHaveProperty('totalEvents');
    expect(body.totalEvents, 'totalEvents must be a number').toBeGreaterThanOrEqual(5);
    expect(body, 'response must have verifiedEvents').toHaveProperty('verifiedEvents');
    expect(body.verifiedEvents).toBe(body.totalEvents);
    expect(body, 'response must have brokenLinks').toHaveProperty('brokenLinks');
    expect(body.brokenLinks, 'brokenLinks must be 0').toBe(0);
  });

  // -------------------------------------------------------------------------
  // Step 7a: Analytics — Usage
  // -------------------------------------------------------------------------
  test('7a. Analytics Usage — returns org usage statistics', async ({ request }) => {
    expect(state.accessToken, 'accessToken must be set').toBeTruthy();

    const response = await request.get('/api/v1/analytics/usage', {
      headers: jwtGetHeaders(state.accessToken!),
    });

    expect(response.status(), `analytics/usage should return 200, got: ${await response.text()}`).toBe(200);

    const body = await response.json();
    // Shape: must be an object with numeric fields (totalEvents, totalTokens, etc.)
    expect(body).not.toBeNull();
    expect(typeof body).toBe('object');
    // At minimum the endpoint returned successfully — field names vary by implementation
    // Validate that at least one sensible numeric field is present
    const hasNumericField = Object.values(body).some((v) => typeof v === 'number');
    expect(hasNumericField, 'usage response must contain at least one numeric metric').toBe(true);
  });

  // -------------------------------------------------------------------------
  // Step 7b: Analytics — Cost
  // -------------------------------------------------------------------------
  test('7b. Analytics Cost — returns cost breakdown', async ({ request }) => {
    expect(state.accessToken, 'accessToken must be set').toBeTruthy();

    const response = await request.get('/api/v1/analytics/cost', {
      headers: jwtGetHeaders(state.accessToken!),
    });

    expect(response.status(), `analytics/cost should return 200, got: ${await response.text()}`).toBe(200);

    const body = await response.json();
    expect(body).not.toBeNull();
    expect(typeof body).toBe('object');
  });

  // -------------------------------------------------------------------------
  // Step 8: Generate Compliance Report
  // -------------------------------------------------------------------------
  test('8. Generate Compliance Report — eu-ai-act framework', async ({ request }) => {
    expect(state.accessToken, 'accessToken must be set').toBeTruthy();
    expect(state.csrfToken, 'csrfToken must be set').toBeTruthy();

    const response = await request.post('/api/v1/compliance/reports/generate', {
      headers: jwtHeaders(state.accessToken!, state.csrfToken!),
      data: {
        framework: 'eu-ai-act',
      },
    });

    expect(response.status(), `compliance report should return 201, got: ${await response.text()}`).toBe(201);

    const body = await response.json();
    expect(body).not.toBeNull();
    // Report must have an id and at minimum a framework field
    expect(body, 'report must have an id').toHaveProperty('id');
    expect(body.framework ?? body.frameworks ?? body.type).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Step 9: Generate Compliance Report — soc2
  // -------------------------------------------------------------------------
  test('9. Generate Compliance Report — soc2 framework', async ({ request }) => {
    expect(state.accessToken, 'accessToken must be set').toBeTruthy();
    expect(state.csrfToken, 'csrfToken must be set').toBeTruthy();

    const response = await request.post('/api/v1/compliance/reports/generate', {
      headers: jwtHeaders(state.accessToken!, state.csrfToken!),
      data: {
        framework: 'soc2',
      },
    });

    expect(response.status(), `soc2 compliance report should return 201, got: ${await response.text()}`).toBe(201);

    const body = await response.json();
    expect(body).not.toBeNull();
    expect(body).toHaveProperty('id');
  });

  // -------------------------------------------------------------------------
  // Step 10: Generate Compliance Report — iso42001
  // -------------------------------------------------------------------------
  test('10. Generate Compliance Report — iso42001 framework', async ({ request }) => {
    expect(state.accessToken, 'accessToken must be set').toBeTruthy();
    expect(state.csrfToken, 'csrfToken must be set').toBeTruthy();

    const response = await request.post('/api/v1/compliance/reports/generate', {
      headers: jwtHeaders(state.accessToken!, state.csrfToken!),
      data: {
        framework: 'iso42001',
      },
    });

    expect(response.status(), `iso42001 compliance report should return 201, got: ${await response.text()}`).toBe(201);

    const body = await response.json();
    expect(body).not.toBeNull();
    expect(body).toHaveProperty('id');
  });

  // -------------------------------------------------------------------------
  // Step 11: Fetch Events List — verify events are queryable
  // -------------------------------------------------------------------------
  test('11. List Events — events are visible via JWT auth', async ({ request }) => {
    expect(state.accessToken, 'accessToken must be set').toBeTruthy();
    expect(state.agentId, 'agentId must be set').toBeTruthy();

    const response = await request.get(
      `/api/v1/events?agentId=${state.agentId!}&limit=10`,
      { headers: jwtGetHeaders(state.accessToken!) },
    );

    expect(response.status(), `list events should return 200, got: ${await response.text()}`).toBe(200);

    const body = await response.json();
    // Accept { data: [...] } or plain array
    const events = Array.isArray(body) ? body : (body.data ?? body.events ?? []);
    expect(Array.isArray(events), 'events must be an array').toBe(true);
    expect(events.length, 'at least 5 events should be returned').toBeGreaterThanOrEqual(5);

    // Verify event shape
    const firstEvent = events[0];
    expect(firstEvent).toHaveProperty('id');
    expect(firstEvent).toHaveProperty('agentId');
    expect(firstEvent.agentId).toBe(state.agentId);
    expect(firstEvent).toHaveProperty('hash');
    expect(typeof firstEvent.hash).toBe('string');
    expect(firstEvent.hash.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Event batch factory — realistic LLM workflow
// ---------------------------------------------------------------------------

function buildRealisticEventBatch(agentId: string): object[] {
  return [
    // 1. Agent initialization
    {
      agentId,
      category: 'agent_lifecycle',
      level: 'info',
      message: 'Agent initialized — model loaded and ready',
      payload: {
        model: 'gpt-4o',
        version: '2.1.0',
        environment: 'production',
        initDurationMs: 342,
      },
    },
    // 2. LLM call — document analysis
    {
      agentId,
      category: 'llm_call',
      level: 'info',
      message: 'Analyze Q4 revenue report for ACME Corp',
      payload: {
        prompt: 'Analyze the Q4 revenue trends and identify key drivers.',
        model: 'gpt-4o',
        temperature: 0.2,
        maxTokens: 1000,
      },
      tokensInput: 512,
      tokensOutput: 847,
      costUsd: 0.00512,
      latencyMs: 1823,
    },
    // 3. Tool invocation — database query
    {
      agentId,
      category: 'tool_invocation',
      level: 'info',
      message: 'Query financial database for Q4 figures',
      payload: {
        tool: 'sql_query',
        query: 'SELECT revenue, period FROM financials WHERE quarter = \'Q4\'',
        rowsReturned: 12,
        executionMs: 45,
      },
      latencyMs: 45,
    },
    // 4. Second LLM call — synthesis
    {
      agentId,
      category: 'llm_call',
      level: 'info',
      message: 'Synthesize revenue analysis into executive summary',
      payload: {
        model: 'gpt-4o',
        temperature: 0.3,
        maxTokens: 500,
      },
      tokensInput: 1024,
      tokensOutput: 412,
      costUsd: 0.00314,
      latencyMs: 1102,
    },
    // 5. Agent completion
    {
      agentId,
      category: 'agent_lifecycle',
      level: 'info',
      message: 'Agent task completed successfully',
      payload: {
        tasksCompleted: 1,
        totalCostUsd: 0.00826,
        totalTokens: 2795,
        durationMs: 3312,
        outputDelivered: true,
      },
    },
  ];
}
