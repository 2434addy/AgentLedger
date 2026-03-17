# AgentLedger — MCP Server Setup Guide

## Replace these placeholders with real values BEFORE running /mcp

### 1. Neon PostgreSQL (REQUIRED — get this first)
Go to: https://console.neon.tech → your project → Connection Details
Select: "Pooled connection" tab (MUST have ?pgbouncer=true in URL)
Replace: YOUR_NEON_POOLED_CONNECTION_STRING
Example: postgresql://user:pass@ep-cool-name.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true

### 2. Upstash Redis (REQUIRED for queues + cache)
Go to: https://console.upstash.com → your database → REST API tab
Replace: YOUR_UPSTASH_REST_URL → the URL shown under "UPSTASH_REDIS_REST_URL"
Replace: YOUR_UPSTASH_REST_TOKEN → the token shown under "UPSTASH_REDIS_REST_TOKEN"

### 3. GitHub PAT (REQUIRED for auto-deploy)
Go to: github.com → Settings → Developer settings → Personal access tokens → Fine-grained
Create token with permissions: Contents (read/write), Pull requests, Issues, Metadata
Replace: YOUR_GITHUB_PAT

### 4. Cloudflare (REQUIRED for frontend deployment)
Go to: dash.cloudflare.com → My Profile → API Tokens → Create Token
Use template: "Edit Cloudflare Workers"
Also get Account ID from: dash.cloudflare.com → right sidebar
Replace: YOUR_CLOUDFLARE_API_TOKEN and YOUR_CLOUDFLARE_ACCOUNT_ID

### 5. Brave Search (FREE — get this for web search)
Go to: https://api.search.brave.com/register
Free tier = 2000 searches/month, no credit card
Replace: YOUR_BRAVE_API_KEY

## MCP Server → Agent mapping for AgentLedger

| MCP Server      | Agents that use it              | Purpose                                    |
|-----------------|---------------------------------|--------------------------------------------|
| neon-postgres   | db-architect, devops-engineer   | Run migrations, inspect live DB schema     |
| upstash-redis   | backend-architect, qa-engineer  | Monitor queues, debug cache issues         |
| github          | devops-engineer, tech-lead      | Auto-commit, manage PRs, push code         |
| filesystem      | ALL 9 agents                    | Read/write any file in the project         |
| cloudflare      | devops-engineer, frontend       | Deploy frontend, check build logs          |
| brave-search    | ALL 9 agents                    | Look up docs, debug error messages         |
| context7        | backend-architect, frontend     | NestJS/Next.js/TypeORM accurate docs       |
| puppeteer       | qa-engineer, ux-designer        | Screenshot live site, test UI rendering    |

## Verify all servers are connected — run this in Claude terminal:
/mcp

All 8 servers should show green. If any show red, check the key for that server above.
