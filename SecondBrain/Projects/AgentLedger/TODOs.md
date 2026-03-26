---
project: AgentLedger
type: todos
status: active
tags: [tasks, priorities, deployment, roadmap]
created: 2026-03-24
---

# AgentLedger TODOs

Current phase: **Phase 5 — Deployment**. See also [[Decisions]], [[Architecture]].

## P0 — Deployment (Phase 5)

- [ ] Set all secrets in Koyeb env vars (DATABASE_URL, REDIS_URL, JWT_SECRET, JWT_REFRESH_SECRET, CORS_ORIGIN)
- [ ] Set NEXT_PUBLIC_API_URL in Cloudflare Pages env
- [ ] Deploy backend to Koyeb (Docker build from `backend/Dockerfile`)
- [ ] Deploy frontend to Cloudflare Pages (Git integration)
- [ ] Verify health check: `GET /health` on production
- [ ] Run migrations on production Neon DB
- [ ] Smoke test full flow: signup → login → create agent → session → events → compliance

## P1 — Post-Launch

- [ ] Publish `@agentledger/sdk` to npm
- [ ] Set up custom domain (if desired)
- [ ] Configure Cloudflare analytics
- [ ] Monitor Koyeb free tier resource usage
- [ ] Set up error alerting/monitoring

## P2 — Feature Backlog

- [ ] Real-time event streaming (WebSocket/SSE)
- [ ] Team member invitations (multi-user orgs)
- [ ] Role-based access control (admin vs member permissions)
- [ ] Webhook notifications for anomalies
- [ ] SDK support for Python agents
- [ ] Dashboard customization (widget layout)
- [ ] Export events as CSV/JSON
- [ ] Approval workflow UI (human-in-the-loop from dashboard)

## P3 — Technical Debt

- [ ] Add unit tests for backend services
- [ ] Add frontend component tests
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] API rate limiting per org/plan tier
- [ ] Database backup strategy
- [ ] Log aggregation setup

## Completed

- [x] Phase 1: Repo setup, CLAUDE.md, agent files, wireframes
- [x] Phase 2: Database schema + NestJS backend (all modules, 6/6 API tests passed)
- [x] Phase 3: Next.js frontend (all pages wired, glass UI)
- [x] Phase 4: Security audit (17 findings fixed) + QA (33/33 tests passed)
- [x] Dockerfile + koyeb.yaml created
- [x] .env.example files committed
- [x] ESLint pinned to ^8.57.0
- [x] Frontend .npmrc with legacy-peer-deps
- [x] SDK package created (@agentledger/sdk)
