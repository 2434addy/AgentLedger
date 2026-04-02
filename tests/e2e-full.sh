#!/bin/bash
# AgentLedger Production Readiness — Full E2E Test Suite (Windows-compatible)
set -o pipefail

BASE="http://localhost:3001"
PASS=0; FAIL=0; TOTAL=0; FINDINGS=""
TS=$(date +%s)
EMAIL="e2e-${TS}@agentledger.dev"
PASSWORD="E2eTest!Pass123"
NAME="E2E Test User"
COOKIES="/tmp/al-cookies-${TS}.txt"

jq_extract() { node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const v=$1;console.log(v===undefined||v===null?'':v)}catch(e){console.log('')}})"; }

ok() {
  TOTAL=$((TOTAL+1)); PASS=$((PASS+1))
  echo "  ✓ $1"
}
fail() {
  TOTAL=$((TOTAL+1)); FAIL=$((FAIL+1))
  echo "  ✗ $1 — $2"
  FINDINGS="${FINDINGS}\n  ✗ $1 — $2"
}
check() { # check "name" expected_code actual_code [detail]
  if [ "$2" = "$3" ]; then ok "$1"; else fail "$1" "expected $2, got $3${4:+ ($4)}"; fi
}

echo "═══════════════════════════════════════════════════════"
echo "  AgentLedger E2E Production Readiness Test"
echo "═══════════════════════════════════════════════════════"

# ─── HEALTH ───────────────────────────────────────────────
echo ""; echo "── Health ──"
H=$(curl -s "$BASE/health")
echo "$H" | grep -q '"status":"ok"' && ok "Health endpoint" || fail "Health endpoint" "$H"

# ─── SIGNUP ───────────────────────────────────────────────
echo ""; echo "── Auth: Signup ──"
RESP=$(curl -s -w "\n%{http_code}" -c "$COOKIES" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"displayName\":\"$NAME\"}" \
  "$BASE/api/v1/auth/signup")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Signup returns 201" "201" "$CODE"

TOKEN=$(echo "$BODY" | jq_extract 'j.accessToken')
USER_ID=$(echo "$BODY" | jq_extract 'j.user.id')
ORG_ID=$(echo "$BODY" | jq_extract 'j.user.organisationId')
CSRF=$(grep "csrf-token" "$COOKIES" | awk '{print $NF}')

[ -n "$TOKEN" ] && ok "Got accessToken" || fail "Got accessToken" "empty"
[ -n "$USER_ID" ] && ok "Got user.id ($USER_ID)" || fail "Got user.id" "empty"
[ -n "$ORG_ID" ] && ok "Got organisationId ($ORG_ID)" || fail "Got organisationId" "empty"
grep -q "refreshToken" "$COOKIES" && ok "Refresh token cookie set" || fail "Refresh token cookie" "missing"
[ -n "$CSRF" ] && ok "CSRF token cookie set" || fail "CSRF token cookie" "missing"

AUTH="-H \"Authorization: Bearer $TOKEN\" -H \"X-CSRF-Token: $CSRF\""

# Helper for authenticated requests
acurl() {
  curl -s -w "\n%{http_code}" -b "$COOKIES" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-CSRF-Token: $CSRF" \
    "$@"
}
acurl_get() {
  curl -s -w "\n%{http_code}" -b "$COOKIES" \
    -H "Authorization: Bearer $TOKEN" \
    "$@"
}

# ─── DUPLICATE SIGNUP ─────────────────────────────────────
echo ""; echo "── Auth: Edge Cases ──"
R=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"displayName\":\"$NAME\"}" \
  "$BASE/api/v1/auth/signup")
C=$(echo "$R" | tail -1)
[ "$C" = "400" ] || [ "$C" = "409" ] && ok "Duplicate signup rejected ($C)" || fail "Duplicate signup" "got $C"

# Wrong password
R=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"WrongOne!1\"}" \
  "$BASE/api/v1/auth/login")
C=$(echo "$R" | tail -1)
check "Wrong password returns 401" "401" "$C"

# Unauthenticated access
R=$(curl -s -w "\n%{http_code}" "$BASE/api/v1/agents")
C=$(echo "$R" | tail -1)
check "Unauthenticated → 401" "401" "$C"

