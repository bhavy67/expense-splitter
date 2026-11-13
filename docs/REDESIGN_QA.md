# Monochrome redesign: QA report

Run on 2026-11-13 against the production build (`npm run build`), served locally with the exact `vercel.json` response headers (CSP included) and brotli/gzip compression like Vercel. "Before" is `main` at `978a8fa` (the neo-brutalist UI), built and served the same way. Browser: Chrome (Playwright and Lighthouse 12, mobile preset).

## Lighthouse (mobile, median of 3 runs, route `/`)

| | Before (`main`) | After | Target |
|---|---|---|---|
| Performance | 96 | **97** | ≥ 90 ✅ |
| Accessibility | 93 | **100** | 100 ✅ |
| Best Practices | 93 | **100** | ≥ 95 ✅ |
| LCP | 2.27 s | **2.25 s** | |
| FCP | 2.19 s | **2.03 s** | |
| TBT / CLS | 0 ms / 0 | 0 ms / 0 | |

Before failed: colour contrast, heading order, console errors (Google Fonts) and DevTools issues. After: no failing audits. Two fixes came out of this run: EmptyState and date headers now use `h2` (no skipped levels), and the TopBar title is an `aria-hidden` `<p>` on pages that render their own `h1`. Loading the dashboard eagerly saved one round trip on the landing route.

The route `/` was measured because Lighthouse can't seed localStorage. Populated routes were checked with Playwright instead (below).

## Bundle size (gzipped, all assets)

| | Before | After | Δ |
|---|---|---|---|
| JS | 276.6 KB | 229.9 KB | **−46.7 KB** |
| CSS | 8.4 KB | 7.9 KB | −0.5 KB |
| Fonts | DM Sans + DM Mono from Google Fonts (third-party request) | Inter latin 48 KB + latin-ext 83 KB, self-hosted, precached | no third-party requests |

framer-motion was removed (−40.7 KB of that JS). Any screen that shows ₹ also loads the latin-ext Inter file (₹ is U+20B9); it's precached by the service worker after the first visit.

## Viewports

Every route (`/`, group: expenses / balances / stats, add expense, expense detail, settings, `/privacy`, 404) at **320, 360, 390, 768, 1024, 1440 px**, light and dark: 108 views, **no horizontal overflow, no console errors**. Seed data used a 42-character group name, a 9-digit amount (₹12,34,56,789.00), a 26-character member name and a payment. The empty dashboard was checked separately at 360px.

## Keyboard only (1280px, no mouse)

Create group → add expense → settle up, using only Tab / Enter / arrow keys:

- "New group" opens the sheet with focus in the name field; the group is created and the page navigates to it.
- "Add expense" lands with focus in the amount field; the expense saves.
- Tabs: Tab reaches the selected tab; ArrowRight selects Balances (roving tabindex, as per the ARIA tabs pattern).
- "Settle" opens the record-payment sheet; "Record payment" saves it and the screen shows "Everyone's settled up".

Every sheet (create group, record payment, UPI, confirm): `:modal`, labelled by its title, Tab never reaches the page behind, Escape closes and returns focus to the trigger, background scroll locked.

## Screen reader (accessibility tree)

Not tested with VoiceOver or TalkBack themselves; checked through the accessibility tree that they read:

- Settlement: "Kabir Mehta owes Devendranath Chattopadhyay", "₹2,46,92,197.80".
- Member balances: "Riya Shah owes −₹2,46,88,497.80", "Devendranath Chattopadhyay gets back +₹9,87,64,591.20".

Never just "₹500".

## Greyscale

`filter: grayscale(1)` on Balances: identical to the normal render (there's no colour to lose); owe/owed is carried by sign, word and arrow.

## Offline

Service worker installed, network set offline, hard reload: `/` and a group page render with Inter loaded (`document.fonts.check` true) and all Lucide icons present.

## CSP

No CSP violations in the console across all 108 views and flows, with the production CSP (`style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self'`, no Google domains).

## Manifest and icons

`manifest.webmanifest`: name, short_name, `display: standalone`, `theme_color`/`background_color` `#0A0A0A`, icons 192, 512 and maskable 512; every icon file's real size matches its declared size. The maskable mark's furthest point sits 180px from the centre, inside the 205px safe-zone radius (checked by overlaying the safe-zone circle). Chrome DevTools' Manifest panel itself wasn't checked; please glance at it once.

## Not done here (needs a person or a release)

- Real-device check of the on-screen keyboard over the add-expense sticky bar.
- A VoiceOver / TalkBack pass.
- Android launcher icon and splash: regenerate with `bubblewrap update`, then a Play release (versionCode 3).
- Store screenshots (`store-assets/1-groups.png` … `6-stats.png`) and `feature-graphic.png` show the old UI and need retaking (the feature graphic embeds `2-expenses.png` and `3-settle-up.png`).
- `/privacy` still says fonts load from Google Fonts. That's no longer true (fonts are self-hosted); the wording is the owner's decision.
