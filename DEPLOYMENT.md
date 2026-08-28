# Deployment

This app has two parts that deploy separately:

- **`frontend/`** — a static Vite/React SPA. Deploys to **Vercel** directly.
- **`backend/`** — a FastAPI service that holds a live Postgres connection
  pool, talks to Redis, and serves long-lived WebSocket connections
  (`/ws/groups/{id}`) for realtime group updates. Vercel's serverless
  functions are request/response only — no persistent connections — so the
  backend **cannot** run on Vercel as-is. Deploy it to a host that runs a
  long-lived process, e.g. Render, Railway, Fly.io, or a VPS. A production
  `Dockerfile` is already provided in `backend/`, so any Docker-based host
  works with no extra changes.

## 1. Backend (Render/Railway/Fly.io/etc.)

1. Provision managed Postgres and Redis on your chosen host.
2. Deploy `backend/` (it already has a `Dockerfile`; `start.sh` runs Alembic
   migrations then starts uvicorn).
3. Set environment variables (see `backend/.env.example`):
   - `DATABASE_URL`, `REDIS_URL` — from your managed instances
   - `JWT_SECRET_KEY` — generate with `python -c "import secrets; print(secrets.token_hex(64))"`
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — if using Google sign-in
   - `APP_ENV=production` — required so the auth refresh cookie is issued as
     `Secure; SameSite=None`, which browsers require for a cookie to be sent
     cross-site (the frontend on Vercel and the backend here are different
     origins)
   - `CORS_ORIGINS=https://your-app.vercel.app` — the exact frontend origin
     (comma-separate if you also want to allow a preview/staging domain)
4. Confirm the backend is reachable over HTTPS and that `/health` returns
   `{"status": "ok"}`, and that WebSocket upgrades work (`wss://your-backend/ws/...`) —
   some hosts need WebSockets enabled explicitly.

## 2. Frontend (Vercel)

1. Import the repo into Vercel and set **Root Directory** to `frontend`
   (this is a monorepo — Vercel needs to know where the Vite app lives).
   Framework preset "Vite" is auto-detected; `frontend/vercel.json` adds the
   SPA rewrite so client-side routes work on refresh/direct link.
2. Set environment variables (see `frontend/.env.example`) in the Vercel
   project settings:
   - `VITE_API_URL=https://your-backend-url.com` — your deployed backend's
     origin, no trailing slash, no `/api` suffix
   - `VITE_WS_URL` — only needed if the WS endpoint lives on a different
     host than the API; otherwise it's derived from `VITE_API_URL`
   - `VITE_GOOGLE_CLIENT_ID` — if using Google sign-in
3. Deploy. Vercel builds with `npm run build` and serves `dist/`.

## 3. Wire them together

- Add the Vercel URL to the backend's `CORS_ORIGINS`.
- If using Google OAuth, add the Vercel URL to the OAuth client's Authorized
  JavaScript origins in the Google Cloud Console.
- Redeploy the backend after changing `CORS_ORIGINS`/`APP_ENV`.

## Local development

Unchanged — `docker-compose.yml` for Postgres/Redis, `npm run dev` for the
frontend (proxies `/api` and `/ws` to `localhost:8000` via `vite.config.ts`),
and `uvicorn app.main:app --reload` (or the backend's own tooling) for the
API. No env vars are required locally; leaving `VITE_API_URL`/`VITE_WS_URL`
unset keeps using the relative dev-proxy paths.
