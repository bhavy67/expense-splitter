# SplitItt — Split expenses, not friendships

> **Live:** [splititt.vercel.app](https://splititt.vercel.app)

A fast, offline-capable expense splitter for groups — trips, flatmates, dinners, and beyond. No account required to get started.

---

## Features

- **No sign-up required** — create a group and start splitting instantly
- **Multiple split modes** — equal, by shares, percentage, exact amounts, itemized line items
- **Multi-currency** — 9 currencies with per-expense exchange rate support
- **Debt simplification** — minimizes the number of transactions needed to settle up
- **Payment tracking** — record settlements and watch balances update in real time
- **Analytics** — spending by category, monthly trend chart, who paid most
- **Expense templates** — save recurring expenses for one-tap reuse
- **Receipt photos** — attach an image to any expense
- **Export** — download group data as CSV or full JSON backup
- **PWA** — installable on iOS and Android, works fully offline
- **Dark / light theme** — system-aware with manual toggle

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 (CSS-first config) |
| Routing | React Router v7 |
| State | Zustand (theme) + custom hooks over localStorage |
| Persistence | `localStorage` — no backend, no account |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| PWA | vite-plugin-pwa (Workbox) |
| Deployment | Vercel |

---

## Project structure

```
/
├── frontend/          # React SPA (the entire app)
│   ├── public/
│   │   ├── icons/     # PWA icons (192, 512, apple-touch-icon)
│   │   ├── favicon.svg
│   │   └── icon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/    # Button, Toast, ConfirmModal, Logo, EmptyState …
│   │   │   ├── expenses/  # ExpenseCard
│   │   │   ├── groups/    # CreateGroupModal, BalancesTab, AnalyticsTab …
│   │   │   └── layout/    # AppShell, Sidebar, TopBar, BottomNav
│   │   ├── hooks/         # useStore, reactive localStorage hooks
│   │   ├── lib/           # storage, calculations, currency, export utils
│   │   ├── pages/
│   │   │   ├── dashboard/ # DashboardPage
│   │   │   ├── expenses/  # AddExpensePage, ExpenseDetailPage
│   │   │   └── groups/    # GroupPage, GroupSettingsPage
│   │   ├── store/         # Zustand theme store
│   │   └── types/         # Shared TypeScript types
│   ├── scripts/
│   │   └── gen-icons.mjs  # Regenerates PWA PNGs from SVG via sharp
│   └── vite.config.ts
├── vercel.json            # Root-level Vercel build config
└── DEPLOYMENT.md          # Detailed deployment & infrastructure notes
```

---

## Local development

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

No environment variables or backend needed — everything runs against `localStorage`.

### Other commands

```bash
npm run build      # Production build → frontend/dist
npm run preview    # Serve the production build locally
npm run lint       # Oxlint
node scripts/gen-icons.mjs   # Regenerate PWA PNG icons from public/icon.svg
```

---

## Deployment

The app deploys automatically to Vercel on every push to `main`.

The root `vercel.json` handles the monorepo layout — Vercel's Root Directory setting stays at `/`, and the config points the build at `frontend/`:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for full infrastructure details.

---

## Design system

Neo-brutalist — thick borders, solid offset shadows, electric lime accent, uppercase mono labels.

| Token | Value |
|---|---|
| Accent | `#b9f542` (electric lime) |
| Accent dark | `#4d6e08` (dark olive, light mode) |
| Background light | `#fafaf7` |
| Background dark | `#0d0d0d` |
| Border | `#0a0a0a` / `#f0ede5` |
| Error / danger | `#ff5c3d` |
| Font | DM Sans + DM Mono |