# Login
echo ""; echo "── Auth: Login ──"
R=$(curl -s -w "\n%{http_code}" -c "$COOKIES" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BASE/api/v1/auth/login")
C=$(echo "$R" | tail -1)
B=$(echo "$R" | sed '$d')
[ "$C" = "200" ] || [ "$C" = "201" ] && ok "Login returns $C" || fail "Login" "got $C"
TOKEN=$(echo "$B" | jq_extract 'j.accessToken')
CSRF=$(grep "csrf-token" "$COOKIES" | awk '{print $NF}')
[ -n "$TOKEN" ] && ok "Login accessToken valid" || fail "Login accessToken" "empty"

# Refresh
R=$(curl -s -w "\n%{http_code}" -b "$COOKIES" -c "$COOKIES" -X POST \
  -H "Content-Type: application/json" "$BASE/api/v1/auth/refresh")
C=$(echo "$R" | tail -1)
[ "$C" = "200" ] || [ "$C" = "201" ] && ok "Token refresh ($C)" || fail "Token refresh" "$C"

# Forgot password
R=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}" "$BASE/api/v1/auth/forgot-password")
C=$(echo "$R" | tail -1)
[ "$C" = "200" ] || [ "$C" = "201" ] && ok "Forgot password ($C)" || fail "Forgot password" "$C"

# ─── AGENT MANAGEMENT ────────────────────────────────────
echo ""; echo "── Agents ──"

R=$(acurl -H "Content-Type: application/json" \
  -d '{"name":"gpt-4o-finance-bot","description":"Financial analysis agent","modelProvider":"openai","modelId":"gpt-4o"}' \
  "$BASE/api/v1/agents")
C=$(echo "$R" | tail -1); B=$(echo "$R" | sed '$d')
check "Create agent: finance-bot" "201" "$C"
AGENT1=$(echo "$B" | jq_extract 'j.id')
[ -n "$AGENT1" ] && ok "Agent1 ID: $AGENT1" || fail "Agent1 ID" "empty"

R=$(acurl -H "Content-Type: application/json" \
  -d '{"name":"support-bot-v1","description":"Customer support","modelProvider":"anthropic","modelId":"claude-sonnet-4-6"}' \
  "$BASE/api/v1/agents")
C=$(echo "$R" | tail -1); B=$(echo "$R" | sed '$d')
check "Create agent: support-bot" "201" "$C"
AGENT2=$(echo "$B" | jq_extract 'j.id')

R=$(acurl -H "Content-Type: application/json" \
  -d '{"name":"data-pipeline-agent","description":"ETL pipeline","modelProvider":"openai","modelId":"gpt-4o-mini"}' \
  "$BASE/api/v1/agents")
C=$(echo "$R" | tail -1)
check "Create agent: data-pipeline" "201" "$C"

R=$(acurl_get "$BASE/api/v1/agents")
C=$(echo "$R" | tail -1)
check "List agents" "200" "$C"

if [ -n "$AGENT1" ]; then
  R=$(acurl_get "$BASE/api/v1/agents/$AGENT1")
  C=$(echo "$R" | tail -1)
  check "Get agent detail" "200" "$C"
fi

# ─── API KEYS ────────────────────────────────────────────
echo ""; echo "── API Keys ──"

R=$(acurl -H "Content-Type: application/json" \
  -d '{"name":"Production Key"}' \
  "$BASE/api/v1/api-keys")
C=$(echo "$R" | tail -1); B=$(echo "$R" | sed '$d')
check "Create API key" "201" "$C"
API_KEY=$(echo "$B" | jq_extract "j.key||j.plaintext||''")
APIKEY_ID=$(echo "$B" | jq_extract 'j.id')
[ -n "$API_KEY" ] && ok "API key plaintext received" || fail "API key plaintext" "empty — body: $(echo $B | head -c 100)"

R=$(acurl_get "$BASE/api/v1/api-keys")
C=$(echo "$R" | tail -1)
check "List API keys" "200" "$C"

# ─── SESSIONS ────────────────────────────────────────────
echo ""; echo "── Sessions ──"

