#Requires -Version 5.1
# AgentLedger - Full Customer Journey E2E Test Suite

$ErrorActionPreference = "Stop"

$BackendUrl  = "http://localhost:3001"
$Timestamp   = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$TestEmail   = "qa-$Timestamp@test.com"
$TestPass    = "TestPass123!"
$TestDisplay = "QA Tester"

$script:PassCount = 0
$script:FailCount = 0
$AccessToken = $null
$AgentId     = $null
$SessionId   = $null
$RawApiKey   = $null

function Write-Pass([string]$Label, [string]$Detail = "") {
    $script:PassCount++
    $msg = "  [PASS] $Label"
    if ($Detail) { $msg += " | $Detail" }
    Write-Host $msg -ForegroundColor Green
}

function Write-Fail([string]$Label, [string]$Expected, [string]$Actual) {
    $script:FailCount++
    Write-Host "  [FAIL] $Label" -ForegroundColor Red
    Write-Host "         Expected: $Expected" -ForegroundColor Yellow
    Write-Host "         Actual:   $Actual" -ForegroundColor Yellow
}

function Write-Step([int]$Num, [string]$Name) {
    Write-Host ""
    Write-Host "Step $Num - $Name" -ForegroundColor Cyan
    Write-Host ("-" * 60) -ForegroundColor DarkGray
}

function Api([string]$Method, [string]$Uri, [hashtable]$Headers = @{}, [object]$Body = $null) {
    $params = @{
        Method      = $Method
        Uri         = $Uri
        Headers     = $Headers
        ContentType = "application/json"
        ErrorAction = "Stop"
    }
    if ($null -ne $Body) {
        $params["Body"] = ($Body | ConvertTo-Json -Depth 10 -Compress)
    }
    return Invoke-RestMethod @params
}

function Get-StatusCode($err) {
    try { return $err.Exception.Response.StatusCode.value__ }
    catch { return 0 }
}

# ===== STEP 1: Health check =====
Write-Step 1 "Health check"
try {
    $resp = Api -Method GET -Uri "$BackendUrl/health"
    if ($resp.status -eq "ok") { Write-Pass "GET /health" "status=ok" }
    else { Write-Fail "GET /health" "status: ok" "status: $($resp.status)" }
}
catch {
    Write-Fail "GET /health" "HTTP 200" $_.Exception.Message
    Write-Host "CRITICAL: Backend unreachable. Aborting." -ForegroundColor Red
    exit 1
}

# ===== STEP 2: Signup =====
Write-Step 2 "Signup new user ($TestEmail)"
try {
    $body = @{ email = $TestEmail; password = $TestPass; displayName = $TestDisplay }
    $resp = Api -Method POST -Uri "$BackendUrl/api/v1/auth/signup" -Body $body

    if ($resp.accessToken) { Write-Pass "signup - accessToken present"; $AccessToken = $resp.accessToken }
    else { Write-Fail "signup - accessToken" "non-empty" "(missing)"; exit 1 }

    if ($resp.refreshToken) { Write-Pass "signup - refreshToken present" }
    else { Write-Fail "signup - refreshToken" "non-empty" "(missing)" }

    if ($resp.user -and $resp.user.id) { Write-Pass "signup - user.id present" "id=$($resp.user.id)" }
    else { Write-Fail "signup - user.id" "UUID" "(missing)" }

    if ($resp.user -and $resp.user.email -eq $TestEmail) { Write-Pass "signup - user.email matches" }
    else { Write-Fail "signup - user.email" $TestEmail "$($resp.user.email)" }
}
catch {
    Write-Fail "POST /auth/signup" "201 with tokens" $_.Exception.Message
    Write-Host "CRITICAL: Signup failed. Aborting." -ForegroundColor Red
    exit 1
}

# ===== STEP 3: Login =====
Write-Step 3 "Login"
try {
    $body = @{ email = $TestEmail; password = $TestPass }
    $resp = Api -Method POST -Uri "$BackendUrl/api/v1/auth/login" -Body $body

    if ($resp.accessToken) { Write-Pass "login - accessToken present"; $AccessToken = $resp.accessToken }
    else { Write-Fail "login - accessToken" "non-empty" "(missing)"; exit 1 }

    if ($resp.refreshToken) { Write-Pass "login - refreshToken present" }
    else { Write-Fail "login - refreshToken" "non-empty" "(missing)" }

    if ($resp.user -and $resp.user.email -eq $TestEmail) { Write-Pass "login - user.email matches" }
    else { Write-Fail "login - user.email" $TestEmail "$($resp.user.email)" }
}
catch {
    Write-Fail "POST /auth/login" "200 with tokens" $_.Exception.Message
    Write-Host "CRITICAL: Login failed. Aborting." -ForegroundColor Red
    exit 1
}

