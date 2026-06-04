# Deploying to Railway

This app deploys as **one Railway web service** (Node server that serves the
built React client + the API) plus **two Railway database services**:
Postgres (with pgvector) and Redis.

## What's already set up (in code)
- `railway.json` — build (`npm run build`) + pre-deploy (`npm run release`) + start (`npm run start`)
- `npm run build` → installs & builds the client, installs the server, generates Prisma client
- `npm run release` → ensures pgvector extension → `prisma db push` → idempotent seed (skips if already seeded) → creates HNSW indexes
- The server serves `client/dist` as static + SPA fallback in production
- All config is env-driven (no secrets in code)

## One-time deploy steps (need your Railway login)

```bash
# 1. Log in (opens browser) — run this in your terminal
railway login

# 2. From the project root, create a Railway project
cd /Users/smitsuthar/swirl/gemini-voice-assistant-poc
railway init                 # name it e.g. "car-voice-assistant"

# 3. Add the databases
railway add --database postgres
railway add --database redis

# 4. Set env vars on the web service
railway variables --set "GEMINI_API_KEY=<your-key>"
#   DATABASE_URL and REDIS_URL: reference the DB services in the Railway
#   dashboard (Variables tab) →
#     DATABASE_URL = ${{Postgres.DATABASE_URL}}
#     REDIS_URL    = ${{Redis.REDIS_URL}}
#   (Optional) CORS_ORIGIN is not needed — client is same-origin in prod.

# 5. Deploy
railway up

# 6. Get the public URL
railway domain
```

## pgvector note
Railway's managed Postgres supports the `pgvector` extension; the `release`
step runs `CREATE EXTENSION IF NOT EXISTS vector` automatically. If your
Postgres image lacks it, swap the DB service to the `pgvector/pgvector:pg16`
image (Railway → New → Docker Image) and point `DATABASE_URL` at it.

## First deploy will
1. Build client + server
2. Create the pgvector extension
3. Push the schema (tables + indexes)
4. Seed brands, cars, showrooms, time slots, reviews & videos (with embeddings)
5. Build HNSW vector indexes
6. Start the server and serve the app at the Railway domain

Re-deploys are safe: the seed is idempotent (set `FORCE_SEED=1` to re-seed).