if [ -n "$AGENT1" ]; then
  R=$(acurl -H "Content-Type: application/json" \
    -d "{\"agentId\":\"$AGENT1\",\"metadata\":{\"purpose\":\"Q4 financial analysis\"}}" \
    "$BASE/api/v1/sessions")
  C=$(echo "$R" | tail -1); B=$(echo "$R" | sed '$d')
  check "Create session: finance-bot" "201" "$C"
  SESS1=$(echo "$B" | jq_extract 'j.id')
  [ -n "$SESS1" ] && ok "Session1 ID: $SESS1" || fail "Session1 ID" "empty"
fi

if [ -n "$AGENT2" ]; then
  R=$(acurl -H "Content-Type: application/json" \
    -d "{\"agentId\":\"$AGENT2\",\"metadata\":{\"purpose\":\"Customer support\"}}" \
    "$BASE/api/v1/sessions")
  C=$(echo "$R" | tail -1); B=$(echo "$R" | sed '$d')
  check "Create session: support-bot" "201" "$C"
  SESS2=$(echo "$B" | jq_extract 'j.id')
fi

# ─── EVENT INGESTION (JWT) ───────────────────────────────
echo ""; echo "── Events: JWT Ingestion ──"

if [ -n "$AGENT1" ] && [ -n "$SESS1" ]; then
  R=$(acurl -H "Content-Type: application/json" -d @- "$BASE/api/v1/events" <<ENDJSON
{"events":[
  {"sessionId":"$SESS1","agentId":"$AGENT1","category":"agent_lifecycle","level":"info","message":"Agent gpt-4o-finance-bot initialized","payload":{"version":"1.0","env":"production"}},
  {"sessionId":"$SESS1","agentId":"$AGENT1","category":"llm_call","level":"info","message":"Analyze Q4 revenue trends","payload":{"model":"gpt-4o","response":"Q4 revenue shows 12% increase"},"tokensInput":350,"tokensOutput":900,"costUsd":0.015,"latencyMs":1823},
  {"sessionId":"$SESS1","agentId":"$AGENT1","category":"tool_invocation","level":"info","message":"search_database","payload":{"tool":"search_database","input":{"query":"ACME Q4"},"output":{"revenue":2400000}},"latencyMs":245},
  {"sessionId":"$SESS1","agentId":"$AGENT1","category":"llm_call","level":"info","message":"Generate recommendation","payload":{"model":"gpt-4o"},"tokensInput":420,"tokensOutput":470,"costUsd":0.011,"latencyMs":1456},
  {"sessionId":"$SESS1","agentId":"$AGENT1","category":"agent_lifecycle","level":"info","message":"Session completed","payload":{"totalCost":0.026}}
]}
ENDJSON
)
  C=$(echo "$R" | tail -1)
  check "Batch 1: 5 finance events" "201" "$C"
fi

if [ -n "$AGENT2" ] && [ -n "$SESS2" ]; then
  R=$(acurl -H "Content-Type: application/json" -d @- "$BASE/api/v1/events" <<ENDJSON
{"events":[
  {"sessionId":"$SESS2","agentId":"$AGENT2","category":"agent_lifecycle","level":"info","message":"Support bot started","payload":{"channel":"web"}},
  {"sessionId":"$SESS2","agentId":"$AGENT2","category":"llm_call","level":"info","message":"Handle billing query","payload":{"model":"claude-sonnet-4-6"},"tokensInput":180,"tokensOutput":350,"costUsd":0.003,"latencyMs":890},
  {"sessionId":"$SESS2","agentId":"$AGENT2","category":"agent_lifecycle","level":"info","message":"Support session done","payload":{"resolution":"resolved"}}
]}
ENDJSON
)
  C=$(echo "$R" | tail -1)
  check "Batch 2: 3 support events" "201" "$C"
fi

# ─── EVENT INGESTION (API Key) ───────────────────────────
echo ""; echo "── Events: API Key Ingestion ──"

if [ -n "$API_KEY" ] && [ -n "$AGENT1" ] && [ -n "$SESS1" ]; then
  R=$(curl -s -w "\n%{http_code}" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "{\"sessionId\":\"$SESS1\",\"agentId\":\"$AGENT1\",\"category\":\"security\",\"level\":\"warn\",\"message\":\"Unusual access pattern\",\"payload\":{\"ip\":\"203.0.113.42\"}}" \
    "$BASE/api/v1/events")
  C=$(echo "$R" | tail -1)
  check "Event via API key" "201" "$C"