# Negative: wrong password
try {
    $bad = @{ email = $TestEmail; password = "WrongPass999!" }
    Api -Method POST -Uri "$BackendUrl/api/v1/auth/login" -Body $bad | Out-Null
    Write-Fail "login - rejects wrong password" "HTTP 401" "HTTP 200"
}
catch {
    $sc = Get-StatusCode $_
    if ($sc -eq 401) { Write-Pass "login - rejects wrong password" "HTTP 401" }
    else { Write-Fail "login - rejects wrong password" "HTTP 401" "HTTP $sc" }
}

# ===== STEP 4: Get organisation =====
Write-Step 4 "Get organisation"
try {
    $h = @{ Authorization = "Bearer $AccessToken" }
    $resp = Api -Method GET -Uri "$BackendUrl/api/v1/organisations/me" -Headers $h

    if ($resp.id) { Write-Pass "GET /organisations/me - id present" "id=$($resp.id)" }
    else { Write-Fail "GET /organisations/me - id" "UUID" "(missing)" }

    if ($resp.name) { Write-Pass "GET /organisations/me - name present" "name=$($resp.name)" }
    else { Write-Fail "GET /organisations/me - name" "non-empty" "(missing)" }
}
catch { Write-Fail "GET /organisations/me" "200 with org" $_.Exception.Message }

# Negative: no token
try {
    Api -Method GET -Uri "$BackendUrl/api/v1/organisations/me" | Out-Null
    Write-Fail "GET /organisations/me - rejects no auth" "HTTP 401" "HTTP 200"
}
catch {
    $sc = Get-StatusCode $_
    if ($sc -eq 401) { Write-Pass "GET /organisations/me - rejects no auth" "HTTP 401" }
    else { Write-Fail "GET /organisations/me - rejects no auth" "HTTP 401" "HTTP $sc" }
}

# ===== STEP 5: Generate API key =====
Write-Step 5 "Generate API key"
try {
    $h = @{ Authorization = "Bearer $AccessToken" }
    $body = @{ name = "test-key-$Timestamp" }
    $resp = Api -Method POST -Uri "$BackendUrl/api/v1/api-keys" -Headers $h -Body $body

    if ($resp.id) { Write-Pass "POST /api-keys - id present" "id=$($resp.id)" }
    else { Write-Fail "POST /api-keys - id" "UUID" "(missing)" }

    if ($resp.key) {
        Write-Pass "POST /api-keys - raw key returned"
        $RawApiKey = $resp.key
    }
    else { Write-Fail "POST /api-keys - key" "non-empty string" "(missing)" }

    if ($resp.key -and $resp.key.StartsWith("al_live_sk_")) { Write-Pass "POST /api-keys - correct prefix" "al_live_sk_..." }
    elseif ($resp.key) { Write-Fail "POST /api-keys - prefix" "al_live_sk_*" "$($resp.key.Substring(0,20))" }
}
catch { Write-Fail "POST /api-keys" "201 with key" $_.Exception.Message }

# ===== STEP 6: Create agent =====
Write-Step 6 "Create agent"

# 6a: Via API key
if ($RawApiKey) {
    try {
        $h = @{ "X-API-Key" = $RawApiKey }
        $body = @{ name = "QA Bot (APIKey)"; modelProvider = "openai"; modelId = "gpt-4o" }
        $resp = Api -Method POST -Uri "$BackendUrl/api/v1/agents" -Headers $h -Body $body

        if ($resp.id) { Write-Pass "POST /agents via X-API-Key - id present" "id=$($resp.id)"; $AgentId = $resp.id }
        else { Write-Fail "POST /agents via X-API-Key - id" "UUID" "(missing)" }

        if ($resp.name -eq "QA Bot (APIKey)") { Write-Pass "POST /agents via X-API-Key - name matches" }
        else { Write-Fail "POST /agents via X-API-Key - name" "QA Bot (APIKey)" "$($resp.name)" }
    }
    catch { Write-Fail "POST /agents via X-API-Key" "201" $_.Exception.Message }
}

