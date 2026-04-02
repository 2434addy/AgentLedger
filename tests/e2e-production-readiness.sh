#!/bin/bash
# AgentLedger Production Readiness E2E Test Suite
# Tests all API flows with real HTTP requests

BASE_URL="http://localhost:3001"
RESULTS_FILE="/tmp/e2e-results.json"
PASS=0
FAIL=0
TOTAL=0
FINDINGS=""

# Unique email to avoid conflicts
TIMESTAMP=$(date +%s)
TEST_EMAIL="e2e-test-${TIMESTAMP}@agentledger.dev"
TEST_PASSWORD="E2eTest!Pass123"
TEST_NAME="E2E Test User"

log_result() {
  local test_name="$1"
  local status="$2"
  local detail="$3"
  TOTAL=$((TOTAL + 1))
  if [ "$status" = "PASS" ]; then
    PASS=$((PASS + 1))
    echo "  ✓ PASS: $test_name"
  else
    FAIL=$((FAIL + 1))
    echo "  ✗ FAIL: $test_name — $detail"
    FINDINGS="${FINDINGS}\nFAIL: $test_name — $detail"
  fi
}

echo "═══════════════════════════════════════════════════════"
echo "  AgentLedger Production Readiness E2E Test Suite"
echo "═══════════════════════════════════════════════════════"
echo ""

# ─── FLOW 1: Health Check ─────────────────────────────────
echo "── Flow 0: Health Check ──"
HEALTH=$(curl -s "$BASE_URL/health")
echo "$HEALTH" | grep -q '"status":"ok"' && log_result "Health endpoint returns ok" "PASS" || log_result "Health endpoint returns ok" "FAIL" "Got: $HEALTH"

# ─── FLOW 2: Auth Flow ────────────────────────────────────
echo ""
echo "── Flow 2: Auth Flow ──"

# Signup
SIGNUP_RESP=$(curl -s -w "\n%{http_code}" -c /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"displayName\":\"$TEST_NAME\"}" \
  "$BASE_URL/api/v1/auth/signup")
SIGNUP_CODE=$(echo "$SIGNUP_RESP" | tail -1)
SIGNUP_BODY=$(echo "$SIGNUP_RESP" | sed '$d')

