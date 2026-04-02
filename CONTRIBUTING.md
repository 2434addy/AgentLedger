# Contributing to AgentLedger

Thanks for your interest in contributing! Here's how to get started.

## Getting Started

```bash
git clone https://github.com/2434addy/AgentLedger.git
cd AgentLedger

# Start infrastructure
docker-compose up -d   # PostgreSQL + Redis

# Backend
cd backend
cp .env.example .env   # Edit with your DB and Redis URLs
npm install
npm run migration:run
npm run start:dev      # http://localhost:3001

# Frontend (separate terminal)
cd frontend
npm install
npm run dev            # http://localhost:3000
```

## Pull Request Guidelines

1. **Open an issue first** for non-trivial changes. Describe what you want to build and why.
2. **Fork and branch** — create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature
   ```
3. **Follow conventions**:
   - Commit messages: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
   - TypeScript strict mode — no `any` types
   - All new endpoints need tests
4. **Test your changes**:
   ```bash
   cd backend && npm run build    # Must pass with 0 errors
   cd frontend && npm run build   # Must pass with 0 errors
   ```
5. **Submit PR** against `main` with:
   - Clear description of what changed and why
   - Screenshots for UI changes
   - Test plan

## Project Structure

```
AgentLedger/
├── backend/          # NestJS API server
│   └── src/
│       ├── agents/       # Agent CRUD
│       ├── events/       # Event ingestion + hash chain
│       ├── sessions/     # Session management
│       ├── approvals/    # Human-in-loop approval queue
│       ├── compliance/   # Report generation
│       ├── analytics/    # Cost and usage analytics
│       ├── auth/         # JWT + API key auth
│       └── common/       # Guards, filters, DTOs
├── frontend/         # Next.js dashboard
│   └── src/
│       ├── app/          # Pages and routes
│       ├── components/   # Shared components
│       └── lib/          # API client, utilities
├── sdk/              # TypeScript SDK (npm package)
│   └── src/
│       ├── client.ts     # Main SDK class
│       ├── types.ts      # Exported types
│       └── errors.ts     # Error classes
└── demo/             # Example scripts
```

## Reporting Bugs

Use [GitHub Issues](https://github.com/2434addy/AgentLedger/issues) with the bug report template. Include:
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, browser)

## Feature Requests

Use [GitHub Issues](https://github.com/2434addy/AgentLedger/issues) with the feature request template. Describe:
- The problem you're trying to solve
- Your proposed solution
- Alternatives you've considered

## Code of Conduct

Be respectful, constructive, and inclusive. We're building something together.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