# 6b: Via Bearer
try {
    $h = @{ Authorization = "Bearer $AccessToken" }
    $body = @{ name = "QA Bot (JWT)"; modelProvider = "openai"; modelId = "gpt-4o" }
    $resp = Api -Method POST -Uri "$BackendUrl/api/v1/agents" -Headers $h -Body $body

    if ($resp.id) { Write-Pass "POST /agents via Bearer - id present" "id=$($resp.id)"; if (-not $AgentId) { $AgentId = $resp.id } }
    else { Write-Fail "POST /agents via Bearer - id" "UUID" "(missing)" }

    if ($resp.modelProvider -eq "openai") { Write-Pass "POST /agents via Bearer - modelProvider correct" }
    else { Write-Fail "POST /agents via Bearer - modelProvider" "openai" "$($resp.modelProvider)" }
}
catch { Write-Fail "POST /agents via Bearer" "201" $_.Exception.Message }

if (-not $AgentId) {
    Write-Host "CRITICAL: No agent created. Aborting." -ForegroundColor Red
    exit 1
}

# ===== STEP 7: Create session =====
Write-Step 7 "Create session"
try {
    $h = @{ Authorization = "Bearer $AccessToken" }
    $body = @{ agentId = $AgentId }
    $resp = Api -Method POST -Uri "$BackendUrl/api/v1/sessions" -Headers $h -Body $body

    if ($resp.id) { Write-Pass "POST /sessions - id present" "id=$($resp.id)"; $SessionId = $resp.id }
    else { Write-Fail "POST /sessions - id" "UUID" "(missing)" }

    if ($resp.agentId -eq $AgentId) { Write-Pass "POST /sessions - agentId matches" }
    else { Write-Fail "POST /sessions - agentId" $AgentId "$($resp.agentId)" }
}
catch {
    Write-Fail "POST /sessions" "201" $_.Exception.Message
    Write-Host "CRITICAL: Session creation failed. Aborting." -ForegroundColor Red
    exit 1
}

# Negative: missing agentId
try {
    $h = @{ Authorization = "Bearer $AccessToken" }
    Api -Method POST -Uri "$BackendUrl/api/v1/sessions" -Headers $h -Body @{ metadata = @{ note = "no agentId" } } | Out-Null
    Write-Fail "POST /sessions - rejects missing agentId" "HTTP 400" "HTTP 200"
}
catch {
    $sc = Get-StatusCode $_
    if ($sc -eq 400) { Write-Pass "POST /sessions - rejects missing agentId" "HTTP 400" }
    else { Write-Fail "POST /sessions - rejects missing agentId" "HTTP 400" "HTTP $sc" }
}

# ===== STEP 8: Post events =====
Write-Step 8 "Post events"
try {
    $h = @{ Authorization = "Bearer $AccessToken" }

    $primaryEvent = @{
        sessionId = $SessionId
        agentId   = $AgentId
        category  = "llm_call"
        level     = "info"
        message   = "Test LLM call from QA suite"
    }
    $body = @{ events = @($primaryEvent) }
    $resp = Api -Method POST -Uri "$BackendUrl/api/v1/events" -Headers $h -Body $body

    $firstEvent = if ($resp -is [array]) { $resp[0] } else { $resp }
    if ($firstEvent -and ($firstEvent.id -or $firstEvent.Count -gt 0)) {
        Write-Pass "POST /events (primary) - created" "response received"
    }
    else { Write-Fail "POST /events (primary)" "event with id" "unexpected response" }

    # Bulk: cover all categories
    $cats = @("agent_lifecycle", "llm_call", "tool_invocation", "user_action", "system", "security", "guardrail")
    $bulkEvents = @()
    foreach ($c in $cats) {
        $bulkEvents += @{ sessionId = $SessionId; agentId = $AgentId; category = $c; level = "info"; message = "Enum: $c" }
    }
    $bulkBody = @{ events = $bulkEvents }
    Api -Method POST -Uri "$BackendUrl/api/v1/events" -Headers $h -Body $bulkBody | Out-Null
    Write-Pass "POST /events (bulk categories: $($cats.Count))" "all accepted"

    # Bulk: cover all levels
    $lvls = @("debug", "info", "warn", "error", "fatal")
    $lvlEvents = @()
    foreach ($l in $lvls) {
        $lvlEvents += @{ sessionId = $SessionId; agentId = $AgentId; category = "system"; level = $l; message = "Enum: $l" }
    }
    $lvlBody = @{ events = $lvlEvents }
    Api -Method POST -Uri "$BackendUrl/api/v1/events" -Headers $h -Body $lvlBody | Out-Null
    Write-Pass "POST /events (bulk levels: $($lvls.Count))" "all accepted"
}
catch { Write-Fail "POST /events" "201" $_.Exception.Message }