else
  fail "Event via API key" "no API_KEY or AGENT1"
fi

# ─── EVENTS EXPLORER & HASH CHAIN ────────────────────────
echo ""; echo "── Events Explorer & Hash Chain ──"

R=$(acurl_get "$BASE/api/v1/events?limit=20")
C=$(echo "$R" | tail -1); B=$(echo "$R" | sed '$d')
check "List events" "200" "$C"

# Check hash presence
echo "$B" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  try{
    const data=JSON.parse(d);
    const events=Array.isArray(data)?data:data.data||[];
    const hasHash=events.length>0&&events.every(e=>e.hash);
    console.log(hasHash?'HAS_HASH':'MISSING_HASH');
  }catch(e){console.log('PARSE_ERROR')}
})" 2>/dev/null | grep -q "HAS_HASH" && ok "All events have hash values" || fail "Events hash" "some missing"

# Filter by agent
if [ -n "$AGENT1" ]; then
  R=$(acurl_get "$BASE/api/v1/events?agentId=$AGENT1")
  C=$(echo "$R" | tail -1)
  check "Filter by agent" "200" "$C"
fi

# Filter by category
R=$(acurl_get "$BASE/api/v1/events?category=llm_call")
C=$(echo "$R" | tail -1)
check "Filter by category" "200" "$C"

# Verify chain
R=$(acurl_get "$BASE/api/v1/events/verify-chain")
C=$(echo "$R" | tail -1); B=$(echo "$R" | sed '$d')
check "Verify-chain endpoint" "200" "$C"
echo "$B" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).chainIntact?'INTACT':'BROKEN')}catch(e){console.log('ERR')}})" 2>/dev/null | grep -q "INTACT" && ok "Hash chain INTACT" || fail "Hash chain" "broken"

# Verify all
R=$(acurl_get "$BASE/api/v1/events/verify")
C=$(echo "$R" | tail -1)
check "Verify all events" "200" "$C"

# ─── SESSIONS LIST & DETAIL ──────────────────────────────
echo ""; echo "── Sessions ──"

R=$(acurl_get "$BASE/api/v1/sessions")
C=$(echo "$R" | tail -1)
check "List sessions" "200" "$C"

if [ -n "$SESS1" ]; then
  R=$(acurl_get "$BASE/api/v1/sessions/$SESS1")
  C=$(echo "$R" | tail -1)
  check "Session detail" "200" "$C"
fi

# ─── APPROVAL QUEUE ──────────────────────────────────────
echo ""; echo "── Approvals ──"

if [ -n "$AGENT1" ]; then
  R=$(acurl -H "Content-Type: application/json" -d @- "$BASE/api/v1/approvals" <<ENDJSON
{"agentId":"$AGENT1","type":"cost_threshold","payload":{"action":"Wire transfer \$48,200","amount":48200,"currency":"USD"},"requestedBy":"$USER_ID"}
ENDJSON
)
  C=$(echo "$R" | tail -1); B=$(echo "$R" | sed '$d')
  check "Create approval" "201" "$C"
  APR1=$(echo "$B" | jq_extract 'j.id')

  R=$(acurl_get "$BASE/api/v1/approvals/pending")
  C=$(echo "$R" | tail -1)
  check "List pending approvals" "200" "$C"

  if [ -n "$APR1" ]; then
    R=$(acurl -X PATCH -H "Content-Type: application/json" \
      -d '{"comment":"Approved after verification"}' \
      "$BASE/api/v1/approvals/$APR1/approve")
    C=$(echo "$R" | tail -1)
    check "Approve request" "200" "$C"
  fi

  # Create + reject another
  R=$(acurl -H "Content-Type: application/json" -d @- "$BASE/api/v1/approvals" <<ENDJSON
{"agentId":"$AGENT1","type":"data_access","payload":{"action":"Export PII","scope":"full"},"requestedBy":"$USER_ID"}
ENDJSON
)
  C=$(echo "$R" | tail -1); B=$(echo "$R" | sed '$d')
  APR2=$(echo "$B" | jq_extract 'j.id')
  if [ -n "$APR2" ]; then
    R=$(acurl -X PATCH -H "Content-Type: application/json" \
      -d '{"comment":"Rejected: not authorized"}' \
      "$BASE/api/v1/approvals/$APR2/reject")
    C=$(echo "$R" | tail -1)
    check "Reject request" "200" "$C"
  fi
