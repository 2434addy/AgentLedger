# AgentLedger Production Deployment Guide

## Generated on: 2026-03-17

---

## 1. Koyeb Backend Environment Variables

Set these in Koyeb dashboard > Service > Environment Variables:

| Variable | Value |
|----------|-------|
| PORT | 3001 |
| NODE_ENV | production |
| DATABASE_URL | postgresql://neondb_owner:npg_P01sqloprIGt@ep-quiet-violet-a1epe2z3-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require |
| REDIS_URL | rediss://default:gQAAAAAAARr1AAIncDIxOTlhMWQ5ODA0Mjc0N2ZmOGFhZGZkYThkMTc4YWVjOXAyNzI0Mzc@bold-silkworm-72437.upstash.io:6379 |
| JWT_SECRET | 9e933fd2b276b5cdb9e8ee41e95ade96294f382a1e6cd231e1044210af5c76ff90ef5e4d83082f64b8ee14b44e08dd0e12db8af686d3a1243b389b7a813b06fb |
| JWT_REFRESH_SECRET | 2a080ab66bcd8370bfb973f1bb87cdfe6623c00127d7c30732b1fc14a0f6a2265ac49d7effa55f4bb415192223dda523b1fbd3d7a529d6bdafd896344f16a936 |
| JWT_EXPIRES_IN | 15m |
| JWT_REFRESH_EXPIRES_IN | 7d |
| CORS_ORIGIN | https://agentledger.pages.dev |
| API_KEY_PREFIX | al_live_sk_ |

## 2. Cloudflare Pages Frontend Environment Variables

Set these in Cloudflare Pages dashboard > Settings > Environment Variables:

| Variable | Value |
|----------|-------|
| NEXT_PUBLIC_API_URL | https://YOUR-KOYEB-APP-NAME.koyeb.app |

(Replace YOUR-KOYEB-APP-NAME with your actual Koyeb service URL after deployment)

## 3. Koyeb Backend Deployment Steps

1. Go to https://app.koyeb.com
2. Click "Create Service"
3. Select "GitHub" as source
4. Connect your GitHub account if not already connected
5. Select repository: `2434addy/AgentLedger`
6. Set these build settings:
   - **Builder**: Dockerfile
   - **Dockerfile path**: `backend/Dockerfile`
   - **Work directory**: `backend`
7. Set **Port**: 3001
8. Add ALL environment variables from Section 1 above
9. Set **Instance type**: Free (nano)
10. Set **Region**: Closest to your users
11. Click "Deploy"
12. Wait for build to complete — note the generated URL (e.g., `https://xxx.koyeb.app`)
13. Test: `curl https://xxx.koyeb.app/health` should return `{"status":"ok"}`

## 4. Cloudflare Pages Frontend Deployment Steps

1. Go to https://dash.cloudflare.com > Pages
2. Click "Create a project"
3. Select "Connect to Git"
4. Select repository: `2434addy/AgentLedger`
5. Set these build settings:
   - **Framework preset**: Next.js
   - **Build command**: `cd frontend && npm install --legacy-peer-deps && npm run build`
   - **Build output directory**: `frontend/.next`
   - **Root directory**: `/` (leave default)
6. Add environment variable from Section 2 above:
   - `NEXT_PUBLIC_API_URL` = `https://YOUR-KOYEB-URL.koyeb.app`
7. Click "Save and Deploy"
8. Once deployed, note the URL (e.g., `https://agentledger.pages.dev`)
9. Go back to Koyeb and update `CORS_ORIGIN` to match the Cloudflare Pages URL

## 5. Post-Deployment Verification

1. Open the Cloudflare Pages URL in browser
2. Sign up with a new account
3. Login should redirect to dashboard
4. Create an agent, create a session, post events
5. Verify dashboard shows the data
6. Test API key generation and usage

## 6. Important Notes

- **Never commit .env files** — backend/.gitignore excludes them
- **Rotate secrets** if you suspect they were exposed
- **CORS_ORIGIN** must exactly match the frontend URL (no trailing slash)
- **Database**: Neon free tier — no expiry, auto-suspend after 5min inactivity
- **Redis**: Upstash free tier — 10,000 commands/day
- **Total cost**: $0/month

---

## Troubleshooting

- Database connect error: check DATABASE_URL uses pooled string with ?pgbouncer=true
- CORS error: CORS_ORIGIN on Koyeb must EXACTLY match Cloudflare Pages URL (no trailing slash)
- Redis error: REDIS_URL must start with rediss:// (two s, TLS required)
- Build fail on Cloudflare: check frontend/.npmrc has legacy-peer-deps=true
- Build fail on Koyeb: check eslint is pinned to ^8.57.0 in frontend/package.json
- SSL error on DB: ssl: { rejectUnauthorized: false } must be set in TypeORM config
