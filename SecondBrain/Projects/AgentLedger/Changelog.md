---
project: AgentLedger
type: changelog
status: current
tags: [changelog, git-history, releases]
created: 2026-03-24
---

# AgentLedger Changelog

Derived from git history. See also [[TODOs]], [[Architecture]].

## Latest (main branch)

### a707af6 — feat: add @agentledger/sdk TypeScript package
- Created `@agentledger/sdk` standalone SDK
- Classes: AgentLedger, Session, EventEmitter, Hasher
- Features: wrap/session/track API, SHA-256 chain hashing, approval polling
- Build: tsup (CJS + ESM + .d.ts)

### 059f8ef — docs: add comprehensive README
- Project README with feature overview and usage examples

### 73073a0 — feat: competitor comparison table + framework SDK snippets
- Added competitor comparison (vs LangSmith, Arize, etc.)
- SDK integration snippets for popular agent frameworks

### 5c57492 — feat: add human-in-loop, SHA-256 tamper proof, compliance reports UI
- Human-in-the-loop approval workflow
- SHA-256 tamper-proof event hashing
- Compliance reports UI page
- Session replay UI

### cd9d4f0 — fix: security audit fixes + add test report documentation
- Fixed 17 security findings (all critical/high resolved)
- Added test report documentation
- SECURITY_AUDIT.md created

### bab7e03 — feat: add event integrity system, state snapshots, comprehensive test suite
- Event hash verification endpoints
- stateBefore/stateAfter JSONB columns
- 33/33 QA tests passing
- Migration: AddEventStateSnapshots

### 10ac741 — fix: compliance audit trail, event FK, build config
- Fixed compliance module audit trail
- Fixed event foreign key constraints
- Build configuration fixes

### 64ed7db — fix: nullable sessionId, PDF/Word compliance export, render.yaml
- Made sessionId nullable on events
- PDF and Word document export for compliance reports
- Added render.yaml deployment config

### 0160bdf — feat: AgentLedger v2.0 - complete rebuild
- Full rebuild of the platform
- NestJS backend with 10 modules
- Next.js frontend with glassmorphism UI
- PostgreSQL + Redis architecture
- JWT + API key authentication

## Phase Timeline

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | Done | Repo setup, CLAUDE.md, agent files, wireframes |
| Phase 2 | Done | Database schema + NestJS backend (all endpoints) |
| Phase 3 | Done | Next.js frontend (all pages, glass UI) |
| Phase 4 | Done | Security audit (17 fixes) + QA (33/33 pass) |
| Phase 5 | In Progress | Deployment to Koyeb + Cloudflare Pages |
