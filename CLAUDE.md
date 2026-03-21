# AgentLedger — Build Plan & Project State

## Current Phase
PHASE 5 — Deployment (READY)

## Phases
- [x] Phase 1: Repo setup + CLAUDE.md + all agent files + wireframe generation
- [x] Phase 2: Database schema + NestJS backend (all modules, all endpoints) — all 6 API tests passed
- [x] Phase 3: Next.js frontend (all pages wired to real API, glass UI) — complete
- [x] Phase 4: Security audit (17 findings, all critical/high fixed) + QA tests (33/33 PASS) + bug fixes
- [ ] Phase 5: Deployment to Koyeb + Cloudflare Pages + Neon + Upstash

## Deployment Stack (100% Free Forever)
- **Backend**: Koyeb (https://koyeb.com) — free tier, no credit card
- **Frontend**: Cloudflare Pages (https://pages.cloudflare.com) — unlimited free
- **Database**: Neon PostgreSQL (https://neon.tech) — free forever, no expiry
- **Redis**: Upstash Redis (https://upstash.com) — free forever, no expiry
- **CI/CD**: GitHub (https://github.com/2434addy/AgentLedger) — free forever
- **Total cost**: $0/month

## Domain Ownership (NO agent crosses these boundaries)
- backend-architect: /backend/src/** (except migrations/entities)
- db-architect: /backend/src/**/*.entity.ts, /backend/src/migrations/**, seeds
- frontend-engineer: /frontend/src/**, /frontend/app/**, tailwind.config.ts
- ux-designer: /docs/wireframes/**, /docs/design-system/**
- security-auditor: READ-ONLY across all domains
- devops-engineer: koyeb.yaml, Dockerfile, .env.example
- qa-engineer: /tests/**, /scripts/test-*.ps1
- code-reviewer: READ-ONLY across all domains
- tech-lead-orchestrator: CLAUDE.md, .claude/agents/**, architecture decisions

## Parallel Execution Rules
- Within Phase 2: backend-architect and db-architect run in PARALLEL
- Within Phase 3: frontend-engineer runs alone (depends on backend)
- Within Phase 4: security-auditor and qa-engineer run in PARALLEL
- Phase 5: devops-engineer runs alone
- code-reviewer runs AFTER every phase completes, BEFORE the next begins

## Key Architecture Decisions
- Auth: JWT (access 15min, refresh 7d) + API key (SHA-256 hashed in DB)
- Events table is append-only — no updates, no deletes
- Redis is used ONLY for: session caching, BullMQ queues, rate limiting
- All API routes prefixed with /api/v1/
- Frontend NEXT_PUBLIC_API_URL must point to Koyeb backend URL
- Enum values are FINAL — see db-architect agent prompt for the full list

## MCP Servers (8 configured)
- neon-postgres: Direct DB access for db-architect and devops-engineer
- upstash-redis: Redis access for backend-architect and qa-engineer
- github: Repo management for devops-engineer and tech-lead
- filesystem: Local file ops for ALL agents
- cloudflare: Frontend deployment for devops-engineer and frontend-engineer
- brave-search: Web search for ALL agents
- context7: Library docs for backend-architect and frontend-engineer
- puppeteer: Browser testing for qa-engineer and ux-designer

## Deployment Checklist (Phase 5)
- [x] Backend: Dockerfile created, Koyeb service configured
- [x] Backend: DATABASE_URL uses Neon pooled connection with ?pgbouncer=true
- [x] Backend: REDIS_URL set on Koyeb (starts with rediss://)
- [x] Backend: main.ts has NO fallback HTTP server
- [x] Backend: CORS_ORIGIN env var set to Cloudflare Pages URL
- [x] Frontend: .npmrc contains legacy-peer-deps=true
- [x] Frontend: package-lock.json regenerated from inside frontend/ directory
- [x] Frontend: eslint pinned to ^8.57.0 in package.json
- [x] Both: .env.example committed with all required env vars listed
- [ ] Both: All secrets set in hosting platform env — never in code (manual step)
