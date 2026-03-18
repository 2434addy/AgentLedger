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
| DATABASE_URL | postgresql://neondb_owner:npg_P01sqloprIGt@ep-quiet-violet-a1epe2z3-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require |
| REDIS_URL | rediss://default:gQAAAAAAARr1AAIncDIxOTlhMWQ5ODA0Mjc0N2ZmOGFhZGZkYThkMTc4YWVjOXAyNzI0Mzc@bold-silkworm-72437.upstash.io:6379 |
| JWT_SECRET | 9e933fd2b8c4a1e7d3f2a8b5c9d6e4f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7 |
| JWT_REFRESH_SECRET | 2a080ab6c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0 |
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
