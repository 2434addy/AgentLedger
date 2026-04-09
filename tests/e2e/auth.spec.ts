/**
 * AgentLedger — Auth Edge Cases E2E Test
 *
 * Covers error paths and boundary conditions for the auth module:
 *   - Duplicate email signup
 *   - Wrong password login
 *   - Refresh token rotation
 *   - Expired / missing token returns 401
 *   - CSRF guard enforcement on JWT-protected mutations
 *
 * Each test is fully independent — no shared state between tests.
 *
 * Run: npx playwright test tests/e2e/auth.spec.ts --config playwright.config.ts
 */

import { test, expect } from 'playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE = 'http://localhost:3001';

function uniqueEmail(): string {
  return `auth-edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@e2e.test`;
}

const VALID_PASSWORD = 'AuthEdge!Pass1';

interface SignupResult {
  accessToken: string;
  csrfToken: string;
  refreshTokenCookie: string;
  userId: string;
  orgId: string;
}

/** Sign up a fresh user and return credentials. */
async function signupFreshUser(
  request: import('playwright/test').APIRequestContext,
  email = uniqueEmail(),
): Promise<SignupResult> {
  const response = await request.post('/api/v1/auth/signup', {
    headers: { 'Content-Type': 'application/json' },
    data: {
      email,
      password: VALID_PASSWORD,
      displayName: 'Edge Case User',
      orgName: `Edge Org ${Date.now()}`,
    },
  });

  expect(response.status(), `signup helper failed: ${await response.text()}`).toBe(201);
  const body = await response.json();

  // Extract cookies from the Set-Cookie headers
  let csrfToken = '';
  let refreshTokenCookie = '';
  for (const header of response.headersArray()) {
    if (header.name.toLowerCase() !== 'set-cookie') continue;
    const csrfMatch = header.value.match(/csrf-token=([^;]+)/);
    if (csrfMatch) csrfToken = csrfMatch[1];
    const rtMatch = header.value.match(/refreshToken=([^;]+)/);
    if (rtMatch) refreshTokenCookie = rtMatch[1];
  }

  return {
    accessToken: body.accessToken as string,
    csrfToken,
    refreshTokenCookie,
    userId: body.user.id as string,
    orgId: body.user.orgId as string,
  };
}

// ---------------------------------------------------------------------------
// Signup edge cases
// ---------------------------------------------------------------------------

test.describe('Signup', () => {
  test('duplicate email returns 400 or 409', async ({ request }) => {
    const email = uniqueEmail();

    // First signup succeeds
    const first = await request.post('/api/v1/auth/signup', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email,
        password: VALID_PASSWORD,
        displayName: 'First User',
        orgName: `Duplicate Org ${Date.now()}`,
      },
    });
    expect(first.status()).toBe(201);

    // Second signup with the same email must fail
    const second = await request.post('/api/v1/auth/signup', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email,
        password: VALID_PASSWORD,
        displayName: 'Duplicate User',
        orgName: `Another Org ${Date.now()}`,
      },
    });

    expect(
      [400, 409],
      `duplicate email must return 400 or 409, got ${second.status()}: ${await second.text()}`,
    ).toContain(second.status());
  });

  test('missing required fields returns 400', async ({ request }) => {
    const response = await request.post('/api/v1/auth/signup', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        // email is intentionally omitted
        password: VALID_PASSWORD,
        displayName: 'Incomplete',
        orgName: 'Incomplete Org',
      },
    });

    expect(response.status(), 'missing email must return 400').toBe(400);
  });

  test('weak password returns 400', async ({ request }) => {
    const response = await request.post('/api/v1/auth/signup', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: uniqueEmail(),
        password: '123', // too short / weak
        displayName: 'Weak Password User',
        orgName: `WeakPwd Org ${Date.now()}`,
      },
    });

    expect(response.status(), 'weak password must return 400').toBe(400);
  });

  test('signup sets httpOnly refresh cookie and csrf-token cookie', async ({ request }) => {
    const email = uniqueEmail();
    const response = await request.post('/api/v1/auth/signup', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email,
        password: VALID_PASSWORD,
        displayName: 'Cookie Checker',
        orgName: `Cookie Org ${Date.now()}`,
      },
    });

    expect(response.status()).toBe(201);

    const setCookies = response
      .headersArray()
      .filter((h) => h.name.toLowerCase() === 'set-cookie')
      .map((h) => h.value);

    const hasRefreshToken = setCookies.some((c) => c.includes('refreshToken='));
    const hasCsrf = setCookies.some((c) => c.includes('csrf-token='));
    const refreshIsHttpOnly = setCookies.some(
      (c) => c.includes('refreshToken=') && c.toLowerCase().includes('httponly'),
    );
    const csrfIsNotHttpOnly = setCookies.some(
      (c) => c.includes('csrf-token=') && !c.toLowerCase().includes('httponly'),
    );

    expect(hasRefreshToken, 'refreshToken cookie must be set').toBe(true);
    expect(hasCsrf, 'csrf-token cookie must be set').toBe(true);
    expect(refreshIsHttpOnly, 'refreshToken must be httpOnly').toBe(true);
    expect(csrfIsNotHttpOnly, 'csrf-token must NOT be httpOnly (JS-readable)').toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Login edge cases