# Negative: invalid category
try {
    $h = @{ Authorization = "Bearer $AccessToken" }
    $body = @{ events = @(@{ sessionId = $SessionId; agentId = $AgentId; category = "invalid_xyz"; level = "info"; message = "bad" }) }
    Api -Method POST -Uri "$BackendUrl/api/v1/events" -Headers $h -Body $body | Out-Null
    Write-Fail "POST /events - rejects invalid category" "HTTP 400" "HTTP 200"
}
catch {
    $sc = Get-StatusCode $_
    if ($sc -eq 400) { Write-Pass "POST /events - rejects invalid category" "HTTP 400" }
    else { Write-Fail "POST /events - rejects invalid category" "HTTP 400" "HTTP $sc" }
}

# Negative: invalid level
try {
    $h = @{ Authorization = "Bearer $AccessToken" }
    $body = @{ events = @(@{ sessionId = $SessionId; agentId = $AgentId; category = "llm_call"; level = "verbose"; message = "bad" }) }
    Api -Method POST -Uri "$BackendUrl/api/v1/events" -Headers $h -Body $body | Out-Null
    Write-Fail "POST /events - rejects invalid level" "HTTP 400" "HTTP 200"
}
catch {
    $sc = Get-StatusCode $_
    if ($sc -eq 400) { Write-Pass "POST /events - rejects invalid level" "HTTP 400" }
    else { Write-Fail "POST /events - rejects invalid level" "HTTP 400" "HTTP $sc" }
}

# ===== STEP 9: Verify events in API =====
Write-Step 9 "Verify events in API"
try {
    $h = @{ Authorization = "Bearer $AccessToken" }
    $resp = Api -Method GET -Uri "$BackendUrl/api/v1/events?sessionId=$SessionId" -Headers $h

    $eventList = if ($resp -is [array]) { $resp } else { @($resp) }

    if ($eventList.Count -gt 0) { Write-Pass "GET /events?sessionId - non-empty" "count=$($eventList.Count)" }
    else { Write-Fail "GET /events?sessionId" "non-empty array" "empty" }

    $primary = $eventList | Where-Object { $_.message -eq "Test LLM call from QA suite" } | Select-Object -First 1
    if ($primary) { Write-Pass "GET /events - primary event found" }
    else { Write-Fail "GET /events - primary event" "message match" "not found" }

    if ($primary -and $primary.category -eq "llm_call") { Write-Pass "GET /events - category correct" "llm_call" }
    elseif ($primary) { Write-Fail "GET /events - category" "llm_call" "$($primary.category)" }

    if ($primary -and $primary.agentId -eq $AgentId) { Write-Pass "GET /events - agentId correct" }
    elseif ($primary) { Write-Fail "GET /events - agentId" $AgentId "$($primary.agentId)" }

    # Filter by category
    $catResp = Api -Method GET -Uri "$BackendUrl/api/v1/events?sessionId=$SessionId&category=llm_call" -Headers $h
    $catList = if ($catResp -is [array]) { $catResp } else { @($catResp) }
    if ($catList.Count -gt 0) { Write-Pass "GET /events?category=llm_call - filtered" "count=$($catList.Count)" }
    else { Write-Fail "GET /events?category=llm_call" "non-empty" "empty" }

    # Negative: nonexistent session
    $fakeId = [System.Guid]::NewGuid().ToString()
    $noResp = Api -Method GET -Uri "$BackendUrl/api/v1/events?sessionId=$fakeId" -Headers $h
    $noList = if ($noResp -is [array]) { $noResp } else { @($noResp) }
    if ($noList.Count -eq 0 -or ($noList.Count -eq 1 -and $null -eq $noList[0])) {
        Write-Pass "GET /events?sessionId=<fake> - returns empty"
    }
    else { Write-Fail "GET /events?sessionId=<fake>" "empty array" "count=$($noList.Count)" }
}
catch { Write-Fail "GET /events" "200 with events" $_.Exception.Message }

# ===== SUMMARY =====
$Total = $script:PassCount + $script:FailCount
Write-Host ""
Write-Host ("=" * 60) -ForegroundColor DarkGray
Write-Host "TEST SUMMARY" -ForegroundColor White
Write-Host ("=" * 60) -ForegroundColor DarkGray
Write-Host "  Total  : $Total"
Write-Host "  Passed : $($script:PassCount)" -ForegroundColor Green
if ($script:FailCount -eq 0) {
    Write-Host "  Failed : 0" -ForegroundColor Green
} else {
    Write-Host "  Failed : $($script:FailCount)" -ForegroundColor Red
}
Write-Host ("=" * 60) -ForegroundColor DarkGray

if ($script:FailCount -gt 0) {
    Write-Host ""
    Write-Host "Some tests FAILED. Review output above." -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "All tests PASSED." -ForegroundColor Green
    exit 0
}
