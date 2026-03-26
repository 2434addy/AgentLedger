# AgentLedger — TODOs & Pending Work

## Deployment (Phase 5) — CRITICAL
- [ ] Set all secrets in Koyeb, Cloudflare, Neon, and Upstash dashboards (manual step)
- [ ] Verify live deployment end-to-end after secrets are set
- [ ] Commit outstanding unstaged changes (auth service, JWT strategy, main.ts, sessions controller)

---

## Security Issues (from Security Audit)

### High Priority
- [ ] **Move tokens from localStorage to httpOnly Secure cookies** — Prevents XSS token theft
- [ ] **Add role-based access control (@Roles guards)** — Currently any authenticated user can CRUD all resources in their org regardless of role

### Medium Priority
- [ ] **Add CSRF protection** — Needed once cookies are used for auth
- [ ] **Wire up audit_logs entity** — Entity exists but no interceptor writes to it; create NestJS interceptor for auto-logging
- [ ] **Client-side rate limiting on login** — Add exponential backoff after failed login attempts
- [ ] **React Error Boundaries** — Wrap dashboard pages to prevent full-app crashes
- [ ] **Per-API-key rate limiting** — Add throttle per `keyHash` in ApiKeyGuard

### Low Priority
- [ ] **Add Swagger/OpenAPI docs** — Use `@nestjs/swagger` decorators
- [ ] **Session inactivity timeout** — Add idle timer on frontend that logs user out

---

## Testing
- [ ] **Backend unit tests** — No unit or integration tests exist; test script is a placeholder
- [ ] **Frontend tests** — No component or E2E tests in frontend
- [ ] E2E tests exist (`tests/test-api.js`, 33/33 passing) but are manual scripts, not CI-integrated

---

## Roadmap Features
- [ ] AgentLedger MCP server (Claude integration)
- [ ] Slack / PagerDuty alert integrations
- [ ] HIPAA compliance report template
- [ ] SOC 2 Type II certification (target Q3 2026)
- [ ] On-premise / air-gapped deployment option

---

## SDK
- [ ] **Package name mismatch** — `sdk/package.json` has `@2434addy/sdk` but README and docs reference `@agentledger/sdk`

---

## Codebase Hygiene
- [ ] Commit or stash uncommitted changes: `.gitignore`, `auth.service.ts`, `jwt.strategy.ts`, `main.ts`, `sessions.controller.ts`, `frontend/package-lock.json`, `sdk/package.json`
- [ ] Decide whether `SECURITY_AUDIT.md` and `SecondBrain/` should be tracked in git