if [ "$SIGNUP_CODE" = "201" ]; then
  log_result "Signup returns 201" "PASS"
  ACCESS_TOKEN=$(echo "$SIGNUP_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null || echo "")
  USER_ID=$(echo "$SIGNUP_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['id'])" 2>/dev/null || echo "")
  ORG_ID=$(echo "$SIGNUP_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['organisationId'])" 2>/dev/null || echo "")
  [ -n "$ACCESS_TOKEN" ] && log_result "Signup returns accessToken" "PASS" || log_result "Signup returns accessToken" "FAIL" "No token"
  [ -n "$USER_ID" ] && log_result "Signup returns user.id" "PASS" || log_result "Signup returns user.id" "FAIL" "No user id"
  [ -n "$ORG_ID" ] && log_result "Signup returns user.organisationId" "PASS" || log_result "Signup returns user.organisationId" "FAIL" "No org id"
else
  log_result "Signup returns 201" "FAIL" "Got $SIGNUP_CODE: $SIGNUP_BODY"
  ACCESS_TOKEN=""
fi

# Check refresh token cookie
grep -q "refreshToken" /tmp/cookies.txt 2>/dev/null && log_result "Refresh token set as cookie" "PASS" || log_result "Refresh token set as cookie" "FAIL" "No refreshToken cookie"

# Duplicate signup
DUP_RESP=$(curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"displayName\":\"$TEST_NAME\"}" \
  "$BASE_URL/api/v1/auth/signup")
DUP_CODE=$(echo "$DUP_RESP" | tail -1)
[ "$DUP_CODE" = "400" ] || [ "$DUP_CODE" = "409" ] && log_result "Duplicate signup rejected" "PASS" || log_result "Duplicate signup rejected" "FAIL" "Got $DUP_CODE"

# Login with wrong password
WRONG_RESP=$(curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"WrongPass!123\"}" \
  "$BASE_URL/api/v1/auth/login")
WRONG_CODE=$(echo "$WRONG_RESP" | tail -1)
[ "$WRONG_CODE" = "401" ] && log_result "Wrong password returns 401" "PASS" || log_result "Wrong password returns 401" "FAIL" "Got $WRONG_CODE"

# Login with correct credentials
LOGIN_RESP=$(curl -s -w "\n%{http_code}" -c /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  "$BASE_URL/api/v1/auth/login")
LOGIN_CODE=$(echo "$LOGIN_RESP" | tail -1)
LOGIN_BODY=$(echo "$LOGIN_RESP" | sed '$d')

if [ "$LOGIN_CODE" = "201" ] || [ "$LOGIN_CODE" = "200" ]; then
  log_result "Login returns 200/201" "PASS"
  ACCESS_TOKEN=$(echo "$LOGIN_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null || echo "")
  [ -n "$ACCESS_TOKEN" ] && log_result "Login returns accessToken" "PASS" || log_result "Login returns accessToken" "FAIL" "No token"
else
  log_result "Login returns 200/201" "FAIL" "Got $LOGIN_CODE: $LOGIN_BODY"
fi

# Token refresh
REFRESH_RESP=$(curl -s -w "\n%{http_code}" -b /tmp/cookies.txt -c /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -X POST "$BASE_URL/api/v1/auth/refresh")
REFRESH_CODE=$(echo "$REFRESH_RESP" | tail -1)
[ "$REFRESH_CODE" = "201" ] || [ "$REFRESH_CODE" = "200" ] && log_result "Token refresh works" "PASS" || log_result "Token refresh works" "FAIL" "Got $REFRESH_CODE"

# Forgot password
FORGOT_RESP=$(curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}" \
  "$BASE_URL/api/v1/auth/forgot-password")
FORGOT_CODE=$(echo "$FORGOT_RESP" | tail -1)
[ "$FORGOT_CODE" = "201" ] || [ "$FORGOT_CODE" = "200" ] && log_result "Forgot password endpoint works" "PASS" || log_result "Forgot password endpoint works" "FAIL" "Got $FORGOT_CODE"

# Access protected route without auth
NOAUTH_RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/v1/agents")
NOAUTH_CODE=$(echo "$NOAUTH_RESP" | tail -1)
[ "$NOAUTH_CODE" = "401" ] && log_result "Protected route rejects unauthenticated" "PASS" || log_result "Protected route rejects unauthenticated" "FAIL" "Got $NOAUTH_CODE"

AUTH_HEADER="Authorization: Bearer $ACCESS_TOKEN"

# ─── FLOW 3: Agent Management ────────────────────────────
echo ""
echo "── Flow 3: Agent Management ──"

# Register agent 1
AGENT1_RESP=$(curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"name":"gpt-4o-finance-bot","description":"Financial analysis agent","modelProvider":"openai","modelId":"gpt-4o"}' \
  "$BASE_URL/api/v1/agents")
AGENT1_CODE=$(echo "$AGENT1_RESP" | tail -1)
AGENT1_BODY=$(echo "$AGENT1_RESP" | sed '$d')

if [ "$AGENT1_CODE" = "201" ]; then
  log_result "Register agent 1 (finance-bot)" "PASS"
  AGENT1_ID=$(echo "$AGENT1_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
else
  log_result "Register agent 1 (finance-bot)" "FAIL" "Got $AGENT1_CODE: $AGENT1_BODY"
  AGENT1_ID=""
fi

# Register agent 2
AGENT2_RESP=$(curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"name":"support-bot-v1","description":"Customer support agent","modelProvider":"anthropic","modelId":"claude-sonnet-4-6"}' \
  "$BASE_URL/api/v1/agents")
AGENT2_CODE=$(echo "$AGENT2_RESP" | tail -1)
AGENT2_BODY=$(echo "$AGENT2_RESP" | sed '$d')
if [ "$AGENT2_CODE" = "201" ]; then
  log_result "Register agent 2 (support-bot)" "PASS"
  AGENT2_ID=$(echo "$AGENT2_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
else
  log_result "Register agent 2 (support-bot)" "FAIL" "Got $AGENT2_CODE"
  AGENT2_ID=""
fi

# Register agent 3
AGENT3_RESP=$(curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"name":"data-pipeline-agent","description":"Data ETL pipeline","modelProvider":"openai","modelId":"gpt-4o-mini"}' \
  "$BASE_URL/api/v1/agents")
AGENT3_CODE=$(echo "$AGENT3_RESP" | tail -1)
[ "$AGENT3_CODE" = "201" ] && log_result "Register agent 3 (data-pipeline)" "PASS" || log_result "Register agent 3 (data-pipeline)" "FAIL" "Got $AGENT3_CODE"

# List agents
AGENTS_LIST=$(curl -s -w "\n%{http_code}" \
  -H "$AUTH_HEADER" \
  "$BASE_URL/api/v1/agents")
AGENTS_CODE=$(echo "$AGENTS_LIST" | tail -1)
AGENTS_BODY=$(echo "$AGENTS_LIST" | sed '$d')
[ "$AGENTS_CODE" = "200" ] && log_result "List agents returns 200" "PASS" || log_result "List agents returns 200" "FAIL" "Got $AGENTS_CODE"

# Get agent detail
if [ -n "$AGENT1_ID" ]; then
  AGENT_DETAIL=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/agents/$AGENT1_ID")
  DETAIL_CODE=$(echo "$AGENT_DETAIL" | tail -1)
  [ "$DETAIL_CODE" = "200" ] && log_result "Get agent detail" "PASS" || log_result "Get agent detail" "FAIL" "Got $DETAIL_CODE"
fi

# ─── FLOW 4: API Key Management ──────────────────────────
echo ""
echo "── Flow 4: API Key Management ──"

APIKEY_RESP=$(curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"name":"Production Key"}' \
  "$BASE_URL/api/v1/api-keys")
APIKEY_CODE=$(echo "$APIKEY_RESP" | tail -1)
APIKEY_BODY=$(echo "$APIKEY_RESP" | sed '$d')

if [ "$APIKEY_CODE" = "201" ]; then
  log_result "Create API key returns 201" "PASS"
  # Try to extract plaintext key (field might be 'key' or 'plaintext')
  API_KEY=$(echo "$APIKEY_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('key','') or d.get('plaintext',''))" 2>/dev/null)
  APIKEY_ID=$(echo "$APIKEY_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
  [ -n "$API_KEY" ] && log_result "API key plaintext returned on creation" "PASS" || log_result "API key plaintext returned on creation" "FAIL" "No key in response"
else
  log_result "Create API key returns 201" "FAIL" "Got $APIKEY_CODE: $APIKEY_BODY"
  API_KEY=""
fi

# List API keys — should show masked
KEYS_LIST=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/api-keys")
KEYS_CODE=$(echo "$KEYS_LIST" | tail -1)
[ "$KEYS_CODE" = "200" ] && log_result "List API keys returns 200" "PASS" || log_result "List API keys returns 200" "FAIL" "Got $KEYS_CODE"

# ─── FLOW 5: Create Sessions ────────────────────────────
echo ""
echo "── Flow 5: Session Creation ──"

if [ -n "$AGENT1_ID" ]; then
  SESSION1_RESP=$(curl -s -w "\n%{http_code}" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{\"agentId\":\"$AGENT1_ID\",\"metadata\":{\"purpose\":\"Q4 financial analysis\"}}" \
    "$BASE_URL/api/v1/sessions")
  SESSION1_CODE=$(echo "$SESSION1_RESP" | tail -1)
  SESSION1_BODY=$(echo "$SESSION1_RESP" | sed '$d')
  if [ "$SESSION1_CODE" = "201" ]; then
    log_result "Create session for finance-bot" "PASS"
    SESSION1_ID=$(echo "$SESSION1_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
  else
    log_result "Create session for finance-bot" "FAIL" "Got $SESSION1_CODE: $SESSION1_BODY"
    SESSION1_ID=""
  fi
fi

if [ -n "$AGENT2_ID" ]; then
  SESSION2_RESP=$(curl -s -w "\n%{http_code}" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{\"agentId\":\"$AGENT2_ID\",\"metadata\":{\"purpose\":\"Customer support\"}}" \
    "$BASE_URL/api/v1/sessions")
  SESSION2_CODE=$(echo "$SESSION2_RESP" | tail -1)
  SESSION2_BODY=$(echo "$SESSION2_RESP" | sed '$d')
  if [ "$SESSION2_CODE" = "201" ]; then
    log_result "Create session for support-bot" "PASS"
    SESSION2_ID=$(echo "$SESSION2_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
  else
    log_result "Create session for support-bot" "FAIL" "Got $SESSION2_CODE"
    SESSION2_ID=""
  fi
fi

# ─── FLOW 6: Event Ingestion via JWT ─────────────────────
echo ""
echo "── Flow 6: Event Ingestion (JWT) ──"

if [ -n "$AGENT1_ID" ] && [ -n "$SESSION1_ID" ]; then
  # Batch 1 — Finance bot session
  BATCH1=$(cat <<ENDJSON
{
  "events": [
    {"sessionId":"$SESSION1_ID","agentId":"$AGENT1_ID","category":"agent_lifecycle","level":"info","message":"Agent gpt-4o-finance-bot initialized","payload":{"version":"1.0","environment":"production"}},
    {"sessionId":"$SESSION1_ID","agentId":"$AGENT1_ID","category":"llm_call","level":"info","message":"Analyze Q4 revenue trends for ACME Corp","payload":{"model":"gpt-4o","prompt":"Analyze Q4 revenue trends","response":"Based on financial data, Q4 revenue shows 12% increase...","tokens":1250,"cost":0.015},"tokensInput":350,"tokensOutput":900,"costUsd":0.015,"latencyMs":1823},
    {"sessionId":"$SESSION1_ID","agentId":"$AGENT1_ID","category":"tool_invocation","level":"info","message":"search_database invoked","payload":{"tool":"search_database","input":{"query":"ACME Corp Q4 financials"},"output":{"revenue":2400000,"growth":0.12}},"latencyMs":245},
    {"sessionId":"$SESSION1_ID","agentId":"$AGENT1_ID","category":"llm_call","level":"info","message":"Generate investment recommendation","payload":{"model":"gpt-4o","prompt":"Generate investment recommendation","response":"Based on 12% growth trend, I recommend...","tokens":890,"cost":0.011},"tokensInput":420,"tokensOutput":470,"costUsd":0.011,"latencyMs":1456},
    {"sessionId":"$SESSION1_ID","agentId":"$AGENT1_ID","category":"agent_lifecycle","level":"info","message":"Session completed successfully","payload":{"totalCost":0.026,"totalTokens":2140}}
  ]
}
ENDJSON
)

  BATCH1_RESP=$(curl -s -w "\n%{http_code}" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "$BATCH1" \
    "$BASE_URL/api/v1/events")
  BATCH1_CODE=$(echo "$BATCH1_RESP" | tail -1)
  BATCH1_BODY=$(echo "$BATCH1_RESP" | sed '$d')
  [ "$BATCH1_CODE" = "201" ] && log_result "Batch 1: 5 finance events ingested" "PASS" || log_result "Batch 1: 5 finance events ingested" "FAIL" "Got $BATCH1_CODE: $(echo "$BATCH1_BODY" | head -c 200)"
fi

# Batch 2 — Support bot session
if [ -n "$AGENT2_ID" ] && [ -n "$SESSION2_ID" ]; then
  BATCH2=$(cat <<ENDJSON
{
  "events": [
    {"sessionId":"$SESSION2_ID","agentId":"$AGENT2_ID","category":"agent_lifecycle","level":"info","message":"Support bot v1 started","payload":{"channel":"web-chat"}},
    {"sessionId":"$SESSION2_ID","agentId":"$AGENT2_ID","category":"llm_call","level":"info","message":"Handle customer query about billing","payload":{"model":"claude-sonnet-4-6","prompt":"Customer asks about their recent charge of 49.99","response":"I see your charge of 49.99 was for the Pro plan subscription..."},"tokensInput":180,"tokensOutput":350,"costUsd":0.003,"latencyMs":890},
    {"sessionId":"$SESSION2_ID","agentId":"$AGENT2_ID","category":"agent_lifecycle","level":"info","message":"Support session completed","payload":{"resolution":"resolved","satisfaction":"positive"}}
  ]
}
ENDJSON
)

  BATCH2_RESP=$(curl -s -w "\n%{http_code}" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "$BATCH2" \
    "$BASE_URL/api/v1/events")
  BATCH2_CODE=$(echo "$BATCH2_RESP" | tail -1)
  [ "$BATCH2_CODE" = "201" ] && log_result "Batch 2: 3 support events ingested" "PASS" || log_result "Batch 2: 3 support events ingested" "FAIL" "Got $BATCH2_CODE"
fi

# ─── FLOW 6B: Event Ingestion via API Key ────────────────
echo ""
echo "── Flow 6B: Event Ingestion (API Key) ──"

if [ -n "$API_KEY" ] && [ -n "$AGENT1_ID" ] && [ -n "$SESSION1_ID" ]; then
  APIKEY_EVENT=$(curl -s -w "\n%{http_code}" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "{\"sessionId\":\"$SESSION1_ID\",\"agentId\":\"$AGENT1_ID\",\"category\":\"security\",\"level\":\"warn\",\"message\":\"Unusual access pattern detected\",\"payload\":{\"ip\":\"203.0.113.42\",\"action\":\"bulk_export\"}}" \
    "$BASE_URL/api/v1/events")
  AK_CODE=$(echo "$APIKEY_EVENT" | tail -1)
  [ "$AK_CODE" = "201" ] && log_result "Event via API key accepted" "PASS" || log_result "Event via API key accepted" "FAIL" "Got $AK_CODE"
fi

# ─── FLOW 7: Events Explorer & Hash Chain ────────────────
echo ""
echo "── Flow 7: Events Explorer & Hash Chain ──"

EVENTS_LIST=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/events?limit=20")
EVENTS_CODE=$(echo "$EVENTS_LIST" | tail -1)
EVENTS_BODY=$(echo "$EVENTS_LIST" | sed '$d')
[ "$EVENTS_CODE" = "200" ] && log_result "List events returns 200" "PASS" || log_result "List events returns 200" "FAIL" "Got $EVENTS_CODE"

# Check events have hashes
echo "$EVENTS_BODY" | python3 -c "
import sys,json
try:
  data = json.load(sys.stdin)
  events = data if isinstance(data, list) else data.get('data', data.get('events', []))
  if not events:
    print('NO_EVENTS')
    sys.exit(1)
  has_hash = all(e.get('hash') for e in events)
  print('HAS_HASH' if has_hash else 'MISSING_HASH')
except: print('PARSE_ERROR')
" 2>/dev/null | grep -q "HAS_HASH" && log_result "All events have hash values" "PASS" || log_result "All events have hash values" "FAIL" "Some events missing hash"

# Filter by agent
if [ -n "$AGENT1_ID" ]; then
  FILTER_RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/events?agentId=$AGENT1_ID")
  FILTER_CODE=$(echo "$FILTER_RESP" | tail -1)
  [ "$FILTER_CODE" = "200" ] && log_result "Filter events by agent" "PASS" || log_result "Filter events by agent" "FAIL" "Got $FILTER_CODE"
fi

# Filter by category
FILTER_CAT=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/events?category=llm_call")
FCAT_CODE=$(echo "$FILTER_CAT" | tail -1)
[ "$FCAT_CODE" = "200" ] && log_result "Filter events by category (llm_call)" "PASS" || log_result "Filter events by category (llm_call)" "FAIL" "Got $FCAT_CODE"

# Verify hash chain
CHAIN_RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/events/verify-chain")
CHAIN_CODE=$(echo "$CHAIN_RESP" | tail -1)
CHAIN_BODY=$(echo "$CHAIN_RESP" | sed '$d')
[ "$CHAIN_CODE" = "200" ] && log_result "Verify-chain endpoint returns 200" "PASS" || log_result "Verify-chain endpoint returns 200" "FAIL" "Got $CHAIN_CODE"

echo "$CHAIN_BODY" | python3 -c "
import sys,json
try:
  data = json.load(sys.stdin)
  intact = data.get('chainIntact', False)
  print('INTACT' if intact else 'BROKEN')
except: print('PARSE_ERROR')
" 2>/dev/null | grep -q "INTACT" && log_result "Hash chain integrity verified" "PASS" || log_result "Hash chain integrity verified" "FAIL" "Chain broken: $(echo "$CHAIN_BODY" | head -c 200)"

# Verify single event
VERIFY_ALL=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/events/verify")
VA_CODE=$(echo "$VERIFY_ALL" | tail -1)
[ "$VA_CODE" = "200" ] && log_result "Verify all events endpoint" "PASS" || log_result "Verify all events endpoint" "FAIL" "Got $VA_CODE"

# ─── FLOW 8: Sessions ────────────────────────────────────
echo ""
echo "── Flow 8: Sessions ──"

SESSIONS_LIST=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/sessions")
SESS_CODE=$(echo "$SESSIONS_LIST" | tail -1)
[ "$SESS_CODE" = "200" ] && log_result "List sessions returns 200" "PASS" || log_result "List sessions returns 200" "FAIL" "Got $SESS_CODE"

if [ -n "$SESSION1_ID" ]; then
  SESSION_DETAIL=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/sessions/$SESSION1_ID")
  SD_CODE=$(echo "$SESSION_DETAIL" | tail -1)
  [ "$SD_CODE" = "200" ] && log_result "Get session detail" "PASS" || log_result "Get session detail" "FAIL" "Got $SD_CODE"
fi

# ─── FLOW 9: Approval Queue ──────────────────────────────
echo ""
echo "── Flow 9: Approval Queue ──"

if [ -n "$AGENT1_ID" ]; then
  # Create approval request
  APPROVAL1_RESP=$(curl -s -w "\n%{http_code}" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{\"agentId\":\"$AGENT1_ID\",\"type\":\"cost_threshold\",\"payload\":{\"action\":\"Execute wire transfer of \$48,200 to vendor account\",\"amount\":48200,\"currency\":\"USD\"},\"requestedBy\":\"$USER_ID\"}" \
    "$BASE_URL/api/v1/approvals")
  APR1_CODE=$(echo "$APPROVAL1_RESP" | tail -1)
  APR1_BODY=$(echo "$APPROVAL1_RESP" | sed '$d')
  if [ "$APR1_CODE" = "201" ]; then
    log_result "Create approval request" "PASS"
    APPROVAL1_ID=$(echo "$APR1_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
  else
    log_result "Create approval request" "FAIL" "Got $APR1_CODE: $APR1_BODY"
    APPROVAL1_ID=""
  fi

  # List pending approvals
  PENDING=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/approvals/pending")
  PEND_CODE=$(echo "$PENDING" | tail -1)
  [ "$PEND_CODE" = "200" ] && log_result "List pending approvals" "PASS" || log_result "List pending approvals" "FAIL" "Got $PEND_CODE"

  # Approve
  if [ -n "$APPROVAL1_ID" ]; then
    APPROVE_RESP=$(curl -s -w "\n%{http_code}" \
      -H "Content-Type: application/json" \
      -H "$AUTH_HEADER" \
      -X PATCH \
      -d '{"comment":"Approved after manual verification"}' \
      "$BASE_URL/api/v1/approvals/$APPROVAL1_ID/approve")
    APPR_CODE=$(echo "$APPROVE_RESP" | tail -1)
    [ "$APPR_CODE" = "200" ] && log_result "Approve approval request" "PASS" || log_result "Approve approval request" "FAIL" "Got $APPR_CODE"
  fi

  # Create second approval and reject it
  APPROVAL2_RESP=$(curl -s -w "\n%{http_code}" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{\"agentId\":\"$AGENT1_ID\",\"type\":\"data_access\",\"payload\":{\"action\":\"Access customer PII database\",\"scope\":\"full_export\"},\"requestedBy\":\"$USER_ID\"}" \
    "$BASE_URL/api/v1/approvals")
  APR2_CODE=$(echo "$APPROVAL2_RESP" | tail -1)
  APR2_BODY=$(echo "$APPROVAL2_RESP" | sed '$d')
  if [ "$APR2_CODE" = "201" ]; then
    APPROVAL2_ID=$(echo "$APR2_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
    REJECT_RESP=$(curl -s -w "\n%{http_code}" \
      -H "Content-Type: application/json" \
      -H "$AUTH_HEADER" \
      -X PATCH \
      -d '{"comment":"Rejected: PII export not authorized"}' \
      "$BASE_URL/api/v1/approvals/$APPROVAL2_ID/reject")
    REJ_CODE=$(echo "$REJECT_RESP" | tail -1)
    [ "$REJ_CODE" = "200" ] && log_result "Reject approval request" "PASS" || log_result "Reject approval request" "FAIL" "Got $REJ_CODE"
  fi
fi

# ─── FLOW 10: Compliance Reports ─────────────────────────
echo ""
echo "── Flow 10: Compliance Reports ──"

# Quick report
COMP_REPORT=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/compliance/report")
CR_CODE=$(echo "$COMP_REPORT" | tail -1)
[ "$CR_CODE" = "200" ] && log_result "Compliance report endpoint" "PASS" || log_result "Compliance report endpoint" "FAIL" "Got $CR_CODE"

# Compliance checks
COMP_CHECKS=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/compliance/checks")
CC_CODE=$(echo "$COMP_CHECKS" | tail -1)
[ "$CC_CODE" = "200" ] && log_result "Compliance checks endpoint" "PASS" || log_result "Compliance checks endpoint" "FAIL" "Got $CC_CODE"

# Generate EU AI Act report
EUAI_RESP=$(curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"framework":"eu-ai-act"}' \
  "$BASE_URL/api/v1/compliance/reports/generate")
EUAI_CODE=$(echo "$EUAI_RESP" | tail -1)
EUAI_BODY=$(echo "$EUAI_RESP" | sed '$d')
[ "$EUAI_CODE" = "201" ] && log_result "Generate EU AI Act report" "PASS" || log_result "Generate EU AI Act report" "FAIL" "Got $EUAI_CODE"

# Generate SOC 2 report
SOC2_RESP=$(curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"framework":"soc2"}' \
  "$BASE_URL/api/v1/compliance/reports/generate")
SOC2_CODE=$(echo "$SOC2_RESP" | tail -1)
[ "$SOC2_CODE" = "201" ] && log_result "Generate SOC 2 report" "PASS" || log_result "Generate SOC 2 report" "FAIL" "Got $SOC2_CODE"

# Generate ISO 42001 report
ISO_RESP=$(curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"framework":"iso42001"}' \
  "$BASE_URL/api/v1/compliance/reports/generate")
ISO_CODE=$(echo "$ISO_RESP" | tail -1)
[ "$ISO_CODE" = "201" ] && log_result "Generate ISO 42001 report" "PASS" || log_result "Generate ISO 42001 report" "FAIL" "Got $ISO_CODE"

# ─── FLOW 11: Analytics ──────────────────────────────────
echo ""
echo "── Flow 11: Analytics ──"

COST_RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/analytics/cost")
COST_CODE=$(echo "$COST_RESP" | tail -1)
[ "$COST_CODE" = "200" ] && log_result "Cost analytics endpoint" "PASS" || log_result "Cost analytics endpoint" "FAIL" "Got $COST_CODE"

USAGE_RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/analytics/usage")
USAGE_CODE=$(echo "$USAGE_RESP" | tail -1)
[ "$USAGE_CODE" = "200" ] && log_result "Usage analytics endpoint" "PASS" || log_result "Usage analytics endpoint" "FAIL" "Got $USAGE_CODE"

MODELS_RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/analytics/models")
MODELS_CODE=$(echo "$MODELS_RESP" | tail -1)
[ "$MODELS_CODE" = "200" ] && log_result "Model analytics endpoint" "PASS" || log_result "Model analytics endpoint" "FAIL" "Got $MODELS_CODE"

# ─── FLOW 12: Organisation ───────────────────────────────
echo ""
echo "── Flow 12: Organisation ──"

ORG_RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/organisations/me")
ORG_CODE=$(echo "$ORG_RESP" | tail -1)
[ "$ORG_CODE" = "200" ] && log_result "Get organisation profile" "PASS" || log_result "Get organisation profile" "FAIL" "Got $ORG_CODE"

# ─── FLOW 13: Anomalies ──────────────────────────────────
echo ""
echo "── Flow 13: Anomalies ──"

ANOM_RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/anomalies")
ANOM_CODE=$(echo "$ANOM_RESP" | tail -1)
[ "$ANOM_CODE" = "200" ] && log_result "Anomalies endpoint" "PASS" || log_result "Anomalies endpoint" "FAIL" "Got $ANOM_CODE"

# ─── FLOW 14: Edge Cases & Error Handling ─────────────────
echo ""
echo "── Flow 14: Edge Cases & Error Handling ──"

# Invalid API key
INVALID_KEY=$(curl -s -w "\n%{http_code}" \
  -H "x-api-key: al_live_sk_fake_invalid_key_12345" \
  "$BASE_URL/api/v1/events")
IK_CODE=$(echo "$INVALID_KEY" | tail -1)
[ "$IK_CODE" = "401" ] && log_result "Invalid API key returns 401" "PASS" || log_result "Invalid API key returns 401" "FAIL" "Got $IK_CODE"

# Batch too large (>500 events) — generate 501 events
LARGE_BATCH='{"events":['
for i in $(seq 1 501); do
  [ $i -gt 1 ] && LARGE_BATCH+=','
  LARGE_BATCH+="{\"agentId\":\"$AGENT1_ID\",\"category\":\"system\",\"level\":\"debug\",\"message\":\"Event $i\"}"
done
LARGE_BATCH+=']}'

LARGE_RESP=$(curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "$LARGE_BATCH" \
  "$BASE_URL/api/v1/events")
LARGE_CODE=$(echo "$LARGE_RESP" | tail -1)
[ "$LARGE_CODE" = "400" ] && log_result "Batch >500 rejected (400)" "PASS" || log_result "Batch >500 rejected" "FAIL" "Got $LARGE_CODE (expected 400)"

# XSS in agent name
XSS_RESP=$(curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"name":"<script>alert(1)</script>","modelProvider":"openai","modelId":"gpt-4o"}' \
  "$BASE_URL/api/v1/agents")
XSS_CODE=$(echo "$XSS_RESP" | tail -1)
XSS_BODY=$(echo "$XSS_RESP" | sed '$d')
# Should either reject or sanitize
if [ "$XSS_CODE" = "400" ]; then
  log_result "XSS in agent name rejected" "PASS"
elif echo "$XSS_BODY" | grep -q "<script>"; then
  log_result "XSS in agent name sanitized" "FAIL" "Script tag stored unsanitized"
else
  log_result "XSS in agent name handled" "PASS"
fi

# SQL injection in filter
SQLI_RESP=$(curl -s -w "\n%{http_code}" \
  -H "$AUTH_HEADER" \
  "$BASE_URL/api/v1/events?category=llm_call%27%20OR%201%3D1%20--%20")
SQLI_CODE=$(echo "$SQLI_RESP" | tail -1)
# Should return 400 or 200 with empty results, NOT 500
[ "$SQLI_CODE" != "500" ] && log_result "SQL injection attempt handled safely" "PASS" || log_result "SQL injection attempt handled safely" "FAIL" "Got 500 (possible injection)"

# Access other org's resources with fake UUID
FAKE_UUID="00000000-0000-0000-0000-000000000000"
IDOR_RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/api/v1/agents/$FAKE_UUID")
IDOR_CODE=$(echo "$IDOR_RESP" | tail -1)
[ "$IDOR_CODE" = "404" ] || [ "$IDOR_CODE" = "403" ] && log_result "IDOR prevention (fake UUID)" "PASS" || log_result "IDOR prevention (fake UUID)" "FAIL" "Got $IDOR_CODE"

# ─── FLOW 15: Logout ─────────────────────────────────────
echo ""
echo "── Flow 15: Logout ──"

LOGOUT_RESP=$(curl -s -w "\n%{http_code}" \
  -H "$AUTH_HEADER" \
  -X POST \
  -b /tmp/cookies.txt \
  "$BASE_URL/api/v1/auth/logout")
LOGOUT_CODE=$(echo "$LOGOUT_RESP" | tail -1)
[ "$LOGOUT_CODE" = "201" ] || [ "$LOGOUT_CODE" = "200" ] && log_result "Logout succeeds" "PASS" || log_result "Logout succeeds" "FAIL" "Got $LOGOUT_CODE"

# ─── SUMMARY ─────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  RESULTS: $PASS passed, $FAIL failed, $TOTAL total"
echo "═══════════════════════════════════════════════════════"

if [ $FAIL -gt 0 ]; then
  echo ""
  echo "Failed tests:"
  echo -e "$FINDINGS"
fi

# Save key variables for later use
echo "ACCESS_TOKEN=$ACCESS_TOKEN" > /tmp/e2e-vars.sh
echo "API_KEY=$API_KEY" >> /tmp/e2e-vars.sh
echo "AGENT1_ID=$AGENT1_ID" >> /tmp/e2e-vars.sh
echo "AGENT2_ID=$AGENT2_ID" >> /tmp/e2e-vars.sh
echo "SESSION1_ID=$SESSION1_ID" >> /tmp/e2e-vars.sh
echo "SESSION2_ID=$SESSION2_ID" >> /tmp/e2e-vars.sh
echo "TEST_EMAIL=$TEST_EMAIL" >> /tmp/e2e-vars.sh
echo "TEST_PASSWORD=$TEST_PASSWORD" >> /tmp/e2e-vars.sh
echo "ORG_ID=$ORG_ID" >> /tmp/e2e-vars.sh

echo ""
echo "Variables saved to /tmp/e2e-vars.sh"