// ---------------------------------------------------------------------------

test.describe('Login', () => {
  test('wrong password returns 401', async ({ request }) => {
    const email = uniqueEmail();
    await signupFreshUser(request, email);

    const response = await request.post('/api/v1/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email,
        password: 'WrongPass!999',
      },
    });

    expect(response.status(), 'wrong password must return 401').toBe(401);
  });

  test('unknown email returns 401', async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: `ghost-${Date.now()}@nowhere.test`,
        password: VALID_PASSWORD,
      },
    });

    expect(response.status(), 'unknown email must return 401').toBe(401);
  });

  test('valid credentials return access token and user', async ({ request }) => {
    const email = uniqueEmail();
    await signupFreshUser(request, email);

    const response = await request.post('/api/v1/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: { email, password: VALID_PASSWORD },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('accessToken');
    expect(body).toHaveProperty('user');
    expect(body.user.email).toBe(email);
  });

  test('missing email field returns 400', async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        // email omitted
        password: VALID_PASSWORD,
      },
    });

    expect(response.status(), 'missing email must return 400').toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Refresh token flow
// ---------------------------------------------------------------------------

test.describe('Refresh Token', () => {
  test('refresh endpoint returns new access token when refresh cookie is present', async ({ request }) => {
    // Signup to get a refresh cookie
    const email = uniqueEmail();
    const signupResponse = await request.post('/api/v1/auth/signup', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email,
        password: VALID_PASSWORD,
        displayName: 'Refresh Tester',
        orgName: `Refresh Org ${Date.now()}`,
      },
    });
    expect(signupResponse.status()).toBe(201);

    // Extract the refresh token cookie value
    let refreshTokenValue = '';
    for (const header of signupResponse.headersArray()) {
      if (header.name.toLowerCase() !== 'set-cookie') continue;
      const match = header.value.match(/refreshToken=([^;]+)/);
      if (match) refreshTokenValue = match[1];
    }
    expect(refreshTokenValue, 'refresh cookie must be set after signup').toBeTruthy();

    // Call /refresh with the cookie — Playwright's request context does NOT
    // automatically re-send cookies, so we inject it manually via the Cookie header.
    // The path for refreshToken is /api/v1/auth so we pass it explicitly.
    const refreshResponse = await request.post('/api/v1/auth/refresh', {
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${refreshTokenValue}`,
      },
    });

    expect(
      refreshResponse.status(),
      `refresh should return 200, got: ${await refreshResponse.text()}`,
    ).toBe(200);

    const refreshBody = await refreshResponse.json();
    expect(refreshBody).toHaveProperty('accessToken');
    expect(typeof refreshBody.accessToken).toBe('string');
    expect(refreshBody.accessToken.length).toBeGreaterThan(0);

    // New access token must differ from the signup token
    const signupToken = (await signupResponse.json()).accessToken as string;
    expect(refreshBody.accessToken).not.toBe(signupToken);
  });

  test('refresh without cookie returns 401', async ({ request }) => {
    const response = await request.post('/api/v1/auth/refresh', {
      headers: { 'Content-Type': 'application/json' },
      // No Cookie header — no refresh token
    });

    expect(
      response.status(),
      `refresh without cookie should return 401, got: ${await response.text()}`,
    ).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// JWT protection
// ---------------------------------------------------------------------------

test.describe('JWT Protection', () => {
  test('protected GET endpoint without token returns 401', async ({ request }) => {
    const response = await request.get('/api/v1/agents');
    expect(response.status(), 'unauthenticated request must return 401').toBe(401);
  });

  test('protected GET endpoint with invalid token returns 401', async ({ request }) => {
    const response = await request.get('/api/v1/agents', {
      headers: {
        Authorization: 'Bearer this.is.not.a.valid.token',
      },
    });
    expect(response.status(), 'invalid token must return 401').toBe(401);
  });

  test('expired/garbage token returns 401 on events endpoint', async ({ request }) => {
    const response = await request.get('/api/v1/events', {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlIn0.invalidsig',
      },
    });
    expect(response.status(), 'garbage JWT must return 401').toBe(401);
  });

  test('valid JWT accesses protected endpoint successfully', async ({ request }) => {
    const { accessToken } = await signupFreshUser(request);
    const response = await request.get('/api/v1/agents', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response.status(), 'valid JWT must access /agents').toBe(200);
  });
});

// ---------------------------------------------------------------------------
// CSRF guard
// ---------------------------------------------------------------------------

test.describe('CSRF Guard', () => {
  test('JWT-authenticated POST without CSRF token returns 403', async ({ request }) => {
    const { accessToken } = await signupFreshUser(request);

    // POST to a protected endpoint with JWT but NO CSRF header or cookie
    const response = await request.post('/api/v1/agents', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        // Deliberately omitting X-CSRF-Token and csrf-token cookie
      },
      data: {
        name: 'CSRF Test Agent',
        modelProvider: 'openai',
        modelId: 'gpt-4o',
      },
    });

    expect(
      response.status(),
      `POST without CSRF must return 403, got: ${await response.text()}`,
    ).toBe(403);
  });

  test('API-key-authenticated POST succeeds without CSRF token', async ({ request }) => {
    // Setup: signup, create agent, create API key
    const { accessToken, csrfToken } = await signupFreshUser(request);

    const agentResponse = await request.post('/api/v1/agents', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: `csrf-token=${csrfToken}`,
      },
      data: {
        name: 'CSRF API Key Test Agent',
        modelProvider: 'anthropic',
        modelId: 'claude-3-5-sonnet-20241022',
      },
    });
    expect(agentResponse.status()).toBe(201);
    const agent = await agentResponse.json();

    const apiKeyResponse = await request.post('/api/v1/api-keys', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: `csrf-token=${csrfToken}`,
      },
      data: { name: `CSRF Test Key ${Date.now()}` },
    });
    expect(apiKeyResponse.status()).toBe(201);
    const { key: apiKey } = await apiKeyResponse.json();

    // Now use the API key to POST events — NO CSRF header needed
    const eventsResponse = await request.post('/api/v1/events', {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        // No Authorization, no X-CSRF-Token — API keys are CSRF-exempt
      },
      data: {
        events: [
          {
            agentId: agent.id,
            category: 'agent_lifecycle',
            level: 'info',
            message: 'CSRF exemption test event',
          },
        ],
      },
    });

    expect(
      eventsResponse.status(),
      `API key POST without CSRF must succeed with 201, got: ${await eventsResponse.text()}`,
    ).toBe(201);
  });

  test('CSRF token mismatch between cookie and header returns 403', async ({ request }) => {
    const { accessToken, csrfToken } = await signupFreshUser(request);

    // Use a different value for the header than what's in the cookie
    const wrongToken = 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899';

    const response = await request.post('/api/v1/agents', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-CSRF-Token': wrongToken, // wrong
        Cookie: `csrf-token=${csrfToken}`, // correct (from signup)
      },
      data: {
        name: 'Mismatch CSRF Agent',
        modelProvider: 'openai',
        modelId: 'gpt-4o',
      },
    });

    expect(
      response.status(),
      `CSRF mismatch must return 403, got: ${await response.text()}`,
    ).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Health check (baseline connectivity)
// ---------------------------------------------------------------------------

test('Health — /health endpoint is reachable before all auth tests', async ({ request }) => {
  const response = await request.get('/health');
  expect(
    response.status(),
    `health endpoint must return 200, got: ${await response.text()}`,
  ).toBe(200);
});
