# Deployment

The app is split across two hosted pieces:

- **`frontend/`** — a static Vite/React SPA. Deploys to **Vercel**.
- **Backend** — entirely **Supabase**: Postgres (schema + RLS in
  `supabase/migrations/`), Supabase Auth (email/password + Google), Supabase
  Realtime (live group updates), and one Edge Function (`supabase/functions/expenses/`)
  that owns expense writes (validation, split-building, the audit trail, and
  triggering settlement recalculation). There is no separate server to host —
  everything backend-side lives inside the Supabase project already
  provisioned for this app (**"Expense Splitter"**, `ekghmehgnotdrelhghpk`,
  `ap-south-1`).

## 1. Supabase project setup

The schema, RLS policies, RPC functions (`join_group`, `recalculate_settlements`,
etc.), and the `expenses` Edge Function are already applied to the project.
To reproduce this on a different project (or after a reset):

```bash
# from supabase/migrations/ — apply in order via the SQL editor, the
# Supabase CLI (`supabase db push`), or the apply_migration MCP tool.
20260828000001_init_schema.sql
20260828000002_harden_function_privileges.sql

# deploy the Edge Function (Supabase CLI: `supabase functions deploy expenses`)
supabase/functions/expenses/index.ts
```

### Auth providers (manual — no API for this)

In the Supabase dashboard, **Authentication → Providers**:

- **Email**: enabled by default on new projects. Decide whether to require
  email confirmation (Authentication → Providers → Email → "Confirm email")
  — the frontend handles both cases (`useRegister` in `hooks/useAuth.ts`).
- **Google**: enable the provider and add your Google OAuth **Client ID**
  under "Authorized Client IDs" (this app signs in via Google Identity
  Services' one-tap button and exchanges the ID token with
  `supabase.auth.signInWithIdToken()` — the Client ID here must match
  `VITE_GOOGLE_CLIENT_ID` below).

Also set **Authentication → URL Configuration → Site URL** (and Redirect
URLs, if used) to your deployed Vercel URL.

### Service-role key (for the Edge Function)

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
injected into Edge Functions automatically by Supabase — no manual env var
setup needed there.

## 2. Frontend (Vercel)

1. Import the repo into Vercel and set **Root Directory** to `frontend`
   (this is a monorepo). Framework preset "Vite" is auto-detected;
   `frontend/vercel.json` adds the SPA rewrite so client-side routes survive
   a refresh/direct link.
2. Set environment variables (see `frontend/.env.example`) in the Vercel
   project settings:
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — Settings → API in the
     Supabase dashboard (`https://ekghmehgnotdrelhghpk.supabase.co` for the
     project above; both are safe to expose client-side — the anon key only
     grants what RLS allows).
   - `VITE_GOOGLE_CLIENT_ID` — if using Google sign-in.
3. Deploy. Vercel builds with `npm run build` and serves `dist/`.

No CORS configuration is needed on the Supabase side — PostgREST and Edge
Functions accept requests from any origin by default; access control is
entirely RLS/JWT-based, not origin-based.

## Local development

- `npm run dev` in `frontend/` — talks directly to the hosted Supabase
  project via `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` in a local
  `.env` file (copy `.env.example`). There's no local backend process to
  run.
- To develop against a local Supabase stack instead: `supabase start`
  (Supabase CLI), then point `.env` at the printed local URL/anon key, and
  `supabase functions serve expenses` to run the Edge Function locally.

## Regenerating types after a schema change

`frontend/src/lib/database.types.ts` is generated from the live schema
(`mcp__Supabase__generate_typescript_types`, or `supabase gen types
typescript` via the CLI). Regenerate it after any migration that adds/changes
tables, columns, or RPC function signatures.
