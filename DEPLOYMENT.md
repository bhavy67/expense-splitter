# Deployment

SplitItt is a static Vite/React PWA in `frontend/`. There is no backend:
all data lives in the browser's localStorage on the user's device.

## Vercel

Deployed as project **`expense-splitter`** in the `bhavyladani-project`
team, git-linked to `bhavy67/expense-splitter` (auto-deploys `main`).
Production domain: **https://splititt.bhavyladani.in**.

The Vercel project's Root Directory is the repo root, so the root
`vercel.json` builds the subdirectory directly (`cd frontend && npm run build`,
output `frontend/dist`). It also sets:

- **SPA rewrite** — every unknown path serves `index.html`. Real files in
  `public/` (e.g. `robots.txt`, `.well-known/assetlinks.json`) win over it.
- **Security headers** — CSP, nosniff, referrer, permissions, frame-deny.
  The CSP allows scripts from `'self'` only, which is why the theme
  anti-flicker script lives in `public/theme-init.js` instead of inline.
  If you add an external request (API, analytics, CDN), add its origin to
  the CSP **and** update the About & Privacy page (`/privacy`).
- **Cache headers** — `/assets/*` immutable; `sw.js`, `index.html`,
  `manifest.webmanifest` always revalidate.

No environment variables are needed.

## PWA updates

`vite-plugin-pwa` runs in `prompt` mode: when a new deploy is detected
(hourly, on tab focus, on reconnect) the app shows "A new version is ready
→ Reload". Users with a stuck build can use **About & Privacy → Clear cache
& reload** (clears service worker + caches, keeps their data).

## Icons

`node frontend/scripts/gen-icons.mjs` regenerates every PNG icon, including
the maskable one, from the mark defined in that script.

## Local development

```bash
cd frontend
npm run dev                      # dev server
npm run build && npm run preview # always check the production build too
```