fi

# ─── COMPLIANCE ──────────────────────────────────────────
echo ""; echo "── Compliance ──"

R=$(acurl_get "$BASE/api/v1/compliance/report")
C=$(echo "$R" | tail -1)
check "Compliance report" "200" "$C"

R=$(acurl_get "$BASE/api/v1/compliance/checks")
C=$(echo "$R" | tail -1)
check "Compliance checks" "200" "$C"

for FW in eu-ai-act soc2 iso42001; do
  R=$(acurl -H "Content-Type: application/json" \
    -d "{\"framework\":\"$FW\"}" \
    "$BASE/api/v1/compliance/reports/generate")
  C=$(echo "$R" | tail -1)
  check "Generate $FW report" "201" "$C"
done

# ─── ANALYTICS ───────────────────────────────────────────
echo ""; echo "── Analytics ──"

for EP in cost usage models; do
  R=$(acurl_get "$BASE/api/v1/analytics/$EP")
  C=$(echo "$R" | tail -1)
  check "Analytics: $EP" "200" "$C"
done

# ─── ORGANISATION ────────────────────────────────────────
echo ""; echo "── Organisation ──"

R=$(acurl_get "$BASE/api/v1/organisations/me")
C=$(echo "$R" | tail -1)
check "Get org profile" "200" "$C"

# ─── ANOMALIES ───────────────────────────────────────────
echo ""; echo "── Anomalies ──"

R=$(acurl_get "$BASE/api/v1/anomalies")
C=$(echo "$R" | tail -1)
check "Anomalies endpoint" "200" "$C"

# ─── EDGE CASES ──────────────────────────────────────────
echo ""; echo "── Edge Cases & Security ──"

# Invalid API key
R=$(curl -s -w "\n%{http_code}" -H "x-api-key: al_live_sk_fake_key" "$BASE/api/v1/events")
C=$(echo "$R" | tail -1)
check "Invalid API key → 401" "401" "$C"

# XSS in agent name
R=$(acurl -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>","modelProvider":"openai","modelId":"gpt-4o"}' \
  "$BASE/api/v1/agents")
C=$(echo "$R" | tail -1); B=$(echo "$R" | sed '$d')
echo "$B" | grep -q "<script>" && fail "XSS stored unsanitized" "script tag in response" || ok "XSS handled safely"

# SQL injection in filter
R=$(acurl_get "$BASE/api/v1/events?category=llm_call'%20OR%201=1%20--")
C=$(echo "$R" | tail -1)
[ "$C" != "500" ] && ok "SQL injection safe ($C)" || fail "SQL injection" "got 500"

# IDOR - fake UUID
R=$(acurl_get "$BASE/api/v1/agents/00000000-0000-0000-0000-000000000000")
C=$(echo "$R" | tail -1)
[ "$C" = "404" ] || [ "$C" = "403" ] && ok "IDOR prevention ($C)" || fail "IDOR" "got $C"

# ─── LOGOUT ──────────────────────────────────────────────
echo ""; echo "── Logout ──"

R=$(acurl -X POST "$BASE/api/v1/auth/logout")
C=$(echo "$R" | tail -1)
[ "$C" = "200" ] || [ "$C" = "201" ] && ok "Logout ($C)" || fail "Logout" "got $C"

# ─── SUMMARY ─────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  RESULTS: $PASS passed / $FAIL failed / $TOTAL total"
echo "═══════════════════════════════════════════════════════"

if [ $FAIL -gt 0 ]; then
  echo ""
  echo "FAILURES:"
  echo -e "$FINDINGS"
fi

# Save vars
cat > /tmp/e2e-vars.sh <<EOF
TOKEN=$TOKEN
API_KEY=$API_KEY
AGENT1=$AGENT1
AGENT2=$AGENT2
SESS1=$SESS1
SESS2=$SESS2
EMAIL=$EMAIL
PASSWORD=$PASSWORD
ORG_ID=$ORG_ID
USER_ID=$USER_ID
CSRF=$CSRF
COOKIES=$COOKIES
EOF
echo ""
echo "Variables saved to /tmp/e2e-vars.sh"
