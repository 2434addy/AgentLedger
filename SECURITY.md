# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 2.x     | Yes                |
| 1.x     | No                 |

## Reporting a Vulnerability

If you discover a security vulnerability in AgentLedger, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

1. **Email**: Send a detailed report to security@agentledger.dev
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Impact assessment
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgement**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Fix Timeline**: Critical issues within 7 days, High within 14 days

### What to Expect

- We will confirm receipt of your report
- We will investigate and validate the issue
- We will develop and test a fix
- We will credit you in the release notes (unless you prefer anonymity)

## Security Measures

AgentLedger implements the following security controls:

- **Authentication**: JWT (15min access, 7d refresh) + API key (SHA-256 hashed)
- **Authorization**: Role-based access control (OWNER, ADMIN, MEMBER, VIEWER)
- **CSRF**: Double-submit cookie pattern with timing-safe comparison
- **Rate Limiting**: Global (60/min) + per-endpoint throttling + per-org API key limits
- **Input Validation**: class-validator on all DTOs with MaxLength and type constraints
- **JSONB Limits**: 64KB max on all JSON payload fields
- **SQL Injection**: TypeORM parameterized queries (no raw SQL with user input)
- **XSS**: React auto-escaping, no dangerouslySetInnerHTML, CSP headers
- **Security Headers**: Helmet.js (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
- **Encryption**: bcrypt (12 rounds) for passwords, SHA-256 for API keys and tokens
- **Append-only Audit**: Events table is immutable with SHA-256 hash chain integrity
- **Cookie Security**: httpOnly, Secure, SameSite=Strict on refresh tokens

## Known Limitations

- `rejectUnauthorized: false` is used for Neon PostgreSQL connections when `DATABASE_CA_CERT` is not set. Neon's proxy validates TLS at the edge, but for full cert pinning, set the `DATABASE_CA_CERT` environment variable.
- Transitive dependency vulnerabilities in `path-to-regexp` and `picomatch` (NestJS/Angular DevKit) are ReDoS-class and mitigated by rate limiting. These require NestJS major version bumps to resolve.
