# AgentLedger — Production Deployment Guide

## Deployment Stack (100% Free Forever)

| Service   | Provider          | Tier         |
|-----------|-------------------|--------------|
| Backend   | Render.com        | Free         |
| Frontend  | Cloudflare Pages  | Free         |
| Database  | Neon PostgreSQL   | Free forever |
| Redis     | Upstash           | Free forever |

**Total cost: $0/month**

---

## Step 1: Deploy Backend on Render.com

1. Go to https://render.com → Sign up with GitHub (free, no credit card)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub → select **2434addy/AgentLedger**
4. Configure settings:
   - **Name:** `agentledger-api`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `node dist/main`
   - **Instance Type:** Free
5. Add environment variables:

| Variable | Value |
|----------|-------|
| PORT | 3001 |
| NODE_ENV | production |
| DATABASE_URL | *(Get from Neon console → Connection Details → Pooled connection)* |
| REDIS_URL | *(Get from Upstash console → Database → Details → Redis URL)* |
| JWT_SECRET | *(Generate with: `openssl rand -hex 32`)* |
| JWT_REFRESH_SECRET | *(Generate with: `openssl rand -hex 32`)* |
| JWT_EXPIRES_IN | 15m |
| JWT_REFRESH_EXPIRES_IN | 7d |
| CORS_ORIGIN | https://agentledger.pages.dev |
| API_KEY_PREFIX | al_live_sk_ |

6. Click **"Create Web Service"**
7. Wait for deploy (3-5 minutes)
8. Test: `curl https://YOUR-URL.onrender.com/health`

---

## Step 2: Deploy Frontend on Cloudflare Pages

1. Go to https://dash.cloudflare.com
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Select **2434addy/AgentLedger**
4. Build settings:
   - **Framework preset:** Next.js
   - **Build command:** `cd frontend && npm ci && npm run build`
   - **Build output directory:** `frontend/.next`
   - **Root directory:** `/` (leave default)
5. Environment variables:

| Variable | Value |
|----------|-------|
| NEXT_PUBLIC_API_URL | https://YOUR-RENDER-URL.onrender.com |

6. Click **Deploy**
7. Note your URL: `https://agentledger.pages.dev`

---

## Step 3: Post-Deployment Configuration

1. **Update CORS on Render:** Set `CORS_ORIGIN` to your actual Cloudflare Pages URL (no trailing slash)
2. **Migrations:** The backend auto-runs migrations on startup via TypeORM synchronize
3. **Test full flow:**
   - Visit your Cloudflare URL
   - Sign up a new account
   - Login should redirect to dashboard
   - Create an agent
   - Create a session
   - Send test events via API
   - Verify dashboard shows real data
   - Test API key generation and usage

---

## Important Notes

- **Never commit .env files** — backend/.gitignore excludes them
- **Rotate secrets** if you suspect they were exposed
- **CORS_ORIGIN** must exactly match the frontend URL (no trailing slash)
- **Database**: Neon free tier — no expiry, auto-suspend after 5min inactivity
- **Redis**: Upstash free tier — 10,000 commands/day
- **Render free tier**: Spins down after 15min inactivity, cold start ~30s

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check `DATABASE_URL` and `REDIS_URL` are set correctly |
| CORS errors | Ensure `CORS_ORIGIN` matches your frontend URL exactly (no trailing slash) |
| Auth failures | Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are set |
| Database connection | Ensure Neon connection string uses pooler endpoint |
| Redis connection | Ensure URL starts with `rediss://` (double s for TLS) |
| Build fail on Cloudflare | Check frontend/.npmrc has `legacy-peer-deps=true` |
| SSL error on DB | Ensure `ssl: { rejectUnauthorized: false }` in TypeORM config |

---

## Architecture

```
User → Cloudflare Pages (Next.js) → Render.com (NestJS) → Neon PostgreSQL
                                                        → Upstash Redis
```
